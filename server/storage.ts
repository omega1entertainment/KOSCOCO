import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type {
  User, InsertUser,
  Category, InsertCategory,
  Phase, InsertPhase,
  Registration, InsertRegistration,
  Video, InsertVideo,
  Vote, InsertVote,
  JudgeScore, InsertJudgeScore,
  Affiliate, InsertAffiliate,
  Referral, InsertReferral
} from "@shared/schema";

const httpClient = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: httpClient, schema });

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByFacebookId(facebookId: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  updateUserGoogleId(id: string, googleId: string): Promise<User | undefined>;
  updateUserFacebookId(id: string, facebookId: string): Promise<User | undefined>;
  setPasswordResetToken(id: string, token: string, expires: Date): Promise<void>;
  updatePassword(id: string, password: string): Promise<void>;
  
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
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
  getVideosByCategory(categoryId: string): Promise<Video[]>;
  getPendingVideos(): Promise<Video[]>;
  updateVideoStatus(id: string, status: string): Promise<Video | undefined>;
  incrementVideoViews(id: string): Promise<void>;
  
  createVote(vote: InsertVote): Promise<Vote>;
  getVideoVoteCount(videoId: string): Promise<number>;
  getUserVotesForVideo(userId: string | null, videoId: string, ipAddress?: string): Promise<Vote[]>;
  getUserVotes(userId: string): Promise<Vote[]>;
  getUserStats(userId: string): Promise<{ totalVideos: number; totalVotesReceived: number; totalVotesCast: number }>;
  getLeaderboard(categoryId?: string, phaseId?: string, limit?: number): Promise<(Video & { voteCount: number; totalJudgeScore: number; rank: number })[]>;
  
  createJudgeScore(score: InsertJudgeScore): Promise<JudgeScore>;
  getVideoJudgeScores(videoId: string): Promise<JudgeScore[]>;
  
  createAffiliate(affiliate: InsertAffiliate): Promise<Affiliate>;
  getAffiliateByUserId(userId: string): Promise<Affiliate | undefined>;
  getAffiliateByReferralCode(code: string): Promise<Affiliate | undefined>;
  updateAffiliateStats(id: string, referrals: number, earnings: number): Promise<Affiliate | undefined>;
  
  createReferral(referral: InsertReferral): Promise<Referral>;
  getAffiliateReferrals(affiliateId: string): Promise<Referral[]>;
  getReferralsByRegistrationId(registrationId: string): Promise<Referral[]>;
  updateReferralStatus(id: string, status: string): Promise<Referral | undefined>;
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

  async getVideosByCategory(categoryId: string): Promise<Video[]> {
    return await db.select().from(schema.videos)
      .where(and(eq(schema.videos.categoryId, categoryId), eq(schema.videos.status, 'approved')))
      .orderBy(desc(schema.videos.createdAt));
  }

  async getPendingVideos(): Promise<Video[]> {
    return await db.select().from(schema.videos).where(eq(schema.videos.status, 'pending')).orderBy(desc(schema.videos.createdAt));
  }

  async updateVideoStatus(id: string, status: string): Promise<Video | undefined> {
    const [video] = await db.update(schema.videos).set({ status, updatedAt: new Date() }).where(eq(schema.videos.id, id)).returning();
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
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(schema.votes)
      .where(eq(schema.votes.videoId, videoId));
    return result[0]?.count || 0;
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

  async getUserVotes(userId: string): Promise<Vote[]> {
    return await db.select().from(schema.votes)
      .where(eq(schema.votes.userId, userId))
      .orderBy(desc(schema.votes.createdAt));
  }

  async getUserStats(userId: string): Promise<{ totalVideos: number; totalVotesReceived: number; totalVotesCast: number }> {
    // Count total videos (all statuses)
    const videoCountResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.videos)
      .where(eq(schema.videos.userId, userId));
    const totalVideos = videoCountResult[0]?.count || 0;

    // Count total votes received (aggregate in SQL, all video statuses)
    const votesReceivedResult = await db.select({ count: sql<number>`COUNT(${schema.votes.id})` })
      .from(schema.votes)
      .innerJoin(schema.videos, eq(schema.votes.videoId, schema.videos.id))
      .where(eq(schema.videos.userId, userId));
    const totalVotesReceived = votesReceivedResult[0]?.count || 0;

    // Count total votes cast
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
          SELECT COALESCE(COUNT(*), 0)
          FROM ${schema.votes}
          WHERE ${schema.votes.videoId} = ${schema.videos.id}
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
          SELECT COALESCE(COUNT(*), 0)
          FROM ${schema.votes}
          WHERE ${schema.votes.videoId} = ${schema.videos.id}
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
}

export const storage = new DbStorage();
