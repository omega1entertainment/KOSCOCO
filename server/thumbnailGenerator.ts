import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { ObjectStorageService, objectStorageClient, parseObjectPath } from './objectStorage';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export interface ThumbnailGenerationResult {
  thumbnailUrl: string;
  success: boolean;
  error?: string;
}

export async function generateThumbnail(
  videoPath: string,
  userId: string,
  videoDuration: number
): Promise<ThumbnailGenerationResult> {
  const tempDir = os.tmpdir();
  const tempVideoPath = path.join(tempDir, `video-${randomUUID()}.mp4`);
  const tempThumbnailPath = path.join(tempDir, `thumbnail-${randomUUID()}.jpg`);

  try {
    console.log(`[ThumbnailGen] Starting generation for video: ${videoPath}`);

    const { bucketName, objectName } = parseObjectPath(videoPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const videoFile = bucket.file(objectName);

    await videoFile.download({ destination: tempVideoPath });
    console.log(`[ThumbnailGen] Downloaded video to temp: ${tempVideoPath}`);

    const seekTime = Math.max(1, Math.floor(videoDuration * 0.25));
    console.log(`[ThumbnailGen] Extracting frame at ${seekTime}s (25% of ${videoDuration}s)`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempVideoPath)
        .screenshots({
          count: 1,
          folder: tempDir,
          filename: path.basename(tempThumbnailPath),
          timestamps: [seekTime],
          size: '1280x720',
        })
        .on('end', () => {
          console.log('[ThumbnailGen] Frame extraction completed');
          resolve();
        })
        .on('error', (err: Error) => {
          console.error('[ThumbnailGen] FFmpeg error:', err);
          reject(err);
        });
    });

    const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || '';
    if (!privateObjectDir) {
      throw new Error('PRIVATE_OBJECT_DIR not configured');
    }

    const thumbnailId = randomUUID();
    const thumbnailStoragePath = `${privateObjectDir}/thumbnails/${thumbnailId}.jpg`;
    const { bucketName: thumbBucket, objectName: thumbObjectName } = parseObjectPath(thumbnailStoragePath);
    const thumbnailBucket = objectStorageClient.bucket(thumbBucket);
    const thumbnailFile = thumbnailBucket.file(thumbObjectName);

    await new Promise<void>((resolve, reject) => {
      const readStream = require('fs').createReadStream(tempThumbnailPath);
      const writeStream = thumbnailFile.createWriteStream({
        metadata: {
          contentType: 'image/jpeg',
          cacheControl: 'private, max-age=3600',
        },
      });

      readStream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('finish', () => resolve());

      readStream.pipe(writeStream);
    });
    console.log(`[ThumbnailGen] Uploaded thumbnail to: ${thumbnailStoragePath}`);

    const objectStorageService = new ObjectStorageService();
    const normalizedThumbnailPath = await objectStorageService.trySetObjectEntityAclPolicy(
      thumbnailStoragePath,
      {
        owner: userId,
        visibility: 'private',
      }
    );

    await fs.unlink(tempVideoPath);
    await fs.unlink(tempThumbnailPath);

    console.log(`[ThumbnailGen] Successfully generated thumbnail: ${normalizedThumbnailPath}`);
    return {
      thumbnailUrl: normalizedThumbnailPath,
      success: true,
    };
  } catch (error: any) {
    console.error('[ThumbnailGen] Error generating thumbnail:', error);

    try {
      await fs.unlink(tempVideoPath).catch(() => {});
      await fs.unlink(tempThumbnailPath).catch(() => {});
    } catch {}

    return {
      thumbnailUrl: '',
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}
