import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, db } from "./storage";
import * as schema from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";
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
import { sendNewsletterWelcomeEmail, sendBulkEmailToAffiliates } from "./emailService";

// Initialize Flutterwave
const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY || '',
  process.env.FLW_SECRET_KEY || ''
);

// In-memory wallet payment tracking for development
const walletPayments = new Map<string, { userId: string; amount: number; timestamp: number }>();

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

  // Get user by ID (public endpoint - limited info)
  app.get('/api/users/:id', async (req: any, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Return limited public user info
      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
      });
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

  app.get('/api/stats/home', async (req, res) => {
    try {
      const stats = await storage.getHomePageStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching home page stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
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

  // Admin: Update phase (only allows updating description, name, and dates, not status)
  app.put('/api/admin/phases/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, startDate, endDate } = req.body;

      // Only allow updating name, description, and dates
      // Status changes must go through activate/complete endpoints
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (startDate !== undefined) updates.startDate = new Date(startDate);
      if (endDate !== undefined) updates.endDate = new Date(endDate);

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

  // Admin: Select top 500 videos per category based on likes
  app.post('/api/admin/select-top-500', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const results = await storage.selectTop500VideosPerCategory();
      
      res.json({
        message: "Top 500 videos selected per category",
        results,
      });
    } catch (error) {
      console.error("Error selecting top 500 videos:", error);
      res.status(500).json({ message: "Failed to select top 500 videos" });
    }
  });

  // ============================================
  // koscoco PLATFORM ROUTES
  // ============================================

  // Feed Routes
  app.get('/api/feed/trending', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const videos = await storage.getTrendingVideos(limit);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching trending videos:", error);
      res.status(500).json({ message: "Failed to fetch trending videos" });
    }
  });

  app.get('/api/feed/following', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as SelectUser;
      const limit = parseInt(req.query.limit as string) || 50;
      const videos = await storage.getFollowingFeedVideos(user.id, limit);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching following feed:", error);
      res.status(500).json({ message: "Failed to fetch following feed" });
    }
  });

  app.get('/api/feed/exclusive', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const videos = await storage.getExclusiveVideos(limit);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching exclusive videos:", error);
      res.status(500).json({ message: "Failed to fetch exclusive videos" });
    }
  });

  // Exclusive Content Routes
  app.get('/api/exclusive/:videoId', async (req, res) => {
    try {
      const { videoId } = req.params;
      const exclusive = await storage.getExclusiveContent(videoId);
      if (!exclusive) {
        return res.status(404).json({ message: "Exclusive content not found" });
      }
      res.json(exclusive);
    } catch (error) {
      console.error("Error fetching exclusive content:", error);
      res.status(500).json({ message: "Failed to fetch exclusive content" });
    }
  });

  app.get('/api/exclusive/:videoId/access', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as SelectUser;
      const { videoId } = req.params;

      const exclusive = await storage.getExclusiveContent(videoId);
      if (!exclusive) {
        return res.json({ hasAccess: true }); // Not exclusive, has access
      }

      // Check if user is the creator
      if (exclusive.creatorId === user.id) {
        return res.json({ hasAccess: true, isCreator: true });
      }

      // Check if user has purchased
      const hasPurchased = await storage.hasUserPurchasedExclusive(user.id, exclusive.id);
      res.json({ 
        hasAccess: hasPurchased, 
        price: exclusive.priceUsd,
        previewDuration: exclusive.previewDuration
      });
    } catch (error) {
      console.error("Error checking exclusive access:", error);
      res.status(500).json({ message: "Failed to check access" });
    }
  });

  app.post('/api/exclusive/:videoId/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as SelectUser;
      const { videoId } = req.params;

      const exclusive = await storage.getExclusiveContent(videoId);
      if (!exclusive) {
        return res.status(404).json({ message: "Exclusive content not found" });
      }

      // Check if already purchased
      const hasPurchased = await storage.hasUserPurchasedExclusive(user.id, exclusive.id);
      if (hasPurchased) {
        return res.json({ message: "Already purchased", success: true });
      }

      // Check user wallet balance
      const userWallet = await storage.getOrCreateUserWallet(user.id);
      if (userWallet.balance < exclusive.priceUsd) {
        return res.status(400).json({ 
          message: "Insufficient balance",
          required: exclusive.priceUsd,
          available: userWallet.balance
        });
      }

      // Calculate revenue split (65% creator, 35% platform)
      const creatorShare = Math.round(exclusive.priceUsd * 0.65);
      const platformShare = exclusive.priceUsd - creatorShare;

      // Generate unique transaction reference
      const txRef = `EXC-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Create purchase record
      const purchase = await storage.createExclusivePurchase({
        exclusiveContentId: exclusive.id,
        buyerId: user.id,
        creatorId: exclusive.creatorId,
        amountPaidUsd: exclusive.priceUsd,
        amountPaidLocal: exclusive.priceUsd * 600, // Approximate XAF conversion
        creatorShare,
        platformShare,
        currency: 'XAF',
        txRef,
        status: 'completed',
      });

      // Deduct from user wallet
      await storage.updateUserWalletBalance(user.id, -exclusive.priceUsd, 'exclusive_purchase', `Purchased exclusive content`);

      // Add to creator wallet
      await storage.addToCreatorWallet(exclusive.creatorId, creatorShare, 'exclusive_sale', `Exclusive content purchased by @${user.username}`);

      res.json({ 
        message: "Purchase successful", 
        success: true,
        purchase
      });
    } catch (error) {
      console.error("Error purchasing exclusive content:", error);
      res.status(500).json({ message: "Failed to purchase content" });
    }
  });

  // Create exclusive content (for creator)
  app.post('/api/videos/:videoId/exclusive', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as SelectUser;
      const { videoId } = req.params;
      const { priceUsd, previewDuration = 5 } = req.body;

      // Validate price range ($0.10 - $50.00)
      if (priceUsd < 10 || priceUsd > 5000) {
        return res.status(400).json({ message: "Price must be between $0.10 and $50.00" });
      }

      // Check if video belongs to user
      const video = await storage.getVideoById(videoId);
      if (!video || video.userId !== user.id) {
        return res.status(403).json({ message: "You can only make your own videos exclusive" });
      }

      // Check if already exclusive
      const existingExclusive = await storage.getExclusiveContent(videoId);
      if (existingExclusive) {
        return res.status(400).json({ message: "Video is already exclusive" });
      }

      // Check if creator can post exclusive content (5000+ followers or red star)
      const verification = await storage.getOrCreateCreatorVerification(user.id);
      if (!verification.canPostExclusive && !verification.redStar && verification.followerCount < 5000) {
        return res.status(403).json({ 
          message: "You need 5000+ followers or Red Star status to post exclusive content",
          followerCount: verification.followerCount
        });
      }

      const exclusive = await storage.createExclusiveContent({
        videoId,
        creatorId: user.id,
        priceUsd,
        previewDuration,
      });

      res.json(exclusive);
    } catch (error) {
      console.error("Error creating exclusive content:", error);
      res.status(500).json({ message: "Failed to create exclusive content" });
    }
  });

  app.get('/api/feed/competition', async (req, res) => {
    try {
      const competitionSlug = req.query.competition as string || 'koscoco';
      const categoryId = req.query.category as string | undefined;
      const phaseId = req.query.phase as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const videos = await storage.getCompetitionVideos(competitionSlug, categoryId, phaseId, limit);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching competition videos:", error);
      res.status(500).json({ message: "Failed to fetch competition videos" });
    }
  });

  // Competition Routes
  app.get('/api/competitions', async (req, res) => {
    try {
      const competitions = await storage.getAllCompetitions();
      res.json(competitions);
    } catch (error) {
      console.error("Error fetching competitions:", error);
      res.status(500).json({ message: "Failed to fetch competitions" });
    }
  });

  app.get('/api/competitions/active', async (req, res) => {
    try {
      const competitions = await storage.getActiveCompetitions();
      res.json(competitions);
    } catch (error) {
      console.error("Error fetching active competitions:", error);
      res.status(500).json({ message: "Failed to fetch active competitions" });
    }
  });

  app.get('/api/competitions/:slug', async (req, res) => {
    try {
      const competition = await storage.getCompetitionBySlug(req.params.slug);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      res.json(competition);
    } catch (error) {
      console.error("Error fetching competition:", error);
      res.status(500).json({ message: "Failed to fetch competition" });
    }
  });

  // Gift Routes
  app.get('/api/gifts', async (req, res) => {
    try {
      const gifts = await storage.getAllGifts();
      res.json(gifts);
    } catch (error) {
      console.error("Error fetching gifts:", error);
      res.status(500).json({ message: "Failed to fetch gifts" });
    }
  });

  app.get('/api/gifts/catalog', async (req, res) => {
    try {
      const gifts = await storage.getAllGifts();
      res.json(gifts);
    } catch (error) {
      console.error("Error fetching gift catalog:", error);
      res.status(500).json({ message: "Failed to fetch gift catalog" });
    }
  });

  // Send gift to video creator
  app.post('/api/videos/:videoId/gift', isAuthenticated, async (req: any, res) => {
    try {
      const sender = req.user as SelectUser;
      const { videoId } = req.params;
      const { giftId, quantity = 1 } = req.body;

      if (!giftId) {
        return res.status(400).json({ message: "Gift ID is required" });
      }

      // Get the video to find the creator
      const video = await storage.getVideoById(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      // Get the gift details
      const gift = await storage.getGiftById(giftId);
      if (!gift) {
        return res.status(404).json({ message: "Gift not found" });
      }

      // Check user wallet balance
      const userWallet = await storage.getOrCreateUserWallet(sender.id);
      const totalCost = gift.priceUsd * quantity;
      
      if (userWallet.balance < totalCost) {
        return res.status(400).json({ 
          message: "Insufficient balance",
          required: totalCost,
          available: userWallet.balance
        });
      }

      // Calculate revenue split (65% creator, 35% platform)
      const creatorShare = Math.round(totalCost * 0.65);
      const platformShare = totalCost - creatorShare;

      // Generate unique transaction reference
      const txRef = `GIFT-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Create gift transaction
      const transaction = await storage.createGiftTransaction({
        senderId: sender.id,
        recipientId: video.userId,
        videoId,
        giftId,
        quantity,
        amountPaidUsd: totalCost,
        amountPaidLocal: totalCost * 600, // Approximate XAF conversion
        creatorShare,
        platformShare,
        currency: 'XAF',
        txRef,
        status: 'completed',
      });

      // Deduct from user wallet
      await storage.updateUserWalletBalance(sender.id, -totalCost, 'gift_purchase', `Sent ${quantity}x ${gift.name}`);

      // Add to creator wallet
      await storage.addToCreatorWallet(video.userId, creatorShare, 'gift_received', `Received ${quantity}x ${gift.name} from @${sender.username}`);

      res.json({
        message: "Gift sent successfully",
        transaction,
        giftName: gift.name,
        quantity,
        totalCost,
        creatorShare,
      });
    } catch (error) {
      console.error("Error sending gift:", error);
      res.status(500).json({ message: "Failed to send gift" });
    }
  });

  // Follow/Unfollow Routes
  app.post('/api/users/:userId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user as SelectUser;
      const targetUserId = req.params.userId;

      if (currentUser.id === targetUserId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      const isAlreadyFollowing = await storage.isFollowing(currentUser.id, targetUserId);
      if (isAlreadyFollowing) {
        return res.status(400).json({ message: "Already following this user" });
      }

      await storage.followUser(currentUser.id, targetUserId);
      res.json({ message: "Successfully followed user" });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.post('/api/users/:userId/unfollow', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user as SelectUser;
      const targetUserId = req.params.userId;

      await storage.unfollowUser(currentUser.id, targetUserId);
      res.json({ message: "Successfully unfollowed user" });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get('/api/users/:userId/followers', async (req, res) => {
    try {
      const followers = await storage.getFollowers(req.params.userId);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get('/api/users/:userId/following', async (req, res) => {
    try {
      const following = await storage.getFollowing(req.params.userId);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  // Notifications endpoints
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const notifications = await storage.getUserNotifications(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const unreadCount = await storage.getUnreadNotificationCount(userId);
      res.json({ unreadCount });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.post('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all as read" });
    }
  });

  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Creator Wallet Routes
  app.get('/api/creator/wallet', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as SelectUser;
      const wallet = await storage.getOrCreateCreatorWallet(user.id);
      res.json(wallet);
    } catch (error) {
      console.error("Error fetching creator wallet:", error);
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });

  app.get('/api/creator/wallet/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as SelectUser;
      const wallet = await storage.getCreatorWallet(user.id);
      if (!wallet) {
        return res.json([]);
      }
      const transactions = await storage.getWalletTransactions(wallet.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/creator/wallet/withdraw', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as SelectUser;
      const { amount, paymentMethod, accountDetails } = req.body;

      const wallet = await storage.getCreatorWallet(user.id);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      const availableBalance = wallet.availableBalance;
      const requestedAmount = parseInt(amount);
      if (requestedAmount > availableBalance) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Minimum withdrawal is 15000 XAF (approximately $25 USD)
      const MIN_WITHDRAWAL = 15000;
      if (requestedAmount < MIN_WITHDRAWAL) {
        return res.status(400).json({ message: `Minimum withdrawal is ${MIN_WITHDRAWAL} XAF (approximately $25)` });
      }

      const withdrawal = await storage.createCreatorWithdrawal({
        userId: user.id,
        walletId: wallet.id,
        amount: requestedAmount,
        paymentMethod,
        accountDetails,
        status: 'pending',
      });

      res.json(withdrawal);
    } catch (error) {
      console.error("Error creating withdrawal:", error);
      res.status(500).json({ message: "Failed to create withdrawal" });
    }
  });

  app.get('/api/creator/wallet/withdrawals', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as SelectUser;
      const withdrawals = await storage.getCreatorWithdrawals(user.id);
      res.json(withdrawals);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  // Admin: Manage creator withdrawals
  app.get('/api/admin/withdrawals', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const withdrawals = await storage.getAllCreatorWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      console.error("Error fetching all withdrawals:", error);
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  app.patch('/api/admin/withdrawals/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status, rejectionReason, transactionRef } = req.body;
      const admin = req.user as SelectUser;

      const updates: any = { status };
      if (rejectionReason) updates.rejectionReason = rejectionReason;
      if (transactionRef) updates.transactionRef = transactionRef;
      
      if (status === 'approved' || status === 'rejected') {
        updates.reviewedAt = new Date();
        updates.reviewedBy = admin.id;
      }
      if (status === 'completed') {
        updates.processedAt = new Date();
      }

      const withdrawal = await storage.updateCreatorWithdrawal(req.params.id, updates);
      if (!withdrawal) {
        return res.status(404).json({ message: "Withdrawal not found" });
      }

      // If completed, update the wallet's totalWithdrawn
      if (status === 'completed') {
        const wallet = await storage.getCreatorWallet(withdrawal.userId);
        if (wallet) {
          const newTotalWithdrawn = wallet.totalWithdrawn + withdrawal.amount;
          await storage.updateCreatorWallet(withdrawal.userId, {
            totalWithdrawn: newTotalWithdrawn,
          });
        }
      }

      res.json(withdrawal);
    } catch (error) {
      console.error("Error updating withdrawal:", error);
      res.status(500).json({ message: "Failed to update withdrawal" });
    }
  });

  // User Wallet Routes (for buying gifts/exclusive content)
  app.get('/api/wallet', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as SelectUser;
      const wallet = await storage.getOrCreateUserWallet(user.id);
      res.json(wallet);
    } catch (error) {
      console.error("Error fetching user wallet:", error);
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });

  // User Wallet Top-up
  app.post('/api/wallet/topup/initiate', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as SelectUser;
      const { amount } = req.body;

      if (!amount || amount < 100) {
        return res.status(400).json({ message: "Minimum top-up amount is 100 XAF" });
      }

      if (amount > 1000000) {
        return res.status(400).json({ message: "Maximum top-up amount is 1,000,000 XAF" });
      }

      const txRef = `WLT-${Date.now()}-${user.id.slice(0, 8)}`;

      // Store payment in memory for tracking
      walletPayments.set(txRef, { userId: user.id, amount, timestamp: Date.now() });

      res.json({
        success: true,
        txRef,
        amount,
        customer: {
          email: user.email,
          phone: '',
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        },
      });
    } catch (error) {
      console.error("Error initiating wallet top-up:", error);
      res.status(500).json({ message: "Failed to initiate wallet top-up" });
    }
  });

  app.post('/api/wallet/topup/callback', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as SelectUser;
      const { txRef, transactionId } = req.body;

      if (!txRef || !transactionId) {
        return res.status(400).json({ message: "Transaction reference and ID are required" });
      }

      const paymentRecord = walletPayments.get(txRef);
      if (!paymentRecord) {
        return res.status(404).json({ message: "Payment not found" });
      }

      if (paymentRecord.userId !== user.id) {
        return res.status(403).json({ message: "Forbidden - Not your payment" });
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
        const terminalFailureStatuses = ['failed', 'cancelled', 'error', 'abandoned', 'reversed'];
        
        if (terminalFailureStatuses.includes(paymentData.status)) {
          walletPayments.delete(txRef);
          return res.status(400).json({ message: `Payment failed: ${paymentData.status}` });
        }
        
        return res.status(202).json({ message: `Payment not yet complete: ${paymentData.status}` });
      }

      if (paymentData.tx_ref !== txRef) {
        return res.status(400).json({ message: "Transaction reference mismatch" });
      }

      if (paymentData.currency !== 'XAF') {
        return res.status(400).json({ message: "Invalid payment currency" });
      }

      if (Math.abs(paymentData.amount - paymentRecord.amount) > 0.01) {
        return res.status(400).json({ message: "Payment amount mismatch" });
      }

      // Credit user wallet
      await storage.updateUserWalletBalance(user.id, paymentRecord.amount, 'wallet_topup', 'Wallet top-up');

      // Remove from pending payments
      walletPayments.delete(txRef);

      res.json({ 
        success: true, 
        message: "Wallet topped up successfully",
        amount: paymentRecord.amount
      });
    } catch (error: any) {
      console.error("User wallet top-up callback error:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Creator Verification Routes
  app.get('/api/creator/verification', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as SelectUser;
      const verification = await storage.getOrCreateCreatorVerification(user.id);
      res.json(verification);
    } catch (error) {
      console.error("Error fetching verification status:", error);
      res.status(500).json({ message: "Failed to fetch verification status" });
    }
  });

  // END koscoco PLATFORM ROUTES
  // ============================================

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

  app.get('/api/registrations/count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const registrations = await storage.getUserRegistrations(userId);
      res.json({ registrationCount: registrations.length });
    } catch (error) {
      console.error("Error fetching registration count:", error);
      res.status(500).json({ message: "Failed to fetch registration count" });
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
      // Increase timeout for file uploads (10 minutes)
      res.setTimeout(600000);
      req.setTimeout(600000);
      
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

      // Generate unique slug to avoid duplicate key errors
      let slug = generateSlug(title);
      let slugCounter = 1;
      
      // Check if slug already exists and make it unique
      while (true) {
        const existingWithSlug = await db
          .select()
          .from(schema.videos)
          .where(eq(schema.videos.slug, slug))
          .limit(1);
        
        if (existingWithSlug.length === 0) {
          break; // Slug is unique
        }
        
        slug = generateSlug(title, slugCounter.toString());
        slugCounter++;
      }

      // Create video with pending moderation status
      const video = await storage.createVideo({
        userId,
        categoryId,
        subcategory,
        title,
        slug,
        description: description || null,
        videoUrl: videoPath,
        thumbnailUrl: thumbnailPath,
        duration,
        fileSize,
        status: 'approved',
        moderationStatus: 'pending',
        moderationCategories: null,
        moderationReason: null,
        moderatedAt: null,
      });

      res.json(video);
      
      // Send notifications to all followers (in background, don't block response)
      setImmediate(async () => {
        try {
          const followers = await storage.getFollowers(userId);
          const creator = await storage.getUser(userId);
          if (followers.length > 0 && creator) {
            const creatorName = creator.username || `${creator.firstName} ${creator.lastName}`;
            for (const follower of followers) {
              await storage.createNotification({
                userId: follower.id,
                type: 'upload',
                title: `New video from ${creatorName}`,
                message: `"${title}" uploaded a new video`,
                relatedId: video.id,
                read: false,
              });
            }
          }
        } catch (notifError) {
          console.error('Error sending notifications:', notifError);
        }
      });
      
      // Run moderation in background (don't block response)
      setImmediate(async () => {
        try {
          const objectStorageTempDir = path.join(process.cwd(), '.tmp-object-storage');
          await fs.mkdir(objectStorageTempDir, { recursive: true });
          
          const tempVideoPath = path.join(objectStorageTempDir, `video-${randomUUID()}.mp4`);
          
          try {
            const parsedPath = parseObjectPath(videoPath);
            const [file] = await objectStorageClient
              .bucket(parsedPath.bucketName)
              .file(parsedPath.objectName)
              .download();
            
            await fs.writeFile(tempVideoPath, file);
            const moderationResult = await moderateVideo(tempVideoPath, title, description);
            
            // Update video with moderation results
            await db.update(schema.videos)
              .set({
                moderationStatus: moderationResult.flagged ? 'flagged' : 'approved',
                moderationCategories: moderationResult.categories.length > 0 ? moderationResult.categories : null,
                moderationReason: moderationResult.reason || null,
                moderatedAt: new Date(),
              })
              .where(eq(schema.videos.id, video.id));
          } catch (moderationError) {
            console.error('Background moderation error:', moderationError);
            // Update to approved anyway after error
            await db.update(schema.videos)
              .set({
                moderationStatus: 'approved',
                moderatedAt: new Date(),
              })
              .where(eq(schema.videos.id, video.id));
          } finally {
            try {
              await fs.unlink(tempVideoPath);
            } catch (cleanupError) {
              console.error('Error cleaning up temp video:', cleanupError);
            }
          }
        } catch (bgError) {
          console.error('Background moderation process error:', bgError);
        }
      });
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
        bio: user.bio,
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

  app.patch('/api/creator/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const { firstName, lastName, username, bio, location, age } = req.body;

      const updates: any = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (username !== undefined) updates.username = username;
      if (bio !== undefined) updates.bio = bio || null;
      if (location !== undefined) updates.location = location;
      if (age !== undefined) updates.age = parseInt(age, 10) || null;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No updates provided" });
      }

      const user = await storage.updateUser(userId, updates);

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
        bio: user.bio,
        location: user.location,
        age: user.age,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Error updating creator profile:", error);
      res.status(500).json({ message: "Failed to update creator profile" });
    }
  });

  app.post('/api/creator/profile-photo', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const form = formidable({
        maxFileSize: 5 * 1024 * 1024,
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

        const photoFile = Array.isArray(files.profileImage) ? files.profileImage[0] : files.profileImage;

        if (!photoFile) {
          return res.status(400).json({ message: "No photo file provided" });
        }

        const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
        if (!ALLOWED_IMAGE_FORMATS.includes(photoFile.mimetype?.toLowerCase() || '')) {
          return res.status(400).json({ message: "Invalid image format. Allowed: JPEG, PNG, WebP" });
        }

        try {
          const publicObjectDir = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',')[0] || "";
          if (!publicObjectDir) {
            return res.status(500).json({ message: "Object storage not configured" });
          }

          const extMap: { [key: string]: string } = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
          };
          const ext = extMap[photoFile.mimetype?.toLowerCase() || ''] || 'jpg';

          const photoId = randomUUID();
          const photoPath = `${publicObjectDir}/profile-photos/${photoId}.${ext}`;
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

          const user = await storage.updateUser(userId, { profileImageUrl: photoPath });

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
            bio: user.bio,
            location: user.location,
            age: user.age,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
          });
        } catch (error: any) {
          console.error("Error uploading photo:", error);
          res.status(500).json({ message: error.message || "Failed to upload photo" });
        }
      });
    } catch (error) {
      console.error("Error in profile photo endpoint:", error);
      res.status(500).json({ message: "Failed to update profile photo" });
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
      const history = await storage.getUserWatchHistory(userId);
      
      // Get video details for each watch history entry
      const enrichedHistory = await Promise.all(
        history.slice(0, 20).map(async (entry: any) => {
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
      const allPayoutRequests = await storage.getAllPayoutRequests();
      const payoutRequests = allPayoutRequests.filter((req: any) => req.affiliateId === affiliate.id);

      const pendingPayouts = payoutRequests
        .filter((r: any) => r.status === 'pending')
        .reduce((sum: number, r: any) => sum + r.amount, 0);

      const completedPayouts = payoutRequests
        .filter((r: any) => r.status === 'approved')
        .reduce((sum: number, r: any) => sum + r.amount, 0);

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

  app.get('/api/leaderboard/top-creators', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const creators = await storage.getTopCreatorsByFollowers(limit);
      res.json(creators);
    } catch (error) {
      console.error("Error fetching top creators:", error);
      res.status(500).json({ message: "Failed to fetch top creators" });
    }
  });

  app.get('/api/leaderboard/top-videos/:metric', async (req, res) => {
    try {
      const { metric } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const validMetrics = ['views', 'likes', 'votes', 'gifts'];
      
      if (!validMetrics.includes(metric)) {
        return res.status(400).json({ message: "Invalid metric. Must be: views, likes, votes, or gifts" });
      }
      
      const videos = await storage.getTopVideosByMetric(metric as any, limit);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching top videos:", error);
      res.status(500).json({ message: "Failed to fetch top videos" });
    }
  });

  // Live chat routes
  app.post('/api/live-chat/:videoId', async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { videoId } = req.params;
      const { message } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ message: "Message is required" });
      }

      if (message.length > 1000) {
        return res.status(400).json({ message: "Message too long (max 1000 characters)" });
      }

      const video = await storage.getVideoById(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      const chat = await storage.createLiveChat({
        videoId,
        userId: (req.user as SelectUser).id,
        message: message.trim(),
      });

      res.status(201).json(chat);
    } catch (error) {
      console.error("Error creating live chat message:", error);
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });

  app.get('/api/live-chat/:videoId', async (req, res) => {
    try {
      const { videoId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const video = await storage.getVideoById(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      const messages = await storage.getLiveChatsByVideo(videoId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching live chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.delete('/api/live-chat/:id', async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const user = req.user as SelectUser;

      await storage.deleteLiveChat(id);
      res.json({ message: "Chat message deleted" });
    } catch (error) {
      console.error("Error deleting live chat message:", error);
      res.status(500).json({ message: "Failed to delete chat message" });
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
          20 as commission_rate,
          a.status,
          a.created_at,
          u.email,
          u.username,
          u.first_name,
          u.last_name,
          (SELECT COUNT(*) FROM payout_requests WHERE affiliate_id = a.id AND status = 'pending') as pending_payouts,
          (SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE affiliate_id = a.id AND (status = 'approved' OR status = 'paid')) as total_paid_out
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

  // Admin: Get affiliate analytics and statistics (MUST come before :id route)
  app.get('/api/admin/affiliates/stats', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const stats = await db.execute(sql`
        SELECT 
          COUNT(DISTINCT a.id) as total_affiliates,
          COUNT(DISTINCT CASE WHEN a.status = 'active' OR a.status = 'approved' THEN a.id END) as active_affiliates,
          COALESCE(SUM(a.total_earnings), 0) as total_revenue,
          COUNT(DISTINCT CASE WHEN pr.status = 'pending' THEN pr.id END) as pending_payouts,
          COUNT(DISTINCT CASE WHEN pr.status = 'approved' THEN pr.id END) as approved_payouts,
          COALESCE(SUM(CASE WHEN pr.status = 'approved' THEN pr.amount ELSE 0 END), 0) as approved_payout_amount,
          COALESCE(SUM(CASE WHEN pr.status = 'pending' THEN pr.amount ELSE 0 END), 0) as pending_payout_amount
        FROM affiliates a
        LEFT JOIN payout_requests pr ON a.id = pr.affiliate_id
      `);
      
      const topAffiliates = await db.execute(sql`
        SELECT 
          a.id,
          CONCAT(u.first_name, ' ', u.last_name) as name,
          a.total_earnings as earnings,
          a.total_referrals as referrals
        FROM affiliates a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.total_earnings DESC
        LIMIT 5
      `);

      const geoBreakdown = await db.execute(sql`
        SELECT 
          COALESCE(u.location, 'Unknown') as location,
          COUNT(DISTINCT r.id) as registrations
        FROM registrations r
        JOIN users u ON r.user_id = u.id
        GROUP BY u.location
        ORDER BY registrations DESC
        LIMIT 5
      `);

      const paidPayouts = await db.execute(sql`
        SELECT 
          COALESCE(SUM(CASE WHEN pr.processed_at IS NOT NULL AND pr.status != 'rejected' THEN pr.amount ELSE 0 END), 0) as paid_amount
        FROM payout_requests pr
      `);

      const result = stats.rows[0];
      const paidResult = paidPayouts.rows[0];
      res.json({
        totalAffiliates: Number(result.total_affiliates),
        activeAffiliates: Number(result.active_affiliates),
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: Number(result.total_revenue),
        pendingPayouts: Number(result.pending_payouts),
        approvedPayouts: Number(result.approved_payouts),
        pendingPayoutAmount: Number(result.pending_payout_amount),
        approvedPayoutAmount: Number(result.approved_payout_amount),
        paidPayoutAmount: Number(paidResult.paid_amount),
        topAffiliates: topAffiliates.rows,
        geoBreakdown: geoBreakdown.rows,
      });
    } catch (error) {
      console.error("Error fetching affiliate stats:", error);
      res.status(500).json({ message: "Failed to fetch affiliate stats" });
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

      if (!status || !['active', 'suspended', 'inactive', 'approved', 'blocked'].includes(status)) {
        return res.status(400).json({ message: "Valid status required: active, suspended, inactive, approved, or blocked" });
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

  // Admin: Create new affiliate
  app.post('/api/admin/affiliates', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { email, firstName, lastName } = req.body;

      if (!email || !firstName || !lastName) {
        return res.status(400).json({ message: "Email, firstName, and lastName required" });
      }

      // Check if user with email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      // Generate referral code
      const referralCode = `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create user first
      const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      const user = await storage.createUser({
        email,
        firstName,
        lastName,
        password: hashedPassword,
        emailVerified: true,
      });

      // Create affiliate
      const affiliate = await storage.createAffiliate({
        userId: user.id,
        referralCode,
        status: 'active',
      });

      res.status(201).json(affiliate);
    } catch (error) {
      console.error("Error creating affiliate:", error);
      res.status(500).json({ message: "Failed to create affiliate" });
    }
  });

  // Admin: Update affiliate details
  app.patch('/api/admin/affiliates/:id/edit', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, email } = req.body;

      // Get affiliate to find user
      const affiliateResult = await db.execute(sql`
        SELECT user_id FROM affiliates WHERE id = ${id}
      `);

      if (affiliateResult.rows.length === 0) {
        return res.status(404).json({ message: "Affiliate not found" });
      }

      const userId = (affiliateResult.rows[0] as any).user_id;

      // Update user details
      await storage.updateUser(userId, {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email || undefined,
      });

      res.json({ success: true, message: "Affiliate updated" });
    } catch (error) {
      console.error("Error updating affiliate:", error);
      res.status(500).json({ message: "Failed to update affiliate" });
    }
  });

  // Admin: Approve affiliate
  app.patch('/api/admin/affiliates/:id/approve', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

      const result = await db.execute(sql`
        UPDATE affiliates 
        SET status = 'approved'
        WHERE id = ${id}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Affiliate not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error approving affiliate:", error);
      res.status(500).json({ message: "Failed to approve affiliate" });
    }
  });

  // Admin: Block affiliate
  app.patch('/api/admin/affiliates/:id/block', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

      const result = await db.execute(sql`
        UPDATE affiliates 
        SET status = 'blocked'
        WHERE id = ${id}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Affiliate not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error blocking affiliate:", error);
      res.status(500).json({ message: "Failed to block affiliate" });
    }
  });

  // Admin: Update affiliate commission rate
  app.patch('/api/admin/affiliates/:id/commission', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { commissionRate } = req.body;

      if (typeof commissionRate !== 'number' || commissionRate < 0 || commissionRate > 100) {
        return res.status(400).json({ message: "Commission rate must be between 0 and 100" });
      }

      const result = await db.execute(sql`
        UPDATE affiliates 
        SET commission_rate = ${commissionRate}
        WHERE id = ${id}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Affiliate not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating affiliate commission:", error);
      res.status(500).json({ message: "Failed to update commission rate" });
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
        judgePhotoUrl: z.string().trim().optional().or(z.literal("")),
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

  // Admin: Update judge profile
  app.patch('/api/admin/judges/:judgeId/profile', isAuthenticated, isAdmin, async (req: any, res) => {
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

      // Parse form data if photo is included
      let judgeName = "";
      let judgeBio = "";
      let judgePhotoUrl = null;

      if (req.headers["content-type"]?.includes("application/x-www-form-urlencoded")) {
        judgeName = req.body.judgeName || "";
        judgeBio = req.body.judgeBio || "";
      } else if (req.headers["content-type"]?.includes("multipart/form-data")) {
        const form = formidable({ multiples: false });
        const [fields, files] = await form.parse(req);

        judgeName = (Array.isArray(fields.judgeName) ? fields.judgeName[0] : fields.judgeName) || "";
        judgeBio = (Array.isArray(fields.judgeBio) ? fields.judgeBio[0] : fields.judgeBio) || "";

        if (files.photo) {
          const photoFile = Array.isArray(files.photo) ? files.photo[0] : files.photo;

          const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
          if (!ALLOWED_IMAGE_FORMATS.includes(photoFile.mimetype?.toLowerCase() || '')) {
            return res.status(400).json({ message: "Invalid image format. Allowed: JPEG, PNG, WebP" });
          }

          const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || "";
          if (!privateObjectDir) {
            return res.status(500).json({ message: "Object storage not configured" });
          }

          // Determine file extension
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

          judgePhotoUrl = photoPath;
        }
      }

      // Update judge profile
      const updateData: any = {
        judgeName: judgeName || null,
        judgeBio: judgeBio || null,
      };

      if (judgePhotoUrl) {
        updateData.judgePhotoUrl = judgePhotoUrl;
      }

      await db.update(schema.users)
        .set(updateData)
        .where(eq(schema.users.id, judgeId));

      res.json({ message: "Judge profile updated successfully" });
    } catch (error) {
      console.error("Error updating judge profile:", error);
      res.status(500).json({ message: "Failed to update judge profile" });
    }
  });

  // Currency conversion rates (USD to local currency)
  const currencyRates: Record<string, { rate: number; symbol: string; name: string }> = {
    'GB': { rate: 0.79, symbol: '£', name: 'GBP' },
    'EU': { rate: 0.92, symbol: '€', name: 'EUR' },
    'JP': { rate: 149.50, symbol: '¥', name: 'JPY' },
    'IN': { rate: 83.12, symbol: '₹', name: 'INR' },
    'NG': { rate: 1557.50, symbol: '₦', name: 'NGN' },
    'KE': { rate: 129.50, symbol: 'KSh', name: 'KES' },
    'GH': { rate: 15.50, symbol: 'GH₵', name: 'GHS' },
    'TZ': { rate: 2580.00, symbol: 'TSh', name: 'TZS' },
    'UG': { rate: 3950.00, symbol: 'USh', name: 'UGX' },
    'ZA': { rate: 18.50, symbol: 'R', name: 'ZAR' },
    'EG': { rate: 49.30, symbol: '£', name: 'EGP' },
    'CM': { rate: 656.00, symbol: 'FCFA', name: 'XAF' },
    'SN': { rate: 656.00, symbol: 'CFA', name: 'XOF' },
    'CI': { rate: 656.00, symbol: 'CFA', name: 'XOF' },
    'BR': { rate: 4.97, symbol: 'R$', name: 'BRL' },
    'MX': { rate: 17.05, symbol: '$', name: 'MXN' },
    'CA': { rate: 1.36, symbol: 'C$', name: 'CAD' },
    'AU': { rate: 1.55, symbol: 'A$', name: 'AUD' },
    'SG': { rate: 1.35, symbol: 'S$', name: 'SGD' },
    'HK': { rate: 7.81, symbol: 'HK$', name: 'HKD' },
    'PH': { rate: 56.00, symbol: '₱', name: 'PHP' },
    'TH': { rate: 35.50, symbol: '฿', name: 'THB' },
  };

  // Currency detection endpoint
  app.get('/api/currency', async (req: any, res) => {
    try {
      // Default to USD
      let countryCode = 'US';
      let currencyInfo = { rate: 1, symbol: '$', name: 'USD', code: 'USD' };
      
      // Try to detect country from IP using a simple free service with timeout
      const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '0.0.0.0';
      
      if (ip && ip !== '0.0.0.0' && ip !== '::1') {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const response = await fetch(`https://ipapi.co/${ip}/json/`, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            if (data.country_code) {
              countryCode = data.country_code;
              if (currencyRates[countryCode]) {
                currencyInfo = { ...currencyRates[countryCode], code: countryCode };
              }
            }
          }
        } catch (error) {
          console.log('IP geolocation failed, using default currency');
        }
      }
      
      res.json({ countryCode, ...currencyInfo });
    } catch (error) {
      console.error('Currency detection error:', error);
      res.json({ rate: 1, symbol: '$', name: 'USD', code: 'USD', countryCode: 'US' });
    }
  });

  // Admin: Get all users
  // Admin dashboard stats endpoint
  app.get('/api/admin/stats', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allVideos = await storage.getApprovedVideos();
      
      const stats = {
        totalUsers: allUsers.length,
        totalVideos: allVideos.length,
        totalViews: allVideos.reduce((sum, v) => sum + (v.views || 0), 0),
        suspendedUsers: allUsers.filter((u: any) => u.suspended).length,
        unverifiedEmails: allUsers.filter((u: any) => !u.emailVerified).length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin: Get live chat messages for moderation
  app.get('/api/admin/live-chats', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const messages = await db.select({
        id: schema.liveChats.id,
        videoId: schema.liveChats.videoId,
        userId: schema.liveChats.userId,
        message: schema.liveChats.message,
        createdAt: schema.liveChats.createdAt,
        user: {
          id: schema.users.id,
          username: schema.users.username,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
        },
        video: {
          id: schema.videos.id,
          title: schema.videos.title,
        },
      }).from(schema.liveChats)
        .innerJoin(schema.users, eq(schema.liveChats.userId, schema.users.id))
        .innerJoin(schema.videos, eq(schema.liveChats.videoId, schema.videos.id))
        .orderBy(desc(schema.liveChats.createdAt))
        .limit(limit);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching live chats:", error);
      res.status(500).json({ message: "Failed to fetch live chats" });
    }
  });

  // Admin: Delete live chat message
  app.delete('/api/admin/live-chats/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLiveChat(id);
      res.json({ message: "Chat message deleted" });
    } catch (error) {
      console.error("Error deleting live chat:", error);
      res.status(500).json({ message: "Failed to delete chat message" });
    }
  });

  // Admin: Suspend/Unsuspend user
  app.patch('/api/admin/users/:id/suspend', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { suspended } = req.body;
      
      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      const updated = await storage.updateUser(id, { suspended });
      res.json(updated);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

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

  // Get user data counts for deletion dialog
  app.get('/api/users/:id/data-counts', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user as SelectUser;

      // Users can only get their own counts, admins can get anyone's
      if (!currentUser.isAdmin && currentUser.id !== id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const counts = await Promise.all([
        db.select({ count: sql`count(*)` }).from(schema.videos).where(eq(schema.videos.userId, id)),
        db.select({ count: sql`count(*)` }).from(schema.votes).where(eq(schema.votes.userId, id)),
        db.select({ count: sql`count(*)` }).from(schema.likes).where(eq(schema.likes.userId, id)),
        db.select({ count: sql`count(*)` }).from(schema.watchHistory).where(eq(schema.watchHistory.userId, id)),
        db.select({ count: sql`count(*)` }).from(schema.votePurchases).where(eq(schema.votePurchases.userId, id)),
        db.select({ count: sql`count(*)` }).from(schema.registrations).where(eq(schema.registrations.userId, id)),
        db.select({ count: sql`count(*)` }).from(schema.reports).where(sql`${schema.reports.reportedBy} = ${id} OR ${schema.reports.reviewedBy} = ${id}`),
        db.select({ count: sql`count(*)` }).from(schema.judgeScores).where(eq(schema.judgeScores.judgeId, id)),
        db.select({ count: sql`count(*)` }).from(schema.affiliates).where(eq(schema.affiliates.userId, id)),
      ]);

      res.json({
        videos: Number(counts[0][0].count) || 0,
        votes: Number(counts[1][0].count) || 0,
        likes: Number(counts[2][0].count) || 0,
        watchHistory: Number(counts[3][0].count) || 0,
        votePurchases: Number(counts[4][0].count) || 0,
        registrations: Number(counts[5][0].count) || 0,
        reports: Number(counts[6][0].count) || 0,
        judges: Number(counts[7][0].count) || 0,
        affiliates: Number(counts[8][0].count) || 0,
      });
    } catch (error) {
      console.error("Error fetching user data counts:", error);
      res.status(500).json({ message: "Failed to fetch data counts" });
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
      const { selectedItems = [] } = req.body || {};

      // Prevent self-deletion
      if (currentUser.id === id) {
        return res.status(403).json({ message: "You cannot delete your own account" });
      }

      // Always delete the user account itself
      // Selectively delete data based on selectedItems

      // Delete selected data in cascade order
      if (selectedItems.includes('votePurchases')) {
        await db.execute(sql`DELETE FROM paid_votes WHERE purchase_id IN (SELECT id FROM vote_purchases WHERE user_id = ${id})`);
        await db.execute(sql`DELETE FROM vote_purchases WHERE user_id = ${id}`);
      }

      if (selectedItems.includes('watchHistory')) {
        await db.execute(sql`DELETE FROM watch_history WHERE user_id = ${id}`);
      }

      if (selectedItems.includes('likes')) {
        await db.execute(sql`DELETE FROM likes WHERE user_id = ${id}`);
      }

      if (selectedItems.includes('votes')) {
        await db.execute(sql`DELETE FROM votes WHERE user_id = ${id}`);
      }

      if (selectedItems.includes('judges')) {
        await db.execute(sql`DELETE FROM judge_scores WHERE judge_id = ${id}`);
      }

      if (selectedItems.includes('reports')) {
        await db.execute(sql`DELETE FROM reports WHERE reported_by = ${id} OR reviewed_by = ${id}`);
      }

      if (selectedItems.includes('videos')) {
        await db.execute(sql`DELETE FROM videos WHERE user_id = ${id}`);
      }

      if (selectedItems.includes('registrations')) {
        await db.execute(sql`DELETE FROM registrations WHERE user_id = ${id}`);
      }

      if (selectedItems.includes('affiliates')) {
        await db.execute(sql`DELETE FROM payout_requests WHERE affiliate_id IN (SELECT id FROM affiliates WHERE user_id = ${id})`);
        await db.execute(sql`DELETE FROM referrals WHERE affiliate_id IN (SELECT id FROM affiliates WHERE user_id = ${id})`);
        await db.execute(sql`DELETE FROM affiliates WHERE user_id = ${id}`);
      }

      // Always delete the user
      await storage.deleteUser(id);

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // User: Delete own account
  app.post('/api/account/delete', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user as SelectUser;
      const userId = currentUser.id;
      const { selectedItems = [] } = req.body || {};

      // ALWAYS delete data with foreign key constraints to users (regardless of selectedItems)
      // This must happen before deleting the user
      
      // Delete ad impressions and clicks (depends on user)
      await db.execute(sql`DELETE FROM ad_impressions WHERE user_id = ${userId}`);
      await db.execute(sql`DELETE FROM ad_clicks WHERE user_id = ${userId}`);
      
      // Delete poll responses (depends on user)
      await db.execute(sql`DELETE FROM poll_responses WHERE user_id = ${userId}`);
      
      // Delete likes (depends on user)
      await db.execute(sql`DELETE FROM likes WHERE user_id = ${userId}`);
      
      // Delete votes (depends on user)
      await db.execute(sql`DELETE FROM votes WHERE user_id = ${userId}`);
      
      // Delete watch history (depends on user)
      await db.execute(sql`DELETE FROM watch_history WHERE user_id = ${userId}`);
      
      // Delete judge scores (depends on user as judge)
      await db.execute(sql`DELETE FROM judge_scores WHERE judge_id = ${userId}`);
      
      // Delete reports (depends on user as reported_by or reviewed_by)
      await db.execute(sql`DELETE FROM reports WHERE reported_by = ${userId} OR reviewed_by = ${userId}`);
      
      // Delete paid votes and vote purchases (depends on user)
      await db.execute(sql`DELETE FROM paid_votes WHERE purchase_id IN (SELECT id FROM vote_purchases WHERE user_id = ${userId})`);
      await db.execute(sql`DELETE FROM vote_purchases WHERE user_id = ${userId}`);

      // NOW handle optional selective deletions based on selectedItems
      
      // Delete polls created by user (depends on user as creator)
      if (selectedItems.includes('videos')) {
        await db.execute(sql`DELETE FROM polls WHERE creator_id = ${userId}`);
      }

      if (selectedItems.includes('videos')) {
        await db.execute(sql`DELETE FROM videos WHERE user_id = ${userId}`);
      }

      if (selectedItems.includes('registrations')) {
        await db.execute(sql`DELETE FROM registrations WHERE user_id = ${userId}`);
      }

      if (selectedItems.includes('affiliates')) {
        await db.execute(sql`DELETE FROM payout_requests WHERE affiliate_id IN (SELECT id FROM affiliates WHERE user_id = ${userId})`);
        await db.execute(sql`DELETE FROM referrals WHERE affiliate_id IN (SELECT id FROM affiliates WHERE user_id = ${userId})`);
        await db.execute(sql`DELETE FROM affiliates WHERE user_id = ${userId}`);
      }

      // Always delete the user
      await storage.deleteUser(userId);

      // Log out the user by clearing their session
      req.logout((err: any) => {
        if (err) {
          console.error("Error during logout after account deletion:", err);
        }
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
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

      // Also update the user's status if they have a corresponding user account
      const user = await storage.getUserByEmail(advertiser.email);
      if (user) {
        // User account is already created, advertiser is now active
        // No additional user status update needed
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

      // Also update the user's status if they have a corresponding user account
      const user = await storage.getUserByEmail(advertiser.email);
      if (user) {
        // Advertiser is suspended, but user account remains for historical records
        // No additional user update needed
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

  // Admin: Delete advertiser account
  app.delete('/api/admin/advertisers/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const advertiser = await storage.getAdvertiser(id);
      if (!advertiser) {
        return res.status(404).json({ message: "Advertiser not found" });
      }

      // Delete associated campaigns and ads
      const campaigns = await storage.getAdvertiserCampaigns(id);
      for (const campaign of campaigns) {
        const ads = await storage.getCampaignAds(campaign.id);
        for (const ad of ads) {
          // Delete ad directly from database
          await db.delete(schema.ads).where(eq(schema.ads.id, ad.id));
        }
        await storage.deleteCampaign(campaign.id);
      }

      // Delete any other advertiser ads not in campaigns
      const allAds = await storage.getAdvertiserAds(id);
      for (const ad of allAds) {
        // Delete ad directly from database
        await db.delete(schema.ads).where(eq(schema.ads.id, ad.id));
      }

      // Delete advertiser payments
      const payments = await storage.getAdvertiserPayments(id);
      for (const payment of payments) {
        await db.delete(schema.adPayments).where(eq(schema.adPayments.id, payment.id));
      }

      // Delete the advertiser account
      await storage.deleteAdvertiser(id);

      // Also delete the corresponding user account if it exists
      const user = await storage.getUserByEmail(advertiser.email);
      if (user) {
        await storage.deleteUser(user.id);
      }

      res.json({ 
        message: "Advertiser deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting advertiser:", error);
      res.status(500).json({ message: "Failed to delete advertiser" });
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
  app.get("/api/advertiser/current", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Check if user has an advertiser account (has companyName)
      if (!user || !user.companyName) {
        return res.json(null);
      }

      // Return advertiser account info
      res.json({
        id: user.id,
        email: user.email,
        companyName: user.companyName,
        status: user.status,
        walletBalance: user.walletBalance,
        totalSpent: user.totalSpent,
      });
    } catch (error) {
      console.error("Get current advertiser error:", error);
      res.status(500).json({ message: "Failed to fetch advertiser account" });
    }
  });

  app.get("/api/advertiser/me", isAdvertiser, async (req, res) => {
    try {
      const advertiser = req.user as any;
      const dbAdvertiser = await storage.getAdvertiser(advertiser.id);
      
      if (!dbAdvertiser) {
        return res.status(404).json({ message: "Advertiser not found" });
      }

      res.json(dbAdvertiser);
    } catch (error) {
      console.error("Get advertiser me error:", error);
      res.status(500).json({ message: "Failed to fetch advertiser account" });
    }
  });

  app.patch("/api/advertiser/account", isAdvertiser, async (req, res) => {
    try {
      const advertiser = req.user as any;
      const { companyName, contactName, businessType, country, companyWebsite, contactPhone, companyDescription } = req.body;

      // Validate required fields
      if (!companyName || !contactName || !businessType || !country) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Update advertiser account
      const updated = await storage.updateAdvertiser(advertiser.id, {
        companyName: companyName?.trim(),
        contactName: contactName?.trim(),
        businessType: businessType?.trim(),
        country: country?.trim(),
        companyWebsite: companyWebsite?.trim(),
        contactPhone: contactPhone?.trim(),
        companyDescription: companyDescription?.trim(),
      });

      if (!updated) {
        return res.status(404).json({ message: "Advertiser not found" });
      }

      res.json({
        message: "Account settings updated successfully",
        advertiser: updated,
      });
    } catch (error) {
      console.error("Update advertiser account error:", error);
      res.status(500).json({ message: "Failed to update account settings" });
    }
  });

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

  // Dashboard notification endpoints
  app.get("/api/creator/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const notifications = await storage.getUserNotifications(userId, 20);
      const unreadCount = await storage.getUnreadNotificationCount(userId);
      res.json({ notifications, unreadCount });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/creator/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post("/api/creator/notifications/mark-all-read", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  app.delete("/api/creator/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Activity log endpoints
  app.get("/api/creator/activity-log", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const logs = await storage.getUserActivityLogs(userId, 50);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity log" });
    }
  });

  // Session management endpoints
  app.get("/api/creator/sessions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const sessions = await storage.getUserLoginSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.delete("/api/creator/sessions/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLoginSession(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Email preferences endpoints
  app.get("/api/creator/email-preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const prefs = await storage.getEmailPreferences(userId);
      res.json(prefs || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email preferences" });
    }
  });

  app.patch("/api/creator/email-preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const prefs = await storage.updateEmailPreferences(userId, req.body);
      res.json(prefs);
    } catch (error) {
      res.status(500).json({ message: "Failed to update email preferences" });
    }
  });

  // Dashboard preferences endpoints
  app.get("/api/creator/dashboard-preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const prefs = await storage.getDashboardPreferences(userId);
      res.json(prefs || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard preferences" });
    }
  });

  app.patch("/api/creator/dashboard-preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const prefs = await storage.updateDashboardPreferences(userId, req.body);
      res.json(prefs);
    } catch (error) {
      res.status(500).json({ message: "Failed to update dashboard preferences" });
    }
  });

  // Account settings endpoints
  app.get("/api/creator/account-settings", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const settings = await storage.getAccountSettings(userId);
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account settings" });
    }
  });

  app.patch("/api/creator/account-settings", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      const settings = await storage.updateAccountSettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update account settings" });
    }
  });

  app.post("/api/creator/deactivate-account", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      await storage.deactivateAccount(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate account" });
    }
  });

  app.post("/api/creator/schedule-account-deletion", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as SelectUser).id;
      await storage.scheduleAccountDeletion(userId);
      res.json({ success: true, message: "Account deletion scheduled for 30 days from now" });
    } catch (error) {
      res.status(500).json({ message: "Failed to schedule account deletion" });
    }
  });

  // Poll and quiz endpoints
  app.post("/api/videos/:videoId/polls", isAuthenticated, async (req, res) => {
    try {
      const { videoId } = req.params;
      const userId = (req.user as SelectUser).id;
      
      // Verify user owns the video
      const video = await storage.getVideoById(videoId);
      if (!video || video.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { question, type, timingSeconds, duration, isRequired, options } = req.body;
      if (!question || !type || timingSeconds === undefined || !duration || !options?.length) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const poll = await storage.createPoll({
        videoId,
        question,
        type,
        timingSeconds,
        duration,
        isRequired: isRequired || false,
        options: options.map((opt: any, idx: number) => ({
          text: opt.text,
          isCorrect: opt.isCorrect || false,
          order: idx,
        })),
      } as any);

      res.status(201).json(poll);
    } catch (error) {
      console.error("Error creating poll:", error);
      res.status(500).json({ message: "Failed to create poll" });
    }
  });

  app.get("/api/videos/:videoId/polls", async (req, res) => {
    try {
      const { videoId } = req.params;
      const polls = await storage.getVideoPolls(videoId);
      res.json(polls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch polls" });
    }
  });

  app.get("/api/polls/:pollId", async (req, res) => {
    try {
      const { pollId } = req.params;
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      res.json(poll);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch poll" });
    }
  });

  app.get("/api/polls/:pollId/stats", async (req, res) => {
    try {
      const { pollId } = req.params;
      const stats = await storage.getPollStats(pollId);
      if (!stats) {
        return res.status(404).json({ message: "Poll not found" });
      }
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch poll stats" });
    }
  });

  app.patch("/api/polls/:pollId", isAuthenticated, async (req, res) => {
    try {
      const { pollId } = req.params;
      const userId = (req.user as SelectUser).id;
      
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }

      const video = await storage.getVideoById(poll.videoId);
      if (!video || video.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updated = await storage.updatePoll(pollId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update poll" });
    }
  });

  app.delete("/api/polls/:pollId", isAuthenticated, async (req, res) => {
    try {
      const { pollId } = req.params;
      const userId = (req.user as SelectUser).id;
      
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }

      const video = await storage.getVideoById(poll.videoId);
      if (!video || video.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deletePoll(pollId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete poll" });
    }
  });

  app.post("/api/polls/:pollId/respond", async (req, res) => {
    try {
      const { pollId } = req.params;
      const { optionId } = req.body;
      const userId = (req.user as SelectUser | undefined)?.id;
      const ipAddress = req.ip;

      if (!optionId) {
        return res.status(400).json({ message: "optionId is required" });
      }

      // Check if user already responded
      const existing = await storage.getUserPollResponse(pollId, userId || null, ipAddress);
      if (existing) {
        return res.status(400).json({ message: "You have already responded to this poll" });
      }

      const response = await storage.createPollResponse({
        pollId,
        optionId,
        userId: userId || null,
        ipAddress: ipAddress || '',
      });

      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating response:", error);
      res.status(500).json({ message: "Failed to submit response" });
    }
  });

  // Admin: Get fraud alerts
  app.get('/api/admin/fraud-alerts', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      res.json([]);
    } catch (error) {
      console.error("Error fetching fraud alerts:", error);
      res.status(500).json({ message: "Failed to fetch fraud alerts" });
    }
  });

  // Admin: Create affiliate campaign
  app.post('/api/admin/affiliate-campaigns', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { name, description, commissionPercentage } = req.body;
      
      if (!name || !commissionPercentage) {
        return res.status(400).json({ message: "Name and commission percentage required" });
      }

      res.status(201).json({ 
        id: Math.random().toString(), 
        name, 
        description, 
        commissionPercentage,
        status: 'active',
        message: "Campaign feature coming soon"
      });
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  // Admin: Get affiliate campaigns
  app.get('/api/admin/affiliate-campaigns', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      res.json([]);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  // Admin: Resolve fraud alert
  app.patch('/api/admin/fraud-alerts/:id/resolve', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      res.json({ message: "Fraud alert feature coming soon" });
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  });

  // Admin: Create custom payout for affiliate
  app.post('/api/admin/affiliates/:id/custom-payout', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid payout amount required" });
      }

      // Verify affiliate exists
      const affiliateResult = await db.execute(sql`
        SELECT id FROM affiliates WHERE id = ${id}
      `);

      if (affiliateResult.rows.length === 0) {
        return res.status(404).json({ message: "Affiliate not found" });
      }

      // Create custom payout request
      const payoutId = randomUUID();
      await db.execute(sql`
        INSERT INTO payout_requests (id, affiliate_id, amount, status, payment_method, requested_at)
        VALUES (${payoutId}, ${id}, ${amount}, 'pending', 'custom', NOW())
      `);

      res.status(201).json({
        id: payoutId,
        amount,
        status: 'pending',
        message: "Custom payout created successfully"
      });
    } catch (error) {
      console.error("Error creating custom payout:", error);
      res.status(500).json({ message: "Failed to create custom payout" });
    }
  });

  // Admin: Get affiliate performance logs
  app.get('/api/admin/affiliates/:id/performance', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

      // Verify affiliate exists
      const affiliateResult = await db.execute(sql`
        SELECT id FROM affiliates WHERE id = ${id}
      `);

      if (affiliateResult.rows.length === 0) {
        return res.status(404).json({ message: "Affiliate not found" });
      }

      // Get performance data from referrals and payouts
      const performanceData = await db.execute(sql`
        SELECT 
          'referral_batch' as event_type,
          'Batch referral registrations' as description,
          COUNT(ref.id) as referrals_count,
          COUNT(ref.id) as clicks_count,
          COUNT(ref.id) as conversions_count,
          COALESCE(SUM(ref.commission), 0) as earnings,
          MAX(ref.created_at) as created_at
        FROM referrals ref
        WHERE ref.affiliate_id = ${id}
        GROUP BY ref.affiliate_id
        UNION ALL
        SELECT 
          'payout' as event_type,
          CONCAT('Payout - ', pr.status) as description,
          0 as referrals_count,
          0 as clicks_count,
          0 as conversions_count,
          pr.amount as earnings,
          pr.requested_at as created_at
        FROM payout_requests pr
        WHERE pr.affiliate_id = ${id}
        ORDER BY created_at DESC
        LIMIT 50
      `);

      const logs = (performanceData.rows || []).map((row: any) => ({
        event_type: row.event_type,
        description: row.description,
        referrals_count: Number(row.referrals_count) || 0,
        clicks_count: Number(row.clicks_count) || 0,
        conversions_count: Number(row.conversions_count) || 0,
        earnings: Number(row.earnings) || 0,
        created_at: row.created_at
      }));

      res.json(logs);
    } catch (error) {
      console.error("Error fetching performance logs:", error);
      res.status(500).json({ message: "Failed to fetch performance logs" });
    }
  });

  // Admin: Upload image for WYSIWYG editor
  app.post('/api/admin/communications/upload-image', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const form = new formidable.IncomingForm();
      const [fields, files] = await form.parse(req);
      
      const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
      if (!imageFile) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(imageFile.mimetype || '')) {
        return res.status(400).json({ message: "Invalid image format. Allowed: JPEG, PNG, GIF, WebP" });
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if ((imageFile.size || 0) > maxSize) {
        return res.status(400).json({ message: "Image size must be less than 5MB" });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const ext = imageFile.originalFilename?.split('.').pop() || 'jpg';
      const filename = `affiliate-email-${timestamp}-${random}.${ext}`;

      // Upload to object storage
      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || "";
      const bucketPath = `${privateObjectDir}/affiliate-emails`;
      const objectPath = `${bucketPath}/${filename}`;
      
      const fileBuffer = await fs.readFile(imageFile.filepath);
      const bucketName = privateObjectDir.split('/')[0];
      const bucket = objectStorageClient.bucket(bucketName);
      
      const file = bucket.file(objectPath);
      const writeStream = file.createWriteStream({
        metadata: {
          contentType: imageFile.mimetype || 'image/jpeg',
        },
      });
      
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        writeStream.end(fileBuffer);
      });

      // Generate public URL
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectPath}`;

      res.json({
        url: publicUrl,
        message: "Image uploaded successfully"
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Admin: Send bulk communications to all affiliates
  app.post('/api/admin/communications/send', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { subject, message } = req.body;

      if (!subject || !message) {
        return res.status(400).json({ message: "Subject and message are required" });
      }

      // Get all active affiliates
      const affiliatesResult = await db.execute(sql`
        SELECT 
          u.email,
          u.first_name,
          u.last_name
        FROM affiliates a
        JOIN users u ON a.user_id = u.id
        WHERE a.status = 'active' OR a.status = 'approved'
        ORDER BY a.created_at DESC
      `);

      if (affiliatesResult.rows.length === 0) {
        return res.status(400).json({ message: "No active affiliates to send to" });
      }

      // Send emails in batch
      const affiliateEmails = affiliatesResult.rows.map((row: any) => ({
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
      }));

      const result = await sendBulkEmailToAffiliates({
        emails: affiliateEmails,
        subject,
        htmlMessage: message,
      });

      res.json({
        success: true,
        message: `Email sent to ${result.sent} affiliates${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
        sent: result.sent,
        failed: result.failed,
        total: affiliateEmails.length,
      });
    } catch (error) {
      console.error("Error sending bulk communications:", error);
      res.status(500).json({ message: "Failed to send communications" });
    }
  });

  // Seed African-themed gifts
  app.post('/api/gifts/seed', async (req: any, res: any) => {
    try {
      const gifts = [
        { name: 'African Drum', description: 'Rhythmic African drum', iconUrl: '🥁', priceUsd: 100, tier: 'small' },
        { name: 'Cowrie Shell', description: 'Traditional cowrie shells', iconUrl: '🐚', priceUsd: 200, tier: 'medium' },
        { name: 'Toguh Cloth', description: 'Authentic Northwest Cameroon traditional cloth', iconUrl: '🧵', priceUsd: 200, tier: 'medium' },
        { name: 'Elephant', description: 'Majestic elephant', iconUrl: '🐘', priceUsd: 250, tier: 'medium' },
        { name: 'Lion', description: 'The King of Beasts', iconUrl: '🦁', priceUsd: 500, tier: 'large' },
        { name: 'African Crown', description: 'Royal African crown', iconUrl: '👑', priceUsd: 1000, tier: 'luxury' },
        { name: 'Giraffe', description: 'Tall majestic giraffe', iconUrl: '🦒', priceUsd: 150, tier: 'small' },
        { name: 'Tribal Mask', description: 'Sacred tribal mask', iconUrl: '🎭', priceUsd: 750, tier: 'large' },
      ];
      
      for (const gift of gifts) {
        await db.execute(sql`
          INSERT INTO gifts (name, description, icon_url, price_usd, tier, is_active)
          VALUES (${gift.name}, ${gift.description}, ${gift.iconUrl}, ${gift.priceUsd}, ${gift.tier}, true)
          ON CONFLICT DO NOTHING
        `);
      }
      
      res.json({ message: 'Gifts seeded successfully' });
    } catch (error) {
      console.error('Error seeding gifts:', error);
      res.status(500).json({ message: 'Failed to seed gifts' });
    }
  });

  // Send gift with payment
  app.post('/api/gifts/send', isAuthenticated, async (req: any, res: any) => {
    try {
      const { videoId, creatorId, giftId, quantity } = req.body;
      const senderId = (req.user as SelectUser).id;

      if (!videoId || !creatorId || !giftId || !quantity) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Get gift details
      const giftResult = await db.execute(sql`SELECT * FROM gifts WHERE id = ${giftId}`);
      if (giftResult.rows.length === 0) {
        return res.status(404).json({ message: 'Gift not found' });
      }

      const gift = giftResult.rows[0] as any;
      const totalUsd = (gift.price_usd * quantity);
      const creatorShare = Math.floor(totalUsd * 0.65);
      const platformShare = totalUsd - creatorShare;

      // Create transaction
      const txRef = `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const transactionId = randomUUID();

      await db.execute(sql`
        INSERT INTO gift_transactions 
        (id, sender_id, recipient_id, video_id, gift_id, quantity, amount_paid_usd, amount_paid_local, creator_share, platform_share, tx_ref, status)
        VALUES 
        (${transactionId}, ${senderId}, ${creatorId}, ${videoId}, ${giftId}, ${quantity}, ${totalUsd}, ${totalUsd}, ${creatorShare}, ${platformShare}, ${txRef}, 'completed')
      `);

      // Update creator wallet
      await db.execute(sql`
        UPDATE users SET wallet_balance = wallet_balance + ${creatorShare} WHERE id = ${creatorId}
      `);

      res.status(201).json({
        id: transactionId,
        message: 'Gift sent successfully',
        creatorEarned: creatorShare / 100,
      });
    } catch (error) {
      console.error('Error sending gift:', error);
      res.status(500).json({ message: 'Failed to send gift' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
