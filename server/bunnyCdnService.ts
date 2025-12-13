import { BunnyCdnStream } from "bunnycdn-stream";
import { Readable } from "stream";

interface BunnyCdnConfig {
  streamApiKey: string;
  videoLibraryId: string;
  cdnHostname: string;
  pullZoneUrl?: string;
}

interface VideoUploadResult {
  guid: string;
  title: string;
  embedUrl: string;
  hlsUrl: string;
  thumbnailUrl: string;
}

interface VideoInfo {
  guid: string;
  title: string;
  status: number;
  length: number;
  views: number;
  dateUploaded: string;
  thumbnailUrl: string;
  hlsUrl: string;
  embedUrl: string;
}

class BunnyCdnService {
  private streamClient: BunnyCdnStream | null = null;
  private config: BunnyCdnConfig | null = null;

  initialize(config: BunnyCdnConfig): void {
    this.config = config;
    
    if (config.streamApiKey && config.videoLibraryId) {
      this.streamClient = new BunnyCdnStream({
        apiKey: config.streamApiKey,
        videoLibrary: config.videoLibraryId,
      });
    }
  }

  isConfigured(): boolean {
    return this.streamClient !== null && this.config !== null;
  }

  async createVideo(title: string, collectionId?: string): Promise<{ guid: string }> {
    if (!this.streamClient) {
      throw new Error("BunnyCDN Stream not configured");
    }

    const video = await this.streamClient.createVideo({
      title,
      collectionId: collectionId || undefined,
    });

    return { guid: video.guid };
  }

  async uploadVideo(videoId: string, videoBuffer: Buffer): Promise<VideoUploadResult> {
    if (!this.streamClient || !this.config) {
      throw new Error("BunnyCDN Stream not configured");
    }

    const readStream = Readable.from(videoBuffer);
    await this.streamClient.uploadVideo(videoId, readStream as any);

    return {
      guid: videoId,
      title: "",
      embedUrl: this.getEmbedUrl(videoId),
      hlsUrl: this.getHlsUrl(videoId),
      thumbnailUrl: this.getThumbnailUrl(videoId),
    };
  }

  async uploadVideoFromUrl(videoUrl: string, title: string): Promise<VideoUploadResult> {
    if (!this.config) {
      throw new Error("BunnyCDN Stream not configured");
    }

    const response = await fetch(
      `https://video.bunnycdn.com/library/${this.config.videoLibraryId}/videos/fetch`,
      {
        method: "POST",
        headers: {
          AccessKey: this.config.streamApiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          url: videoUrl,
          title,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    const data = await response.json();
    const videoId = data.guid;

    return {
      guid: videoId,
      title,
      embedUrl: this.getEmbedUrl(videoId),
      hlsUrl: this.getHlsUrl(videoId),
      thumbnailUrl: this.getThumbnailUrl(videoId),
    };
  }

  async getVideo(videoId: string): Promise<VideoInfo> {
    if (!this.streamClient || !this.config) {
      throw new Error("BunnyCDN Stream not configured");
    }

    const video = await this.streamClient.getVideo(videoId);

    return {
      guid: video.guid,
      title: video.title,
      status: video.status,
      length: video.length,
      views: video.views,
      dateUploaded: video.dateUploaded,
      thumbnailUrl: this.getThumbnailUrl(videoId),
      hlsUrl: this.getHlsUrl(videoId),
      embedUrl: this.getEmbedUrl(videoId),
    };
  }

  async deleteVideo(videoId: string): Promise<void> {
    if (!this.streamClient) {
      throw new Error("BunnyCDN Stream not configured");
    }

    await this.streamClient.deleteVideo(videoId);
  }

  async listVideos(page: number = 1, limit: number = 50): Promise<VideoInfo[]> {
    if (!this.streamClient || !this.config) {
      throw new Error("BunnyCDN Stream not configured");
    }

    const response = await this.streamClient.listVideos({
      page,
      itemsPerPage: limit,
      orderBy: "date",
    });

    return response.items.map((video: any) => ({
      guid: video.guid,
      title: video.title,
      status: video.status,
      length: video.length,
      views: video.views,
      dateUploaded: video.dateUploaded,
      thumbnailUrl: this.getThumbnailUrl(video.guid),
      hlsUrl: this.getHlsUrl(video.guid),
      embedUrl: this.getEmbedUrl(video.guid),
    }));
  }

  getEmbedUrl(videoId: string): string {
    if (!this.config) return "";
    return `https://iframe.mediadelivery.net/embed/${this.config.videoLibraryId}/${videoId}`;
  }

  getHlsUrl(videoId: string): string {
    if (!this.config) return "";
    return `https://${this.config.cdnHostname}/${videoId}/playlist.m3u8`;
  }

  getThumbnailUrl(videoId: string): string {
    if (!this.config) return "";
    return `https://${this.config.cdnHostname}/${videoId}/thumbnail.jpg`;
  }

  getCdnUrl(originalUrl: string): string {
    if (!this.config?.pullZoneUrl) {
      return originalUrl;
    }
    
    try {
      const url = new URL(originalUrl);
      return `${this.config.pullZoneUrl}${url.pathname}`;
    } catch {
      return originalUrl;
    }
  }

  getConfig(): BunnyCdnConfig | null {
    return this.config;
  }
}

export const bunnyCdnService = new BunnyCdnService();

export function initializeBunnyCdn(): void {
  const streamApiKey = process.env.BUNNY_STREAM_API_KEY;
  const videoLibraryId = process.env.BUNNY_VIDEO_LIBRARY_ID;
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME;
  const pullZoneUrl = process.env.BUNNY_PULL_ZONE_URL;

  if (streamApiKey && videoLibraryId && cdnHostname) {
    bunnyCdnService.initialize({
      streamApiKey,
      videoLibraryId,
      cdnHostname,
      pullZoneUrl,
    });
    console.log("[BunnyCDN] Service initialized successfully");
  } else {
    console.log("[BunnyCDN] Missing configuration - service not initialized");
  }
}

export type { BunnyCdnConfig, VideoUploadResult, VideoInfo };
