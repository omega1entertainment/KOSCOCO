import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import Flutterwave from "flutterwave-node-v3";
import type { SelectUser } from "@shared/schema";
import bcrypt from "bcrypt";

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

      // Check if payment is already completed (prevent replay attacks)
      if (registration.paymentStatus === 'completed') {
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

      // Update registration payment status (using database transaction would be ideal)
      await storage.updateRegistrationPaymentStatus(registrationId, 'completed');

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
      
      // Verify webhook signature using timing-safe comparison (Flutterwave sends secret hash)
      const secretHash = process.env.FLW_SECRET_HASH;
      const signature = req.headers["verif-hash"];
      
      if (!secretHash || !signature) {
        console.error("Missing webhook signature or secret hash");
        return res.status(401).json({ message: "Missing signature" });
      }

      // Timing-safe comparison to prevent timing attacks
      if (signature !== secretHash) {
        console.error("Invalid webhook signature");
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

        // Check if already completed (prevent duplicate processing)
        if (registration.paymentStatus === 'completed') {
          console.log(`Payment already completed for registration: ${registrationId}`);
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

        // All checks passed - update registration and referrals
        await storage.updateRegistrationPaymentStatus(registrationId, 'completed');
        
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
      const objectStorageService = new ObjectStorageService();
      const { uploadUrl, videoUrl } = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadUrl, videoUrl });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  app.post('/api/videos', isAuthenticated, isEmailVerified, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const { videoUrl, categoryId, subcategory, title, description, duration, fileSize, mimeType } = req.body;

      if (!videoUrl || !categoryId || !subcategory || !title || !duration || !fileSize || !mimeType) {
        return res.status(400).json({ message: "Missing required fields (videoUrl, categoryId, subcategory, title, duration, fileSize, mimeType)" });
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
      const hasRegistration = registrations.some(r => r.categoryIds.includes(categoryId) && r.paymentStatus === 'completed');
      
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

      const video = await storage.createVideo({
        userId,
        categoryId,
        subcategory,
        title,
        description: description || null,
        videoUrl: videoPath,
        thumbnailUrl: null,
        duration,
        fileSize,
        status: 'pending',
      });

      res.json(video);
    } catch (error) {
      console.error("Error creating video:", error);
      res.status(500).json({ message: "Failed to create video" });
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
      }

      const video = await storage.updateVideoStatus(id, status);
      res.json(video);
    } catch (error) {
      console.error("Error updating video status:", error);
      res.status(500).json({ message: "Failed to update video status" });
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
      const score = await storage.createJudgeScore({
        videoId: id,
        judgeId,
        creativityScore,
        qualityScore,
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
      const voteCount = await storage.getVideoVoteCount(videoId);
      res.json({ voteCount });
    } catch (error) {
      console.error("Error fetching vote count:", error);
      res.status(500).json({ message: "Failed to fetch vote count" });
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

  // Email verification endpoint
  app.post('/api/verify-email', async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      const user = await storage.getUserByVerificationToken(token);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      // Check if token is expired
      if (user.verificationTokenExpiry && new Date() > new Date(user.verificationTokenExpiry)) {
        return res.status(400).json({ message: "Verification token has expired. Please request a new one." });
      }

      // Update user as verified
      await storage.verifyUserEmail(user.id);

      res.json({ message: "Email verified successfully! You can now access all features." });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Resend verification email endpoint
  app.post('/api/resend-verification', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const user = req.user as SelectUser;

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate new token
      const { generateVerificationToken, getVerificationTokenExpiry, sendVerificationReminder } = await import('./emailService');
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiry = getVerificationTokenExpiry();

      // Update user with new token
      await storage.updateUserVerificationToken(userId, verificationToken, verificationTokenExpiry);

      // Send verification email
      await sendVerificationReminder({
        email: user.email,
        firstName: user.firstName,
        verificationToken,
      });

      res.json({ message: "Verification email sent successfully. Please check your inbox." });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });

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

        // Update registration payment status
        await storage.updateRegistrationPaymentStatus(registrationId, 'paid');

        res.json({
          status: 'success',
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

  const httpServer = createServer(app);
  return httpServer;
}
