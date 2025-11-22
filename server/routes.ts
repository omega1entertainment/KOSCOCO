import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, db } from "./storage";
import * as schema from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { setupAuth, isAuthenticated, isAdvertiser } from "./auth";
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient, parseObjectPath } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import Flutterwave from "flutterwave-node-v3";
import type { SelectUser } from "@shared/schema";
import { insertJudgeScoreSchema, insertNewsletterSubscriberSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { randomUUID } from "crypto";
import formidable from "formidable";
import { promises as fs, createReadStream } from "fs";
import { generateThumbnail } from "./thumbnailGenerator";
import { moderateVideo } from "./moderation";
import { generateSlug } from "../client/src/lib/slugUtils";
import path from "path";
import { sendNewsletterWelcomeEmail } from "./emailService";

// Initialize Flutterwave
const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY || '',
  process.env.FLW_SECRET_KEY || ''
);

// Admin middleware
function isAdmin(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user as SelectUser;
  if (!user.isAdmin) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  
  next();
}

// Judge middleware
function isJudge(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user as SelectUser;
  if (!user.isJudge) {
    return res.status(403).json({ message: "Forbidden: Judge access required" });
  }
  
  next();
}

// Moderator middleware
function isModerator(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user as SelectUser;
  if (!user.isModerator) {
    return res.status(403).json({ message: "Forbidden: Moderator access required" });
  }
  
  next();
}

// Content Manager middleware
function isContentManager(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user as SelectUser;
  if (!user.isContentManager) {
    return res.status(403).json({ message: "Forbidden: Content Manager access required" });
  }
  
  next();
}

// Affiliate Manager middleware
function isAffiliateManager(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user as SelectUser;
  if (!user.isAffiliateManager) {
    return res.status(403).json({ message: "Forbidden: Affiliate Manager access required" });
  }
  
  next();
}

// Email verified middleware
function isEmailVerified(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user as SelectUser;
  if (!user.emailVerified) {
    return res.status(403).json({ message: "Email verification required. Please verify your email to continue." });
  }
  
  next();
}

// Helper to sanitize user data for public judge profile responses
function toPublicJudgeProfile(user: SelectUser) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    judgeName: user.judgeName,
    judgeBio: user.judgeBio,
    judgePhotoUrl: user.judgePhotoUrl,
    emailVerified: user.emailVerified,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as SelectUser;
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get('/api/categories/video-counts', async (req, res) => {
    try {
      const counts = await storage.getCategoryVideoCounts();
      res.json(counts);
    } catch (error) {
      console.error("Error fetching category video counts:", error);
      res.status(500).json({ message: "Failed to fetch video counts" });
    }
  });

  app.get('/api/phases', async (req, res) => {
    try {
      const phases = await storage.getAllPhases();
      res.json(phases);
    } catch (error) {
      console.error("Error fetching phases:", error);
      res.status(500).json({ message: "Failed to fetch phases" });
    }
  });

  app.get('/api/phases/active', async (req, res) => {
    try {
      const phase = await storage.getActivePhase();
      res.json(phase);
    } catch (error) {
      console.error("Error fetching active phase:", error);
      res.status(500).json({ message: "Failed to fetch active phase" });
    }
  });

  // Admin: Update phase (only allows updating description and name, not status)
  app.put('/api/admin/phases/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Only allow updating name and description
      // Status changes must go through activate/complete endpoints
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const phase = await storage.updatePhase(id, updates);
      
      if (!phase) {
        return res.status(404).json({ message: "Phase not found" });
      }

      res.json(phase);
    } catch (error) {
      console.error("Error updating phase:", error);
      res.status(500).json({ message: "Failed to update phase" });
    }
  });

  // Admin: Activate phase (deactivates all others)
  app.post('/api/admin/phases/:id/activate', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      // Get all phases
      const allPhases = await storage.getAllPhases();

      // Deactivate all phases first
      for (const phase of allPhases) {
        if (phase.id !== id && phase.status === 'active') {
          await storage.updatePhase(phase.id, { status: 'completed' });
        } else if (phase.id !== id && phase.status !== 'completed') {
          await storage.updatePhase(phase.id, { status: 'upcoming' });
        }
      }

      // Activate the selected phase
      const activatedPhase = await storage.updatePhase(id, { 
        status: 'active',
        startDate: new Date(),
      });

      if (!activatedPhase) {
        return res.status(404).json({ message: "Phase not found" });
      }

      res.json(activatedPhase);
    } catch (error) {
      console.error("Error activating phase:", error);
      res.status(500).json({ message: "Failed to activate phase" });
    }
  });

  // Admin: Complete phase
  app.post('/api/admin/phases/:id/complete', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      const completedPhase = await storage.updatePhase(id, { 
        status: 'completed',
        endDate: new Date(),
      });

      if (!completedPhase) {
        return res.status(404).json({ message: "Phase not found" });
      }

      res.json(completedPhase);
    } catch (error) {
      console.error("Error completing phase:", error);
      res.status(500).json({ message: "Failed to complete phase" });
    }
  });

  app.post('/api/registrations', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as SelectUser;
      const userId = user.id;
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { categoryIds, referralCode } = req.body;

      if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        return res.status(400).json({ message: "At least one category must be selected" });
      }

      const activePhase = await storage.getActivePhase();
      if (!activePhase) {
        return res.status(400).json({ message: "No active competition phase" });
      }

      // Check if user has already registered for any of these categories
      const existingRegistrations = await storage.getUserRegistrations(userId);
      const approvedRegistrations = existingRegistrations.filter(reg => reg.paymentStatus === 'approved');
      
      // Get all category IDs from approved registrations
      const registeredCategoryIds = new Set<string>();
      for (const reg of approvedRegistrations) {
        for (const catId of reg.categoryIds) {
          registeredCategoryIds.add(catId);
        }
      }
      
      // Check if any of the new categories are already registered
      const duplicateCategories = categoryIds.filter(catId => registeredCategoryIds.has(catId));
      if (duplicateCategories.length > 0) {
        return res.status(400).json({ message: "Sorry, you cannot register for a Category twice." });
      }

      const FEE_PER_CATEGORY = 2500;
      const totalFee = categoryIds.length * FEE_PER_CATEGORY;

      let affiliate = null;
      if (referralCode) {
        affiliate = await storage.getAffiliateByReferralCode(referralCode);
      }

      // Create ONE registration with all categories
      const registration = await storage.createRegistration({
        userId,
        categoryIds,
        totalFee,
        paymentStatus: 'pending',
        referralCode: referralCode || null,
      });

      // Create referral record if affiliate code was used
      if (affiliate) {
        const commissionAmount = totalFee * 0.2; // 20% commission
        await storage.createReferral({
          affiliateId: affiliate.id,
          registrationId: registration.id,
          commission: commissionAmount,
        });

        // Update affiliate stats
        await storage.updateAffiliateStats(affiliate.id, 1, commissionAmount);
      }

      res.json({ 
        registration, 
        totalAmount: totalFee, 
        referralApplied: !!affiliate 
      });
    } catch (error) {
      console.error("Error creating registration:", error);
      res.status(500).json({ message: "Failed to create registration" });
    }
  });

  app.get('/api/registrations/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const registrations = await storage.getUserRegistrations(userId);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching user registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  // Payment verification endpoint
  app.post('/api/payments/verify', isAuthenticated, async (req: any, res) => {
    try {
      const { transaction_id, registrationId } = req.body;

      if (!transaction_id || !registrationId) {
        return res.status(400).json({ message: "Missing transaction_id or registrationId" });
      }

      // Get the registration first
      const registration = await storage.getRegistrationById(registrationId);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      // Verify the user owns this registration
      const userId = (req.user as SelectUser).id;
      if (registration.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Check if payment is already approved (prevent replay attacks)
      if (registration.paymentStatus === 'approved') {
        return res.status(400).json({ message: "Payment already completed for this registration" });
      }

      // Verify payment with Flutterwave
      const response = await flw.Transaction.verify({ id: transaction_id });
      
      if (response.status !== 'success') {
        return res.status(400).json({ message: "Payment verification failed with Flutterwave" });
      }

      const paymentData = response.data;
      
      // Check if payment was successful
      if (paymentData.status !== 'successful') {
        return res.status(400).json({ message: `Payment not successful: ${paymentData.status}` });
      }

      // Verify tx_ref matches expected format and registration ID
      const expectedTxRefPattern = `REG-${registrationId}-`;
      if (!paymentData.tx_ref || !paymentData.tx_ref.startsWith(expectedTxRefPattern)) {
        console.error(`Transaction reference mismatch: Expected ${expectedTxRefPattern}*, got ${paymentData.tx_ref}`);
        return res.status(400).json({ message: "Transaction does not belong to this registration" });
      }

      // Verify currency is XAF (Cameroon)
      if (paymentData.currency !== 'XAF') {
        console.error(`Currency mismatch: Expected XAF, got ${paymentData.currency}`);
        return res.status(400).json({ message: "Invalid payment currency" });
      }

      // Verify the amount matches (both amount and charged_amount)
      if (paymentData.amount !== registration.totalFee) {
        console.error(`Amount mismatch: Expected ${registration.totalFee}, got ${paymentData.amount}`);
        return res.status(400).json({ message: "Payment amount mismatch" });
      }

      if (paymentData.charged_amount !== registration.totalFee) {
        console.error(`Charged amount mismatch: Expected ${registration.totalFee}, got ${paymentData.charged_amount}`);
        return res.status(400).json({ message: "Charged amount mismatch" });
      }

      // Update registration payment status to approved (user is now fully registered)
      await storage.updateRegistrationPaymentStatus(registrationId, 'approved');

      // If there's a referral, update its status to 'completed'
      const referrals = await storage.getReferralsByRegistrationId(registrationId);
      for (const referral of referrals) {
        await storage.updateReferralStatus(referral.id, 'completed');
      }

      res.json({ 
        success: true, 
        message: "Payment verified successfully",
        registration: await storage.getRegistrationById(registrationId)
      });
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ 
        message: "Failed to verify payment",
        error: error.message 
      });
    }
  });

  // Payment webhook endpoint for async callbacks from Flutterwave
  app.post('/api/payments/webhook', async (req, res) => {
    try {
      const payload = req.body;
      const secretHash = process.env.FLW_SECRET_HASH;
      
      if (!secretHash) {
        console.error("FLW_SECRET_HASH not configured");
        return res.status(401).json({ message: "Webhook not configured" });
      }

      // Support both verification methods for backward compatibility
      const verifHashHeader = req.headers["verif-hash"] as string | undefined;
      const flwSignatureHeader = req.headers["flutterwave-signature"] as string | undefined;
      
      let isValidSignature = false;

      // Method 1: Modern HMAC-SHA256 verification (recommended)
      if (flwSignatureHeader) {
        const rawBody = JSON.stringify(req.body);
        const expectedSignature = crypto
          .createHmac('sha256', secretHash)
          .update(rawBody)
          .digest('hex');
        
        isValidSignature = crypto.timingSafeEqual(
          Buffer.from(flwSignatureHeader),
          Buffer.from(expectedSignature)
        );
        
        if (!isValidSignature) {
          console.error("Invalid HMAC signature");
        }
      }
      // Method 2: Legacy simple hash verification (backward compatibility)
      else if (verifHashHeader) {
        isValidSignature = crypto.timingSafeEqual(
          Buffer.from(verifHashHeader),
          Buffer.from(secretHash)
        );
        
        if (!isValidSignature) {
          console.error("Invalid verif-hash signature");
        }
      }
      else {
        console.error("Missing webhook signature headers");
        return res.status(401).json({ message: "Missing signature" });
      }

      if (!isValidSignature) {
        return res.status(401).json({ message: "Invalid signature" });
      }

      // Process the webhook only if it's a successful charge
      if (payload.event === 'charge.completed' && payload.data?.status === 'successful') {
        const txRef = payload.data.tx_ref;
        const transactionId = payload.data.id;
        
        // Extract registration ID from tx_ref format: REG-{registrationId}-{timestamp}
        const match = txRef?.match(/^REG-([a-f0-9-]+)-\d+$/);
        if (!match) {
          console.error(`Invalid tx_ref format: ${txRef}`);
          return res.status(200).json({ status: 'ignored' });
        }

        const registrationId = match[1];
        
        // Get the registration
        const registration = await storage.getRegistrationById(registrationId);
        if (!registration) {
          console.error(`Registration not found: ${registrationId}`);
          return res.status(200).json({ status: 'ignored' });
        }

        // Check if already approved (prevent duplicate processing)
        if (registration.paymentStatus === 'approved') {
          console.log(`Payment already approved for registration: ${registrationId}`);
          return res.status(200).json({ status: 'already_processed' });
        }

        // Re-verify the transaction with Flutterwave API (don't trust webhook alone)
        const verifyResponse = await flw.Transaction.verify({ id: transactionId });
        
        if (verifyResponse.status !== 'success' || verifyResponse.data.status !== 'successful') {
          console.error(`Transaction verification failed: ${transactionId}`);
          return res.status(200).json({ status: 'verification_failed' });
        }

        const verifiedData = verifyResponse.data;

        // Verify tx_ref, amount, and currency match
        if (verifiedData.tx_ref !== txRef) {
          console.error(`tx_ref mismatch: webhook=${txRef}, verified=${verifiedData.tx_ref}`);
          return res.status(200).json({ status: 'mismatch' });
        }

        if (verifiedData.currency !== 'XAF') {
          console.error(`Invalid currency: ${verifiedData.currency}`);
          return res.status(200).json({ status: 'invalid_currency' });
        }

        if (verifiedData.amount !== registration.totalFee || verifiedData.charged_amount !== registration.totalFee) {
          console.error(`Amount mismatch: expected=${registration.totalFee}, amount=${verifiedData.amount}, charged=${verifiedData.charged_amount}`);
          return res.status(200).json({ status: 'amount_mismatch' });
        }

        // All checks passed - update registration to approved (user is now fully registered)
        await storage.updateRegistrationPaymentStatus(registrationId, 'approved');
        
        const referrals = await storage.getReferralsByRegistrationId(registrationId);
        for (const referral of referrals) {
          await storage.updateReferralStatus(referral.id, 'completed');
        }

        console.log(`Payment webhook processed successfully for registration: ${registrationId}`);
      }

      res.status(200).json({ status: 'received' });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: (req.user as SelectUser | undefined)?.id,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post('/api/videos/upload-url', isAuthenticated, isEmailVerified, async (req: any, res) => {
    try {
      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || "";
      if (!privateObjectDir) {
        return res.status(500).json({ message: "Object storage not configured" });
      }
      const objectId = randomUUID();
      const videoUrl = `${privateObjectDir}/videos/${objectId}`;
      res.json({ videoUrl });
    } catch (error) {
      console.error("Error generating upload path:", error);
      res.status(500).json({ message: "Failed to generate upload path" });
    }
  });

  app.post('/api/videos/upload', isAuthenticated, isEmailVerified, async (req: any, res) => {
    try {
      const form = formidable({
        maxFileSize: 600 * 1024 * 1024, // 600MB (with overhead for 512MB limit)
        maxFieldsSize: 10 * 1024, // 10KB for fields
        keepExtensions: true,
        allowEmptyFiles: false,
      });

      form.parse(req, async (err: any, fields: any, files: any) => {
        if (err) {
          console.error("Error parsing form:", err);
          if (err.code === 'LIMIT_FILE_SIZE' || err.message?.includes('maxFileSize')) {
            return res.status(413).json({ message: "File size exceeds 512MB limit" });
          }
          return res.status(400).json({ message: "Error parsing upload: " + err.message });
        }

        const videoFile = Array.isArray(files.video) ? files.video[0] : files.video;
        const thumbnailFile = files.thumbnail ? (Array.isArray(files.thumbnail) ? files.thumbnail[0] : files.thumbnail) : null;
        const videoUrlField = Array.isArray(fields.videoUrl) ? fields.videoUrl[0] : fields.videoUrl;

        if (!videoFile || !videoUrlField) {
          console.error("Missing video file or path. videoFile:", !!videoFile, "videoUrl:", videoUrlField);
          return res.status(400).json({ message: "Missing video file or path" });
        }

        if (!thumbnailFile) {
          return res.status(400).json({ message: "Thumbnail image is required" });
        }

        const ALLOWED_VIDEO_FORMATS = ['video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime', 'video/x-flv'];
        if (!ALLOWED_VIDEO_FORMATS.includes(videoFile.mimetype?.toLowerCase() || '')) {
          return res.status(400).json({ message: "Invalid video format" });
        }

        const MAX_VIDEO_SIZE = 512 * 1024 * 1024;
        if (videoFile.size > MAX_VIDEO_SIZE) {
          return res.status(413).json({ message: "File size exceeds 512MB limit" });
        }

        const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
        if (!ALLOWED_IMAGE_FORMATS.includes(thumbnailFile.mimetype?.toLowerCase() || '')) {
          return res.status(400).json({ message: "Invalid thumbnail format. Allowed: JPEG, PNG, WebP" });
        }

        const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024; // 2MB
        if (thumbnailFile.size > MAX_THUMBNAIL_SIZE) {
          return res.status(413).json({ message: "Thumbnail size exceeds 2MB limit" });
        }

        let thumbnailUrl = null;

        try {
          const { bucketName, objectName } = parseObjectPath(videoUrlField);
          const bucket = objectStorageClient.bucket(bucketName);
          const videoFileObj = bucket.file(objectName);

          try {
            await new Promise((resolve, reject) => {
              const readStream = createReadStream(videoFile.filepath);
              const writeStream = videoFileObj.createWriteStream({
                metadata: {
                  contentType: videoFile.mimetype || 'video/mp4',
                  cacheControl: 'private, max-age=3600',
                },
              });

              readStream.on('error', (error: Error) => {
                console.error("Error reading file:", error);
                reject(new Error('Failed to read video file'));
              });

              writeStream.on('error', (error: Error) => {
                console.error("Error writing to storage:", error);
                reject(new Error('Failed to upload to storage'));
              });

              writeStream.on('finish', () => {
                resolve(undefined);
              });

              readStream.pipe(writeStream);
            });

            const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || "";
            const thumbnailId = randomUUID();
            const thumbnailPath = `${privateObjectDir}/thumbnails/${thumbnailId}.jpg`;
            const { bucketName: thumbBucket, objectName: thumbObjectName } = parseObjectPath(thumbnailPath);
            const thumbnailBucket = objectStorageClient.bucket(thumbBucket);
            const thumbnailFileObj = thumbnailBucket.file(thumbObjectName);

            await new Promise((resolve, reject) => {
              const readStream = createReadStream(thumbnailFile.filepath);
              const writeStream = thumbnailFileObj.createWriteStream({
                metadata: {
                  contentType: 'image/jpeg',
                  cacheControl: 'private, max-age=3600',
                },
              });

              readStream.on('error', (error: Error) => {
                console.error("Error reading thumbnail file:", error);
                reject(new Error('Failed to read thumbnail file'));
              });

              writeStream.on('error', (error: Error) => {
                console.error("Error writing thumbnail to storage:", error);
                reject(new Error('Failed to upload thumbnail to storage'));
              });

              writeStream.on('finish', () => {
                resolve(undefined);
              });

              readStream.pipe(writeStream);
            });

            thumbnailUrl = thumbnailPath;

            res.json({ success: true, videoUrl: videoUrlField, thumbnailUrl });
          } finally {
            try {
              await fs.unlink(videoFile.filepath);
              await fs.unlink(thumbnailFile.filepath);
            } catch (unlinkError) {
              console.error("Error cleaning up temp files:", unlinkError);
            }
          }
        } catch (error: any) {
          console.error("Error uploading to storage:", error);
          res.status(500).json({ message: error.message || "Failed to upload video" });
        }
      });
    } catch (error: any) {
      console.error("Error in upload handler:", error);
      res.status(500).json({ message: error.message || "Failed to process upload" });
    }
  });

  app.post('/api/videos', isAuthenticated, isEmailVerified, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const { videoUrl, thumbnailUrl, categoryId, subcategory, title, description, duration, fileSize, mimeType } = req.body;

      if (!videoUrl || !thumbnailUrl || !categoryId || !subcategory || !title || !duration || !fileSize || !mimeType) {
        return res.status(400).json({ message: "Missing required fields (videoUrl, thumbnailUrl, categoryId, subcategory, title, duration, fileSize, mimeType)" });
      }

      const ALLOWED_FORMATS = ['video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime', 'video/x-flv'];
      if (!ALLOWED_FORMATS.includes(mimeType.toLowerCase())) {
        return res.status(400).json({ message: "Invalid video format. Allowed: MP4, MPEG4, WebM, MOV, FLV" });
      }

      const MAX_FILE_SIZE = 512 * 1024 * 1024; // 512MB
      if (fileSize > MAX_FILE_SIZE) {
        return res.status(400).json({ message: "File size exceeds 512MB limit" });
      }

      const MIN_DURATION = 60; // 1 minute
      const MAX_DURATION = 180; // 3 minutes
      if (duration < MIN_DURATION || duration > MAX_DURATION) {
        return res.status(400).json({ message: "Video duration must be between 1 and 3 minutes" });
      }

      const registrations = await storage.getUserRegistrations(userId);
      const hasRegistration = registrations.some(r => r.categoryIds.includes(categoryId) && r.paymentStatus === 'approved');
      
      if (!hasRegistration) {
        return res.status(403).json({ message: "You must register and pay for this category before uploading videos" });
      }

      const existingVideos = await storage.getVideosByUser(userId);
      const categoryVideoCount = existingVideos.filter(v => v.categoryId === categoryId).length;
      if (categoryVideoCount >= 2) {
        return res.status(400).json({ message: "Maximum 2 videos per category allowed" });
      }

      const objectStorageService = new ObjectStorageService();
      const videoPath = await objectStorageService.trySetObjectEntityAclPolicy(
        videoUrl,
        {
          owner: userId,
          visibility: "private",
        }
      );

      const thumbnailPath = await objectStorageService.trySetObjectEntityAclPolicy(
        thumbnailUrl,
        {
          owner: userId,
          visibility: "private",
        }
      );

      const objectStorageTempDir = path.join(process.cwd(), '.tmp-object-storage');
      await fs.mkdir(objectStorageTempDir, { recursive: true });
      
      const tempVideoPath = path.join(objectStorageTempDir, `video-${randomUUID()}.mp4`);
      
      let moderationResult;
      try {
        const parsedPath = parseObjectPath(videoPath);
        const [file] = await objectStorageClient
          .bucket(parsedPath.bucketName)
          .file(parsedPath.objectName)
          .download();
        
        await fs.writeFile(tempVideoPath, file);

        moderationResult = await moderateVideo(tempVideoPath, title, description);
      } catch (moderationError) {
        console.error('Moderation error:', moderationError);
        moderationResult = { flagged: false, categories: [], reason: undefined };
      } finally {
        try {
          await fs.unlink(tempVideoPath);
        } catch (cleanupError) {
          console.error('Error cleaning up temp video:', cleanupError);
        }
      }

      const video = await storage.createVideo({
        userId,
        categoryId,
        subcategory,
        title,
        slug: generateSlug(title),
        description: description || null,
        videoUrl: videoPath,
        thumbnailUrl: thumbnailPath,
        duration,
        fileSize,
        status: 'approved',
        moderationStatus: 'approved',
        moderationCategories: moderationResult.categories.length > 0 ? moderationResult.categories : null,
        moderationReason: moderationResult.reason || null,
        moderatedAt: new Date(),
      });

      res.json(video);
    } catch (error) {
      console.error("Error creating video:", error);
      res.status(500).json({ message: "Failed to create video" });
    }
  });

  app.get('/api/videos/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const videos = await storage.getVideosByUser(userId);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching user videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  // Update video metadata (title, description)
  app.patch('/api/videos/:id/metadata', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as SelectUser).id;
      const { title, description } = req.body;

      // Verify video belongs to user
      const video = await storage.getVideoById(id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      if (video.userId !== userId) {
        return res.status(403).json({ message: "You can only edit your own videos" });
      }

      const updatedVideo = await storage.updateVideoMetadata(id, { title, description });
      res.json(updatedVideo);
    } catch (error) {
      console.error("Error updating video metadata:", error);
      res.status(500).json({ message: "Failed to update video" });
    }
  });

  // Delete video
  app.delete('/api/videos/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as SelectUser).id;

      // Verify video belongs to user
      const video = await storage.getVideoById(id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      if (video.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own videos" });
      }

      await storage.deleteVideo(id);
      res.json({ message: "Video deleted successfully" });
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ message: "Failed to delete video" });
    }
  });

  app.get('/api/videos/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }

      const videos = await storage.getPendingVideos();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching pending videos:", error);
      res.status(500).json({ message: "Failed to fetch pending videos" });
    }
  });

  app.get('/api/videos/video-of-the-day', async (req, res) => {
    try {
      const video = await storage.getVideoOfTheDay();
      
      if (!video) {
        return res.status(404).json({ message: "No video of the day available" });
      }

      res.json(video);
    } catch (error) {
      console.error("Error fetching video of the day:", error);
      res.status(500).json({ message: "Failed to fetch video of the day" });
    }
  });

  app.get('/api/videos/category/:categoryId', async (req, res) => {
    try {
      const { categoryId } = req.params;
      const videos = await storage.getVideosByCategory(categoryId);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching category videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  app.get('/api/videos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const video = await storage.getVideoById(id);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      if (video.status !== 'approved') {
        return res.status(403).json({ message: "Video not available" });
      }

      res.json(video);
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ message: "Failed to fetch video" });
    }
  });

  app.patch('/api/videos/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const videoToUpdate = await storage.getVideoById(id);
      if (!videoToUpdate) {
        return res.status(404).json({ message: "Video not found" });
      }

      if (status === 'approved' && videoToUpdate.videoUrl) {
        const objectStorageService = new ObjectStorageService();
        await objectStorageService.trySetObjectEntityAclPolicy(
          videoToUpdate.videoUrl,
          {
            owner: videoToUpdate.userId,
            visibility: "public",
          }
        );
        
        if (videoToUpdate.thumbnailUrl) {
          await objectStorageService.trySetObjectEntityAclPolicy(
            videoToUpdate.thumbnailUrl,
            {
              owner: videoToUpdate.userId,
              visibility: "public",
            }
          );
        }
      }

      const video = await storage.updateVideoStatus(id, status);
      res.json(video);
    } catch (error) {
      console.error("Error updating video status:", error);
      res.status(500).json({ message: "Failed to update video status" });
    }
  });

  // Fix ACL policies for all approved videos - admin only
  app.post('/api/admin/fix-video-acls', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const approvedVideos = await db
        .select()
        .from(schema.videos)
        .where(eq(schema.videos.status, 'approved'));
      
      console.log(`[ACL Fix] Found ${approvedVideos.length} approved videos`);
      
      const objectStorageService = new ObjectStorageService();
      let fixed = 0;
      let errors = 0;
      
      for (const video of approvedVideos) {
        try {
          // Fix video ACL
          if (video.videoUrl) {
            await objectStorageService.trySetObjectEntityAclPolicy(
              video.videoUrl,
              {
                owner: video.userId,
                visibility: "public",
              }
            );
          }
          
          // Fix thumbnail ACL
          if (video.thumbnailUrl) {
            await objectStorageService.trySetObjectEntityAclPolicy(
              video.thumbnailUrl,
              {
                owner: video.userId,
                visibility: "public",
              }
            );
          }
          
          fixed++;
          console.log(`[ACL Fix] Fixed video ${video.id}: ${video.title}`);
        } catch (error) {
          errors++;
          console.error(`[ACL Fix] Error fixing video ${video.id}:`, error);
        }
      }
      
      res.json({
        message: `Fixed ACL policies for ${fixed} videos`,
        total: approvedVideos.length,
        fixed,
        errors,
      });
    } catch (error) {
      console.error('[ACL Fix] Error:', error);
      res.status(500).json({ message: 'Failed to fix ACL policies' });
    }
  });

  // Admin: Delete video
  app.delete('/api/admin/videos/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

      const video = await storage.getVideoById(id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      await storage.deleteVideo(id);

      res.json({ message: "Video deleted successfully" });
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ message: "Failed to delete video" });
    }
  });

  // Admin: Get approved videos
  app.get('/api/admin/videos/approved', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const videos = await storage.getApprovedVideos();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching approved videos:", error);
      res.status(500).json({ message: "Failed to fetch approved videos" });
    }
  });

  // Admin: Get rejected videos
  app.get('/api/admin/videos/rejected', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const videos = await storage.getRejectedVideos();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching rejected videos:", error);
      res.status(500).json({ message: "Failed to fetch rejected videos" });
    }
  });

  // Admin: Update video metadata
  app.patch('/api/admin/videos/:id/metadata', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { title, description, subcategory } = req.body;

      const video = await storage.updateVideoMetadata(id, { title, description, subcategory });
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      res.json({ message: "Video metadata updated successfully", video });
    } catch (error) {
      console.error("Error updating video metadata:", error);
      res.status(500).json({ message: "Failed to update video metadata" });
    }
  });

  // Generate thumbnails for all videos without thumbnails - admin only
  app.post('/api/admin/generate-thumbnails', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const videosWithoutThumbnails = await storage.getVideosWithoutThumbnails();
      
      if (videosWithoutThumbnails.length === 0) {
        return res.json({ 
          message: 'All videos have thumbnails', 
          processed: 0,
          total: 0
        });
      }

      console.log(`[ThumbnailBatch] Starting batch generation for ${videosWithoutThumbnails.length} videos`);
      
      const results = {
        total: videosWithoutThumbnails.length,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const video of videosWithoutThumbnails) {
        try {
          console.log(`[ThumbnailBatch] Processing video ${video.id}: ${video.title}`);
          const result = await generateThumbnail(video.videoUrl, video.userId, video.duration);
          
          if (result.success) {
            await storage.updateVideoThumbnail(video.id, result.thumbnailUrl);
            results.successful++;
            console.log(`[ThumbnailBatch] ✓ Successfully generated thumbnail for video ${video.id}`);
          } else {
            results.failed++;
            results.errors.push(`Video ${video.id}: ${result.error}`);
            console.error(`[ThumbnailBatch] ✗ Failed to generate thumbnail for video ${video.id}:`, result.error);
          }
          results.processed++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Video ${video.id}: ${error.message}`);
          console.error(`[ThumbnailBatch] ✗ Error processing video ${video.id}:`, error);
          results.processed++;
        }
      }

      console.log(`[ThumbnailBatch] Batch complete. Successful: ${results.successful}, Failed: ${results.failed}`);
      
      res.json({
        message: `Processed ${results.processed} videos. ${results.successful} successful, ${results.failed} failed.`,
        ...results
      });
    } catch (error: any) {
      console.error('[ThumbnailBatch] Batch generation error:', error);
      res.status(500).json({ message: 'Failed to generate thumbnails', error: error.message });
    }
  });

  // Judge scoring endpoint - admin only
  app.post('/api/videos/:id/score', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { creativityScore, qualityScore, comments } = req.body;
      const judgeId = (req.user as SelectUser).id;

      // Validate video exists and is approved
      const video = await storage.getVideoById(id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      if (video.status !== 'approved') {
        return res.status(400).json({ message: "Can only score approved videos" });
      }

      // Validate score ranges (0-50 for each component)
      if (typeof creativityScore !== 'number' || creativityScore < 0 || creativityScore > 50) {
        return res.status(400).json({ message: "Creativity score must be between 0 and 50" });
      }

      if (typeof qualityScore !== 'number' || qualityScore < 0 || qualityScore > 50) {
        return res.status(400).json({ message: "Quality score must be between 0 and 50" });
      }

      // Check if judge already scored this video (application-level check)
      const existingScores = await storage.getVideoJudgeScores(id);
      const existingScore = existingScores.find(s => s.judgeId === judgeId);
      if (existingScore) {
        return res.status(400).json({ message: "You have already scored this video" });
      }

      // Create the judge score (database-level unique constraint will prevent race conditions)
      const totalScore = creativityScore + qualityScore;
      const score = await storage.createJudgeScore({
        videoId: id,
        judgeId,
        creativityScore,
        qualityScore,
        totalScore,
        comments: comments || null,
      });

      res.json({
        success: true,
        score,
        totalScore: creativityScore + qualityScore,
      });
    } catch (error: any) {
      console.error("Error creating judge score:", error);
      
      // Handle unique constraint violations
      if (error.code === '23505' || error.message?.includes('unique constraint')) {
        return res.status(400).json({ message: "You have already scored this video" });
      }
      
      res.status(500).json({ message: "Failed to create judge score" });
    }
  });

  // Get judge scores for a video
  app.get('/api/videos/:id/scores', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify video exists
      const video = await storage.getVideoById(id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      const scores = await storage.getVideoJudgeScores(id);
      
      // Calculate total and average
      const total = scores.reduce((sum, score) => sum + score.creativityScore + score.qualityScore, 0);
      const average = scores.length > 0 ? total / scores.length : 0;

      res.json({
        scores,
        count: scores.length,
        total,
        average,
      });
    } catch (error) {
      console.error("Error fetching judge scores:", error);
      res.status(500).json({ message: "Failed to fetch judge scores" });
    }
  });

  // Public judges roster
  app.get('/api/judges', async (req, res) => {
    try {
      const judges = await storage.getJudgeRoster();
      res.json(judges);
    } catch (error) {
      console.error("Error fetching judges:", error);
      res.status(500).json({ message: "Failed to fetch judges" });
    }
  });

  // Public judge with stats
  app.get('/api/judges/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const judge = await storage.getJudgeWithStats(id);
      
      if (!judge) {
        return res.status(404).json({ message: "Judge not found" });
      }
      
      res.json(judge);
    } catch (error) {
      console.error("Error fetching judge:", error);
      res.status(500).json({ message: "Failed to fetch judge" });
    }
  });

  // Judge dashboard - Get pending videos to score
  app.get('/api/judge/videos/pending', isAuthenticated, isJudge, async (req: any, res) => {
    try {
      const judgeId = (req.user as SelectUser).id;
      const { categoryId, phaseId, limit } = req.query;
      
      // Validate UUID format for categoryId and phaseId
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (categoryId && !uuidRegex.test(categoryId as string)) {
        return res.status(400).json({ message: "Invalid categoryId format. Must be a valid UUID" });
      }
      
      if (phaseId && !uuidRegex.test(phaseId as string)) {
        return res.status(400).json({ message: "Invalid phaseId format. Must be a valid UUID" });
      }
      
      // Validate and sanitize limit parameter
      let parsedLimit: number | undefined = undefined;
      if (limit) {
        const limitNum = parseInt(limit as string, 10);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
          return res.status(400).json({ message: "Invalid limit parameter. Must be between 1 and 100" });
        }
        parsedLimit = limitNum;
      }
      
      const videos = await storage.getVideosForJudging(judgeId, {
        categoryId: categoryId as string,
        phaseId: phaseId as string,
        limit: parsedLimit
      });
      
      res.json(videos);
    } catch (error) {
      console.error("Error fetching pending videos for judge:", error);
      res.status(500).json({ message: "Failed to fetch pending videos" });
    }
  });

  // Judge dashboard - Get completed scores
  app.get('/api/judge/videos/completed', isAuthenticated, isJudge, async (req: any, res) => {
    try {
      const judgeId = (req.user as SelectUser).id;
      const { categoryId, phaseId } = req.query;
      
      // Validate UUID format for categoryId and phaseId
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (categoryId && !uuidRegex.test(categoryId as string)) {
        return res.status(400).json({ message: "Invalid categoryId format. Must be a valid UUID" });
      }
      
      if (phaseId && !uuidRegex.test(phaseId as string)) {
        return res.status(400).json({ message: "Invalid phaseId format. Must be a valid UUID" });
      }
      
      const scores = await storage.getJudgeCompletedScores(judgeId, {
        categoryId: categoryId as string,
        phaseId: phaseId as string
      });
      
      res.json(scores);
    } catch (error) {
      console.error("Error fetching completed scores for judge:", error);
      res.status(500).json({ message: "Failed to fetch completed scores" });
    }
  });

  // Judge dashboard - Submit score for a video
  app.post('/api/judge/videos/:videoId/score', isAuthenticated, isJudge, async (req: any, res) => {
    try {
      const { videoId } = req.params;
      const judgeId = (req.user as SelectUser).id;

      // Validate request body with Zod (omit server-populated fields)
      const judgeScoreValidationSchema = insertJudgeScoreSchema
        .omit({ judgeId: true, videoId: true })
        .extend({
          creativityScore: z.number().int().min(0).max(10),
          qualityScore: z.number().int().min(0).max(10),
          comments: z.string().optional().nullable(),
        });

      const validationResult = judgeScoreValidationSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid score data",
          errors: validationResult.error.errors 
        });
      }

      const { creativityScore, qualityScore, comments } = validationResult.data;

      // Check if video exists and is approved
      const video = await storage.getVideoById(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      if (video.status !== 'approved') {
        return res.status(400).json({ message: "Can only score approved videos" });
      }

      // Check if judge already scored this video
      const existingScores = await storage.getVideoJudgeScores(videoId);
      const existingScore = existingScores.find(s => s.judgeId === judgeId);
      if (existingScore) {
        return res.status(400).json({ message: "You have already scored this video" });
      }

      // Create the judge score using validated data
      const totalScore = creativityScore + qualityScore;
      const score = await storage.createJudgeScore({
        videoId,
        judgeId,
        creativityScore,
        qualityScore,
        totalScore,
        comments: comments || null,
      });

      res.json({
        success: true,
        score,
        totalScore: creativityScore + qualityScore,
      });
    } catch (error: any) {
      console.error("Error creating judge score:", error);
      
      if (error.code === '23505' || error.message?.includes('unique constraint')) {
        return res.status(400).json({ message: "You have already scored this video" });
      }
      
      res.status(500).json({ message: "Failed to create judge score" });
    }
  });

  // Judge dashboard - Get assignment summary
  app.get('/api/judge/summary', isAuthenticated, isJudge, async (req: any, res) => {
    try {
      const judgeId = (req.user as SelectUser).id;
      const summary = await storage.getJudgeAssignmentSummary(judgeId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching judge summary:", error);
      res.status(500).json({ message: "Failed to fetch judge summary" });
    }
  });

  // Judge profile - Update judge profile
  app.patch('/api/judge/profile', isAuthenticated, isJudge, async (req: any, res) => {
    try {
      const judgeId = (req.user as SelectUser).id;
      const { judgeName, judgeBio, judgePhotoUrl } = req.body;
      
      const updates: any = {};
      if (judgeName !== undefined) updates.judgeName = judgeName;
      if (judgeBio !== undefined) updates.judgeBio = judgeBio;
      if (judgePhotoUrl !== undefined) updates.judgePhotoUrl = judgePhotoUrl;
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No updates provided" });
      }
      
      const user = await storage.updateJudgeProfile(judgeId, updates);
      
      if (!user) {
        return res.status(404).json({ message: "Judge not found" });
      }
      
      // Return only safe fields, explicitly exclude all sensitive data
      const safeUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        age: user.age,
        location: user.location,
        parentalConsent: user.parentalConsent,
        isAdmin: user.isAdmin,
        isJudge: user.isJudge,
        judgeName: user.judgeName,
        judgeBio: user.judgeBio,
        judgePhotoUrl: user.judgePhotoUrl,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating judge profile:", error);
      res.status(500).json({ message: "Failed to update judge profile" });
    }
  });

  // Judge profile - Upload judge profile photo (self-service)
  app.post('/api/judge/photo', isAuthenticated, isJudge, async (req: any, res) => {
    try {
      const form = formidable({
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxFieldsSize: 1024,
        keepExtensions: true,
        allowEmptyFiles: false,
      });

      form.parse(req, async (err: any, fields: any, files: any) => {
        if (err) {
          console.error("Error parsing photo upload:", err);
          if (err.code === 'LIMIT_FILE_SIZE' || err.message?.includes('maxFileSize')) {
            return res.status(413).json({ message: "Photo size exceeds 5MB limit" });
          }
          return res.status(400).json({ message: "Error parsing upload: " + err.message });
        }

        const photoFile = Array.isArray(files.photo) ? files.photo[0] : files.photo;
        
        if (!photoFile) {
          return res.status(400).json({ message: "No photo file provided" });
        }

        const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
        if (!ALLOWED_IMAGE_FORMATS.includes(photoFile.mimetype?.toLowerCase() || '')) {
          return res.status(400).json({ message: "Invalid image format. Allowed: JPEG, PNG, WebP" });
        }

        try {
          const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || "";
          if (!privateObjectDir) {
            return res.status(500).json({ message: "Object storage not configured" });
          }

          // Determine file extension based on mimetype
          const extMap: { [key: string]: string } = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
          };
          const ext = extMap[photoFile.mimetype?.toLowerCase() || ''] || 'jpg';

          const photoId = randomUUID();
          const photoPath = `${privateObjectDir}/judge-photos/${photoId}.${ext}`;
          const { bucketName, objectName } = parseObjectPath(photoPath);
          const bucket = objectStorageClient.bucket(bucketName);
          const photoFileObj = bucket.file(objectName);

          await new Promise((resolve, reject) => {
            const readStream = createReadStream(photoFile.filepath);
            const writeStream = photoFileObj.createWriteStream({
              metadata: {
                contentType: photoFile.mimetype || 'image/jpeg',
                cacheControl: 'private, max-age=3600',
              },
            });

            readStream.on('error', (error: Error) => {
              console.error("Error reading photo file:", error);
              reject(new Error('Failed to read photo file'));
            });

            writeStream.on('error', (error: Error) => {
              console.error("Error writing photo to storage:", error);
              reject(new Error('Failed to upload photo to storage'));
            });

            writeStream.on('finish', () => {
              resolve(undefined);
            });

            readStream.pipe(writeStream);
          });

          res.json({ photoUrl: photoPath });
        } catch (error: any) {
          console.error("Error uploading photo:", error);
          res.status(500).json({ message: error.message || "Failed to upload photo" });
        } finally {
          // Always clean up temp file
          try {
            await fs.unlink(photoFile.filepath);
          } catch (unlinkError) {
            console.error("Error cleaning up temp file:", unlinkError);
          }
        }
      });
    } catch (error: any) {
      console.error("Error in photo upload handler:", error);
      res.status(500).json({ message: error.message || "Failed to process upload" });
    }
  });

  app.post('/api/votes', async (req: any, res) => {
    try {
      const { videoId } = req.body;
      
      if (!videoId) {
        return res.status(400).json({ message: "Video ID is required" });
      }

      // Check if video exists and is approved
      const video = await storage.getVideoById(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      if (video.status !== 'approved') {
        return res.status(400).json({ message: "Cannot vote for unapproved videos" });
      }

      // Get user ID if authenticated, or use IP address for anonymous votes
      const userId = req.user ? (req.user as SelectUser).id : null;
      const ipAddress = req.ip || req.connection.remoteAddress || null;

      // Check for duplicate votes (application-level check as first line of defense)
      const existingVotes = await storage.getUserVotesForVideo(userId, videoId, ipAddress);
      if (existingVotes.length > 0) {
        return res.status(400).json({ message: "You have already voted for this video" });
      }

      // Create the vote (database-level unique constraints will prevent race conditions)
      const vote = await storage.createVote({
        videoId,
        userId,
        ipAddress,
      });

      // Get updated vote count
      const voteCount = await storage.getVideoVoteCount(videoId);

      res.json({ 
        success: true, 
        vote,
        voteCount,
      });
    } catch (error: any) {
      console.error("Error creating vote:", error);
      
      // Handle unique constraint violations
      if (error.code === '23505' || error.message?.includes('unique constraint')) {
        return res.status(400).json({ message: "You have already voted for this video" });
      }
      
      res.status(500).json({ message: "Failed to create vote" });
    }
  });

  app.get('/api/votes/video/:videoId', async (req, res) => {
    try {
      const { videoId } = req.params;
      const voteCount = await storage.getCombinedVoteCount(videoId);
      res.json({ voteCount });
    } catch (error) {
      console.error("Error fetching vote count:", error);
      res.status(500).json({ message: "Failed to fetch vote count" });
    }
  });

  app.post('/api/votes/purchase/initiate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const { videoId, voteCount } = req.body;

      if (!videoId || !voteCount) {
        return res.status(400).json({ message: "Video ID and vote count are required" });
      }

      if (voteCount < 1 || voteCount > 1000) {
        return res.status(400).json({ message: "Vote count must be between 1 and 1000" });
      }

      const video = await storage.getVideoById(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      if (video.status !== 'approved') {
        return res.status(400).json({ message: "Cannot purchase votes for unapproved videos" });
      }

      const COST_PER_VOTE = 50;
      const amount = voteCount * COST_PER_VOTE;

      const txRef = `VOTE-${randomUUID()}`;

      const purchase = await storage.createVotePurchase({
        userId,
        videoId,
        voteCount,
        amount,
        txRef,
        status: 'pending',
      });

      const user = await storage.getUser(userId);

      res.json({
        success: true,
        txRef: purchase.txRef,
        amount: purchase.amount,
        voteCount: purchase.voteCount,
        customer: {
          email: user?.email,
          phone: user?.username || '',
          name: `${user?.firstName} ${user?.lastName}`,
        },
      });
    } catch (error) {
      console.error("Error initiating vote purchase:", error);
      res.status(500).json({ message: "Failed to initiate vote purchase" });
    }
  });

  app.post('/api/votes/purchase/callback', isAuthenticated, async (req: any, res) => {
    try {
      const { txRef, transactionId } = req.body;
      const userId = (req.user as SelectUser).id;

      if (!txRef || !transactionId) {
        return res.status(400).json({ message: "Transaction reference and ID are required" });
      }

      const purchase = await storage.getVotePurchaseByTxRef(txRef);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }

      if (purchase.userId !== userId) {
        return res.status(403).json({ message: "Forbidden - Not your purchase" });
      }

      if (purchase.status === 'successful') {
        return res.json({ success: true, message: "Already processed" });
      }

      const flwClient = new Flutterwave(
        process.env.FLW_PUBLIC_KEY!,
        process.env.FLW_SECRET_KEY!
      );

      const verifyResponse = await flwClient.Transaction.verify({ id: transactionId });

      if (verifyResponse.status !== 'success') {
        return res.status(400).json({ message: "Payment verification failed with Flutterwave" });
      }

      const paymentData = verifyResponse.data;

      if (paymentData.status !== 'successful') {
        await storage.updateVotePurchase(purchase.id, {
          status: 'failed',
          paymentData: { data: paymentData },
        });
        return res.status(400).json({ message: `Payment not successful: ${paymentData.status}` });
      }

      if (paymentData.tx_ref !== txRef) {
        return res.status(400).json({ message: "Transaction reference mismatch" });
      }

      if (paymentData.currency !== 'XAF') {
        return res.status(400).json({ message: "Invalid payment currency" });
      }

      if (Math.abs(paymentData.amount - purchase.amount) > 0.01) {
        return res.status(400).json({ message: "Payment amount mismatch" });
      }

      if (Math.abs(paymentData.charged_amount - purchase.amount) > 0.01) {
        return res.status(400).json({ message: "Charged amount mismatch" });
      }

      const COST_PER_VOTE = 50;
      const verifiedVoteCount = Math.floor(paymentData.amount / COST_PER_VOTE);
      if (verifiedVoteCount !== purchase.voteCount) {
        return res.status(400).json({ message: "Vote count mismatch" });
      }

      await storage.updateVotePurchase(purchase.id, {
        status: 'successful',
        flwRef: paymentData.flw_ref,
        completedAt: new Date(),
        paymentData: { data: paymentData },
      });

      await storage.createPaidVote({
        purchaseId: purchase.id,
        videoId: purchase.videoId,
        quantity: verifiedVoteCount,
      });

      res.json({ 
        success: true, 
        message: "Payment verified successfully",
        voteCount: verifiedVoteCount
      });
    } catch (error: any) {
      console.error("Vote purchase callback error:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  app.post('/api/votes/purchase/webhook', async (req, res) => {
    try {
      const payload = req.body;
      console.log("[Vote Purchase Webhook] Received:", JSON.stringify(payload, null, 2));

      const secretHash = process.env.FLW_SECRET_HASH;
      const signature = req.headers['verif-hash'];

      if (!signature || signature !== secretHash) {
        console.error("[Vote Purchase Webhook] Invalid signature");
        return res.status(401).json({ message: "Unauthorized - Invalid signature" });
      }

      if (payload.event !== 'charge.completed' || payload.data?.status !== 'successful') {
        console.log("[Vote Purchase Webhook] Ignoring non-successful event");
        return res.status(200).json({ status: 'ignored' });
      }

      const txRef = payload.data.tx_ref;
      const transactionId = payload.data.id;

      if (!txRef || !transactionId) {
        console.error("[Vote Purchase Webhook] Missing tx_ref or transaction_id");
        return res.status(400).json({ message: "Missing required fields" });
      }

      const purchase = await storage.getVotePurchaseByTxRef(txRef);
      if (!purchase) {
        console.error(`[Vote Purchase Webhook] Purchase not found: ${txRef}`);
        return res.status(404).json({ message: "Purchase not found" });
      }

      if (purchase.status === 'successful') {
        console.log(`[Vote Purchase Webhook] Already processed: ${txRef}`);
        return res.json({ success: true, message: "Already processed" });
      }

      const flw_ref = payload.data.flw_ref;
      const existingByFlwRef = flw_ref ? await storage.getVotePurchaseByFlwRef(flw_ref) : null;
      if (existingByFlwRef && existingByFlwRef.id !== purchase.id) {
        console.log(`[Vote Purchase Webhook] Duplicate flw_ref: ${flw_ref}`);
        return res.json({ success: true, message: "Duplicate Flutterwave reference" });
      }

      const flwClient = new Flutterwave(
        process.env.FLW_PUBLIC_KEY!,
        process.env.FLW_SECRET_KEY!
      );

      const verifyResponse = await flwClient.Transaction.verify({ id: transactionId });

      if (verifyResponse.status !== 'success') {
        console.error("[Vote Purchase Webhook] Flutterwave verification failed");
        return res.status(400).json({ message: "Payment verification failed" });
      }

      const paymentData = verifyResponse.data;

      if (paymentData.status !== 'successful') {
        console.error(`[Vote Purchase Webhook] Payment not successful: ${paymentData.status}`);
        await storage.updateVotePurchase(purchase.id, {
          status: 'failed',
          paymentData: payload,
        });
        return res.json({ success: true, message: "Payment not successful" });
      }

      if (paymentData.tx_ref !== txRef) {
        console.error(`[Vote Purchase Webhook] tx_ref mismatch: expected ${txRef}, got ${paymentData.tx_ref}`);
        return res.status(400).json({ message: "Transaction reference mismatch" });
      }

      if (paymentData.currency !== 'XAF') {
        console.error(`[Vote Purchase Webhook] Invalid currency: ${paymentData.currency}`);
        return res.status(400).json({ message: "Invalid currency" });
      }

      if (Math.abs(paymentData.amount - purchase.amount) > 0.01) {
        console.error(`[Vote Purchase Webhook] Amount mismatch: expected ${purchase.amount}, got ${paymentData.amount}`);
        return res.status(400).json({ message: "Amount mismatch - potential tampering detected" });
      }

      if (Math.abs(paymentData.charged_amount - purchase.amount) > 0.01) {
        console.error(`[Vote Purchase Webhook] Charged amount mismatch: expected ${purchase.amount}, got ${paymentData.charged_amount}`);
        return res.status(400).json({ message: "Charged amount mismatch" });
      }

      const COST_PER_VOTE = 50;
      const verifiedVoteCount = Math.floor(paymentData.amount / COST_PER_VOTE);
      if (verifiedVoteCount !== purchase.voteCount) {
        console.error(`[Vote Purchase Webhook] Vote count mismatch: stored ${purchase.voteCount}, calculated ${verifiedVoteCount}`);
        return res.status(400).json({ message: "Vote count mismatch" });
      }

      await storage.updateVotePurchase(purchase.id, {
        status: 'successful',
        flwRef: flw_ref,
        completedAt: new Date(),
        paymentData: payload,
      });

      await storage.createPaidVote({
        purchaseId: purchase.id,
        videoId: purchase.videoId,
        quantity: verifiedVoteCount,
      });

      console.log(`[Vote Purchase Webhook] Successfully processed: ${txRef}, ${verifiedVoteCount} votes added`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Vote Purchase Webhook] Error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.get('/api/votes/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const votes = await storage.getUserVotes(userId);
      res.json(votes);
    } catch (error) {
      console.error("Error fetching user votes:", error);
      res.status(500).json({ message: "Failed to fetch user votes" });
    }
  });

  // Like routes
  app.post('/api/likes', async (req: any, res) => {
    try {
      const { videoId } = req.body;
      
      if (!videoId) {
        return res.status(400).json({ message: "Video ID is required" });
      }

      const video = await storage.getVideoById(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      if (video.status !== 'approved') {
        return res.status(400).json({ message: "Cannot like unapproved videos" });
      }

      const userId = req.user ? (req.user as SelectUser).id : null;
      const ipAddress = req.ip || req.connection.remoteAddress || null;

      // Check for both authenticated and IP-based duplicates
      if (userId) {
        const userLikes = await storage.getUserLikesForVideo(userId, videoId, undefined);
        if (userLikes.length > 0) {
          return res.status(400).json({ message: "You have already liked this video" });
        }
      }
      
      if (ipAddress && !userId) {
        const ipLikes = await storage.getUserLikesForVideo(null, videoId, ipAddress);
        if (ipLikes.length > 0) {
          return res.status(400).json({ message: "You have already liked this video" });
        }
      }

      const like = await storage.createLike({
        videoId,
        userId,
        ipAddress: !userId ? ipAddress : null, // Only store IP for anonymous users
      });

      const likeCount = await storage.getVideoLikeCount(videoId);

      res.json({ 
        success: true, 
        like,
        likeCount
      });
    } catch (error: any) {
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        return res.status(400).json({ message: "You have already liked this video" });
      }
      console.error("Error creating like:", error);
      res.status(500).json({ message: "Failed to create like" });
    }
  });

  app.get('/api/likes/video/:videoId', async (req, res) => {
    try {
      const { videoId } = req.params;
      const likeCount = await storage.getVideoLikeCount(videoId);
      res.json({ likeCount });
    } catch (error) {
      console.error("Error fetching like count:", error);
      res.status(500).json({ message: "Failed to fetch like count" });
    }
  });

  app.get('/api/likes/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const likes = await storage.getUserLikes(userId);
      res.json(likes);
    } catch (error) {
      console.error("Error fetching user likes:", error);
      res.status(500).json({ message: "Failed to fetch user likes" });
    }
  });

  app.post('/api/watch-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const { videoId, watchDuration, completed } = req.body;
      
      if (!videoId) {
        return res.status(400).json({ message: "Video ID is required" });
      }

      // First create watch history record
      const watchHistory = await storage.createWatchHistory({
        userId,
        videoId,
        watchDuration: watchDuration || null,
        completed: completed || false,
      });

      // Only increment view count after successfully creating watch history
      await storage.incrementVideoViews(videoId);

      res.json({ success: true, watchHistory });
    } catch (error) {
      console.error("Error creating watch history:", error);
      res.status(500).json({ message: "Failed to record watch history" });
    }
  });

  app.get('/api/watch-history/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const watchHistory = await storage.getUserWatchHistory(userId, limit);
      res.json(watchHistory);
    } catch (error) {
      console.error("Error fetching watch history:", error);
      res.status(500).json({ message: "Failed to fetch watch history" });
    }
  });

  app.get('/api/watch-history/check/:videoId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const { videoId } = req.params;
      const watched = await storage.checkIfWatched(userId, videoId);
      res.json({ watched });
    } catch (error) {
      console.error("Error checking watch history:", error);
      res.status(500).json({ message: "Failed to check watch history" });
    }
  });

  app.get('/api/stats/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Creator Dashboard endpoints
  app.get('/api/creator/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      
      // Get all creator's videos
      const videos = await storage.getVideosByUser(userId);
      
      // Calculate stats
      const totalVideos = videos.length;
      const approvedVideos = videos.filter(v => v.status === 'approved').length;
      const pendingVideos = videos.filter(v => v.status === 'pending').length;
      const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
      
      // Get vote counts
      const totalVotes = await Promise.all(
        videos.map(v => storage.getCombinedVoteCount(v.id))
      ).then(counts => counts.reduce((sum, count) => sum + count, 0));
      
      // Get like counts
      const totalLikes = await Promise.all(
        videos.map(v => storage.getVideoLikeCount(v.id))
      ).then(counts => counts.reduce((sum, count) => sum + count, 0));
      
      // Get user's ranking position (simplified - could be by category/phase)
      const leaderboard = await storage.getLeaderboard(undefined, undefined, 100);
      const rankingPosition = leaderboard.findIndex(entry => entry.userId === userId) + 1;
      
      res.json({
        totalVideos,
        totalViews,
        totalVotes,
        totalLikes,
        approvedVideos,
        pendingVideos,
        rankingPosition: rankingPosition > 0 ? rankingPosition : null,
      });
    } catch (error) {
      console.error("Error fetching creator stats:", error);
      res.status(500).json({ message: "Failed to fetch creator stats" });
    }
  });

  app.get('/api/creator/videos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      
      const videos = await storage.getVideosByUser(userId);
      
      // Enrich with vote and like counts
      const enrichedVideos = await Promise.all(
        videos.map(async (video) => {
          const voteCount = await storage.getCombinedVoteCount(video.id);
          const likeCount = await storage.getVideoLikeCount(video.id);
          
          return {
            ...video,
            voteCount,
            likeCount,
          };
        })
      );
      
      res.json(enrichedVideos);
    } catch (error) {
      console.error("Error fetching creator videos:", error);
      res.status(500).json({ message: "Failed to fetch creator videos" });
    }
  });

  app.get('/api/creator/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        profileImageUrl: user.profileImageUrl,
        location: user.location,
        age: user.age,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Error fetching creator profile:", error);
      res.status(500).json({ message: "Failed to fetch creator profile" });
    }
  });

  app.get('/api/creator/competitions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      
      const registrations = await storage.getUserRegistrations(userId);
      
      // Enrich with category information
      const enrichedRegistrations = await Promise.all(
        registrations.map(async (reg) => {
          const categoryIds = reg.categoryIds || [];
          const categories = await Promise.all(
            categoryIds.map(catId => storage.getCategoryById(catId))
          );
          
          return {
            ...reg,
            categories: categories.filter(Boolean),
          };
        })
      );
      
      res.json(enrichedRegistrations);
    } catch (error) {
      console.error("Error fetching creator competitions:", error);
      res.status(500).json({ message: "Failed to fetch creator competitions" });
    }
  });

  app.get('/api/creator/watch-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const history = await storage.getWatchHistory(userId);
      
      // Get video details for each watch history entry
      const enrichedHistory = await Promise.all(
        history.slice(0, 20).map(async (entry) => {
          const video = await storage.getVideoById(entry.videoId);
          return {
            ...entry,
            video: video ? {
              id: video.id,
              title: video.title,
              thumbnailUrl: video.thumbnailUrl,
              categoryId: video.categoryId,
            } : null,
          };
        })
      );
      
      res.json(enrichedHistory);
    } catch (error) {
      console.error("Error fetching watch history:", error);
      res.status(500).json({ message: "Failed to fetch watch history" });
    }
  });

  app.get('/api/creator/earnings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      
      // Check if user is an affiliate
      const affiliate = await storage.getAffiliateByUserId(userId);
      
      if (!affiliate) {
        return res.json({
          isAffiliate: false,
          totalEarnings: 0,
          totalReferrals: 0,
          pendingPayouts: 0,
          completedPayouts: 0,
        });
      }

      // Get payout requests
      const payoutRequests = await Promise.all([
        storage.getAffiliatePayoutRequests(affiliate.id),
      ]).then(([requests]) => requests || []);

      const pendingPayouts = payoutRequests
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + r.amount, 0);

      const completedPayouts = payoutRequests
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + r.amount, 0);

      res.json({
        isAffiliate: true,
        referralCode: affiliate.referralCode,
        totalEarnings: affiliate.totalEarnings,
        totalReferrals: affiliate.totalReferrals,
        pendingPayouts,
        completedPayouts,
        status: affiliate.status,
      });
    } catch (error) {
      console.error("Error fetching creator earnings:", error);
      res.status(500).json({ message: "Failed to fetch creator earnings" });
    }
  });

  app.get('/api/leaderboard', async (req, res) => {
    try {
      const { categoryId, phaseId, limit } = req.query;
      const leaderboard = await storage.getLeaderboard(
        categoryId as string | undefined,
        phaseId as string | undefined,
        limit ? parseInt(limit as string) : 50
      );
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Affiliate routes - accepts both authenticated and non-authenticated users
  app.post('/api/affiliate/opt-in', async (req: any, res) => {
    try {
      let userId: string;

      if (req.user) {
        // User is already authenticated
        userId = (req.user as SelectUser).id;
        
        // Check if already an affiliate
        const existing = await storage.getAffiliateByUserId(userId);
        if (existing) {
          return res.status(400).json({ message: "Already enrolled as an affiliate" });
        }
      } else {
        // User is not authenticated - create a new account
        const { firstName, lastName, email, username, password } = req.body;

        // Validate required fields for new users
        if (!firstName || !lastName || !email || !username || !password) {
          return res.status(400).json({ message: "All user fields are required for registration" });
        }

        // Check if email already exists
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already registered" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user account
        const newUser = await storage.createUser({
          firstName,
          lastName,
          email,
          username,
          password: hashedPassword,
          isAdmin: false,
        });

        userId = newUser.id;

        // Auto-login the newly created user
        req.login(newUser, (err: Error) => {
          if (err) {
            console.error("Auto-login error:", err);
          }
        });
      }

      // Generate unique referral code
      const referralCode = `REF-${userId.substring(0, 8).toUpperCase()}`;
      
      const affiliate = await storage.createAffiliate({
        userId,
        referralCode,
        status: 'active',
      });

      res.json(affiliate);
    } catch (error) {
      console.error("Error creating affiliate:", error);
      res.status(500).json({ message: "Failed to create affiliate" });
    }
  });

  app.get('/api/affiliate/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const affiliate = await storage.getAffiliateByUserId(userId);
      res.json({ isAffiliate: !!affiliate, affiliate });
    } catch (error) {
      console.error("Error fetching affiliate status:", error);
      res.status(500).json({ message: "Failed to fetch affiliate status" });
    }
  });

  app.get('/api/affiliate/referrals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const affiliate = await storage.getAffiliateByUserId(userId);
      
      if (!affiliate) {
        return res.status(404).json({ message: "Not enrolled as an affiliate" });
      }

      const referrals = await storage.getAffiliateReferrals(affiliate.id);
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  // Affiliate: Request payout
  app.post('/api/affiliate/payout/request', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const affiliate = await storage.getAffiliateByUserId(userId);
      
      if (!affiliate) {
        return res.status(404).json({ message: "Not enrolled as an affiliate" });
      }

      const { amount, paymentMethod, accountDetails } = req.body;

      // Validate required fields
      if (!amount || !paymentMethod || !accountDetails) {
        return res.status(400).json({ message: "Amount, payment method, and account details are required" });
      }

      // Validate amount
      if (amount <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
      }

      // Check available balance
      const availableBalance = await storage.getAffiliateAvailableBalance(affiliate.id);
      
      if (amount > availableBalance) {
        return res.status(400).json({ 
          message: `Insufficient balance. Available: ${availableBalance} FCFA`,
          availableBalance 
        });
      }

      // Minimum payout threshold (e.g., 5000 FCFA)
      const MIN_PAYOUT = 5000;
      if (amount < MIN_PAYOUT) {
        return res.status(400).json({ 
          message: `Minimum payout amount is ${MIN_PAYOUT} FCFA` 
        });
      }

      const payoutRequest = await storage.createPayoutRequest({
        affiliateId: affiliate.id,
        amount,
        paymentMethod,
        accountDetails,
        status: 'pending',
      });

      res.json(payoutRequest);
    } catch (error) {
      console.error("Error creating payout request:", error);
      res.status(500).json({ message: "Failed to create payout request" });
    }
  });

  // Affiliate: Get payout history
  app.get('/api/affiliate/payout/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const affiliate = await storage.getAffiliateByUserId(userId);
      
      if (!affiliate) {
        return res.status(404).json({ message: "Not enrolled as an affiliate" });
      }

      const payoutRequests = await storage.getPayoutRequestsByAffiliate(affiliate.id);
      const availableBalance = await storage.getAffiliateAvailableBalance(affiliate.id);

      res.json({ 
        payoutRequests,
        availableBalance,
        totalEarnings: affiliate.totalEarnings 
      });
    } catch (error) {
      console.error("Error fetching payout history:", error);
      res.status(500).json({ message: "Failed to fetch payout history" });
    }
  });

  // Admin: Get all payout requests
  app.get('/api/admin/payouts', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const payoutRequests = await storage.getAllPayoutRequests();
      res.json(payoutRequests);
    } catch (error) {
      console.error("Error fetching payout requests:", error);
      res.status(500).json({ message: "Failed to fetch payout requests" });
    }
  });

  // Admin: Approve payout request
  app.post('/api/admin/payouts/:id/approve', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminId = (req.user as SelectUser).id;

      const updatedRequest = await storage.updatePayoutStatus(id, 'approved', adminId);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Payout request not found" });
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error approving payout:", error);
      res.status(500).json({ message: "Failed to approve payout" });
    }
  });

  // Admin: Reject payout request
  app.post('/api/admin/payouts/:id/reject', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminId = (req.user as SelectUser).id;
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const updatedRequest = await storage.updatePayoutStatus(id, 'rejected', adminId, rejectionReason);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Payout request not found" });
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error rejecting payout:", error);
      res.status(500).json({ message: "Failed to reject payout" });
    }
  });

  // ============ AFFILIATE MANAGEMENT ENDPOINTS ============

  // Admin: Get all affiliates with summary stats
  app.get('/api/admin/affiliates', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const affiliates = await db.execute(sql`
        SELECT 
          a.id,
          a.user_id,
          a.referral_code,
          a.total_referrals,
          a.total_earnings,
          a.status,
          a.created_at,
          u.email,
          u.username,
          u.first_name,
          u.last_name,
          (SELECT COUNT(*) FROM payout_requests WHERE affiliate_id = a.id AND status = 'pending') as pending_payouts,
          (SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE affiliate_id = a.id AND status = 'approved') as total_paid_out
        FROM affiliates a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
      `);
      res.json(affiliates.rows);
    } catch (error) {
      console.error("Error fetching affiliates:", error);
      res.status(500).json({ message: "Failed to fetch affiliates" });
    }
  });

  // Admin: Get specific affiliate details with referrals and payouts
  app.get('/api/admin/affiliates/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Get affiliate details
      const affiliateResult = await db.execute(sql`
        SELECT 
          a.id,
          a.user_id,
          a.referral_code,
          a.total_referrals,
          a.total_earnings,
          a.status,
          a.created_at,
          u.email,
          u.username,
          u.first_name,
          u.last_name,
          u.location,
          (SELECT COUNT(*) FROM payout_requests WHERE affiliate_id = a.id AND status = 'pending') as pending_payouts,
          (SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE affiliate_id = a.id AND status = 'approved') as total_paid_out
        FROM affiliates a
        JOIN users u ON a.user_id = u.id
        WHERE a.id = ${id}
      `);

      if (affiliateResult.rows.length === 0) {
        return res.status(404).json({ message: "Affiliate not found" });
      }

      const affiliateData = affiliateResult.rows[0];

      // Get referrals
      const referrals = await db.execute(sql`
        SELECT 
          r.id,
          r.commission,
          r.status,
          r.created_at,
          reg.user_id,
          u.email,
          u.username,
          u.first_name,
          u.last_name
        FROM referrals r
        JOIN registrations reg ON r.registration_id = reg.id
        JOIN users u ON reg.user_id = u.id
        WHERE r.affiliate_id = ${id}
        ORDER BY r.created_at DESC
      `);

      // Get payout requests
      const payoutRequests = await db.execute(sql`
        SELECT 
          id,
          amount,
          status,
          payment_method,
          requested_at,
          processed_at,
          processed_by,
          rejection_reason
        FROM payout_requests
        WHERE affiliate_id = ${id}
        ORDER BY requested_at DESC
      `);

      res.json({
        ...affiliateData,
        referrals: referrals.rows,
        payoutRequests: payoutRequests.rows
      });
    } catch (error) {
      console.error("Error fetching affiliate details:", error);
      res.status(500).json({ message: "Failed to fetch affiliate details" });
    }
  });

  // Admin: Update affiliate status
  app.patch('/api/admin/affiliates/:id/status', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['active', 'suspended', 'inactive'].includes(status)) {
        return res.status(400).json({ message: "Valid status required: active, suspended, or inactive" });
      }

      const updatedAffiliate = await storage.updateAffiliateStats(id, 0, 0);
      
      if (!updatedAffiliate) {
        return res.status(404).json({ message: "Affiliate not found" });
      }

      // Update status in database
      const result = await db.execute(sql`
        UPDATE affiliates 
        SET status = ${status}
        WHERE id = ${id}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Affiliate not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating affiliate status:", error);
      res.status(500).json({ message: "Failed to update affiliate status" });
    }
  });

  // Admin: Get all payout requests with affiliate details
  app.get('/api/admin/payout-requests', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { status } = req.query;
      
      const payoutRequests = await db.execute(sql`
        SELECT 
          pr.id,
          pr.amount,
          pr.status,
          pr.payment_method,
          pr.account_details,
          pr.requested_at,
          pr.processed_at,
          pr.processed_by,
          pr.rejection_reason,
          a.id as affiliate_id,
          a.referral_code,
          a.total_earnings,
          u.email,
          u.username,
          u.first_name,
          u.last_name,
          admin.email as processed_by_email
        FROM payout_requests pr
        JOIN affiliates a ON pr.affiliate_id = a.id
        JOIN users u ON a.user_id = u.id
        LEFT JOIN users admin ON pr.processed_by = admin.id
        ${status ? sql`WHERE pr.status = ${status}` : sql``}
        ORDER BY pr.requested_at DESC
      `);

      res.json(payoutRequests.rows);
    } catch (error) {
      console.error("Error fetching payout requests:", error);
      res.status(500).json({ message: "Failed to fetch payout requests" });
    }
  });

  // Admin: Approve payout request with status update
  app.patch('/api/admin/payout-requests/:id/approve', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminId = (req.user as SelectUser).id;

      const updatedRequest = await storage.updatePayoutStatus(id, 'approved', adminId);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Payout request not found" });
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error approving payout:", error);
      res.status(500).json({ message: "Failed to approve payout" });
    }
  });

  // Admin: Reject payout request with reason
  app.patch('/api/admin/payout-requests/:id/reject', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminId = (req.user as SelectUser).id;
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const updatedRequest = await storage.updatePayoutStatus(id, 'rejected', adminId, rejectionReason);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Payout request not found" });
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error rejecting payout:", error);
      res.status(500).json({ message: "Failed to reject payout" });
    }
  });

  // Affiliate: Get comprehensive dashboard stats
  app.get('/api/affiliate/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const affiliate = await storage.getAffiliateByUserId(userId);
      
      if (!affiliate) {
        return res.status(404).json({ message: "Not enrolled as an affiliate" });
      }

      // Get referral statistics
      const referrals = await storage.getAffiliateReferrals(affiliate.id);
      const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
      const completedReferrals = referrals.filter(r => r.status === 'completed').length;
      const totalCommission = referrals.reduce((sum, r) => sum + (r.commission || 0), 0);

      // Get payout information
      const payoutRequests = await storage.getPayoutRequestsByAffiliate(affiliate.id);
      const pendingPayouts = payoutRequests.filter(p => p.status === 'pending');
      const approvedPayouts = payoutRequests.filter(p => p.status === 'approved');
      const rejectedPayouts = payoutRequests.filter(p => p.status === 'rejected');
      const totalPaidOut = approvedPayouts.reduce((sum, p) => sum + p.amount, 0);

      // Get available balance
      const availableBalance = await storage.getAffiliateAvailableBalance(affiliate.id);

      res.json({
        affiliate,
        stats: {
          totalReferrals: affiliate.totalReferrals,
          pendingReferrals,
          completedReferrals,
          totalEarnings: affiliate.totalEarnings,
          totalCommission,
          availableBalance,
          totalPaidOut,
          conversionRate: affiliate.totalReferrals > 0 ? ((completedReferrals / affiliate.totalReferrals) * 100).toFixed(2) : '0'
        },
        payouts: {
          pending: pendingPayouts.length,
          approved: approvedPayouts.length,
          rejected: rejectedPayouts.length,
          recentRequests: payoutRequests.slice(0, 5)
        }
      });
    } catch (error) {
      console.error("Error fetching affiliate dashboard:", error);
      res.status(500).json({ message: "Failed to fetch affiliate dashboard" });
    }
  });

  // Admin: Get all payments (consolidated from vote purchases, registrations, ad payments, and payouts)
  app.get('/api/admin/payments', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const paymentType = req.query.type; // Filter by type: 'votes', 'registrations', 'ads', 'affiliates'
      const status = req.query.status; // Filter by status
      
      const payments: any[] = [];

      // Vote purchases
      if (!paymentType || paymentType === 'votes') {
        const votePurchases = await db.execute(sql`
          SELECT 
            vp.id,
            vp.user_id,
            vp.video_id,
            vp.amount,
            vp.status,
            vp.created_at,
            u.username,
            u.email,
            v.title as video_title,
            'vote_purchase' as payment_type
          FROM vote_purchases vp
          JOIN users u ON vp.user_id = u.id
          LEFT JOIN videos v ON vp.video_id = v.id
          ${status ? sql`WHERE vp.status = ${status}` : sql``}
          ORDER BY vp.created_at DESC
        `);
        payments.push(...votePurchases.rows);
      }

      // Registration payments
      if (!paymentType || paymentType === 'registrations') {
        const registrations = await db.execute(sql`
          SELECT 
            r.id,
            r.user_id,
            r.amount_paid as amount,
            r.payment_status as status,
            r.created_at,
            u.username,
            u.email,
            'registration' as payment_type
          FROM registrations r
          JOIN users u ON r.user_id = u.id
          WHERE r.payment_status != 'pending'
          ${status ? sql`AND r.payment_status = ${status}` : sql``}
          ORDER BY r.created_at DESC
        `);
        payments.push(...registrations.rows);
      }

      // Ad payments
      if (!paymentType || paymentType === 'ads') {
        const adPayments = await db.execute(sql`
          SELECT 
            ap.id,
            ap.advertiser_id as user_id,
            ap.amount,
            ap.status,
            ap.created_at,
            a.company_name as username,
            a.email,
            'ad_payment' as payment_type
          FROM ad_payments ap
          JOIN advertisers a ON ap.advertiser_id = a.id
          ${status ? sql`WHERE ap.status = ${status}` : sql``}
          ORDER BY ap.created_at DESC
        `);
        payments.push(...adPayments.rows);
      }

      // Affiliate payouts
      if (!paymentType || paymentType === 'affiliates') {
        const payouts = await db.execute(sql`
          SELECT 
            pr.id,
            pr.processed_by as user_id,
            pr.amount,
            pr.status,
            pr.requested_at as created_at,
            u.username,
            u.email,
            'affiliate_payout' as payment_type
          FROM payout_requests pr
          JOIN affiliates af ON pr.affiliate_id = af.id
          JOIN users u ON af.user_id = u.id
          ${status ? sql`WHERE pr.status = ${status}` : sql``}
          ORDER BY pr.requested_at DESC
        `);
        payments.push(...payouts.rows);
      }

      // Sort by date descending
      payments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Calculate summary statistics
      const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const completedAmount = payments
        .filter(p => p.status === 'completed' || p.status === 'approved')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const pendingAmount = payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      res.json({
        payments,
        summary: {
          totalPayments: payments.length,
          totalAmount,
          completedAmount,
          pendingAmount,
          byType: {
            votes: payments.filter(p => p.payment_type === 'vote_purchase').length,
            registrations: payments.filter(p => p.payment_type === 'registration').length,
            ads: payments.filter(p => p.payment_type === 'ad_payment').length,
            affiliates: payments.filter(p => p.payment_type === 'affiliate_payout').length,
          },
          byStatus: {
            pending: payments.filter(p => p.status === 'pending').length,
            completed: payments.filter(p => p.status === 'completed').length,
            approved: payments.filter(p => p.status === 'approved').length,
            rejected: payments.filter(p => p.status === 'rejected').length,
          }
        }
      });
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Admin: Get pending ads for approval
  app.get('/api/admin/ads/pending', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const pendingAds = await storage.getPendingAds();
      res.json(pendingAds);
    } catch (error) {
      console.error("Error fetching pending ads:", error);
      res.status(500).json({ message: "Failed to fetch pending ads" });
    }
  });

  // Admin: Get approved ads
  app.get('/api/admin/ads/approved', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const approvedAds = await storage.getApprovedAds();
      res.json(approvedAds);
    } catch (error) {
      console.error("Error fetching approved ads:", error);
      res.status(500).json({ message: "Failed to fetch approved ads" });
    }
  });

  // Admin: Approve ad
  app.post('/api/admin/ads/:id/approve', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminId = (req.user as SelectUser).id;

      const approvedAd = await storage.approveAd(id, adminId);
      
      if (!approvedAd) {
        return res.status(404).json({ message: "Ad not found" });
      }

      res.json(approvedAd);
    } catch (error) {
      console.error("Error approving ad:", error);
      res.status(500).json({ message: "Failed to approve ad" });
    }
  });

  // Admin: Reject ad
  app.post('/api/admin/ads/:id/reject', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const rejectedAd = await storage.rejectAd(id, rejectionReason);
      
      if (!rejectedAd) {
        return res.status(404).json({ message: "Ad not found" });
      }

      res.json(rejectedAd);
    } catch (error) {
      console.error("Error rejecting ad:", error);
      res.status(500).json({ message: "Failed to reject ad" });
    }
  });

  // Admin: Create judge account
  app.post('/api/admin/judges', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      // Validate request body with Zod
      const createJudgeSchema = z.object({
        email: z.string().trim().email(),
        password: z.string().trim().min(8),
        firstName: z.string().trim().min(1).max(100),
        lastName: z.string().trim().min(1).max(100),
        username: z.string().trim().min(3).max(50),
        judgeName: z.string().trim().min(1).max(100),
        judgeBio: z.string().trim().optional().or(z.literal("")),
        judgePhotoUrl: z.string().trim().url().optional().or(z.literal("")),
      });

      const validationResult = createJudgeSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid judge data",
          errors: validationResult.error.errors 
        });
      }

      const { email, password, firstName, lastName, username, judgeName, judgeBio, judgePhotoUrl } = validationResult.data;

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the judge account
      const newJudge = await storage.createUser({
        firstName,
        lastName,
        email,
        username,
        password: hashedPassword,
        isAdmin: false,
        isJudge: true,
        emailVerified: true, // Auto-verify admin-created judges
        judgeName,
        judgeBio: judgeBio || null,
        judgePhotoUrl: judgePhotoUrl || null,
      });

      // Return only safe judge profile data (exclude all sensitive fields)
      res.json(toPublicJudgeProfile(newJudge));
    } catch (error) {
      console.error("Error creating judge:", error);
      res.status(500).json({ message: "Failed to create judge account" });
    }
  });

  // Admin: Upload judge profile photo
  app.post('/api/admin/judges/photo', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const form = formidable({
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxFieldsSize: 1024,
        keepExtensions: true,
        allowEmptyFiles: false,
      });

      form.parse(req, async (err: any, fields: any, files: any) => {
        if (err) {
          console.error("Error parsing photo upload:", err);
          if (err.code === 'LIMIT_FILE_SIZE' || err.message?.includes('maxFileSize')) {
            return res.status(413).json({ message: "Photo size exceeds 5MB limit" });
          }
          return res.status(400).json({ message: "Error parsing upload: " + err.message });
        }

        const photoFile = Array.isArray(files.photo) ? files.photo[0] : files.photo;
        
        if (!photoFile) {
          return res.status(400).json({ message: "No photo file provided" });
        }

        const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
        if (!ALLOWED_IMAGE_FORMATS.includes(photoFile.mimetype?.toLowerCase() || '')) {
          return res.status(400).json({ message: "Invalid image format. Allowed: JPEG, PNG, WebP" });
        }

        try {
          const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || "";
          if (!privateObjectDir) {
            return res.status(500).json({ message: "Object storage not configured" });
          }

          // Determine file extension based on mimetype
          const extMap: { [key: string]: string } = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
          };
          const ext = extMap[photoFile.mimetype?.toLowerCase() || ''] || 'jpg';

          const photoId = randomUUID();
          const photoPath = `${privateObjectDir}/judge-photos/${photoId}.${ext}`;
          const { bucketName, objectName } = parseObjectPath(photoPath);
          const bucket = objectStorageClient.bucket(bucketName);
          const photoFileObj = bucket.file(objectName);

          await new Promise((resolve, reject) => {
            const readStream = createReadStream(photoFile.filepath);
            const writeStream = photoFileObj.createWriteStream({
              metadata: {
                contentType: photoFile.mimetype || 'image/jpeg',
                cacheControl: 'private, max-age=3600',
              },
            });

            readStream.on('error', (error: Error) => {
              console.error("Error reading photo file:", error);
              reject(new Error('Failed to read photo file'));
            });

            writeStream.on('error', (error: Error) => {
              console.error("Error writing photo to storage:", error);
              reject(new Error('Failed to upload photo to storage'));
            });

            writeStream.on('finish', () => {
              resolve(undefined);
            });

            readStream.pipe(writeStream);
          });

          // Clean up temp file
          try {
            await fs.unlink(photoFile.filepath);
          } catch (unlinkError) {
            console.error("Error cleaning up temp file:", unlinkError);
          }

          res.json({ photoUrl: photoPath });
        } catch (error: any) {
          console.error("Error uploading photo:", error);
          res.status(500).json({ message: error.message || "Failed to upload photo" });
        }
      });
    } catch (error: any) {
      console.error("Error in photo upload handler:", error);
      res.status(500).json({ message: error.message || "Failed to process upload" });
    }
  });

  // Admin: Get all judges
  app.get('/api/admin/judges', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const judges = await storage.getJudgeRoster();
      // Sanitize each judge to exclude sensitive fields
      const sanitizedJudges = judges.map(judge => ({
        id: judge.id,
        email: judge.email,
        firstName: judge.firstName,
        lastName: judge.lastName,
        judgeName: judge.judgeName,
        judgeBio: judge.judgeBio,
        judgePhotoUrl: judge.judgePhotoUrl,
      }));
      res.json(sanitizedJudges);
    } catch (error) {
      console.error("Error fetching judges:", error);
      res.status(500).json({ message: "Failed to fetch judges" });
    }
  });

  // Admin: Delete judge account
  app.delete('/api/admin/judges/:judgeId', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { judgeId } = req.params;
      
      if (!judgeId) {
        return res.status(400).json({ message: "Judge ID is required" });
      }

      // Verify the user exists and is a judge
      const judge = await storage.getUser(judgeId);
      if (!judge) {
        return res.status(404).json({ message: "Judge not found" });
      }

      if (!judge.isJudge) {
        return res.status(400).json({ message: "User is not a judge" });
      }

      // Delete related judge_scores first to avoid foreign key constraint issues
      await db.delete(schema.judgeScores).where(eq(schema.judgeScores.judgeId, judgeId));
      
      // Delete the judge account
      await storage.deleteUser(judgeId);

      res.json({ message: "Judge account deleted successfully" });
    } catch (error) {
      console.error("Error deleting judge:", error);
      res.status(500).json({ message: "Failed to delete judge account" });
    }
  });

  // Admin: Get all users
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      // Sanitize to exclude sensitive information
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        location: user.location,
        emailVerified: user.emailVerified,
        isAdmin: user.isAdmin,
        isJudge: user.isJudge,
        isModerator: user.isModerator,
        isContentManager: user.isContentManager,
        isAffiliateManager: user.isAffiliateManager,
        suspended: user.suspended,
        judgeName: user.judgeName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin: Update user role and permissions
  app.patch('/api/admin/users/:id/role', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { isAdmin, isJudge, isModerator, isContentManager, isAffiliateManager } = req.body;
      const currentUser = req.user as SelectUser;

      // Validate all fields are boolean
      const roles = { isAdmin, isJudge, isModerator, isContentManager, isAffiliateManager };
      for (const [key, value] of Object.entries(roles)) {
        if (typeof value !== 'boolean') {
          return res.status(400).json({ message: `${key} must be a boolean value` });
        }
      }

      // Prevent self-demotion from admin
      if (currentUser.id === id && currentUser.isAdmin && !isAdmin) {
        return res.status(403).json({ message: "You cannot remove your own admin privileges" });
      }

      // Update using raw SQL for atomicity
      const [user] = await db.update(schema.users).set({
        isAdmin,
        isJudge,
        isModerator,
        isContentManager,
        isAffiliateManager,
        updatedAt: new Date()
      }).where(eq(schema.users.id, id)).returning();

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        message: "User roles updated successfully",
        user: {
          id: user.id,
          email: user.email,
          isAdmin: user.isAdmin,
          isJudge: user.isJudge,
          isModerator: user.isModerator,
          isContentManager: user.isContentManager,
          isAffiliateManager: user.isAffiliateManager,
        }
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Admin: Toggle user email verification
  app.patch('/api/admin/users/:id/verify-email', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { verified } = req.body;

      if (typeof verified !== 'boolean') {
        return res.status(400).json({ message: "verified must be a boolean value" });
      }

      const user = await storage.toggleUserEmailVerification(id, verified);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        message: `User email ${verified ? 'verified' : 'unverified'} successfully`,
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
        }
      });
    } catch (error) {
      console.error("Error toggling email verification:", error);
      res.status(500).json({ message: "Failed to toggle email verification" });
    }
  });

  // Admin: Suspend user
  app.post('/api/admin/users/:id/suspend', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user as SelectUser;

      // Prevent self-suspension
      if (currentUser.id === id) {
        return res.status(403).json({ message: "You cannot suspend your own account" });
      }

      const user = await storage.suspendUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        message: "User suspended successfully",
        user: {
          id: user.id,
          email: user.email,
          suspended: user.suspended,
        }
      });
    } catch (error) {
      console.error("Error suspending user:", error);
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });

  // Admin: Activate user
  app.post('/api/admin/users/:id/activate', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

      const user = await storage.activateUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        message: "User activated successfully",
        user: {
          id: user.id,
          email: user.email,
          suspended: user.suspended,
        }
      });
    } catch (error) {
      console.error("Error activating user:", error);
      res.status(500).json({ message: "Failed to activate user" });
    }
  });

  // Admin: Delete user
  app.delete('/api/admin/users/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user as SelectUser;

      // Prevent self-deletion
      if (currentUser.id === id) {
        return res.status(403).json({ message: "You cannot delete your own account" });
      }

      // Delete all related records in cascade order using raw SQL
      // Delete likes
      await db.execute(sql`DELETE FROM likes WHERE user_id = ${id}`);
      
      // Delete votes
      await db.execute(sql`DELETE FROM votes WHERE user_id = ${id}`);
      
      // Delete judge scores (if user is a judge)
      await db.execute(sql`DELETE FROM judge_scores WHERE judge_id = ${id}`);
      
      // Delete watch history
      await db.execute(sql`DELETE FROM watch_history WHERE user_id = ${id}`);
      
      // Delete videos
      await db.execute(sql`DELETE FROM videos WHERE creator_id = ${id}`);
      
      // Delete affiliate records
      await db.execute(sql`DELETE FROM affiliates WHERE user_id = ${id}`);
      
      // Delete the user
      await storage.deleteUser(id);

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin: Get all advertisers
  app.get('/api/admin/advertisers', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const advertisers = await storage.getAllAdvertisers();
      // Sanitize to exclude passwords
      const sanitizedAdvertisers = advertisers.map(advertiser => ({
        id: advertiser.id,
        email: advertiser.email,
        companyName: advertiser.companyName,
        companyWebsite: advertiser.companyWebsite,
        companyDescription: advertiser.companyDescription,
        contactName: advertiser.contactName,
        contactPhone: advertiser.contactPhone,
        businessType: advertiser.businessType,
        country: advertiser.country,
        status: advertiser.status,
        createdAt: advertiser.createdAt,
        verifiedAt: advertiser.verifiedAt,
      }));
      res.json(sanitizedAdvertisers);
    } catch (error) {
      console.error("Error fetching advertisers:", error);
      res.status(500).json({ message: "Failed to fetch advertisers" });
    }
  });

  // Admin: Approve advertiser account
  app.post('/api/admin/advertisers/:id/approve', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const advertiser = await storage.updateAdvertiserStatus(id, 'active');
      if (!advertiser) {
        return res.status(404).json({ message: "Advertiser not found" });
      }

      res.json({ 
        message: "Advertiser approved successfully",
        advertiser: {
          id: advertiser.id,
          companyName: advertiser.companyName,
          status: advertiser.status,
        }
      });
    } catch (error) {
      console.error("Error approving advertiser:", error);
      res.status(500).json({ message: "Failed to approve advertiser" });
    }
  });

  // Admin: Reject/Suspend advertiser account
  app.post('/api/admin/advertisers/:id/reject', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const advertiser = await storage.updateAdvertiserStatus(id, 'suspended');
      if (!advertiser) {
        return res.status(404).json({ message: "Advertiser not found" });
      }

      res.json({ 
        message: "Advertiser suspended successfully",
        advertiser: {
          id: advertiser.id,
          companyName: advertiser.companyName,
          status: advertiser.status,
        }
      });
    } catch (error) {
      console.error("Error suspending advertiser:", error);
      res.status(500).json({ message: "Failed to suspend advertiser" });
    }
  });

  // Submit a report (authenticated or anonymous)
  app.post('/api/reports', async (req: any, res) => {
    try {
      const { videoId, reason } = req.body;
      const reportedBy = req.user ? (req.user as SelectUser).id : null;

      if (!videoId || !reason) {
        return res.status(400).json({ message: "Video ID and reason are required" });
      }

      if (!reason.trim()) {
        return res.status(400).json({ message: "Report reason cannot be empty" });
      }

      // Verify video exists
      const video = await storage.getVideoById(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      const report = await storage.createReport({
        videoId,
        reportedBy,
        reason: reason.trim(),
        status: 'pending',
      });

      res.json({ message: "Report submitted successfully", report });
    } catch (error) {
      console.error("Error submitting report:", error);
      res.status(500).json({ message: "Failed to submit report" });
    }
  });

  // Admin: Get all reports
  app.get('/api/admin/reports', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Admin: Mark report as reviewed
  app.patch('/api/admin/reports/:id/review', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const adminId = (req.user as SelectUser).id;

      if (!status || !['reviewed', 'dismissed', 'action_taken'].includes(status)) {
        return res.status(400).json({ 
          message: "Valid status is required (reviewed, dismissed, or action_taken)" 
        });
      }

      const report = await storage.updateReportStatus(id, status, adminId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json(report);
    } catch (error) {
      console.error("Error reviewing report:", error);
      res.status(500).json({ message: "Failed to review report" });
    }
  });

  app.post('/api/seed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }

      const categories = [
        {
          name: "Music & Dance",
          description: "Showcase your musical and dance talents",
          subcategories: ["Singing", "Dancing"],
        },
        {
          name: "Comedy & Performing Arts",
          description: "Make us laugh and entertain",
          subcategories: ["Skits", "Stand-up", "Monologue", "Acting", "Movie content"],
        },
        {
          name: "Fashion & Lifestyle",
          description: "Share your style and lifestyle content",
          subcategories: ["Cooking", "Events", "Decor", "Sports", "Travel", "Vlogging", "Fashion", "Hair", "Makeup", "Beauty", "Reviews"],
        },
        {
          name: "Education & Learning",
          description: "Educate and inspire through your content",
          subcategories: ["DIY", "Tutorials", "Documentary", "Business & Finance", "News", "Motivational Speaking"],
        },
        {
          name: "Gospel Choirs",
          description: "Share gospel music and choir performances",
          subcategories: ["Acapella", "Choir Music"],
        },
      ];

      for (const category of categories) {
        try {
          await storage.createCategory(category);
        } catch (error) {
          console.log(`Category ${category.name} might already exist`);
        }
      }

      const phases = [
        {
          name: "TOP 100",
          description: "Initial submissions",
          number: 1,
          status: "active",
        },
        {
          name: "TOP 50",
          description: "Top performers advance",
          number: 2,
          status: "upcoming",
        },
        {
          name: "TOP 10",
          description: "Final selections",
          number: 3,
          status: "upcoming",
        },
        {
          name: "TOP 3",
          description: "Category winners",
          number: 4,
          status: "upcoming",
        },
        {
          name: "GRAND FINALE",
          description: "Ultimate winner",
          number: 5,
          status: "upcoming",
        },
      ];

      for (const phase of phases) {
        try {
          await storage.createPhase(phase);
        } catch (error) {
          console.log(`Phase ${phase.name} might already exist`);
        }
      }

      res.json({ message: "Database seeded successfully" });
    } catch (error) {
      console.error("Error seeding database:", error);
      res.status(500).json({ message: "Failed to seed database" });
    }
  });

  // Email verification disabled - accounts are automatically verified upon creation
  // Keeping these routes commented out for reference
  
  // app.post('/api/verify-email', async (req, res) => {
  //   try {
  //     const { token } = req.body;
  //     if (!token) {
  //       return res.status(400).json({ message: "Verification token is required" });
  //     }
  //     const user = await storage.getUserByVerificationToken(token);
  //     if (!user) {
  //       return res.status(400).json({ message: "Invalid or expired verification token" });
  //     }
  //     if (user.verificationTokenExpiry && new Date() > new Date(user.verificationTokenExpiry)) {
  //       return res.status(400).json({ message: "Verification token has expired. Please request a new one." });
  //     }
  //     await storage.verifyUserEmail(user.id);
  //     res.json({ message: "Email verified successfully! You can now access all features." });
  //   } catch (error) {
  //     console.error("Email verification error:", error);
  //     res.status(500).json({ message: "Failed to verify email" });
  //   }
  // });

  // app.post('/api/resend-verification', isAuthenticated, async (req: any, res) => {
  //   try {
  //     const userId = (req.user as SelectUser).id;
  //     const user = req.user as SelectUser;
  //     if (user.emailVerified) {
  //       return res.status(400).json({ message: "Email is already verified" });
  //     }
  //     const { generateVerificationToken, getVerificationTokenExpiry, sendVerificationReminder } = await import('./emailService');
  //     const verificationToken = generateVerificationToken();
  //     const verificationTokenExpiry = getVerificationTokenExpiry();
  //     await storage.updateUserVerificationToken(userId, verificationToken, verificationTokenExpiry);
  //     await sendVerificationReminder({
  //       email: user.email,
  //       firstName: user.firstName,
  //       verificationToken,
  //     });
  //     res.json({ message: "Verification email sent successfully. Please check your inbox." });
  //   } catch (error) {
  //     console.error("Resend verification error:", error);
  //     res.status(500).json({ message: "Failed to resend verification email" });
  //   }
  // });

  // Payment verification endpoint
  app.post('/api/payments/verify', isAuthenticated, async (req: any, res) => {
    try {
      const { transaction_id, registrationId } = req.body;
      const userId = (req.user as SelectUser).id;

      if (!transaction_id || !registrationId) {
        return res.status(400).json({ message: "Missing transaction_id or registrationId" });
      }

      // Initialize Flutterwave
      const flw = new Flutterwave(
        process.env.FLW_PUBLIC_KEY!,
        process.env.FLW_SECRET_KEY!
      );

      // Verify payment with Flutterwave
      const response = await flw.Transaction.verify({ id: transaction_id });

      if (
        response.data.status === "successful" &&
        response.data.currency === "XAF" // FCFA currency code
      ) {
        // Get registration to verify ownership and amount
        const registration = await storage.getRegistrationById(registrationId);
        
        if (!registration) {
          return res.status(404).json({ message: "Registration not found" });
        }

        if (registration.userId !== userId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        // Verify amount matches (allowing for small floating point differences)
        const expectedAmount = registration.totalFee;
        const paidAmount = response.data.amount;
        
        if (Math.abs(paidAmount - expectedAmount) > 1) {
          return res.status(400).json({ 
            message: "Payment amount mismatch",
            expected: expectedAmount,
            received: paidAmount
          });
        }

        // Update registration payment status to approved (user is now fully registered)
        await storage.updateRegistrationPaymentStatus(registrationId, 'approved');

        res.json({
          success: true,
          message: 'Payment verified successfully',
          data: {
            transactionId: transaction_id,
            amount: paidAmount,
            currency: response.data.currency,
            registrationId
          }
        });
      } else {
        res.status(400).json({
          status: 'error',
          message: 'Payment verification failed',
          paymentStatus: response.data.status
        });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to verify payment" 
      });
    }
  });

  // Advertiser Routes
  app.get("/api/advertiser/campaigns", isAdvertiser, async (req, res) => {
    try {
      const advertiser = req.user as any;
      const campaigns = await storage.getAdvertiserCampaigns(advertiser.id);
      res.json(campaigns);
    } catch (error) {
      console.error("Get campaigns error:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/advertiser/campaigns", isAdvertiser, async (req, res) => {
    try {
      const advertiser = req.user as any;
      const { name, objective, budget, budgetType, startDate, endDate } = req.body;

      if (!name || !objective || !budget || !budgetType || !startDate || !endDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (budget < 5000) {
        return res.status(400).json({ message: "Minimum budget is 5,000 XAF" });
      }

      const campaign = await storage.createAdCampaign({
        advertiserId: advertiser.id,
        name,
        objective,
        budget,
        budgetType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        status: 'draft',
      });

      res.json(campaign);
    } catch (error) {
      console.error("Create campaign error:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.get("/api/advertiser/campaigns/:id", isAdvertiser, async (req, res) => {
    try {
      const advertiser = req.user as any;
      const campaignId = req.params.id;
      
      const campaign = await storage.getAdCampaign(campaignId);
      
      if (!campaign || campaign.advertiserId !== advertiser.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Get campaign error:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.patch("/api/advertiser/campaigns/:id", isAdvertiser, async (req, res) => {
    try {
      const advertiser = req.user as any;
      const campaignId = req.params.id;
      const { name, objective, budget, budgetType, startDate, endDate, status } = req.body;

      const campaign = await storage.getAdCampaign(campaignId);
      
      if (!campaign || campaign.advertiserId !== advertiser.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      if (budget !== undefined && budget < 5000) {
        return res.status(400).json({ message: "Minimum budget is 5,000 XAF" });
      }

      const updates: Partial<any> = {};
      if (name !== undefined) updates.name = name;
      if (objective !== undefined) updates.objective = objective;
      if (budget !== undefined) updates.budget = budget;
      if (budgetType !== undefined) updates.budgetType = budgetType;
      if (startDate !== undefined) updates.startDate = new Date(startDate);
      if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;
      if (status !== undefined) updates.status = status;

      const updatedCampaign = await storage.updateAdCampaign(campaignId, updates);
      res.json(updatedCampaign);
    } catch (error) {
      console.error("Update campaign error:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.delete("/api/advertiser/campaigns/:id", isAdvertiser, async (req, res) => {
    try {
      const advertiser = req.user as any;
      const campaignId = req.params.id;

      const campaign = await storage.getAdCampaign(campaignId);
      
      if (!campaign || campaign.advertiserId !== advertiser.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      await storage.deleteCampaign(campaignId);
      res.json({ message: "Campaign deleted successfully" });
    } catch (error) {
      console.error("Delete campaign error:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  app.post("/api/advertiser/campaigns/:campaignId/ads", isAdvertiser, async (req, res) => {
    try {
      const advertiser = req.user as any;
      const campaignId = req.params.campaignId;

      // Verify campaign ownership
      const campaign = await storage.getAdCampaign(campaignId);
      if (!campaign || campaign.advertiserId !== advertiser.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      const form = formidable({
        maxFileSize: 50 * 1024 * 1024, // 50MB
        keepExtensions: true,
      });

      const [fields, files] = await form.parse(req);

      const adType = fields.adType?.[0];
      const name = fields.name?.[0];
      const destinationUrl = fields.destinationUrl?.[0];
      const pricingModel = fields.pricingModel?.[0];
      const bidAmount = fields.bidAmount?.[0];
      const mediaFile = files.mediaFile?.[0];

      if (!adType || !name || !destinationUrl || !pricingModel || !bidAmount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!mediaFile) {
        return res.status(400).json({ message: "Media file is required" });
      }

      // Upload media file to public object storage so it can be accessed by browsers
      const fileName = `ad-${Date.now()}-${mediaFile.originalFilename}`;
      const publicDirs = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',') || [];
      const publicDir = publicDirs[0] || '/public';
      const objectPath = `${publicDir}/ads/${fileName}`;
      
      // Upload to object storage using streams
      const { bucketName, objectName } = parseObjectPath(objectPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const fileObj = bucket.file(objectName);
      
      await new Promise((resolve, reject) => {
        const readStream = createReadStream(mediaFile.filepath);
        const writeStream = fileObj.createWriteStream({
          metadata: {
            contentType: mediaFile.mimetype || (adType === 'skippable_instream' ? 'video/mp4' : 'image/jpeg'),
            cacheControl: 'public, max-age=31536000',
          },
        });

        readStream.on('error', (error: Error) => {
          console.error("Error reading media file:", error);
          reject(new Error('Failed to read media file'));
        });

        writeStream.on('error', (error: Error) => {
          console.error("Error writing to storage:", error);
          reject(new Error('Failed to upload to storage'));
        });

        writeStream.on('finish', () => {
          resolve(undefined);
        });

        readStream.pipe(writeStream);
      });
      
      // Clean up temp file
      await fs.unlink(mediaFile.filepath).catch(() => {});
      
      // Store relative URL that browser can access
      const mediaUrl = `/ads/${fileName}`;

      // Parse targetAudience if provided
      let targetAudience: any = null;
      if (fields.targetAudience?.[0]) {
        try {
          targetAudience = JSON.parse(fields.targetAudience[0]);
        } catch (e) {
          console.error("Failed to parse targetAudience:", e);
        }
      }

      const adData: any = {
        campaignId,
        advertiserId: advertiser.id,
        adType,
        title: name,
        destinationUrl,
        pricingModel,
        bidAmount: parseFloat(bidAmount),
        approvalStatus: 'pending',
        status: 'inactive',
        targetAudience,
      };

      // Add type-specific fields
      switch (adType) {
        case 'overlay':
          adData.imageUrl = mediaUrl;
          break;
        case 'skippable_instream':
          adData.videoUrl = mediaUrl;
          break;
        case 'non_skippable_instream':
          adData.videoUrl = mediaUrl;
          break;
        case 'bumper':
          adData.duration = parseInt(fields.duration?.[0] || '6');
          adData.videoUrl = mediaUrl;
          break;
        case 'in_feed':
          adData.description = fields.description?.[0] || '';
          adData.ctaText = fields.ctaText?.[0] || 'Learn More';
          adData.videoUrl = mediaUrl;
          break;
        default:
          return res.status(400).json({ message: "Invalid ad type" });
      }

      const ad = await storage.createAd(adData);
      res.json(ad);
    } catch (error) {
      console.error("Create ad error:", error);
      res.status(500).json({ message: "Failed to create ad" });
    }
  });

  app.get("/api/advertiser/stats", isAdvertiser, async (req, res) => {
    try {
      const advertiser = req.user as any;
      const stats = await storage.getAdvertiserStats(advertiser.id);
      res.json(stats);
    } catch (error) {
      console.error("Get advertiser stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Advertiser Wallet Top-up Payment
  app.post("/api/advertiser/wallet/topup/initiate", isAdvertiser, async (req: any, res) => {
    try {
      const advertiserId = (req.user as any).id;
      const { amount } = req.body;

      if (!amount || amount < 1000) {
        return res.status(400).json({ message: "Minimum top-up amount is 1,000 XAF" });
      }

      if (amount > 10000000) {
        return res.status(400).json({ message: "Maximum top-up amount is 10,000,000 XAF" });
      }

      const txRef = `ADW-${Date.now()}-${advertiserId.slice(0, 8)}`;

      const payment = await storage.createAdPayment({
        advertiserId,
        campaignId: null,
        amount,
        paymentType: 'wallet_topup',
        txRef,
        status: 'pending',
      });

      const advertiser = await storage.getAdvertiser(advertiserId);

      res.json({
        success: true,
        txRef: payment.txRef,
        amount: payment.amount,
        customer: {
          email: advertiser?.email,
          phone: advertiser?.contactPhone || '',
          name: advertiser?.contactName,
        },
      });
    } catch (error) {
      console.error("Error initiating wallet top-up:", error);
      res.status(500).json({ message: "Failed to initiate wallet top-up" });
    }
  });

  app.post("/api/advertiser/wallet/topup/callback", isAdvertiser, async (req: any, res) => {
    try {
      const { txRef, transactionId } = req.body;
      const advertiserId = (req.user as any).id;

      if (!txRef || !transactionId) {
        return res.status(400).json({ message: "Transaction reference and ID are required" });
      }

      // Re-fetch payment to ensure we have latest status (prevents replay)
      const payment = await storage.getAdPaymentByTxRef(txRef);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      if (payment.advertiserId !== advertiserId) {
        return res.status(403).json({ message: "Forbidden - Not your payment" });
      }

      // CRITICAL IDEMPOTENCY CHECK: Payment must be pending to process
      // If payment is already successful, it means wallet was already credited
      // This prevents replay attacks with different transactionIds
      if (payment.status !== 'pending') {
        console.log(`[Wallet Top-up Callback] Payment not pending (status: ${payment.status}): ${txRef}`);
        return res.json({ success: true, message: "Payment already processed or failed" });
      }

      const flwClient = new Flutterwave(
        process.env.FLW_PUBLIC_KEY!,
        process.env.FLW_SECRET_KEY!
      );

      const verifyResponse = await flwClient.Transaction.verify({ id: transactionId });

      if (verifyResponse.status !== 'success') {
        return res.status(400).json({ message: "Payment verification failed with Flutterwave" });
      }

      const paymentData = verifyResponse.data;

      if (paymentData.status !== 'successful') {
        // Terminal failure statuses that should mark payment as failed
        const terminalFailureStatuses = ['failed', 'cancelled', 'error', 'abandoned', 'reversed'];
        
        if (terminalFailureStatuses.includes(paymentData.status)) {
          await storage.updateAdPayment(payment.id, {
            status: 'failed',
            paymentData: { data: paymentData },
          });
          return res.status(400).json({ message: `Payment failed: ${paymentData.status}` });
        }
        
        // For pending or other transient states, persist payload but keep status as pending
        await storage.updateAdPayment(payment.id, {
          paymentData: { data: paymentData },
        });
        console.log(`[Wallet Top-up Callback] Payment still pending: ${txRef}, status: ${paymentData.status}`);
        return res.status(202).json({ message: `Payment not yet complete: ${paymentData.status}` });
      }

      if (paymentData.tx_ref !== txRef) {
        return res.status(400).json({ message: "Transaction reference mismatch" });
      }

      if (paymentData.currency !== 'XAF') {
        return res.status(400).json({ message: "Invalid payment currency" });
      }

      if (Math.abs(paymentData.amount - payment.amount) > 0.01) {
        return res.status(400).json({ message: "Payment amount mismatch" });
      }

      if (Math.abs(paymentData.charged_amount - payment.amount) > 0.01) {
        return res.status(400).json({ message: "Charged amount mismatch" });
      }

      // Atomic UPDATE WHERE status='pending' - prevents concurrent callback replay
      const wasUpdated = await storage.markAdPaymentSuccessful(
        payment.id,
        paymentData.flw_ref,
        paymentData
      );

      if (!wasUpdated) {
        // Another request already processed this payment
        console.log(`[Wallet Top-up Callback] Payment already marked successful (race condition prevented): ${txRef}`);
        return res.json({ success: true, message: "Payment already processed by concurrent request" });
      }

      // Only credit wallet if we successfully marked payment as successful
      await storage.increaseAdvertiserBalance(advertiserId, payment.amount);

      res.json({ 
        success: true, 
        message: "Wallet topped up successfully",
        amount: payment.amount
      });
    } catch (error: any) {
      console.error("Wallet top-up callback error:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  app.post("/api/advertiser/wallet/topup/webhook", async (req, res) => {
    try {
      const payload = req.body;
      console.log("[Wallet Top-up Webhook] Received:", JSON.stringify(payload, null, 2));

      const secretHash = process.env.FLW_SECRET_HASH;
      const signature = req.headers['verif-hash'];

      if (!signature || signature !== secretHash) {
        console.error("[Wallet Top-up Webhook] Invalid signature");
        return res.status(401).json({ message: "Unauthorized - Invalid signature" });
      }

      if (payload.event !== 'charge.completed' || payload.data?.status !== 'successful') {
        console.log("[Wallet Top-up Webhook] Ignoring non-successful event");
        return res.status(200).json({ status: 'ignored' });
      }

      const txRef = payload.data.tx_ref;
      const transactionId = payload.data.id;

      if (!txRef || !transactionId) {
        console.error("[Wallet Top-up Webhook] Missing tx_ref or transaction_id");
        return res.status(400).json({ message: "Missing required fields" });
      }

      const payment = await storage.getAdPaymentByTxRef(txRef);
      if (!payment) {
        console.error(`[Wallet Top-up Webhook] Payment not found: ${txRef}`);
        return res.status(404).json({ message: "Payment not found" });
      }

      if (payment.status === 'successful') {
        console.log(`[Wallet Top-up Webhook] Already processed: ${txRef}`);
        return res.json({ success: true, message: "Already processed" });
      }

      const flw_ref = payload.data.flw_ref;
      const existingByFlwRef = flw_ref ? await storage.getAdPaymentByFlwRef(flw_ref) : null;
      if (existingByFlwRef && existingByFlwRef.id !== payment.id) {
        console.log(`[Wallet Top-up Webhook] Duplicate flw_ref: ${flw_ref}`);
        return res.json({ success: true, message: "Duplicate Flutterwave reference" });
      }

      const flwClient = new Flutterwave(
        process.env.FLW_PUBLIC_KEY!,
        process.env.FLW_SECRET_KEY!
      );

      const verifyResponse = await flwClient.Transaction.verify({ id: transactionId });

      if (verifyResponse.status !== 'success') {
        console.error("[Wallet Top-up Webhook] Flutterwave verification failed");
        return res.status(400).json({ message: "Payment verification failed" });
      }

      const paymentData = verifyResponse.data;

      if (paymentData.status !== 'successful') {
        // Terminal failure statuses that should mark payment as failed
        const terminalFailureStatuses = ['failed', 'cancelled', 'error', 'abandoned', 'reversed'];
        
        if (terminalFailureStatuses.includes(paymentData.status)) {
          console.error(`[Wallet Top-up Webhook] Payment failed: ${paymentData.status}`);
          await storage.updateAdPayment(payment.id, {
            status: 'failed',
            paymentData: { data: paymentData },
          });
          return res.json({ success: true, message: "Payment marked as failed" });
        }
        
        // For pending or other transient states, persist payload but keep status as pending
        await storage.updateAdPayment(payment.id, {
          paymentData: { data: paymentData },
        });
        console.log(`[Wallet Top-up Webhook] Payment not yet complete: ${txRef}, status: ${paymentData.status}`);
        return res.json({ success: true, message: "Payment still pending" });
      }

      if (paymentData.tx_ref !== txRef) {
        console.error(`[Wallet Top-up Webhook] tx_ref mismatch: expected ${txRef}, got ${paymentData.tx_ref}`);
        return res.status(400).json({ message: "Transaction reference mismatch" });
      }

      if (paymentData.currency !== 'XAF') {
        console.error(`[Wallet Top-up Webhook] Invalid currency: ${paymentData.currency}`);
        return res.status(400).json({ message: "Invalid currency" });
      }

      if (Math.abs(paymentData.amount - payment.amount) > 0.01) {
        console.error(`[Wallet Top-up Webhook] Amount mismatch: expected ${payment.amount}, got ${paymentData.amount}`);
        return res.status(400).json({ message: "Amount mismatch - potential tampering detected" });
      }

      if (Math.abs(paymentData.charged_amount - payment.amount) > 0.01) {
        console.error(`[Wallet Top-up Webhook] Charged amount mismatch: expected ${payment.amount}, got ${paymentData.charged_amount}`);
        return res.status(400).json({ message: "Charged amount mismatch" });
      }

      // Use atomic UPDATE WHERE guard to prevent concurrent webhook replay
      const wasUpdated = await storage.markAdPaymentSuccessful(
        payment.id,
        flw_ref,
        paymentData
      );

      if (!wasUpdated) {
        console.log(`[Wallet Top-up Webhook] Payment already processed (race prevented): ${txRef}`);
        return res.json({ success: true, message: "Already processed" });
      }

      await storage.increaseAdvertiserBalance(payment.advertiserId, payment.amount);

      console.log(`[Wallet Top-up Webhook] Successfully processed: ${txRef}, ${payment.amount} XAF added to wallet`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Wallet Top-up Webhook] Error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.get("/api/advertiser/wallet/payments", isAdvertiser, async (req: any, res) => {
    try {
      const advertiserId = (req.user as any).id;
      const payments = await storage.getAdvertiserPayments(advertiserId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching wallet payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Helper function for ad serving logic
  const serveAd = async (adType: string | undefined): Promise<any> => {
    // Get all active approved ads (optionally filtered by type)
    const activeAds = await storage.getApprovedAds(adType);
    
    if (activeAds.length === 0) {
      return null;
    }

    // Filter ads with available budget and active campaigns
    const adsWithBudget = await Promise.all(
      activeAds.map(async (ad) => {
        const campaign = await storage.getAdCampaign(ad.campaignId);
        if (!campaign) return null;
        
        // Check campaign status
        if (campaign.status !== 'active') return null;
        
        // Check if campaign has remaining budget
        const remainingBudget = campaign.budget - (campaign.totalSpent || 0);
        if (remainingBudget <= 0) return null;
        
        // Check if ad status is still active
        if (ad.status !== 'active') return null;
        
        return ad;
      })
    );

    const eligibleAds = adsWithBudget.filter((ad): ad is typeof activeAds[0] => ad !== null);

    if (eligibleAds.length === 0) {
      return null;
    }

    // Weighted random selection based on bid amount
    // Higher bid = higher chance of being selected
    const totalBidWeight = eligibleAds.reduce((sum, ad) => sum + (ad.bidAmount || 0), 0);
    
    if (totalBidWeight === 0) {
      // If all bids are 0, select randomly
      return eligibleAds[Math.floor(Math.random() * eligibleAds.length)];
    }

    // Select ad using weighted random
    let randomValue = Math.random() * totalBidWeight;
    let selectedAd = eligibleAds[0];
    
    for (const ad of eligibleAds) {
      randomValue -= ad.bidAmount || 0;
      if (randomValue <= 0) {
        selectedAd = ad;
        break;
      }
    }

    return selectedAd;
  };

  // Ad Serving API: Get an ad to display with rotation logic
  app.get("/api/ads/serve", async (req, res) => {
    try {
      const adType = req.query.adType as string | undefined;
      const ad = await serveAd(adType);
      
      if (!ad) {
        return res.status(404).json({ message: "No ads available" });
      }

      res.json(ad);
    } catch (error) {
      console.error("Error serving ad:", error);
      res.status(500).json({ message: "Failed to serve ad" });
    }
  });

  // Ad Serving API: Get overlay ad
  app.get("/api/ads/serve/overlay", async (req, res) => {
    try {
      const ad = await serveAd('overlay');
      
      if (!ad) {
        return res.status(404).json({ message: "No overlay ads available" });
      }

      res.json(ad);
    } catch (error) {
      console.error("Error serving overlay ad:", error);
      res.status(500).json({ message: "Failed to serve overlay ad" });
    }
  });

  // Ad Serving API: Get skippable in-stream ad
  app.get("/api/ads/serve/skippable_instream", async (req, res) => {
    try {
      const ad = await serveAd('skippable_instream');
      
      if (!ad) {
        return res.status(404).json({ message: "No skippable in-stream ads available" });
      }

      res.json(ad);
    } catch (error) {
      console.error("Error serving skippable in-stream ad:", error);
      res.status(500).json({ message: "Failed to serve skippable in-stream ad" });
    }
  });

  // Admin: Get dashboard statistics
  app.get('/api/admin/stats/dashboard', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Admin: Get video statistics
  app.get('/api/admin/stats/video/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const stats = await storage.getVideoStats(id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching video stats:", error);
      res.status(500).json({ message: "Failed to fetch video statistics" });
    }
  });

  // Admin: Get revenue statistics
  app.get('/api/admin/stats/revenue', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getRevenueStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching revenue stats:", error);
      res.status(500).json({ message: "Failed to fetch revenue statistics" });
    }
  });

  // Track ad impression (with deduplication and validation)
  app.post("/api/ads/:adId/impression", async (req, res) => {
    try {
      const adId = req.params.adId;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;

      // Require valid IP and user agent to prevent abuse
      if (!ipAddress || !userAgent) {
        return res.status(400).json({ message: "Missing required headers" });
      }

      // Verify ad exists and is active
      const ad = await storage.getAd(adId);
      if (!ad || ad.status !== 'active') {
        return res.status(404).json({ message: "Ad not found or inactive" });
      }

      // Check for recent duplicate impressions (within last 30 seconds)
      const recentImpressions = await db.select()
        .from(schema.adImpressions)
        .where(
          and(
            eq(schema.adImpressions.adId, adId),
            eq(schema.adImpressions.ipAddress, ipAddress),
            sql`${schema.adImpressions.createdAt} > NOW() - INTERVAL '30 seconds'`
          )
        );

      if (recentImpressions.length > 0) {
        // Skip duplicate impression within 30 second window
        return res.json({ success: true, deduplicated: true });
      }

      await storage.createAdImpression({
        adId,
        userId: (req.user as any)?.id || null,
        userAgent,
        ipAddress,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking ad impression:", error);
      res.status(500).json({ message: "Failed to track impression" });
    }
  });

  // Track ad click (with deduplication and validation)
  app.post("/api/ads/:adId/click", async (req, res) => {
    try {
      const adId = req.params.adId;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;

      // Require valid IP and user agent to prevent abuse
      if (!ipAddress || !userAgent) {
        return res.status(400).json({ message: "Missing required headers" });
      }

      // Verify ad exists and is active
      const ad = await storage.getAd(adId);
      if (!ad || ad.status !== 'active') {
        return res.status(404).json({ message: "Ad not found or inactive" });
      }

      // Check for recent duplicate clicks (within last 60 seconds)
      const recentClicks = await db.select()
        .from(schema.adClicks)
        .where(
          and(
            eq(schema.adClicks.adId, adId),
            eq(schema.adClicks.ipAddress, ipAddress),
            sql`${schema.adClicks.createdAt} > NOW() - INTERVAL '60 seconds'`
          )
        );

      if (recentClicks.length > 0) {
        // Skip duplicate click within 60 second window
        return res.json({ success: true, deduplicated: true });
      }

      await storage.createAdClick({
        adId,
        userId: (req.user as any)?.id || null,
        userAgent,
        ipAddress,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking ad click:", error);
      res.status(500).json({ message: "Failed to track click" });
    }
  });

  // Serve ad media files from public object storage
  app.get("/ads/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const objectStorageService = new ObjectStorageService();
      const file = await objectStorageService.searchPublicObject(`ads/${filename}`);
      
      if (!file) {
        return res.status(404).json({ message: "Ad media not found" });
      }

      const stream = file.createReadStream();
      
      // Set appropriate content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
      };
      const contentType = contentTypes[ext] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      stream.pipe(res);
    } catch (error) {
      console.error("Error serving ad media:", error);
      res.status(500).json({ message: "Failed to serve ad media" });
    }
  });

  // CMS endpoints
  app.get("/api/cms/:section", async (req, res) => {
    try {
      const { section } = req.params;
      const content = await storage.getCmsContent(section);
      res.json(content);
    } catch (error) {
      console.error("Error fetching CMS content:", error);
      res.status(500).json({ message: "Failed to fetch CMS content" });
    }
  });

  app.get("/api/cms/:section/:key", async (req, res) => {
    try {
      const { section, key } = req.params;
      const content = await storage.getCmsContentByKey(section, key);
      if (!content) {
        return res.status(404).json({ message: "CMS content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Error fetching CMS content:", error);
      res.status(500).json({ message: "Failed to fetch CMS content" });
    }
  });

  app.post("/api/cms", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { section, key, label, value, type } = req.body;
      if (!section || !key || !label) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const content = await storage.upsertCmsContent({
        section,
        key,
        label,
        value,
        type: type || 'text',
        updatedBy: (req.user as any).id,
      });
      res.json(content);
    } catch (error) {
      console.error("Error upserting CMS content:", error);
      res.status(500).json({ message: "Failed to save CMS content" });
    }
  });

  app.delete("/api/cms/:section/:key", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { section, key } = req.params;
      await storage.deleteCmsContent(section, key);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting CMS content:", error);
      res.status(500).json({ message: "Failed to delete CMS content" });
    }
  });

  // Public Newsletter Subscription endpoint
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const validationResult = insertNewsletterSubscriberSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid subscriber data", errors: validationResult.error.errors });
      }
      const subscriber = await storage.createNewsletterSubscriber(validationResult.data);
      
      // Send welcome email asynchronously (don't block the response)
      sendNewsletterWelcomeEmail({
        email: subscriber.email,
        firstName: subscriber.firstName || undefined,
      }).catch(err => console.error("Failed to send welcome email:", err));
      
      res.json(subscriber);
    } catch (error: any) {
      console.error("Error subscribing to newsletter:", error);
      if (error.message?.includes("unique constraint")) {
        return res.status(409).json({ message: "This email is already subscribed" });
      }
      res.status(500).json({ message: "Failed to subscribe to newsletter" });
    }
  });

  // Newsletter Subscribers endpoints
  app.get("/api/admin/newsletter/subscribers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const subscribers = await storage.getAllNewsletterSubscribers();
      res.json(subscribers);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      res.status(500).json({ message: "Failed to fetch subscribers" });
    }
  });

  app.post("/api/admin/newsletter/subscribers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validationResult = insertNewsletterSubscriberSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid subscriber data", errors: validationResult.error.errors });
      }
      const subscriber = await storage.createNewsletterSubscriber(validationResult.data);
      res.json(subscriber);
    } catch (error) {
      console.error("Error creating subscriber:", error);
      res.status(500).json({ message: "Failed to create subscriber" });
    }
  });

  app.patch("/api/admin/newsletter/subscribers/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const subscriber = await storage.updateNewsletterSubscriber(id, updates);
      res.json(subscriber);
    } catch (error) {
      console.error("Error updating subscriber:", error);
      res.status(500).json({ message: "Failed to update subscriber" });
    }
  });

  app.delete("/api/admin/newsletter/subscribers/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNewsletterSubscriber(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      res.status(500).json({ message: "Failed to delete subscriber" });
    }
  });

  // Email Campaigns endpoints
  app.get("/api/admin/newsletter/campaigns", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getAllEmailCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/admin/newsletter/campaigns", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { title, subject, content, htmlContent, status, scheduledFor } = req.body;
      if (!title || !subject || !content) {
        return res.status(400).json({ message: "Title, subject, and content are required" });
      }
      const campaign = await storage.createEmailCampaign({
        title,
        subject,
        content,
        htmlContent,
        status: status || 'draft',
        createdBy: (req.user as SelectUser).id,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      });
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.patch("/api/admin/newsletter/campaigns/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const campaign = await storage.updateEmailCampaign(id, updates);
      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.post("/api/admin/newsletter/campaigns/:id/send", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.sendEmailCampaign(id);
      res.json(campaign);
    } catch (error) {
      console.error("Error sending campaign:", error);
      res.status(500).json({ message: "Failed to send campaign" });
    }
  });

  app.delete("/api/admin/newsletter/campaigns/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmailCampaign(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
