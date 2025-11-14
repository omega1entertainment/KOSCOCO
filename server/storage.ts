import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import type {
  User, InsertUser,
  Category, InsertCategory,
  Phase, InsertPhase,
  Registration, InsertRegistration,
  Video, InsertVideo, VideoWithStats,
  Vote, InsertVote,
  VotePurchase, InsertVotePurchase,
  PaidVote, InsertPaidVote,
  JudgeScore, InsertJudgeScore, JudgeProfile, JudgeWithStats, JudgeScoreWithVideo, VideoForJudging,
  Affiliate, InsertAffiliate,
  Referral, InsertReferral,
  PayoutRequest, InsertPayoutRequest,
  Like, InsertLike,
  Report, InsertReport
} from "@shared/schema";

const httpClient = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: httpClient, schema });

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByFacebookId(facebookId: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  updateUserGoogleId(id: string, googleId: string): Promise<User | undefined>;
  updateUserFacebookId(id: string, facebookId: string): Promise<User | undefined>;
  setPasswordResetToken(id: string, token: string, expires: Date): Promise<void>;
  updatePassword(id: string, password: string): Promise<void>;
  verifyUserEmail(id: string): Promise<void>;
  updateUserVerificationToken(id: string, token: string, expiry: Date): Promise<void>;
  
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  getCategoryVideoCounts(): Promise<Record<string, number>>;
  
  getAllPhases(): Promise<Phase[]>;
  getActivePhase(): Promise<Phase | undefined>;
  createPhase(phase: InsertPhase): Promise<Phase>;
  updatePhase(id: string, updates: Partial<InsertPhase>): Promise<Phase | undefined>;
  
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  getUserRegistrations(userId: string): Promise<Registration[]>;
  getRegistrationById(id: string): Promise<Registration | undefined>;
  getRegistrationByReferralCode(code: string): Promise<Registration[]>;
  updateRegistrationPaymentStatus(id: string, status: string): Promise<Registration | undefined>;
  
  createVideo(video: InsertVideo): Promise<Video>;
  getVideoById(id: string): Promise<Video | undefined>;
  getVideosByUser(userId: string): Promise<Video[]>;
  getVideosByCategory(categoryId: string): Promise<VideoWithStats[]>;
  getPendingVideos(): Promise<Video[]>;
  getVideosWithoutThumbnails(): Promise<Video[]>;
  updateVideoStatus(id: string, status: string): Promise<Video | undefined>;
  updateVideoThumbnail(id: string, thumbnailUrl: string): Promise<Video | undefined>;
  incrementVideoViews(id: string): Promise<void>;
  
  createVote(vote: InsertVote): Promise<Vote>;
  getVideoVoteCount(videoId: string): Promise<number>;
  getCombinedVoteCount(videoId: string): Promise<number>;
  getUserVotesForVideo(userId: string | null, videoId: string, ipAddress?: string): Promise<Vote[]>;
  getUserVotes(userId: string): Promise<Vote[]>;
  getUserStats(userId: string): Promise<{ totalVideos: number; totalVotesReceived: number; totalVotesCast: number }>;
  getLeaderboard(categoryId?: string, phaseId?: string, limit?: number): Promise<(Video & { voteCount: number; totalJudgeScore: number; rank: number })[]>;
  
  createLike(like: InsertLike): Promise<Like>;
  getVideoLikeCount(videoId: string): Promise<number>;
  getUserLikesForVideo(userId: string | null, videoId: string, ipAddress?: string): Promise<Like[]>;
  getUserLikes(userId: string): Promise<Like[]>;
  
  createVotePurchase(purchase: InsertVotePurchase): Promise<VotePurchase>;
  getVotePurchaseByTxRef(txRef: string): Promise<VotePurchase | undefined>;
  getVotePurchaseByFlwRef(flwRef: string): Promise<VotePurchase | undefined>;
  updateVotePurchase(id: string, updates: Partial<VotePurchase>): Promise<VotePurchase | undefined>;
  
  createPaidVote(paidVote: InsertPaidVote): Promise<PaidVote>;
  getPaidVotesByVideo(videoId: string): Promise<PaidVote[]>;
  
  createJudgeScore(score: InsertJudgeScore): Promise<JudgeScore>;
  getVideoJudgeScores(videoId: string): Promise<JudgeScore[]>;
  
  // Judge-specific methods
  getJudgeRoster(): Promise<JudgeProfile[]>;
  getJudgeWithStats(judgeId: string): Promise<JudgeWithStats | undefined>;
  getVideosForJudging(judgeId: string, filters?: { categoryId?: string; phaseId?: string; limit?: number }): Promise<VideoForJudging[]>;
  getJudgeCompletedScores(judgeId: string, filters?: { categoryId?: string; phaseId?: string }): Promise<JudgeScoreWithVideo[]>;
  updateJudgeProfile(judgeId: string, updates: Partial<Pick<User, 'judgeName' | 'judgeBio' | 'judgePhotoUrl'>>): Promise<User | undefined>;
  getJudgeAssignmentSummary(judgeId: string): Promise<{ pendingCount: number; completedCount: number }>;
  
  createAffiliate(affiliate: InsertAffiliate): Promise<Affiliate>;
  getAffiliateByUserId(userId: string): Promise<Affiliate | undefined>;
  getAffiliateByReferralCode(code: string): Promise<Affiliate | undefined>;
  updateAffiliateStats(id: string, referrals: number, earnings: number): Promise<Affiliate | undefined>;
  
  createReferral(referral: InsertReferral): Promise<Referral>;
  getAffiliateReferrals(affiliateId: string): Promise<Referral[]>;
  getReferralsByRegistrationId(registrationId: string): Promise<Referral[]>;
  updateReferralStatus(id: string, status: string): Promise<Referral | undefined>;

  createPayoutRequest(request: InsertPayoutRequest): Promise<PayoutRequest>;
  getPayoutRequestsByAffiliate(affiliateId: string): Promise<PayoutRequest[]>;
  getAllPayoutRequests(): Promise<PayoutRequest[]>;
  updatePayoutStatus(id: string, status: string, processedBy?: string, rejectionReason?: string): Promise<PayoutRequest | undefined>;
  getAffiliateAvailableBalance(affiliateId: string): Promise<number>;

  createReport(report: InsertReport): Promise<Report>;
  getAllReports(): Promise<Report[]>;
  getReportsByVideo(videoId: string): Promise<Report[]>;
  updateReportStatus(id: string, status: string, reviewedBy: string): Promise<Report | undefined>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.googleId, googleId));
    return user;
  }

  async getUserByFacebookId(facebookId: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.facebookId, facebookId));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.resetPasswordToken, token));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(schema.users).set({...updates, updatedAt: new Date()}).where(eq(schema.users.id, id)).returning();
    return user;
  }

  async updateUserGoogleId(id: string, googleId: string): Promise<User | undefined> {
    const [user] = await db.update(schema.users).set({ googleId, updatedAt: new Date() }).where(eq(schema.users.id, id)).returning();
    return user;
  }

  async updateUserFacebookId(id: string, facebookId: string): Promise<User | undefined> {
    const [user] = await db.update(schema.users).set({ facebookId, updatedAt: new Date() }).where(eq(schema.users.id, id)).returning();
    return user;
  }

  async setPasswordResetToken(id: string, token: string, expires: Date): Promise<void> {
    await db.update(schema.users).set({ 
      resetPasswordToken: token, 
      resetPasswordExpires: expires,
      updatedAt: new Date() 
    }).where(eq(schema.users.id, id));
  }

  async updatePassword(id: string, password: string): Promise<void> {
    await db.update(schema.users).set({ 
      password, 
      resetPasswordToken: null,
      resetPasswordExpires: null,
      updatedAt: new Date() 
    }).where(eq(schema.users.id, id));
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.verificationToken, token));
    return user;
  }

  async verifyUserEmail(id: string): Promise<void> {
    await db.update(schema.users).set({
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
      updatedAt: new Date()
    }).where(eq(schema.users.id, id));
  }

  async updateUserVerificationToken(id: string, token: string, expiry: Date): Promise<void> {
    await db.update(schema.users).set({
      verificationToken: token,
      verificationTokenExpiry: expiry,
      updatedAt: new Date()
    }).where(eq(schema.users.id, id));
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(schema.categories);
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(schema.categories).where(eq(schema.categories.id, id));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(schema.categories).values(insertCategory).returning();
    return category;
  }

  async getAllPhases(): Promise<Phase[]> {
    return await db.select().from(schema.phases).orderBy(schema.phases.number);
  }

  async getActivePhase(): Promise<Phase | undefined> {
    const [phase] = await db.select().from(schema.phases).where(eq(schema.phases.status, 'active'));
    return phase;
  }

  async createPhase(insertPhase: InsertPhase): Promise<Phase> {
    const [phase] = await db.insert(schema.phases).values(insertPhase).returning();
    return phase;
  }

  async updatePhase(id: string, updates: Partial<InsertPhase>): Promise<Phase | undefined> {
    const [phase] = await db.update(schema.phases).set(updates).where(eq(schema.phases.id, id)).returning();
    return phase;
  }

  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const [registration] = await db.insert(schema.registrations).values(insertRegistration).returning();
    return registration;
  }

  async getUserRegistrations(userId: string): Promise<Registration[]> {
    return await db.select().from(schema.registrations).where(eq(schema.registrations.userId, userId));
  }

  async getRegistrationById(id: string): Promise<Registration | undefined> {
    const [registration] = await db.select().from(schema.registrations).where(eq(schema.registrations.id, id));
    return registration;
  }

  async getRegistrationByReferralCode(code: string): Promise<Registration[]> {
    return await db.select().from(schema.registrations).where(eq(schema.registrations.referralCode, code));
  }

  async updateRegistrationPaymentStatus(id: string, status: string): Promise<Registration | undefined> {
    const [registration] = await db
      .update(schema.registrations)
      .set({ paymentStatus: status })
      .where(eq(schema.registrations.id, id))
      .returning();
    return registration;
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db.insert(schema.videos).values(insertVideo).returning();
    return video;
  }

  async getVideoById(id: string): Promise<Video | undefined> {
    const [video] = await db.select().from(schema.videos).where(eq(schema.videos.id, id));
    return video;
  }

  async getVideosByUser(userId: string): Promise<Video[]> {
    return await db.select().from(schema.videos).where(eq(schema.videos.userId, userId)).orderBy(desc(schema.videos.createdAt));
  }

  async getVideosByCategory(categoryId: string): Promise<VideoWithStats[]> {
    const results = await db
      .select({
        id: schema.videos.id,
        userId: schema.videos.userId,
        categoryId: schema.videos.categoryId,
        phaseId: schema.videos.phaseId,
        subcategory: schema.videos.subcategory,
        title: schema.videos.title,
        description: schema.videos.description,
        videoUrl: schema.videos.videoUrl,
        thumbnailUrl: schema.videos.thumbnailUrl,
        duration: schema.videos.duration,
        fileSize: schema.videos.fileSize,
        status: schema.videos.status,
        views: schema.videos.views,
        createdAt: schema.videos.createdAt,
        updatedAt: schema.videos.updatedAt,
        likeCount: sql<number>`(
          SELECT COALESCE(COUNT(*), 0)
          FROM ${schema.likes}
          WHERE ${schema.likes.videoId} = ${schema.videos.id}
        )`,
        voteCount: sql<number>`(
          (SELECT COALESCE(COUNT(*), 0)
           FROM ${schema.votes}
           WHERE ${schema.votes.videoId} = ${schema.videos.id})
          +
          (SELECT COALESCE(SUM(${schema.paidVotes.quantity}), 0)
           FROM ${schema.paidVotes}
           WHERE ${schema.paidVotes.videoId} = ${schema.videos.id})
        )`,
      })
      .from(schema.videos)
      .where(and(eq(schema.videos.categoryId, categoryId), eq(schema.videos.status, 'approved')))
      .orderBy(desc(schema.videos.createdAt));
    
    return results as VideoWithStats[];
  }

  async getCategoryVideoCounts(): Promise<Record<string, number>> {
    const result = await db
      .select({
        categoryId: schema.videos.categoryId,
        count: sql<number>`COUNT(*)`,
      })
      .from(schema.videos)
      .where(eq(schema.videos.status, 'approved'))
      .groupBy(schema.videos.categoryId);
    
    const counts: Record<string, number> = {};
    for (const row of result) {
      counts[row.categoryId] = Number(row.count ?? 0);
    }
    return counts;
  }

  async getPendingVideos(): Promise<Video[]> {
    return await db.select().from(schema.videos).where(eq(schema.videos.status, 'pending')).orderBy(desc(schema.videos.createdAt));
  }

  async getVideosWithoutThumbnails(): Promise<Video[]> {
    return await db.select().from(schema.videos).where(isNull(schema.videos.thumbnailUrl)).orderBy(desc(schema.videos.createdAt));
  }

  async updateVideoStatus(id: string, status: string): Promise<Video | undefined> {
    const [video] = await db.update(schema.videos).set({ status, updatedAt: new Date() }).where(eq(schema.videos.id, id)).returning();
    return video;
  }

  async updateVideoThumbnail(id: string, thumbnailUrl: string): Promise<Video | undefined> {
    const [video] = await db.update(schema.videos).set({ thumbnailUrl, updatedAt: new Date() }).where(eq(schema.videos.id, id)).returning();
    return video;
  }

  async incrementVideoViews(id: string): Promise<void> {
    await db.update(schema.videos)
      .set({ views: sql`${schema.videos.views} + 1` })
      .where(eq(schema.videos.id, id));
  }

  async createVote(insertVote: InsertVote): Promise<Vote> {
    const [vote] = await db.insert(schema.votes).values(insertVote).returning();
    return vote;
  }

  async getVideoVoteCount(videoId: string): Promise<number> {
    return this.getCombinedVoteCount(videoId);
  }

  async getUserVotesForVideo(userId: string | null, videoId: string, ipAddress?: string): Promise<Vote[]> {
    if (userId) {
      return await db.select().from(schema.votes)
        .where(and(eq(schema.votes.videoId, videoId), eq(schema.votes.userId, userId)));
    } else if (ipAddress) {
      return await db.select().from(schema.votes)
        .where(and(eq(schema.votes.videoId, videoId), eq(schema.votes.ipAddress, ipAddress)));
    }
    return [];
  }

  async getCombinedVoteCount(videoId: string): Promise<number> {
    const freeVotesResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.votes)
      .where(eq(schema.votes.videoId, videoId));
    const freeVotes = freeVotesResult[0]?.count || 0;

    const paidVotesResult = await db.select({ total: sql<number>`COALESCE(SUM(${schema.paidVotes.quantity}), 0)` })
      .from(schema.paidVotes)
      .where(eq(schema.paidVotes.videoId, videoId));
    const paidVotes = paidVotesResult[0]?.total || 0;

    return freeVotes + paidVotes;
  }

  async getUserVotes(userId: string): Promise<Vote[]> {
    return await db.select().from(schema.votes)
      .where(eq(schema.votes.userId, userId))
      .orderBy(desc(schema.votes.createdAt));
  }

  async createLike(insertLike: InsertLike): Promise<Like> {
    const [like] = await db.insert(schema.likes).values(insertLike).returning();
    return like;
  }

  async getVideoLikeCount(videoId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.likes)
      .where(eq(schema.likes.videoId, videoId));
    return result[0]?.count || 0;
  }

  async getUserLikesForVideo(userId: string | null, videoId: string, ipAddress?: string): Promise<Like[]> {
    if (userId) {
      return await db.select().from(schema.likes)
        .where(and(eq(schema.likes.videoId, videoId), eq(schema.likes.userId, userId)));
    } else if (ipAddress) {
      return await db.select().from(schema.likes)
        .where(and(eq(schema.likes.videoId, videoId), eq(schema.likes.ipAddress, ipAddress)));
    }
    return [];
  }

  async getUserLikes(userId: string): Promise<Like[]> {
    return await db.select().from(schema.likes)
      .where(eq(schema.likes.userId, userId))
      .orderBy(desc(schema.likes.createdAt));
  }

  async createVotePurchase(insertPurchase: InsertVotePurchase): Promise<VotePurchase> {
    const [purchase] = await db.insert(schema.votePurchases).values(insertPurchase).returning();
    return purchase;
  }

  async getVotePurchaseByTxRef(txRef: string): Promise<VotePurchase | undefined> {
    const [purchase] = await db.select().from(schema.votePurchases)
      .where(eq(schema.votePurchases.txRef, txRef));
    return purchase;
  }

  async getVotePurchaseByFlwRef(flwRef: string): Promise<VotePurchase | undefined> {
    const [purchase] = await db.select().from(schema.votePurchases)
      .where(eq(schema.votePurchases.flwRef, flwRef));
    return purchase;
  }

  async updateVotePurchase(id: string, updates: Partial<VotePurchase>): Promise<VotePurchase | undefined> {
    const [purchase] = await db.update(schema.votePurchases)
      .set(updates)
      .where(eq(schema.votePurchases.id, id))
      .returning();
    return purchase;
  }

  async createPaidVote(insertPaidVote: InsertPaidVote): Promise<PaidVote> {
    const [paidVote] = await db.insert(schema.paidVotes).values(insertPaidVote).returning();
    return paidVote;
  }

  async getPaidVotesByVideo(videoId: string): Promise<PaidVote[]> {
    return await db.select().from(schema.paidVotes)
      .where(eq(schema.paidVotes.videoId, videoId))
      .orderBy(desc(schema.paidVotes.createdAt));
  }

  async getUserStats(userId: string): Promise<{ totalVideos: number; totalVotesReceived: number; totalVotesCast: number }> {
    // Count total videos (all statuses)
    const videoCountResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.videos)
      .where(eq(schema.videos.userId, userId));
    const totalVideos = videoCountResult[0]?.count || 0;

    // Count total free votes received (aggregate in SQL, all video statuses)
    const freeVotesReceivedResult = await db.select({ count: sql<number>`COUNT(${schema.votes.id})` })
      .from(schema.votes)
      .innerJoin(schema.videos, eq(schema.votes.videoId, schema.videos.id))
      .where(eq(schema.videos.userId, userId));
    const freeVotesReceived = freeVotesReceivedResult[0]?.count || 0;

    // Count total paid votes received (sum of quantity)
    const paidVotesReceivedResult = await db.select({ 
      total: sql<number>`COALESCE(SUM(${schema.paidVotes.quantity}), 0)` 
    })
      .from(schema.paidVotes)
      .innerJoin(schema.videos, eq(schema.paidVotes.videoId, schema.videos.id))
      .where(eq(schema.videos.userId, userId));
    const paidVotesReceived = paidVotesReceivedResult[0]?.total || 0;

    const totalVotesReceived = freeVotesReceived + paidVotesReceived;

    // Count total votes cast (free votes only - users don't "cast" paid votes, they purchase them)
    const votesCastResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.votes)
      .where(eq(schema.votes.userId, userId));
    const totalVotesCast = votesCastResult[0]?.count || 0;

    return {
      totalVideos,
      totalVotesReceived,
      totalVotesCast,
    };
  }

  async getLeaderboard(categoryId?: string, phaseId?: string, limit: number = 50): Promise<(Video & { voteCount: number; totalJudgeScore: number; rank: number })[]> {
    const conditions = [eq(schema.videos.status, 'approved')];
    if (categoryId) {
      conditions.push(eq(schema.videos.categoryId, categoryId));
    }
    if (phaseId) {
      conditions.push(eq(schema.videos.phaseId, phaseId));
    }

    // Use subqueries to aggregate votes and judge scores separately
    // This avoids cartesian product and is efficient (single query)
    const videosWithScores = await db
      .select({
        id: schema.videos.id,
        userId: schema.videos.userId,
        categoryId: schema.videos.categoryId,
        phaseId: schema.videos.phaseId,
        subcategory: schema.videos.subcategory,
        title: schema.videos.title,
        description: schema.videos.description,
        videoUrl: schema.videos.videoUrl,
        thumbnailUrl: schema.videos.thumbnailUrl,
        duration: schema.videos.duration,
        fileSize: schema.videos.fileSize,
        status: schema.videos.status,
        views: schema.videos.views,
        createdAt: schema.videos.createdAt,
        updatedAt: schema.videos.updatedAt,
        voteCount: sql<number>`(
          (SELECT COALESCE(COUNT(*), 0)
           FROM ${schema.votes}
           WHERE ${schema.votes.videoId} = ${schema.videos.id})
          +
          (SELECT COALESCE(SUM(${schema.paidVotes.quantity}), 0)
           FROM ${schema.paidVotes}
           WHERE ${schema.paidVotes.videoId} = ${schema.videos.id})
        )`,
        totalJudgeScore: sql<number>`(
          SELECT COALESCE(SUM(${schema.judgeScores.creativityScore} + ${schema.judgeScores.qualityScore}), 0)
          FROM ${schema.judgeScores}
          WHERE ${schema.judgeScores.videoId} = ${schema.videos.id}
        )`,
      })
      .from(schema.videos)
      .where(and(...conditions))
      .orderBy(
        desc(sql`(
          SELECT COALESCE(SUM(${schema.judgeScores.creativityScore} + ${schema.judgeScores.qualityScore}), 0)
          FROM ${schema.judgeScores}
          WHERE ${schema.judgeScores.videoId} = ${schema.videos.id}
        )`),
        desc(sql`(
          (SELECT COALESCE(COUNT(*), 0)
           FROM ${schema.votes}
           WHERE ${schema.votes.videoId} = ${schema.videos.id})
          +
          (SELECT COALESCE(SUM(${schema.paidVotes.quantity}), 0)
           FROM ${schema.paidVotes}
           WHERE ${schema.paidVotes.videoId} = ${schema.videos.id})
        )`),
        desc(schema.videos.views)
      )
      .limit(limit);

    // Add rank to results
    const rankedVideos = videosWithScores.map((video, index) => ({
      ...video,
      rank: index + 1,
    }));

    return rankedVideos as (Video & { voteCount: number; totalJudgeScore: number; rank: number })[];
  }

  async createJudgeScore(insertScore: InsertJudgeScore): Promise<JudgeScore> {
    const [score] = await db.insert(schema.judgeScores).values(insertScore).returning();
    return score;
  }

  async getVideoJudgeScores(videoId: string): Promise<JudgeScore[]> {
    return await db.select().from(schema.judgeScores).where(eq(schema.judgeScores.videoId, videoId));
  }

  async getJudgeRoster(): Promise<JudgeProfile[]> {
    const judges = await db
      .select({
        id: schema.users.id,
        judgeName: schema.users.judgeName,
        judgeBio: schema.users.judgeBio,
        judgePhotoUrl: schema.users.judgePhotoUrl,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
      })
      .from(schema.users)
      .where(eq(schema.users.isJudge, true))
      .orderBy(sql`COALESCE(${schema.users.judgeName}, ${schema.users.lastName})`);
    
    return judges as JudgeProfile[];
  }

  async getJudgeWithStats(judgeId: string): Promise<JudgeWithStats | undefined> {
    const [judge] = await db
      .select({
        id: schema.users.id,
        judgeName: schema.users.judgeName,
        judgeBio: schema.users.judgeBio,
        judgePhotoUrl: schema.users.judgePhotoUrl,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        totalVideosScored: sql<number>`COALESCE(COUNT(${schema.judgeScores.id}), 0)`,
        averageCreativityScore: sql<number>`COALESCE(AVG(${schema.judgeScores.creativityScore}), 0)`,
        averageQualityScore: sql<number>`COALESCE(AVG(${schema.judgeScores.qualityScore}), 0)`,
      })
      .from(schema.users)
      .leftJoin(schema.judgeScores, eq(schema.users.id, schema.judgeScores.judgeId))
      .where(and(
        eq(schema.users.id, judgeId),
        eq(schema.users.isJudge, true)
      ))
      .groupBy(
        schema.users.id,
        schema.users.judgeName,
        schema.users.judgeBio,
        schema.users.judgePhotoUrl,
        schema.users.email,
        schema.users.firstName,
        schema.users.lastName
      );
    
    return judge as JudgeWithStats | undefined;
  }

  async getVideosForJudging(
    judgeId: string,
    filters?: { categoryId?: string; phaseId?: string; limit?: number }
  ): Promise<VideoForJudging[]> {
    const conditions = [
      eq(schema.videos.status, 'approved'),
      isNull(schema.judgeScores.id)  // No score from this judge
    ];
    
    if (filters?.categoryId) {
      conditions.push(eq(schema.videos.categoryId, filters.categoryId));
    }
    if (filters?.phaseId) {
      conditions.push(eq(schema.videos.phaseId, filters.phaseId));
    }

    const videos = await db
      .select({
        id: schema.videos.id,
        userId: schema.videos.userId,
        categoryId: schema.videos.categoryId,
        phaseId: schema.videos.phaseId,
        subcategory: schema.videos.subcategory,
        title: schema.videos.title,
        description: schema.videos.description,
        videoUrl: schema.videos.videoUrl,
        thumbnailUrl: schema.videos.thumbnailUrl,
        duration: schema.videos.duration,
        fileSize: schema.videos.fileSize,
        status: schema.videos.status,
        views: schema.videos.views,
        moderationStatus: schema.videos.moderationStatus,
        moderationCategories: schema.videos.moderationCategories,
        moderationReason: schema.videos.moderationReason,
        moderatedAt: schema.videos.moderatedAt,
        createdAt: schema.videos.createdAt,
        updatedAt: schema.videos.updatedAt,
        likeCount: sql<number>`(
          SELECT COALESCE(COUNT(*), 0)
          FROM ${schema.likes}
          WHERE ${schema.likes.videoId} = ${schema.videos.id}
        )`,
        voteCount: sql<number>`(
          (SELECT COALESCE(COUNT(*), 0)
           FROM ${schema.votes}
           WHERE ${schema.votes.videoId} = ${schema.videos.id})
          +
          (SELECT COALESCE(SUM(${schema.paidVotes.quantity}), 0)
           FROM ${schema.paidVotes}
           WHERE ${schema.paidVotes.videoId} = ${schema.videos.id})
        )`,
        category: {
          id: schema.categories.id,
          name: schema.categories.name,
        },
        creator: {
          id: schema.users.id,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          judgeName: schema.users.judgeName,
        },
      })
      .from(schema.videos)
      .leftJoin(
        schema.judgeScores,
        and(
          eq(schema.videos.id, schema.judgeScores.videoId),
          eq(schema.judgeScores.judgeId, judgeId)
        )
      )
      .leftJoin(schema.categories, eq(schema.videos.categoryId, schema.categories.id))
      .leftJoin(schema.users, eq(schema.videos.userId, schema.users.id))
      .where(and(...conditions))
      .orderBy(desc(schema.videos.createdAt))
      .limit(filters?.limit || 50);
    
    return videos as VideoForJudging[];
  }

  async getJudgeCompletedScores(
    judgeId: string,
    filters?: { categoryId?: string; phaseId?: string }
  ): Promise<JudgeScoreWithVideo[]> {
    const conditions = [eq(schema.judgeScores.judgeId, judgeId)];
    
    const rows = await db
      .select({
        id: schema.judgeScores.id,
        videoId: schema.judgeScores.videoId,
        judgeId: schema.judgeScores.judgeId,
        creativityScore: schema.judgeScores.creativityScore,
        qualityScore: schema.judgeScores.qualityScore,
        comments: schema.judgeScores.comments,
        createdAt: schema.judgeScores.createdAt,
        video: {
          id: schema.videos.id,
          userId: schema.videos.userId,
          categoryId: schema.videos.categoryId,
          phaseId: schema.videos.phaseId,
          subcategory: schema.videos.subcategory,
          title: schema.videos.title,
          description: schema.videos.description,
          videoUrl: schema.videos.videoUrl,
          thumbnailUrl: schema.videos.thumbnailUrl,
          duration: schema.videos.duration,
          fileSize: schema.videos.fileSize,
          status: schema.videos.status,
          views: schema.videos.views,
          moderationStatus: schema.videos.moderationStatus,
          moderationCategories: schema.videos.moderationCategories,
          moderationReason: schema.videos.moderationReason,
          moderatedAt: schema.videos.moderatedAt,
          createdAt: schema.videos.createdAt,
          updatedAt: schema.videos.updatedAt,
          category: {
            id: schema.categories.id,
            name: schema.categories.name,
          },
          creator: {
            id: schema.users.id,
            firstName: schema.users.firstName,
            lastName: schema.users.lastName,
            judgeName: schema.users.judgeName,
          },
        }
      })
      .from(schema.judgeScores)
      .innerJoin(schema.videos, eq(schema.judgeScores.videoId, schema.videos.id))
      .leftJoin(schema.categories, eq(schema.videos.categoryId, schema.categories.id))
      .leftJoin(schema.users, eq(schema.videos.userId, schema.users.id))
      .where(and(...conditions))
      .orderBy(desc(schema.judgeScores.createdAt));
    
    return rows.map(row => ({
      id: row.id,
      videoId: row.videoId,
      judgeId: row.judgeId,
      creativityScore: row.creativityScore,
      qualityScore: row.qualityScore,
      comments: row.comments,
      createdAt: row.createdAt,
      video: row.video
    })) as JudgeScoreWithVideo[];
  }

  async updateJudgeProfile(
    judgeId: string,
    updates: Partial<Pick<User, 'judgeName' | 'judgeBio' | 'judgePhotoUrl'>>
  ): Promise<User | undefined> {
    const [user] = await db
      .update(schema.users)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(schema.users.id, judgeId),
        eq(schema.users.isJudge, true)
      ))
      .returning();
    
    return user;
  }

  async getJudgeAssignmentSummary(judgeId: string): Promise<{ pendingCount: number; completedCount: number }> {
    const [pendingResult, completedResult] = await Promise.all([
      db.select({ count: sql<number>`COUNT(DISTINCT ${schema.videos.id})` })
        .from(schema.videos)
        .leftJoin(
          schema.judgeScores,
          and(
            eq(schema.videos.id, schema.judgeScores.videoId),
            eq(schema.judgeScores.judgeId, judgeId)
          )
        )
        .where(and(
          eq(schema.videos.status, 'approved'),
          isNull(schema.judgeScores.id)
        )),
      db.select({ count: sql<number>`COUNT(*)` })
        .from(schema.judgeScores)
        .where(eq(schema.judgeScores.judgeId, judgeId))
    ]);
    
    return {
      pendingCount: Number(pendingResult[0]?.count || 0),
      completedCount: Number(completedResult[0]?.count || 0)
    };
  }

  async createAffiliate(insertAffiliate: InsertAffiliate): Promise<Affiliate> {
    const [affiliate] = await db.insert(schema.affiliates).values(insertAffiliate).returning();
    return affiliate;
  }

  async getAffiliateByUserId(userId: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(schema.affiliates).where(eq(schema.affiliates.userId, userId));
    return affiliate;
  }

  async getAffiliateByReferralCode(code: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(schema.affiliates).where(eq(schema.affiliates.referralCode, code));
    return affiliate;
  }

  async updateAffiliateStats(id: string, referrals: number, earnings: number): Promise<Affiliate | undefined> {
    const [affiliate] = await db.update(schema.affiliates)
      .set({
        totalReferrals: sql`${schema.affiliates.totalReferrals} + ${referrals}`,
        totalEarnings: sql`${schema.affiliates.totalEarnings} + ${earnings}`
      })
      .where(eq(schema.affiliates.id, id))
      .returning();
    return affiliate;
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const [referral] = await db.insert(schema.referrals).values(insertReferral).returning();
    return referral;
  }

  async getAffiliateReferrals(affiliateId: string): Promise<(Referral & { registration?: Registration })[]> {
    const referrals = await db.select({
      id: schema.referrals.id,
      affiliateId: schema.referrals.affiliateId,
      registrationId: schema.referrals.registrationId,
      commission: schema.referrals.commission,
      status: schema.referrals.status,
      createdAt: schema.referrals.createdAt,
      registration: {
        id: schema.registrations.id,
        userId: schema.registrations.userId,
        categoryIds: schema.registrations.categoryIds,
        totalFee: schema.registrations.totalFee,
        paymentStatus: schema.registrations.paymentStatus,
        referralCode: schema.registrations.referralCode,
        createdAt: schema.registrations.createdAt,
      }
    })
    .from(schema.referrals)
    .leftJoin(schema.registrations, eq(schema.referrals.registrationId, schema.registrations.id))
    .where(eq(schema.referrals.affiliateId, affiliateId))
    .orderBy(desc(schema.referrals.createdAt));

    return referrals as (Referral & { registration?: Registration })[];
  }

  async getReferralsByRegistrationId(registrationId: string): Promise<Referral[]> {
    const referrals = await db.select().from(schema.referrals).where(eq(schema.referrals.registrationId, registrationId));
    return referrals;
  }

  async updateReferralStatus(id: string, status: string): Promise<Referral | undefined> {
    const [referral] = await db.update(schema.referrals)
      .set({ status })
      .where(eq(schema.referrals.id, id))
      .returning();
    return referral;
  }

  async createPayoutRequest(insertRequest: InsertPayoutRequest): Promise<PayoutRequest> {
    const [request] = await db.insert(schema.payoutRequests).values(insertRequest).returning();
    return request;
  }

  async getPayoutRequestsByAffiliate(affiliateId: string): Promise<PayoutRequest[]> {
    const requests = await db.select()
      .from(schema.payoutRequests)
      .where(eq(schema.payoutRequests.affiliateId, affiliateId))
      .orderBy(desc(schema.payoutRequests.requestedAt));
    return requests;
  }

  async getAllPayoutRequests(): Promise<PayoutRequest[]> {
    const requests = await db.select()
      .from(schema.payoutRequests)
      .orderBy(desc(schema.payoutRequests.requestedAt));
    return requests;
  }

  async updatePayoutStatus(
    id: string, 
    status: string, 
    processedBy?: string, 
    rejectionReason?: string
  ): Promise<PayoutRequest | undefined> {
    const updates: any = { 
      status,
      processedAt: new Date()
    };
    
    if (processedBy) {
      updates.processedBy = processedBy;
    }
    
    if (rejectionReason) {
      updates.rejectionReason = rejectionReason;
    }

    const [request] = await db.update(schema.payoutRequests)
      .set(updates)
      .where(eq(schema.payoutRequests.id, id))
      .returning();
    return request;
  }

  async getAffiliateAvailableBalance(affiliateId: string): Promise<number> {
    // Get the affiliate's total earnings
    const [affiliate] = await db.select()
      .from(schema.affiliates)
      .where(eq(schema.affiliates.id, affiliateId));
    
    if (!affiliate) return 0;

    // Get the sum of all approved/paid payout requests
    const result = await db.select({
      totalPaidOut: sql<number>`COALESCE(SUM(${schema.payoutRequests.amount}), 0)`
    })
    .from(schema.payoutRequests)
    .where(
      and(
        eq(schema.payoutRequests.affiliateId, affiliateId),
        sql`${schema.payoutRequests.status} IN ('approved', 'paid')`
      )
    );

    const totalPaidOut = result[0]?.totalPaidOut || 0;
    const availableBalance = affiliate.totalEarnings - totalPaidOut;
    
    return Math.max(0, availableBalance);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db.insert(schema.reports).values(insertReport).returning();
    return report;
  }

  async getAllReports(): Promise<Report[]> {
    const reports = await db.select()
      .from(schema.reports)
      .orderBy(desc(schema.reports.createdAt));
    return reports;
  }

  async getReportsByVideo(videoId: string): Promise<Report[]> {
    const reports = await db.select()
      .from(schema.reports)
      .where(eq(schema.reports.videoId, videoId))
      .orderBy(desc(schema.reports.createdAt));
    return reports;
  }

  async updateReportStatus(id: string, status: string, reviewedBy: string): Promise<Report | undefined> {
    const [report] = await db.update(schema.reports)
      .set({ 
        status,
        reviewedAt: new Date(),
        reviewedBy
      })
      .where(eq(schema.reports.id, id))
      .returning();
    return report;
  }
}

export const storage = new DbStorage();
