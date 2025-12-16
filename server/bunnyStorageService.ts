import BunnyStorageModule from "bunnycdn-storage";

const BunnyStorage = (BunnyStorageModule as any).default || BunnyStorageModule;

interface BunnyStorageConfig {
  apiKey: string;
  storageZone: string;
  region?: string;
  cdnUrl?: string;
}

interface StorageFile {
  name: string;
  path: string;
  length: number;
  lastChanged: string;
  isDirectory: boolean;
}

interface UploadResult {
  success: boolean;
  path: string;
  cdnUrl?: string;
}

class BunnyStorageService {
  private client: any = null;
  private config: BunnyStorageConfig | null = null;

  initialize(config: BunnyStorageConfig): void {
    this.config = config;
    
    if (config.apiKey && config.storageZone) {
      // For Bunny Storage, the main Falkenstein region uses no prefix (empty string)
      // Other regions: ny, la, sg, syd, br, jh, se, uk
      // "de" is NOT a valid region - use empty string for Germany/Falkenstein
      const region = config.region === "de" ? "" : (config.region || "");
      
      this.client = new BunnyStorage(
        config.apiKey,
        config.storageZone,
        region
      );
      console.log(`[BunnyStorage] Service initialized successfully (region: ${region || 'default/Falkenstein'})`);
    }
  }

  isConfigured(): boolean {
    return this.client !== null && this.config !== null;
  }

  getConfig(): BunnyStorageConfig | null {
    return this.config;
  }

  async upload(buffer: Buffer, remotePath: string): Promise<UploadResult> {
    if (!this.client || !this.config) {
      throw new Error("Bunny Storage not configured");
    }

    await this.client.upload(buffer, remotePath);

    return {
      success: true,
      path: remotePath,
      cdnUrl: this.getCdnUrl(remotePath),
    };
  }

  async download(remotePath: string): Promise<Buffer> {
    if (!this.client) {
      throw new Error("Bunny Storage not configured");
    }

    const buffer = await this.client.download(remotePath);
    return buffer;
  }

  async delete(remotePath: string): Promise<boolean> {
    if (!this.client) {
      throw new Error("Bunny Storage not configured");
    }

    await this.client.delete(remotePath);
    return true;
  }

  async list(directory: string = "/"): Promise<StorageFile[]> {
    if (!this.client) {
      throw new Error("Bunny Storage not configured");
    }

    const files = await this.client.list(directory);
    
    return files.map((file: any) => ({
      name: file.ObjectName,
      path: file.Path + file.ObjectName,
      length: file.Length,
      lastChanged: file.LastChanged,
      isDirectory: file.IsDirectory,
    }));
  }

  getCdnUrl(remotePath: string): string | undefined {
    if (!this.config?.cdnUrl) {
      return undefined;
    }
    
    const cleanPath = remotePath.startsWith("/") ? remotePath.slice(1) : remotePath;
    return `${this.config.cdnUrl}/${cleanPath}`;
  }
}

export const bunnyStorageService = new BunnyStorageService();

export function initializeBunnyStorage(): void {
  const apiKey = process.env.BUNNY_STORAGE_API_KEY;
  const storageZone = process.env.BUNNY_STORAGE_ZONE;
  const region = process.env.BUNNY_STORAGE_REGION;
  // Support both BUNNY_STORAGE_CDN_URL and BUNNY_PULL_ZONE_URL for CDN URLs
  const cdnUrl = process.env.BUNNY_STORAGE_CDN_URL || process.env.BUNNY_PULL_ZONE_URL;

  if (apiKey && storageZone) {
    bunnyStorageService.initialize({
      apiKey,
      storageZone,
      region,
      cdnUrl,
    });
    if (cdnUrl) {
      console.log(`[BunnyStorage] CDN URL configured: ${cdnUrl}`);
    } else {
      console.log("[BunnyStorage] No CDN URL configured - files will be served via storage API");
    }
  } else {
    console.log("[BunnyStorage] Missing configuration - service not initialized");
  }
}

export type { BunnyStorageConfig, StorageFile, UploadResult };
