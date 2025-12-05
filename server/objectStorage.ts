import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }

  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${
          isPublic ? "public" : "private"
        }, max-age=${cacheTtlSec}`,
      });

      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async streamVideo(file: File, req: import("express").Request, res: Response) {
    try {
      const [metadata] = await file.getMetadata();
      const fileSize = parseInt(metadata.size as string, 10);
      const contentType = metadata.contentType || "video/mp4";
      const range = req.headers.range;

      // Validate file size
      if (!Number.isFinite(fileSize) || fileSize <= 0) {
        console.error("Invalid file size:", metadata.size);
        res.status(500).json({ error: "Invalid file metadata" });
        return;
      }

      // Generate ETag from file metadata (md5Hash or etag from GCS, or fallback to size+updated)
      const etagSource = metadata.md5Hash || metadata.etag || `${fileSize}-${metadata.updated}`;
      const etag = `"${Buffer.from(etagSource).toString('base64').replace(/[/+=]/g, '').slice(0, 27)}"`;
      
      // Parse Last-Modified from metadata
      const lastModified = metadata.updated ? new Date(metadata.updated as string).toUTCString() : undefined;

      // Check If-None-Match (ETag validation)
      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch && ifNoneMatch === etag) {
        res.status(304).end();
        return;
      }

      // Check If-Modified-Since (Date validation)
      const ifModifiedSince = req.headers['if-modified-since'];
      if (ifModifiedSince && lastModified) {
        const ifModifiedDate = new Date(ifModifiedSince);
        const lastModifiedDate = new Date(lastModified);
        if (lastModifiedDate <= ifModifiedDate) {
          res.status(304).end();
          return;
        }
      }

      // Common headers for all responses - enhanced caching
      const commonHeaders: Record<string, string | number> = {
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400", // 7 days cache, 1 day stale
        "ETag": etag,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Range, Content-Type, If-None-Match, If-Modified-Since",
        "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges, ETag, Last-Modified",
        "Vary": "Accept-Encoding",
      };
      
      if (lastModified) {
        commonHeaders["Last-Modified"] = lastModified;
      }

      // Handle HEAD requests without streaming
      if (req.method === "HEAD") {
        res.status(200).set({
          ...commonHeaders,
          "Content-Length": fileSize,
        }).end();
        return;
      }

      if (range) {
        // Parse range header (e.g., "bytes=0-1023")
        const rangeMatch = range.match(/bytes=(\d*)-(\d*)/);
        
        if (!rangeMatch) {
          // Invalid range format
          res.status(416).set({
            "Content-Range": `bytes */${fileSize}`,
          }).end();
          return;
        }

        const startStr = rangeMatch[1];
        const endStr = rangeMatch[2];
        
        let start: number;
        let end: number;

        if (startStr === "" && endStr !== "") {
          // Suffix range: bytes=-500 means last 500 bytes
          const suffixLength = parseInt(endStr, 10);
          if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
            res.status(416).set({ "Content-Range": `bytes */${fileSize}` }).end();
            return;
          }
          start = Math.max(0, fileSize - suffixLength);
          end = fileSize - 1;
        } else if (startStr !== "") {
          start = parseInt(startStr, 10);
          end = endStr !== "" ? parseInt(endStr, 10) : fileSize - 1;
        } else {
          // Both empty - invalid
          res.status(416).set({ "Content-Range": `bytes */${fileSize}` }).end();
          return;
        }

        // Validate parsed values
        if (!Number.isFinite(start) || !Number.isFinite(end) ||
            start < 0 || end < 0 || start > end || start >= fileSize) {
          res.status(416).set({
            "Content-Range": `bytes */${fileSize}`,
          }).end();
          return;
        }

        // Clamp end to file size
        end = Math.min(end, fileSize - 1);
        const chunkSize = end - start + 1;
        
        res.status(206).set({
          ...commonHeaders,
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Content-Length": chunkSize,
        });

        const stream = file.createReadStream({ start, end });
        stream.on("error", (err) => {
          console.error("Stream error:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error streaming file" });
          }
        });
        stream.pipe(res);
      } else {
        // No range requested - send entire file
        res.status(200).set({
          ...commonHeaders,
          "Content-Length": fileSize,
        });

        const stream = file.createReadStream();
        stream.on("error", (err) => {
          console.error("Stream error:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error streaming file" });
          }
        });
        stream.pipe(res);
      }
    } catch (error) {
      console.error("Error streaming video:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error streaming video" });
      }
    }
  }

  async getObjectEntityUploadURL(): Promise<{ uploadUrl: string; videoUrl: string }> {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/videos/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    const uploadUrl = await signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });
    return {
      uploadUrl,
      videoUrl: fullPath,
    };
  }

  /**
   * Generate a CDN-style signed URL for video playback.
   * This URL allows direct access from Google Cloud Storage's edge network,
   * bypassing the server for faster video loading.
   * @param objectPath - The storage path of the video
   * @param ttlSec - Time to live in seconds (default: 24 hours for caching)
   * @returns Signed URL for direct video access
   */
  async getCdnUrl(objectPath: string, ttlSec: number = 86400): Promise<string> {
    const { bucketName, objectName } = parseObjectPath(objectPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    const [exists] = await file.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }

    const signedUrl = await signObjectURL({
      bucketName,
      objectName,
      method: "GET",
      ttlSec,
    });

    return signedUrl;
  }

  /**
   * Generate CDN URLs for multiple videos in batch.
   * More efficient than calling getCdnUrl individually.
   */
  async getBatchCdnUrls(objectPaths: string[], ttlSec: number = 86400): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    await Promise.all(
      objectPaths.map(async (objectPath) => {
        try {
          const url = await this.getCdnUrl(objectPath, ttlSec);
          results.set(objectPath, url);
        } catch (error) {
          console.error(`Failed to generate CDN URL for ${objectPath}:`, error);
        }
      })
    );

    return results;
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (rawPath.startsWith("https://storage.googleapis.com/")) {
      const url = new URL(rawPath);
      rawPath = url.pathname;
    }
    
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    
    if (rawPath.startsWith(objectEntityDir)) {
      const entityId = rawPath.slice(objectEntityDir.length);
      return `/objects/${entityId}`;
    }
    
    return rawPath;
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }
    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }
}

export function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}
