import { storage } from './storage';

const JOB_INTERVAL_MS = 60000; // Check every minute

let isRunning = false;

async function processScheduledVideos() {
  if (isRunning) {
    console.log('[ScheduledVideoJob] Job already running, skipping...');
    return;
  }

  isRunning = true;
  
  try {
    const pendingVideos = await storage.getPendingScheduledVideos();
    
    if (pendingVideos.length === 0) {
      return;
    }

    console.log(`[ScheduledVideoJob] Processing ${pendingVideos.length} scheduled videos`);

    for (const scheduled of pendingVideos) {
      try {
        const video = await storage.getVideoById(scheduled.videoId);
        
        if (!video) {
          console.error(`[ScheduledVideoJob] Video ${scheduled.videoId} not found`);
          await storage.updateScheduledVideo(scheduled.id, { 
            status: 'failed',
            errorMessage: 'Video not found'
          } as any);
          continue;
        }

        await storage.updateVideoStatus(video.id, 'active');
        
        await storage.updateScheduledVideo(scheduled.id, {
          status: 'published',
          publishedAt: new Date()
        } as any);

        console.log(`[ScheduledVideoJob] Published video: ${video.title} (${video.id})`);

        const user = await storage.getUser(video.userId);
        if (user) {
          await storage.createNotification({
            userId: video.userId,
            type: 'system',
            title: 'Video Published',
            message: `Your video "${video.title}" has been published as scheduled.`,
            read: false,
          });
        }
      } catch (error) {
        console.error(`[ScheduledVideoJob] Error publishing scheduled video ${scheduled.id}:`, error);
        await storage.updateScheduledVideo(scheduled.id, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        } as any);
      }
    }
  } catch (error) {
    console.error('[ScheduledVideoJob] Error processing scheduled videos:', error);
  } finally {
    isRunning = false;
  }
}

export function startScheduledVideoJob() {
  console.log('[ScheduledVideoJob] Starting scheduled video job runner');
  
  processScheduledVideos();
  
  setInterval(processScheduledVideos, JOB_INTERVAL_MS);
}
