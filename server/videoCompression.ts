import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { ObjectStorageService, objectStorageClient, parseObjectPath } from './objectStorage';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export interface VideoCompressionResult {
  compressedVideoUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  success: boolean;
  error?: string;
}

export interface CompressionOptions {
  targetBitrate?: string;
  maxWidth?: number;
  maxHeight?: number;
  crf?: number;
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  crf: 28,
  maxWidth: 1280,
  maxHeight: 720,
  preset: 'veryfast',
};

async function getVideoDimensions(videoPath: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      if (!videoStream || !videoStream.width || !videoStream.height) {
        reject(new Error('Could not determine video dimensions'));
        return;
      }
      resolve({ width: videoStream.width, height: videoStream.height });
    });
  });
}

function calculateScaledDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } | null {
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return null;
  }

  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  const ratio = Math.min(widthRatio, heightRatio);

  let newWidth = Math.round(originalWidth * ratio);
  let newHeight = Math.round(originalHeight * ratio);

  if (newWidth % 2 !== 0) newWidth--;
  if (newHeight % 2 !== 0) newHeight--;

  return { width: newWidth, height: newHeight };
}

export async function compressVideo(
  videoStoragePath: string,
  userId: string,
  options: CompressionOptions = {}
): Promise<VideoCompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const tempDir = os.tmpdir();
  const tempInputPath = path.join(tempDir, `input-${randomUUID()}.mp4`);
  const tempOutputPath = path.join(tempDir, `compressed-${randomUUID()}.mp4`);
  let originalSize = 0;

  try {
    console.log(`[VideoCompression] Starting compression for: ${videoStoragePath}`);

    const { bucketName, objectName } = parseObjectPath(videoStoragePath);
    const bucket = objectStorageClient.bucket(bucketName);
    const videoFile = bucket.file(objectName);

    const [metadata] = await videoFile.getMetadata();
    originalSize = parseInt(metadata.size as string, 10) || 0;
    console.log(`[VideoCompression] Original file size: ${(originalSize / (1024 * 1024)).toFixed(2)} MB`);

    await videoFile.download({ destination: tempInputPath });
    console.log(`[VideoCompression] Downloaded video to temp: ${tempInputPath}`);

    const dimensions = await getVideoDimensions(tempInputPath);
    console.log(`[VideoCompression] Original dimensions: ${dimensions.width}x${dimensions.height}`);

    const scaledDimensions = calculateScaledDimensions(
      dimensions.width,
      dimensions.height,
      opts.maxWidth!,
      opts.maxHeight!
    );

    await new Promise<void>((resolve, reject) => {
      let command = ffmpeg(tempInputPath)
        .outputOptions([
          `-c:v libx264`,
          `-crf ${opts.crf}`,
          `-preset ${opts.preset}`,
          `-c:a aac`,
          `-b:a 128k`,
          `-movflags +faststart`,
          `-pix_fmt yuv420p`,
        ]);

      if (scaledDimensions) {
        console.log(`[VideoCompression] Scaling to: ${scaledDimensions.width}x${scaledDimensions.height}`);
        command = command.outputOptions([
          `-vf scale=${scaledDimensions.width}:${scaledDimensions.height}`
        ]);
      }

      command
        .output(tempOutputPath)
        .on('start', (cmdLine) => {
          console.log(`[VideoCompression] FFmpeg command: ${cmdLine}`);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`[VideoCompression] Progress: ${progress.percent.toFixed(1)}%`);
          }
        })
        .on('end', () => {
          console.log('[VideoCompression] Compression completed');
          resolve();
        })
        .on('error', (err) => {
          console.error('[VideoCompression] FFmpeg error:', err);
          reject(err);
        })
        .run();
    });

    const compressedStats = await fs.stat(tempOutputPath);
    const compressedSize = compressedStats.size;
    const compressionRatio = originalSize > 0 ? (1 - (compressedSize / originalSize)) * 100 : 0;

    console.log(`[VideoCompression] Compressed size: ${(compressedSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`[VideoCompression] Compression ratio: ${compressionRatio.toFixed(1)}% reduction`);

    if (compressedSize >= originalSize * 0.95) {
      console.log('[VideoCompression] Compressed file not significantly smaller, skipping');
      return {
        compressedVideoUrl: '',
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 0,
        success: true,
      };
    }

    const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || '';
    if (!privateObjectDir) {
      throw new Error('PRIVATE_OBJECT_DIR not configured');
    }

    const compressedId = randomUUID();
    const compressedStoragePath = `${privateObjectDir}/videos/compressed/${compressedId}.mp4`;
    const { bucketName: compBucket, objectName: compObjectName } = parseObjectPath(compressedStoragePath);
    const compressedBucket = objectStorageClient.bucket(compBucket);
    const compressedFile = compressedBucket.file(compObjectName);

    await new Promise<void>((resolve, reject) => {
      const readStream = require('fs').createReadStream(tempOutputPath);
      const writeStream = compressedFile.createWriteStream({
        metadata: {
          contentType: 'video/mp4',
          cacheControl: 'private, max-age=3600',
        },
      });

      readStream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('finish', () => resolve());

      readStream.pipe(writeStream);
    });
    console.log(`[VideoCompression] Uploaded compressed video to: ${compressedStoragePath}`);

    const objectStorageService = new ObjectStorageService();
    const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(
      compressedStoragePath,
      {
        owner: userId,
        visibility: 'private',
      }
    );

    console.log(`[VideoCompression] Successfully compressed video: ${normalizedPath}`);
    return {
      compressedVideoUrl: normalizedPath,
      originalSize,
      compressedSize,
      compressionRatio,
      success: true,
    };
  } catch (error: any) {
    console.error('[VideoCompression] Error compressing video:', error);

    return {
      compressedVideoUrl: '',
      originalSize,
      compressedSize: 0,
      compressionRatio: 0,
      success: false,
      error: error.message || 'Unknown error',
    };
  } finally {
    try {
      await fs.unlink(tempInputPath).catch(() => {});
      await fs.unlink(tempOutputPath).catch(() => {});
    } catch {}
  }
}

export async function compressVideoInBackground(
  videoId: string,
  videoStoragePath: string,
  userId: string,
  updateVideoCompressedUrl: (videoId: string, compressedUrl: string, compressedSize: number) => Promise<void>,
  updateCompressionStatus?: (videoId: string, status: 'completed' | 'failed' | 'skipped') => Promise<void>
): Promise<void> {
  try {
    console.log(`[VideoCompression] Starting background compression for video: ${videoId}`);
    
    const result = await compressVideo(videoStoragePath, userId);
    
    if (result.success && result.compressedVideoUrl) {
      await updateVideoCompressedUrl(videoId, result.compressedVideoUrl, result.compressedSize);
      console.log(`[VideoCompression] Background compression complete for video: ${videoId}`);
      console.log(`[VideoCompression] Reduced from ${(result.originalSize / (1024 * 1024)).toFixed(2)} MB to ${(result.compressedSize / (1024 * 1024)).toFixed(2)} MB (${result.compressionRatio.toFixed(1)}% reduction)`);
      // Status already set to 'completed' by updateVideoCompressedUrl
    } else if (result.success && !result.compressedVideoUrl) {
      console.log(`[VideoCompression] Video already optimized or compression not beneficial, skipping: ${videoId}`);
      if (updateCompressionStatus) {
        await updateCompressionStatus(videoId, 'skipped');
      }
    } else {
      console.error(`[VideoCompression] Background compression failed for video ${videoId}:`, result.error);
      if (updateCompressionStatus) {
        await updateCompressionStatus(videoId, 'failed');
      }
    }
  } catch (error) {
    console.error(`[VideoCompression] Background compression error for video ${videoId}:`, error);
    if (updateCompressionStatus) {
      await updateCompressionStatus(videoId, 'failed');
    }
  }
}
