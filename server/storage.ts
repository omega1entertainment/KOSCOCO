import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type {
  User, InsertUser, UpsertUser,
  Category, InsertCategory,
  Phase, InsertPhase,
  Registration, InsertRegistration,
  Video, InsertVideo,
  Vote, InsertVote,
  JudgeScore, InsertJudgeScore,
  Affiliate, InsertAffiliate,
  Referral, InsertReferral
} from "@shared/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const db = drizzle(pool, { schema });

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  getAllPhases(): Promise<Phase[]>;
  getActivePhase(): Promise<Phase | undefined>;
  createPhase(phase: InsertPhase): Promise<Phase>;
  updatePhase(id: string, updates: Partial<InsertPhase>): Promise<Phase | undefined>;
  
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  getUserRegistrations(userId: string): Promise<Registration[]>;
  getRegistrationByReferralCode(code: string): Promise<Registration[]>;
  
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
  
  createJudgeScore(score: InsertJudgeScore): Promise<JudgeScore>;
  getVideoJudgeScores(videoId: string): Promise<JudgeScore[]>;
  
  createAffiliate(affiliate: InsertAffiliate): Promise<Affiliate>;
  getAffiliateByUserId(userId: string): Promise<Affiliate | undefined>;
  getAffiliateByReferralCode(code: string): Promise<Affiliate | undefined>;
  updateAffiliateStats(id: string, referrals: number, earnings: number): Promise<Affiliate | undefined>;
  
  createReferral(referral: InsertReferral): Promise<Referral>;
  getAffiliateReferrals(affiliateId: string): Promise<Referral[]>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(schema.users)
      .values(userData)
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(schema.users).set({...updates, updatedAt: new Date()}).where(eq(schema.users.id, id)).returning();
    return user;
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

  async getRegistrationByReferralCode(code: string): Promise<Registration[]> {
    return await db.select().from(schema.registrations).where(eq(schema.registrations.referralCode, code));
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

  async getAffiliateReferrals(affiliateId: string): Promise<Referral[]> {
    return await db.select().from(schema.referrals).where(eq(schema.referrals.affiliateId, affiliateId)).orderBy(desc(schema.referrals.createdAt));
  }
}

export const storage = new DbStorage();
