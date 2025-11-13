import OpenAI from 'openai';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ModerationResult {
  flagged: boolean;
  categories: string[];
  reason?: string;
}

export async function moderateText(text: string): Promise<ModerationResult> {
  try {
    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: text,
    });

    const result = response.results[0];
    const flaggedCategories: string[] = [];

    if (result.flagged) {
      for (const [category, isFlagged] of Object.entries(result.categories)) {
        if (isFlagged) {
          flaggedCategories.push(category);
        }
      }
    }

    return {
      flagged: result.flagged,
      categories: flaggedCategories,
      reason: flaggedCategories.length > 0 
        ? `Content flagged for: ${flaggedCategories.join(', ')}` 
        : undefined,
    };
  } catch (error) {
    console.error('Text moderation error:', error);
    return { flagged: false, categories: [] };
  }
}

export async function extractVideoFrames(videoPath: string, frameCount: number = 5): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempDir = path.join(process.cwd(), 'tmp', uniqueId);
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filenamePattern = `frame-%03d.jpg`;
    const frames: string[] = [];

    ffmpeg(videoPath)
      .on('end', () => {
        setTimeout(() => {
          try {
            const files = fs.readdirSync(tempDir)
              .filter(f => f.startsWith('frame-') && f.endsWith('.jpg'))
              .sort()
              .slice(0, frameCount)
              .map(f => path.join(tempDir, f));
            resolve(files);
          } catch (err) {
            console.error('Error reading frames:', err);
            reject(err);
          }
        }, 500);
      })
      .on('error', (err) => {
        console.error('Frame extraction error:', err);
        reject(err);
      })
      .screenshots({
        count: frameCount,
        folder: tempDir,
        filename: filenamePattern,
      });
  });
}

export async function moderateImage(imagePath: string): Promise<ModerationResult> {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: [
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`,
          },
        },
      ],
    });

    const result = response.results[0];
    const flaggedCategories: string[] = [];

    if (result.flagged) {
      for (const [category, isFlagged] of Object.entries(result.categories)) {
        if (isFlagged) {
          flaggedCategories.push(category);
        }
      }
    }

    return {
      flagged: result.flagged,
      categories: flaggedCategories,
      reason: flaggedCategories.length > 0 
        ? `Visual content flagged for: ${flaggedCategories.join(', ')}` 
        : undefined,
    };
  } catch (error) {
    console.error('Image moderation error:', error);
    return { flagged: false, categories: [] };
  }
}

export async function moderateVideo(
  videoPath: string,
  title: string,
  description?: string
): Promise<ModerationResult> {
  const allCategories: Set<string> = new Set();
  let overallFlagged = false;
  const reasons: string[] = [];

  const textToModerate = `${title}${description ? '\n\n' + description : ''}`;
  const textResult = await moderateText(textToModerate);
  
  if (textResult.flagged) {
    overallFlagged = true;
    textResult.categories.forEach(cat => allCategories.add(cat));
    if (textResult.reason) reasons.push(textResult.reason);
  }

  let frameFiles: string[] = [];
  try {
    frameFiles = await extractVideoFrames(videoPath, 5);

    for (const framePath of frameFiles) {
      const frameResult = await moderateImage(framePath);
      
      if (frameResult.flagged) {
        overallFlagged = true;
        frameResult.categories.forEach(cat => allCategories.add(cat));
        if (frameResult.reason && !reasons.includes(frameResult.reason)) {
          reasons.push(frameResult.reason);
        }
      }
    }
  } catch (error) {
    console.error('Video frame moderation error:', error);
  } finally {
    frameFiles.forEach(framePath => {
      try {
        if (fs.existsSync(framePath)) {
          fs.unlinkSync(framePath);
        }
        const frameDir = path.dirname(framePath);
        if (fs.existsSync(frameDir) && fs.readdirSync(frameDir).length === 0) {
          fs.rmdirSync(frameDir);
        }
      } catch (err) {
        console.error('Error deleting frame:', err);
      }
    });
  }

  return {
    flagged: overallFlagged,
    categories: Array.from(allCategories),
    reason: reasons.length > 0 ? reasons.join('; ') : undefined,
  };
}

export function cleanupTempFiles() {
  const tempDir = path.join(process.cwd(), 'tmp');
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    files.forEach(file => {
      try {
        fs.unlinkSync(path.join(tempDir, file));
      } catch (err) {
        console.error('Error cleaning temp file:', err);
      }
    });
  }
}
