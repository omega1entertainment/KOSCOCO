import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";
import { eq, and, desc, sql, isNull, inArray } from "drizzle-orm";
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
  WatchHistory, InsertWatchHistory,
  Report, InsertReport,
  Advertiser, InsertAdvertiser,
  AdCampaign, InsertAdCampaign, CampaignWithStats,
  Ad, InsertAd, AdWithStats,
  AdPayment, InsertAdPayment,
  AdImpression, InsertAdImpression,
  AdClick, InsertAdClick,
  CmsContent, InsertCmsContent,
  Notification, InsertNotification,
  ActivityLog, InsertActivityLog,
  LoginSession, InsertLoginSession,
  EmailPreferences, InsertEmailPreferences,
  DashboardPreferences, InsertDashboardPreferences,
  AccountSettings, InsertAccountSettings,
  Poll, InsertPoll,
  PollOption, InsertPollOption,
  PollResponse, InsertPollResponse,
  PollWithOptions, PollWithStats
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
  deleteUser(id: string): Promise<void>;
  updateUserGoogleId(id: string, googleId: string): Promise<User | undefined>;
  updateUserFacebookId(id: string, facebookId: string): Promise<User | undefined>;
  setPasswordResetToken(id: string, token: string, expires: Date): Promise<void>;
  updatePassword(id: string, password: string): Promise<void>;
  verifyUserEmail(id: string): Promise<void>;
  updateUserVerificationToken(id: string, token: string, expiry: Date): Promise<void>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, isAdmin: boolean, isJudge: boolean): Promise<User | undefined>;
  toggleUserEmailVerification(id: string, verified: boolean): Promise<User | undefined>;
  suspendUser(id: string): Promise<User | undefined>;
  activateUser(id: string): Promise<User | undefined>;
  
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  getCategoryVideoCounts(): Promise<Record<string, number>>;
  
  getAllPhases(): Promise<Phase[]>;
  getActivePhase(): Promise<Phase | undefined>;
  
  getVideoOfTheDay(): Promise<VideoWithStats | null>;
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
  deleteVideo(id: string): Promise<void>;
  getApprovedVideos(): Promise<VideoWithStats[]>;
  getRejectedVideos(): Promise<Video[]>;
  updateVideoMetadata(id: string, updates: { title?: string; description?: string; subcategory?: string }): Promise<Video | undefined>;
  
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
  
  createWatchHistory(watchHistory: InsertWatchHistory): Promise<WatchHistory>;
  getUserWatchHistory(userId: string, limit?: number): Promise<(WatchHistory & { video: Video })[]>;
  checkIfWatched(userId: string, videoId: string): Promise<boolean>;
  updateWatchHistory(id: string, updates: Partial<InsertWatchHistory>): Promise<WatchHistory | undefined>;
  
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
  
  // Advertiser methods
  getAdvertiser(id: string): Promise<Advertiser | undefined>;
  getAdvertiserByEmail(email: string): Promise<Advertiser | undefined>;
  createAdvertiser(advertiser: InsertAdvertiser): Promise<Advertiser>;
  updateAdvertiser(id: string, updates: Partial<InsertAdvertiser>): Promise<Advertiser | undefined>;
  getAllAdvertisers(): Promise<Advertiser[]>;
  updateAdvertiserStatus(id: string, status: string): Promise<Advertiser | undefined>;
  
  // Ad Campaign methods
  createAdCampaign(campaign: InsertAdCampaign): Promise<AdCampaign>;
  getAdCampaign(id: string): Promise<AdCampaign | undefined>;
  getAdvertiserCampaigns(advertiserId: string): Promise<CampaignWithStats[]>;
  updateAdCampaign(id: string, updates: Partial<InsertAdCampaign>): Promise<AdCampaign | undefined>;
  deleteCampaign(id: string): Promise<void>;
  
  // Ad methods
  createAd(ad: InsertAd): Promise<Ad>;
  getAd(id: string): Promise<Ad | undefined>;
  getAdvertiserAds(advertiserId: string): Promise<Ad[]>;
  getCampaignAds(campaignId: string): Promise<Ad[]>;
  getPendingAds(): Promise<Ad[]>;
  getApprovedAds(adType?: string): Promise<Ad[]>;
  updateAd(id: string, updates: Partial<InsertAd>): Promise<Ad | undefined>;
  approveAd(id: string, approvedBy: string): Promise<Ad | undefined>;
  rejectAd(id: string, reason: string): Promise<Ad | undefined>;
  getAdStats(adId: string): Promise<AdWithStats | undefined>;
  
  // Ad Payment methods
  createAdPayment(payment: InsertAdPayment): Promise<AdPayment>;
  getAdPaymentByTxRef(txRef: string): Promise<AdPayment | undefined>;
  updateAdPayment(id: string, updates: Partial<AdPayment>): Promise<AdPayment | undefined>;
  markAdPaymentSuccessful(id: string, flwRef: string, paymentData: any): Promise<boolean>;
  getAdvertiserPayments(advertiserId: string): Promise<AdPayment[]>;
  
  // Ad Tracking methods
  createAdImpression(impression: InsertAdImpression): Promise<AdImpression>;
  createAdClick(click: InsertAdClick): Promise<AdClick>;
  getAdImpressions(adId: string): Promise<number>;
  getAdClicks(adId: string): Promise<number>;
  getAdvertiserStats(advertiserId: string): Promise<{
    totalImpressions: number;
    totalClicks: number;
    ctr: string;
    totalSpend: number;
  }>;

  // Analytics methods
  getDashboardStats(): Promise<{
    totalUsers: number;
    totalVideos: number;
    pendingVideos: number;
    approvedVideos: number;
    totalVotes: number;
    totalRevenue: number;
    pendingPayouts: number;
    activeAdvertisers: number;
  }>;
  getVideoStats(videoId: string): Promise<{
    views: number;
    voteCount: number;
    likeCount: number;
    judgeScores: number[];
    avgJudgeScore: number;
  }>;
  getRevenueStats(): Promise<{
    totalRegistrationRevenue: number;
    totalVotingRevenue: number;
    totalAdRevenue: number;
    totalRevenue: number;
  }>;
  
  // CMS methods
  getCmsContent(section: string): Promise<CmsContent[]>;
  getCmsContentByKey(section: string, key: string): Promise<CmsContent | undefined>;
  upsertCmsContent(content: InsertCmsContent & { updatedBy: string }): Promise<CmsContent>;
  deleteCmsContent(section: string, key: string): Promise<void>;

  // Newsletter methods
  getAllNewsletterSubscribers(): Promise<schema.NewsletterSubscriber[]>;
  getActiveNewsletterSubscribers(): Promise<schema.NewsletterSubscriber[]>;
  createNewsletterSubscriber(subscriber: schema.InsertNewsletterSubscriber): Promise<schema.NewsletterSubscriber>;
  updateNewsletterSubscriber(id: string, updates: Partial<schema.InsertNewsletterSubscriber>): Promise<schema.NewsletterSubscriber | undefined>;
  deleteNewsletterSubscriber(id: string): Promise<void>;
  unsubscribeNewsletterSubscriber(email: string): Promise<schema.NewsletterSubscriber | undefined>;
  
  // Email Campaign methods
  getAllEmailCampaigns(): Promise<schema.EmailCampaign[]>;
  getEmailCampaignById(id: string): Promise<schema.EmailCampaign | undefined>;
  createEmailCampaign(campaign: schema.InsertEmailCampaign): Promise<schema.EmailCampaign>;
  updateEmailCampaign(id: string, updates: Partial<schema.InsertEmailCampaign>): Promise<schema.EmailCampaign | undefined>;
  deleteEmailCampaign(id: string): Promise<void>;
  sendEmailCampaign(id: string): Promise<schema.EmailCampaign | undefined>;
  
  // Home page stats
  getHomePageStats(): Promise<{ totalParticipants: number; videosSubmitted: number; categories: number; totalVotes: number }>;

  // Dashboard notification methods
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;

  // Activity log methods
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getUserActivityLogs(userId: string, limit?: number): Promise<ActivityLog[]>;

  // Session management methods
  createLoginSession(session: InsertLoginSession): Promise<LoginSession>;
  getUserLoginSessions(userId: string): Promise<LoginSession[]>;
  deleteLoginSession(id: string): Promise<void>;

  // Email preferences methods
  getEmailPreferences(userId: string): Promise<EmailPreferences | undefined>;
  updateEmailPreferences(userId: string, prefs: Partial<InsertEmailPreferences>): Promise<EmailPreferences | undefined>;

  // Dashboard preferences methods
  getDashboardPreferences(userId: string): Promise<DashboardPreferences | undefined>;
  updateDashboardPreferences(userId: string, prefs: Partial<InsertDashboardPreferences>): Promise<DashboardPreferences | undefined>;

  // Account settings methods
  getAccountSettings(userId: string): Promise<AccountSettings | undefined>;
  updateAccountSettings(userId: string, settings: Partial<InsertAccountSettings>): Promise<AccountSettings | undefined>;
  deactivateAccount(userId: string): Promise<void>;
  scheduleAccountDeletion(userId: string): Promise<void>;

  // Poll and quiz methods
  createPoll(poll: InsertPoll & { options: InsertPollOption[] }): Promise<PollWithOptions>;
  getPoll(id: string): Promise<PollWithOptions | undefined>;
  getVideoPollsByTiming(videoId: string): Promise<PollWithOptions[]>;
  getVideoPolls(videoId: string): Promise<PollWithOptions[]>;
  updatePoll(id: string, updates: Partial<InsertPoll>): Promise<Poll | undefined>;
  deletePoll(id: string): Promise<void>;

  // Poll option methods
  createPollOption(option: InsertPollOption): Promise<PollOption>;
  updatePollOption(id: string, updates: Partial<InsertPollOption>): Promise<PollOption | undefined>;
  deletePollOption(id: string): Promise<void>;

  // Poll response methods
  createPollResponse(response: InsertPollResponse): Promise<PollResponse>;
  getPollStats(pollId: string): Promise<PollWithStats | undefined>;
  getUserPollResponse(pollId: string, userId: string | null, ipAddress?: string): Promise<PollResponse | undefined>;
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

  async deleteUser(id: string): Promise<void> {
    await db.delete(schema.users).where(eq(schema.users.id, id));
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users).orderBy(sql`${schema.users.createdAt} DESC`);
  }

  async updateUserRole(id: string, isAdmin: boolean, isJudge: boolean): Promise<User | undefined> {
    const [user] = await db.update(schema.users).set({
      isAdmin,
      isJudge,
      updatedAt: new Date()
    }).where(eq(schema.users.id, id)).returning();
    return user;
  }

  async toggleUserEmailVerification(id: string, verified: boolean): Promise<User | undefined> {
    const [user] = await db.update(schema.users).set({
      emailVerified: verified,
      updatedAt: new Date()
    }).where(eq(schema.users.id, id)).returning();
    return user;
  }

  async suspendUser(id: string): Promise<User | undefined> {
    const [user] = await db.update(schema.users).set({
      suspended: true,
      updatedAt: new Date()
    }).where(eq(schema.users.id, id)).returning();
    return user;
  }

  async activateUser(id: string): Promise<User | undefined> {
    const [user] = await db.update(schema.users).set({
      suspended: false,
      updatedAt: new Date()
    }).where(eq(schema.users.id, id)).returning();
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
        likeCount: sql<string>`CAST((
          SELECT COALESCE(COUNT(*), 0)
          FROM likes
          WHERE likes.video_id = videos.id
        ) AS text)`,
        voteCount: sql<string>`CAST((
          (SELECT COALESCE(COUNT(*), 0)
           FROM votes
           WHERE votes.video_id = videos.id)
          +
          (SELECT COALESCE(SUM(paid_votes.quantity), 0)
           FROM paid_votes
           WHERE paid_votes.video_id = videos.id)
        ) AS text)`,
      })
      .from(schema.videos)
      .where(and(eq(schema.videos.categoryId, categoryId), eq(schema.videos.status, 'approved')))
      .orderBy(desc(schema.videos.createdAt));
    
    // Convert string aggregates to numbers
    return results.map(video => ({
      ...video,
      likeCount: parseInt(video.likeCount, 10),
      voteCount: parseInt(video.voteCount, 10),
    })) as VideoWithStats[];
  }

  async getVideoOfTheDay(): Promise<VideoWithStats | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
    
    const approvedVideos = await db
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
        likeCount: sql<string>`CAST((
          SELECT COALESCE(COUNT(*), 0)
          FROM likes
          WHERE likes.video_id = videos.id
        ) AS text)`,
        voteCount: sql<string>`CAST((
          (SELECT COALESCE(COUNT(*), 0)
           FROM votes
           WHERE votes.video_id = videos.id)
          +
          (SELECT COALESCE(SUM(paid_votes.quantity), 0)
           FROM paid_votes
           WHERE paid_votes.video_id = videos.id)
        ) AS text)`,
      })
      .from(schema.videos)
      .where(eq(schema.videos.status, 'approved'))
      .orderBy(desc(schema.videos.createdAt));
    
    if (approvedVideos.length === 0) {
      return null;
    }
    
    const selectedIndex = daysSinceEpoch % approvedVideos.length;
    const selectedVideo = approvedVideos[selectedIndex];
    
    return {
      ...selectedVideo,
      likeCount: parseInt(selectedVideo.likeCount, 10),
      voteCount: parseInt(selectedVideo.voteCount, 10),
    } as VideoWithStats;
  }

  async getCategoryVideoCounts(): Promise<Record<string, number>> {
    const result = await db
      .select({
        categoryId: schema.categories.id,
        count: sql<number>`COUNT(*)`,
      })
      .from(schema.videos)
      .innerJoin(schema.categories, eq(schema.videos.categoryId, schema.categories.id))
      .where(eq(schema.videos.status, 'approved'))
      .groupBy(schema.categories.id);
    
    const counts: Record<string, number> = {};
    
    // Get all categories to ensure each has an entry (even if 0)
    const allCategories = await db.select({ id: schema.categories.id }).from(schema.categories);
    for (const category of allCategories) {
      counts[category.id] = 0;
    }
    
    // Fill in actual counts
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

  async deleteVideo(id: string): Promise<void> {
    await db.delete(schema.videos).where(eq(schema.videos.id, id));
  }

  async getApprovedVideos(): Promise<VideoWithStats[]> {
    const videosWithVotes = await db
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
        voteCount: sql<number>`COALESCE(COUNT(DISTINCT ${schema.votes.id}), 0)`,
      })
      .from(schema.videos)
      .leftJoin(schema.votes, eq(schema.videos.id, schema.votes.videoId))
      .where(eq(schema.videos.status, 'approved'))
      .groupBy(schema.videos.id)
      .orderBy(desc(schema.videos.createdAt));

    return videosWithVotes;
  }

  async getRejectedVideos(): Promise<Video[]> {
    return await db.select().from(schema.videos)
      .where(eq(schema.videos.status, 'rejected'))
      .orderBy(desc(schema.videos.createdAt));
  }

  async updateVideoMetadata(id: string, updates: { title?: string; description?: string; subcategory?: string }): Promise<Video | undefined> {
    const [video] = await db.update(schema.videos)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.videos.id, id))
      .returning();
    return video;
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

  async createWatchHistory(insertWatchHistory: InsertWatchHistory): Promise<WatchHistory> {
    const [watchHistory] = await db.insert(schema.watchHistory).values(insertWatchHistory).returning();
    return watchHistory;
  }

  async getUserWatchHistory(userId: string, limit: number = 50): Promise<(WatchHistory & { video: Video })[]> {
    const results = await db
      .select({
        id: schema.watchHistory.id,
        userId: schema.watchHistory.userId,
        videoId: schema.watchHistory.videoId,
        watchedAt: schema.watchHistory.watchedAt,
        watchDuration: schema.watchHistory.watchDuration,
        completed: schema.watchHistory.completed,
        video: schema.videos,
      })
      .from(schema.watchHistory)
      .innerJoin(schema.videos, eq(schema.watchHistory.videoId, schema.videos.id))
      .where(eq(schema.watchHistory.userId, userId))
      .orderBy(desc(schema.watchHistory.watchedAt))
      .limit(limit);

    return results;
  }

  async checkIfWatched(userId: string, videoId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(schema.watchHistory)
      .where(
        and(
          eq(schema.watchHistory.userId, userId),
          eq(schema.watchHistory.videoId, videoId)
        )
      )
      .limit(1);
    
    return result.length > 0;
  }

  async updateWatchHistory(id: string, updates: Partial<InsertWatchHistory>): Promise<WatchHistory | undefined> {
    const [updated] = await db
      .update(schema.watchHistory)
      .set(updates)
      .where(eq(schema.watchHistory.id, id))
      .returning();
    
    return updated;
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

  async getLeaderboard(categoryId?: string, phaseId?: string, limit: number = 50): Promise<schema.LeaderboardEntry[]> {
    const conditions = [eq(schema.videos.status, 'approved')];
    if (categoryId) {
      conditions.push(eq(schema.videos.categoryId, categoryId));
    }
    if (phaseId) {
      conditions.push(eq(schema.videos.phaseId, phaseId));
    }

    // Use subqueries to aggregate votes and judge scores separately
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
        voteCount: sql<string>`CAST((
          (SELECT COALESCE(COUNT(*), 0)
           FROM votes
           WHERE votes.video_id = videos.id)
          +
          (SELECT COALESCE(SUM(paid_votes.quantity), 0)
           FROM paid_votes
           WHERE paid_votes.video_id = videos.id)
        ) AS text)`,
        likeCount: sql<string>`CAST((
          SELECT COALESCE(COUNT(*), 0)
          FROM likes
          WHERE likes.video_id = videos.id
        ) AS text)`,
        totalJudgeScore: sql<string>`CAST((
          SELECT COALESCE(SUM(judge_scores.creativity_score + judge_scores.quality_score), 0)
          FROM judge_scores
          WHERE judge_scores.video_id = videos.id
        ) AS text)`,
        avgCreativityScore: sql<string>`CAST((
          SELECT COALESCE(AVG(judge_scores.creativity_score), 0)
          FROM judge_scores
          WHERE judge_scores.video_id = videos.id
        ) AS text)`,
        avgQualityScore: sql<string>`CAST((
          SELECT COALESCE(AVG(judge_scores.quality_score), 0)
          FROM judge_scores
          WHERE judge_scores.video_id = videos.id
        ) AS text)`,
      })
      .from(schema.videos)
      .where(and(...conditions));

    // Convert string aggregates to numbers and find Vmax
    const processedVideos = videosWithScores.map(video => ({
      ...video,
      voteCount: parseInt(video.voteCount, 10),
      likeCount: parseInt(video.likeCount, 10),
      totalJudgeScore: parseFloat(video.totalJudgeScore),
      avgCreativityScore: parseFloat(video.avgCreativityScore),
      avgQualityScore: parseFloat(video.avgQualityScore),
    }));

    // Find maximum vote count (Vmax)
    const Vmax = Math.max(...processedVideos.map(v => v.voteCount), 0);

    // Calculate overall score using the formula
    const videosWithOverallScore = processedVideos.map(video => {
      // Vnorm = (V / Vmax) * 100
      const normalizedVotes = Vmax > 0 ? (video.voteCount / Vmax) * 100 : 0;
      
      // Judge scores are already 0-10, convert to 0-100 scale
      const creativityScore100 = video.avgCreativityScore * 10;
      const qualityScore100 = video.avgQualityScore * 10;
      
      // Overall = (0.60 * Vnorm) + (0.30 * C) + (0.10 * Q)
      // where C and Q are on 0-100 scale
      const overallScore = (0.60 * normalizedVotes) + (0.30 * creativityScore100) + (0.10 * qualityScore100);

      return {
        ...video,
        normalizedVotes,
        avgCreativityScore: video.avgCreativityScore, // Keep in 0-10 scale
        avgQualityScore: video.avgQualityScore, // Keep in 0-10 scale
        overallScore,
      };
    });

    // Sort by overall score (desc), then by voteCount (desc), then by views (desc)
    const sortedVideos = videosWithOverallScore.sort((a, b) => {
      if (b.overallScore !== a.overallScore) {
        return b.overallScore - a.overallScore;
      }
      if (b.voteCount !== a.voteCount) {
        return b.voteCount - a.voteCount;
      }
      return b.views - a.views;
    });

    // Apply limit and add rank
    const limitedVideos = sortedVideos.slice(0, limit);
    const rankedVideos = limitedVideos.map((video, index) => ({
      ...video,
      rank: index + 1,
    }));

    return rankedVideos as schema.LeaderboardEntry[];
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
    const [result] = await db
      .select({
        id: schema.users.id,
        judgeName: schema.users.judgeName,
        judgeBio: schema.users.judgeBio,
        judgePhotoUrl: schema.users.judgePhotoUrl,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        totalVideosScored: sql<string>`COALESCE(COUNT(${schema.judgeScores.id}), 0)`,
        averageCreativityScore: sql<string>`COALESCE(AVG(${schema.judgeScores.creativityScore}), 0)`,
        averageQualityScore: sql<string>`COALESCE(AVG(${schema.judgeScores.qualityScore}), 0)`,
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
    
    if (!result) {
      return undefined;
    }
    
    // Convert string values from PostgreSQL aggregates to numbers
    return {
      ...result,
      totalVideosScored: parseInt(result.totalVideosScored, 10),
      averageCreativityScore: parseFloat(result.averageCreativityScore),
      averageQualityScore: parseFloat(result.averageQualityScore),
    } as JudgeWithStats;
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
        // Flatten video fields
        videoId_v: schema.videos.id,
        videoUserId: schema.videos.userId,
        videoCategoryId: schema.videos.categoryId,
        videoPhaseId: schema.videos.phaseId,
        videoSubcategory: schema.videos.subcategory,
        videoTitle: schema.videos.title,
        videoDescription: schema.videos.description,
        videoUrl: schema.videos.videoUrl,
        videoThumbnailUrl: schema.videos.thumbnailUrl,
        videoDuration: schema.videos.duration,
        videoFileSize: schema.videos.fileSize,
        videoStatus: schema.videos.status,
        videoViews: schema.videos.views,
        videoModerationStatus: schema.videos.moderationStatus,
        videoModerationCategories: schema.videos.moderationCategories,
        videoModerationReason: schema.videos.moderationReason,
        videoModeratedAt: schema.videos.moderatedAt,
        videoCreatedAt: schema.videos.createdAt,
        videoUpdatedAt: schema.videos.updatedAt,
        // Category fields
        categoryId: schema.categories.id,
        categoryName: schema.categories.name,
        // Creator fields
        creatorId: schema.users.id,
        creatorFirstName: schema.users.firstName,
        creatorLastName: schema.users.lastName,
        creatorJudgeName: schema.users.judgeName,
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
      video: {
        id: row.videoId_v,
        userId: row.videoUserId,
        categoryId: row.videoCategoryId,
        phaseId: row.videoPhaseId,
        subcategory: row.videoSubcategory,
        title: row.videoTitle,
        description: row.videoDescription,
        videoUrl: row.videoUrl,
        thumbnailUrl: row.videoThumbnailUrl,
        duration: row.videoDuration,
        fileSize: row.videoFileSize,
        status: row.videoStatus,
        views: row.videoViews,
        moderationStatus: row.videoModerationStatus,
        moderationCategories: row.videoModerationCategories,
        moderationReason: row.videoModerationReason,
        moderatedAt: row.videoModeratedAt,
        createdAt: row.videoCreatedAt,
        updatedAt: row.videoUpdatedAt,
        category: {
          id: row.categoryId,
          name: row.categoryName,
        },
        creator: {
          id: row.creatorId,
          firstName: row.creatorFirstName,
          lastName: row.creatorLastName,
          judgeName: row.creatorJudgeName,
        },
      }
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

  // Advertiser methods
  async getAdvertiser(id: string): Promise<Advertiser | undefined> {
    const [advertiser] = await db.select().from(schema.advertisers).where(eq(schema.advertisers.id, id));
    return advertiser;
  }

  async getAdvertiserByEmail(email: string): Promise<Advertiser | undefined> {
    const [advertiser] = await db.select().from(schema.advertisers).where(eq(schema.advertisers.email, email));
    return advertiser;
  }

  async createAdvertiser(insertAdvertiser: InsertAdvertiser): Promise<Advertiser> {
    const [advertiser] = await db.insert(schema.advertisers).values(insertAdvertiser).returning();
    return advertiser;
  }

  async updateAdvertiser(id: string, updates: Partial<InsertAdvertiser>): Promise<Advertiser | undefined> {
    const [advertiser] = await db.update(schema.advertisers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.advertisers.id, id))
      .returning();
    return advertiser;
  }

  async getAllAdvertisers(): Promise<Advertiser[]> {
    const advertisers = await db.select()
      .from(schema.advertisers)
      .orderBy(desc(schema.advertisers.createdAt));
    return advertisers;
  }

  async updateAdvertiserStatus(id: string, status: string): Promise<Advertiser | undefined> {
    const updates: any = { status, updatedAt: new Date() };
    if (status === 'active') {
      updates.verifiedAt = new Date();
    }
    const [advertiser] = await db.update(schema.advertisers)
      .set(updates)
      .where(eq(schema.advertisers.id, id))
      .returning();
    return advertiser;
  }

  // Ad Campaign methods
  async createAdCampaign(insertCampaign: InsertAdCampaign): Promise<AdCampaign> {
    const [campaign] = await db.insert(schema.adCampaigns).values(insertCampaign).returning();
    return campaign;
  }

  async getAdCampaign(id: string): Promise<AdCampaign | undefined> {
    const [campaign] = await db.select().from(schema.adCampaigns).where(eq(schema.adCampaigns.id, id));
    return campaign;
  }

  async getAdvertiserCampaigns(advertiserId: string): Promise<CampaignWithStats[]> {
    const campaigns = await db.select({
      id: schema.adCampaigns.id,
      advertiserId: schema.adCampaigns.advertiserId,
      name: schema.adCampaigns.name,
      objective: schema.adCampaigns.objective,
      budget: schema.adCampaigns.budget,
      budgetType: schema.adCampaigns.budgetType,
      startDate: schema.adCampaigns.startDate,
      endDate: schema.adCampaigns.endDate,
      status: schema.adCampaigns.status,
      totalSpent: schema.adCampaigns.totalSpent,
      createdAt: schema.adCampaigns.createdAt,
      updatedAt: schema.adCampaigns.updatedAt,
    })
    .from(schema.adCampaigns)
    .where(eq(schema.adCampaigns.advertiserId, advertiserId))
    .orderBy(desc(schema.adCampaigns.createdAt));

    const campaignsWithStats: CampaignWithStats[] = await Promise.all(
      campaigns.map(async (campaign) => {
        const adsResult = await db.select({
          activeAds: sql<number>`COUNT(CASE WHEN ${schema.ads.status} = 'active' THEN 1 END)`,
          totalImpressions: sql<number>`COALESCE(SUM(${schema.ads.totalImpressions}), 0)`,
          totalClicks: sql<number>`COALESCE(SUM(${schema.ads.totalClicks}), 0)`,
          totalViews: sql<number>`COALESCE(SUM(${schema.ads.totalViews}), 0)`,
        })
        .from(schema.ads)
        .where(eq(schema.ads.campaignId, campaign.id));

        const stats = adsResult[0] || { activeAds: 0, totalImpressions: 0, totalClicks: 0, totalViews: 0 };
        const averageCtr = stats.totalImpressions > 0 ? (stats.totalClicks / stats.totalImpressions) * 100 : 0;

        return {
          ...campaign,
          activeAds: Number(stats.activeAds),
          totalImpressions: Number(stats.totalImpressions),
          totalClicks: Number(stats.totalClicks),
          totalViews: Number(stats.totalViews),
          averageCtr,
        };
      })
    );

    return campaignsWithStats;
  }

  async updateAdCampaign(id: string, updates: Partial<InsertAdCampaign>): Promise<AdCampaign | undefined> {
    const [campaign] = await db.update(schema.adCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.adCampaigns.id, id))
      .returning();
    return campaign;
  }

  async deleteCampaign(id: string): Promise<void> {
    const campaignAds = await db.select({ id: schema.ads.id })
      .from(schema.ads)
      .where(eq(schema.ads.campaignId, id));
    
    const adIds = campaignAds.map(ad => ad.id);
    
    if (adIds.length > 0) {
      await db.delete(schema.adClicks).where(inArray(schema.adClicks.adId, adIds));
      await db.delete(schema.adImpressions).where(inArray(schema.adImpressions.adId, adIds));
    }
    
    await db.delete(schema.adPayments).where(eq(schema.adPayments.campaignId, id));
    await db.delete(schema.ads).where(eq(schema.ads.campaignId, id));
    await db.delete(schema.adCampaigns).where(eq(schema.adCampaigns.id, id));
  }

  // Ad methods
  async createAd(insertAd: InsertAd): Promise<Ad> {
    const [ad] = await db.insert(schema.ads).values(insertAd).returning();
    return ad;
  }

  async getAd(id: string): Promise<Ad | undefined> {
    const [ad] = await db.select().from(schema.ads).where(eq(schema.ads.id, id));
    return ad;
  }

  async getAdvertiserAds(advertiserId: string): Promise<Ad[]> {
    const ads = await db.select()
      .from(schema.ads)
      .where(eq(schema.ads.advertiserId, advertiserId))
      .orderBy(desc(schema.ads.createdAt));
    return ads;
  }

  async getCampaignAds(campaignId: string): Promise<Ad[]> {
    const ads = await db.select()
      .from(schema.ads)
      .where(eq(schema.ads.campaignId, campaignId))
      .orderBy(desc(schema.ads.createdAt));
    return ads;
  }

  async getPendingAds(): Promise<Ad[]> {
    const ads = await db.select()
      .from(schema.ads)
      .where(eq(schema.ads.approvalStatus, 'pending'))
      .orderBy(desc(schema.ads.createdAt));
    return ads;
  }

  async getApprovedAds(adType?: string): Promise<Ad[]> {
    const conditions = [
      eq(schema.ads.approvalStatus, 'approved'),
      eq(schema.ads.status, 'active')
    ];
    
    if (adType) {
      conditions.push(eq(schema.ads.adType, adType));
    }

    const ads = await db.select()
      .from(schema.ads)
      .where(and(...conditions))
      .orderBy(desc(schema.ads.createdAt));
    return ads;
  }

  async updateAd(id: string, updates: Partial<InsertAd>): Promise<Ad | undefined> {
    const [ad] = await db.update(schema.ads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.ads.id, id))
      .returning();
    return ad;
  }

  async approveAd(id: string, approvedBy: string): Promise<Ad | undefined> {
    const [ad] = await db.update(schema.ads)
      .set({
        approvalStatus: 'approved',
        status: 'active',
        approvedAt: new Date(),
        approvedBy,
        updatedAt: new Date(),
      })
      .where(eq(schema.ads.id, id))
      .returning();
    return ad;
  }

  async rejectAd(id: string, reason: string): Promise<Ad | undefined> {
    const [ad] = await db.update(schema.ads)
      .set({
        approvalStatus: 'rejected',
        status: 'paused',
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(schema.ads.id, id))
      .returning();
    return ad;
  }

  async getAdStats(adId: string): Promise<AdWithStats | undefined> {
    const [ad] = await db.select().from(schema.ads).where(eq(schema.ads.id, adId));
    if (!ad) return undefined;

    const impressionsResult = await db.select({
      avgDuration: sql<number>`AVG(${schema.adImpressions.viewDuration})`,
    })
    .from(schema.adImpressions)
    .where(eq(schema.adImpressions.adId, adId));

    const ctr = ad.totalImpressions > 0 ? (ad.totalClicks / ad.totalImpressions) * 100 : 0;
    const averageViewDuration = impressionsResult[0]?.avgDuration || 0;
    const conversionRate = ad.totalViews > 0 ? (ad.totalClicks / ad.totalViews) * 100 : 0;

    return {
      ...ad,
      ctr,
      averageViewDuration: Number(averageViewDuration),
      conversionRate,
    };
  }

  // Ad Payment methods
  async createAdPayment(insertPayment: InsertAdPayment): Promise<AdPayment> {
    const [payment] = await db.insert(schema.adPayments).values(insertPayment).returning();
    return payment;
  }

  async getAdPaymentByTxRef(txRef: string): Promise<AdPayment | undefined> {
    const [payment] = await db.select().from(schema.adPayments).where(eq(schema.adPayments.txRef, txRef));
    return payment;
  }

  async updateAdPayment(id: string, updates: Partial<AdPayment>): Promise<AdPayment | undefined> {
    const [payment] = await db.update(schema.adPayments)
      .set(updates)
      .where(eq(schema.adPayments.id, id))
      .returning();
    return payment;
  }

  async markAdPaymentSuccessful(id: string, flwRef: string, paymentData: any): Promise<boolean> {
    // Atomic UPDATE WHERE status='pending' - only first concurrent request succeeds
    const result = await db.update(schema.adPayments)
      .set({
        status: 'successful',
        flwRef,
        completedAt: new Date(),
        paymentData: { data: paymentData },
      })
      .where(
        and(
          eq(schema.adPayments.id, id),
          eq(schema.adPayments.status, 'pending')
        )
      )
      .returning();
    
    // Returns true if update succeeded (payment was pending), false otherwise
    return result.length > 0;
  }

  async getAdvertiserPayments(advertiserId: string): Promise<AdPayment[]> {
    const payments = await db.select()
      .from(schema.adPayments)
      .where(eq(schema.adPayments.advertiserId, advertiserId))
      .orderBy(desc(schema.adPayments.createdAt));
    return payments;
  }

  async getAdPaymentByFlwRef(flwRef: string): Promise<AdPayment | undefined> {
    const [payment] = await db.select().from(schema.adPayments).where(eq(schema.adPayments.flwRef, flwRef));
    return payment;
  }

  async increaseAdvertiserBalance(advertiserId: string, amount: number): Promise<void> {
    await db.update(schema.advertisers)
      .set({
        walletBalance: sql`${schema.advertisers.walletBalance} + ${amount}`,
      })
      .where(eq(schema.advertisers.id, advertiserId));
  }

  async decreaseAdvertiserBalance(advertiserId: string, amount: number): Promise<boolean> {
    const result = await db.update(schema.advertisers)
      .set({
        walletBalance: sql`${schema.advertisers.walletBalance} - ${amount}`,
        totalSpent: sql`${schema.advertisers.totalSpent} + ${amount}`,
      })
      .where(
        and(
          eq(schema.advertisers.id, advertiserId),
          sql`${schema.advertisers.walletBalance} >= ${amount}`
        )
      )
      .returning();
    
    return result.length > 0;
  }

  async deductAdSpend(adId: string, campaignId: string, advertiserId: string, cost: number): Promise<boolean> {
    if (cost <= 0) return true;

    try {
      // Use transaction to ensure all updates succeed or fail together
      await db.transaction(async (tx) => {
        // Deduct from advertiser wallet and update totalSpent
        const walletResult = await tx.update(schema.advertisers)
          .set({
            walletBalance: sql`${schema.advertisers.walletBalance} - ${cost}`,
            totalSpent: sql`${schema.advertisers.totalSpent} + ${cost}`,
          })
          .where(
            and(
              eq(schema.advertisers.id, advertiserId),
              sql`${schema.advertisers.walletBalance} >= ${cost}`
            )
          )
          .returning();
        
        if (walletResult.length === 0) {
          throw new Error(`Insufficient wallet balance for advertiser ${advertiserId} to deduct ${cost} XAF`);
        }

        // Update ad totalSpent
        await tx.update(schema.ads)
          .set({
            totalSpent: sql`${schema.ads.totalSpent} + ${cost}`,
          })
          .where(eq(schema.ads.id, adId));

        // Update campaign totalSpent
        await tx.update(schema.adCampaigns)
          .set({
            totalSpent: sql`${schema.adCampaigns.totalSpent} + ${cost}`,
          })
          .where(eq(schema.adCampaigns.id, campaignId));
      });

      return true;
    } catch (error) {
      console.error(`Failed to deduct ad spend:`, error);
      return false;
    }
  }

  // Ad Tracking methods
  async createAdImpression(insertImpression: InsertAdImpression): Promise<AdImpression> {
    // Use transaction to ensure ALL operations are atomic
    // If any step fails (e.g., insufficient balance), everything rolls back including the impression record
    return await db.transaction(async (tx) => {
      // 1. Insert impression record
      const [impression] = await tx.insert(schema.adImpressions).values(insertImpression).returning();
      
      // 2. Update ad impressions and get ALL ad data atomically
      const [updatedAd] = await tx.update(schema.ads)
        .set({
          totalImpressions: sql`${schema.ads.totalImpressions} + 1`,
        })
        .where(eq(schema.ads.id, impression.adId))
        .returning();

      if (!updatedAd) {
        throw new Error(`Ad not found: ${impression.adId}`);
      }

      // 3. Calculate cost based on the UPDATED impression count and FRESH ad data
      let cost = 0;
      if (updatedAd.pricingModel === 'cpm') {
        // For CPM: Calculate exact spend based on updated impression count
        // Expected spend = floor(totalImpressions * bidAmount / 1000)
        // Charge the difference between expected and actual spend
        const expectedSpend = Math.floor((updatedAd.totalImpressions * updatedAd.bidAmount) / 1000);
        const actualSpend = updatedAd.totalSpent || 0;
        cost = Math.max(0, expectedSpend - actualSpend);
      }
      // Note: CPC charges are handled in createAdClick
      // Note: CPV (cost per view) requires actual view-complete events, not impressions
      // CPV ads do NOT charge or increment totalViews on impressions

      // 4. Deduct cost if needed, all within the same transaction
      if (cost > 0) {
        // Deduct from advertiser wallet
        const walletResult = await tx.update(schema.advertisers)
          .set({
            walletBalance: sql`${schema.advertisers.walletBalance} - ${cost}`,
            totalSpent: sql`${schema.advertisers.totalSpent} + ${cost}`,
          })
          .where(
            and(
              eq(schema.advertisers.id, updatedAd.advertiserId),
              sql`${schema.advertisers.walletBalance} >= ${cost}`
            )
          )
          .returning();
        
        if (walletResult.length === 0) {
          throw new Error(`Insufficient wallet balance for advertiser ${updatedAd.advertiserId}`);
        }

        // Update ad totalSpent
        await tx.update(schema.ads)
          .set({
            totalSpent: sql`${schema.ads.totalSpent} + ${cost}`,
          })
          .where(eq(schema.ads.id, updatedAd.id));

        // Update campaign totalSpent
        await tx.update(schema.adCampaigns)
          .set({
            totalSpent: sql`${schema.adCampaigns.totalSpent} + ${cost}`,
          })
          .where(eq(schema.adCampaigns.id, updatedAd.campaignId));
      }

      return impression;
    });
  }

  async createAdClick(insertClick: InsertAdClick): Promise<AdClick> {
    const [click] = await db.insert(schema.adClicks).values(insertClick).returning();
    
    // Get ad details to calculate cost
    const ad = await this.getAd(click.adId);
    if (ad) {
      // Update ad total clicks
      await db.update(schema.ads)
        .set({
          totalClicks: sql`${schema.ads.totalClicks} + 1`,
        })
        .where(eq(schema.ads.id, click.adId));

      // Calculate and deduct cost for CPC ads
      if (ad.pricingModel === 'cpc') {
        const cost = ad.bidAmount;
        await this.deductAdSpend(ad.id, ad.campaignId, ad.advertiserId, cost);
      }
    }

    return click;
  }

  async getAdImpressions(adId: string): Promise<number> {
    const result = await db.select({
      count: sql<number>`COUNT(*)`,
    })
    .from(schema.adImpressions)
    .where(eq(schema.adImpressions.adId, adId));
    
    return Number(result[0]?.count || 0);
  }

  async getAdClicks(adId: string): Promise<number> {
    const result = await db.select({
      count: sql<number>`COUNT(*)`,
    })
    .from(schema.adClicks)
    .where(eq(schema.adClicks.adId, adId));
    
    return Number(result[0]?.count || 0);
  }

  async getAdvertiserStats(advertiserId: string): Promise<{
    totalImpressions: number;
    totalClicks: number;
    ctr: string;
    totalSpend: number;
  }> {
    // Get all ads for this advertiser
    const ads = await db.select()
      .from(schema.ads)
      .innerJoin(schema.adCampaigns, eq(schema.ads.campaignId, schema.adCampaigns.id))
      .where(eq(schema.adCampaigns.advertiserId, advertiserId));

    // Sum up impressions and clicks
    const totalImpressions = ads.reduce((sum, ad) => sum + (ad.ads.totalImpressions || 0), 0);
    const totalClicks = ads.reduce((sum, ad) => sum + (ad.ads.totalClicks || 0), 0);

    // Calculate CTR
    const ctr = totalImpressions > 0 
      ? ((totalClicks / totalImpressions) * 100).toFixed(2)
      : '0.00';

    // Get total spend from payments
    const payments = await db.select()
      .from(schema.adPayments)
      .where(
        and(
          eq(schema.adPayments.advertiserId, advertiserId),
          eq(schema.adPayments.status, 'successful')
        )
      );

    const totalSpend = payments.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);

    return {
      totalImpressions,
      totalClicks,
      ctr,
      totalSpend,
    };
  }

  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalVideos: number;
    pendingVideos: number;
    approvedVideos: number;
    totalVotes: number;
    totalRevenue: number;
    pendingPayouts: number;
    activeAdvertisers: number;
  }> {
    const [users] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.users);
    const [videos] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.videos);
    const [pendingVids] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.videos).where(eq(schema.videos.status, 'pending'));
    const [approvedVids] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.videos).where(eq(schema.videos.status, 'approved'));
    const [votes] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.votes);
    const [pendingPay] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.payoutRequests).where(eq(schema.payoutRequests.status, 'pending'));
    const [activeAdv] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.advertisers).where(eq(schema.advertisers.status, 'active'));

    // Calculate total revenue from registrations and paid votes
    const [regRevenue] = await db.select({ 
      total: sql<number>`COALESCE(SUM(${schema.registrations.amountPaid}), 0)` 
    }).from(schema.registrations).where(eq(schema.registrations.paymentStatus, 'successful'));
    
    const [voteRevenue] = await db.select({ 
      total: sql<number>`COALESCE(SUM(${schema.votePurchases.amount}), 0)` 
    }).from(schema.votePurchases).where(eq(schema.votePurchases.status, 'successful'));

    const totalRevenue = (regRevenue.total || 0) + (voteRevenue.total || 0);

    return {
      totalUsers: users.count,
      totalVideos: videos.count,
      pendingVideos: pendingVids.count,
      approvedVideos: approvedVids.count,
      totalVotes: votes.count,
      totalRevenue,
      pendingPayouts: pendingPay.count,
      activeAdvertisers: activeAdv.count,
    };
  }

  async getVideoStats(videoId: string): Promise<{
    views: number;
    voteCount: number;
    likeCount: number;
    judgeScores: number[];
    avgJudgeScore: number;
  }> {
    const video = await this.getVideoById(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    const [voteCount] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.votes)
      .where(eq(schema.votes.videoId, videoId));

    const [likeCount] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.likes)
      .where(eq(schema.likes.videoId, videoId));

    const scores = await db.select()
      .from(schema.judgeScores)
      .where(eq(schema.judgeScores.videoId, videoId));

    const judgeScores = scores.map(s => s.totalScore);
    const avgJudgeScore = judgeScores.length > 0 
      ? judgeScores.reduce((a, b) => a + b, 0) / judgeScores.length 
      : 0;

    return {
      views: video.views,
      voteCount: voteCount.count,
      likeCount: likeCount.count,
      judgeScores,
      avgJudgeScore,
    };
  }

  async getRevenueStats(): Promise<{
    totalRegistrationRevenue: number;
    totalVotingRevenue: number;
    totalAdRevenue: number;
    totalRevenue: number;
  }> {
    const [regRevenue] = await db.select({ 
      total: sql<number>`COALESCE(SUM(${schema.registrations.amountPaid}), 0)` 
    }).from(schema.registrations).where(eq(schema.registrations.paymentStatus, 'successful'));
    
    const [voteRevenue] = await db.select({ 
      total: sql<number>`COALESCE(SUM(${schema.votePurchases.amount}), 0)` 
    }).from(schema.votePurchases).where(eq(schema.votePurchases.status, 'successful'));

    const [adRevenue] = await db.select({ 
      total: sql<number>`COALESCE(SUM(${schema.adPayments.amount}), 0)` 
    }).from(schema.adPayments).where(eq(schema.adPayments.status, 'successful'));

    const totalRegistrationRevenue = regRevenue.total || 0;
    const totalVotingRevenue = voteRevenue.total || 0;
    const totalAdRevenue = adRevenue.total || 0;
    const totalRevenue = totalRegistrationRevenue + totalVotingRevenue + totalAdRevenue;

    return {
      totalRegistrationRevenue,
      totalVotingRevenue,
      totalAdRevenue,
      totalRevenue,
    };
  }

  async getCmsContent(section: string): Promise<CmsContent[]> {
    return db.select().from(schema.cmsContent).where(eq(schema.cmsContent.section, section));
  }

  async getCmsContentByKey(section: string, key: string): Promise<CmsContent | undefined> {
    const [content] = await db.select().from(schema.cmsContent).where(
      and(eq(schema.cmsContent.section, section), eq(schema.cmsContent.key, key))
    );
    return content;
  }

  async upsertCmsContent(content: InsertCmsContent & { updatedBy: string }): Promise<CmsContent> {
    const existing = await this.getCmsContentByKey(content.section, content.key);
    if (existing) {
      const [updated] = await db.update(schema.cmsContent).set({
        ...content,
        updatedAt: new Date(),
      }).where(and(eq(schema.cmsContent.section, content.section), eq(schema.cmsContent.key, content.key))).returning();
      return updated;
    }
    const [created] = await db.insert(schema.cmsContent).values(content).returning();
    return created;
  }

  async deleteCmsContent(section: string, key: string): Promise<void> {
    await db.delete(schema.cmsContent).where(
      and(eq(schema.cmsContent.section, section), eq(schema.cmsContent.key, key))
    );
  }

  // Newsletter methods
  async getAllNewsletterSubscribers(): Promise<schema.NewsletterSubscriber[]> {
    return db.select().from(schema.newsletterSubscribers).orderBy(desc(schema.newsletterSubscribers.createdAt));
  }

  async getActiveNewsletterSubscribers(): Promise<schema.NewsletterSubscriber[]> {
    return db.select().from(schema.newsletterSubscribers)
      .where(eq(schema.newsletterSubscribers.status, 'subscribed'))
      .orderBy(desc(schema.newsletterSubscribers.createdAt));
  }

  async createNewsletterSubscriber(subscriber: schema.InsertNewsletterSubscriber): Promise<schema.NewsletterSubscriber> {
    const [created] = await db.insert(schema.newsletterSubscribers).values(subscriber).returning();
    return created;
  }

  async updateNewsletterSubscriber(id: string, updates: Partial<schema.InsertNewsletterSubscriber>): Promise<schema.NewsletterSubscriber | undefined> {
    const [updated] = await db.update(schema.newsletterSubscribers).set(updates)
      .where(eq(schema.newsletterSubscribers.id, id)).returning();
    return updated;
  }

  async deleteNewsletterSubscriber(id: string): Promise<void> {
    await db.delete(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.id, id));
  }

  async unsubscribeNewsletterSubscriber(email: string): Promise<schema.NewsletterSubscriber | undefined> {
    const [updated] = await db.update(schema.newsletterSubscribers)
      .set({ status: 'unsubscribed', unsubscribedAt: new Date() })
      .where(eq(schema.newsletterSubscribers.email, email)).returning();
    return updated;
  }

  // Email Campaign methods
  async getAllEmailCampaigns(): Promise<schema.EmailCampaign[]> {
    return db.select().from(schema.emailCampaigns).orderBy(desc(schema.emailCampaigns.createdAt));
  }

  async getEmailCampaignById(id: string): Promise<schema.EmailCampaign | undefined> {
    const [campaign] = await db.select().from(schema.emailCampaigns)
      .where(eq(schema.emailCampaigns.id, id));
    return campaign;
  }

  async createEmailCampaign(campaign: schema.InsertEmailCampaign): Promise<schema.EmailCampaign> {
    const [created] = await db.insert(schema.emailCampaigns).values(campaign).returning();
    return created;
  }

  async updateEmailCampaign(id: string, updates: Partial<schema.InsertEmailCampaign>): Promise<schema.EmailCampaign | undefined> {
    const [updated] = await db.update(schema.emailCampaigns).set({...updates, updatedAt: new Date()})
      .where(eq(schema.emailCampaigns.id, id)).returning();
    return updated;
  }

  async deleteEmailCampaign(id: string): Promise<void> {
    await db.delete(schema.emailCampaigns).where(eq(schema.emailCampaigns.id, id));
  }

  async sendEmailCampaign(id: string): Promise<schema.EmailCampaign | undefined> {
    const [campaign] = await db.update(schema.emailCampaigns)
      .set({ status: 'sent', sentAt: new Date() })
      .where(eq(schema.emailCampaigns.id, id)).returning();
    return campaign;
  }

  async getHomePageStats(): Promise<{ totalParticipants: number; videosSubmitted: number; categories: number; totalVotes: number }> {
    // Get total participants (unique users with registrations)
    const participantsResult = await db.select({ count: sql<number>`count(distinct ${schema.registrations.userId})` }).from(schema.registrations);
    const totalParticipants = participantsResult[0]?.count || 0;

    // Get videos submitted (approved videos only)
    const videosResult = await db.select({ count: sql<number>`count(*)` })
      .from(schema.videos)
      .where(eq(schema.videos.status, 'approved'));
    const videosSubmitted = videosResult[0]?.count || 0;

    // Get categories count
    const categoriesResult = await db.select({ count: sql<number>`count(*)` }).from(schema.categories);
    const categories = categoriesResult[0]?.count || 0;

    // Get total votes (sum of all votes and paid votes)
    const votesResult = await db.select({ count: sql<number>`count(*)` }).from(schema.votes);
    const paidVotesResult = await db.select({ count: sql<number>`count(*)` }).from(schema.paidVotes);
    const totalVotes = (votesResult[0]?.count || 0) + (paidVotesResult[0]?.count || 0);

    return { totalParticipants, videosSubmitted, categories, totalVotes };
  }

  // Notification methods
  async getUserNotifications(userId: string, limit = 20): Promise<Notification[]> {
    return db.select().from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.read, false)));
    return result[0]?.count || 0;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const [updated] = await db.update(schema.notifications)
      .set({ read: true, readAt: new Date() })
      .where(eq(schema.notifications.id, id)).returning();
    return updated;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(schema.notifications)
      .set({ read: true, readAt: new Date() })
      .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.read, false)));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(schema.notifications).where(eq(schema.notifications.id, id));
  }

  // Activity log methods
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [created] = await db.insert(schema.activityLogs).values(log).returning();
    return created;
  }

  async getUserActivityLogs(userId: string, limit = 50): Promise<ActivityLog[]> {
    return db.select().from(schema.activityLogs)
      .where(eq(schema.activityLogs.userId, userId))
      .orderBy(desc(schema.activityLogs.createdAt))
      .limit(limit);
  }

  // Session methods
  async createLoginSession(session: InsertLoginSession): Promise<LoginSession> {
    const [created] = await db.insert(schema.loginSessions).values(session).returning();
    return created;
  }

  async getUserLoginSessions(userId: string): Promise<LoginSession[]> {
    return db.select().from(schema.loginSessions)
      .where(eq(schema.loginSessions.userId, userId))
      .orderBy(desc(schema.loginSessions.lastActiveAt));
  }

  async deleteLoginSession(id: string): Promise<void> {
    await db.delete(schema.loginSessions).where(eq(schema.loginSessions.id, id));
  }

  // Email preferences methods
  async getEmailPreferences(userId: string): Promise<EmailPreferences | undefined> {
    const [prefs] = await db.select().from(schema.emailPreferences)
      .where(eq(schema.emailPreferences.userId, userId));
    return prefs;
  }

  async updateEmailPreferences(userId: string, prefs: Partial<InsertEmailPreferences>): Promise<EmailPreferences | undefined> {
    const [updated] = await db.update(schema.emailPreferences)
      .set({ ...prefs, updatedAt: new Date() })
      .where(eq(schema.emailPreferences.userId, userId)).returning();
    return updated;
  }

  // Dashboard preferences methods
  async getDashboardPreferences(userId: string): Promise<DashboardPreferences | undefined> {
    const [prefs] = await db.select().from(schema.dashboardPreferences)
      .where(eq(schema.dashboardPreferences.userId, userId));
    return prefs;
  }

  async updateDashboardPreferences(userId: string, prefs: Partial<InsertDashboardPreferences>): Promise<DashboardPreferences | undefined> {
    const [updated] = await db.update(schema.dashboardPreferences)
      .set({ ...prefs, updatedAt: new Date() })
      .where(eq(schema.dashboardPreferences.userId, userId)).returning();
    return updated;
  }

  // Account settings methods
  async getAccountSettings(userId: string): Promise<AccountSettings | undefined> {
    const [settings] = await db.select().from(schema.accountSettings)
      .where(eq(schema.accountSettings.userId, userId));
    return settings;
  }

  async updateAccountSettings(userId: string, settings: Partial<InsertAccountSettings>): Promise<AccountSettings | undefined> {
    const [updated] = await db.update(schema.accountSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(schema.accountSettings.userId, userId)).returning();
    return updated;
  }

  async deactivateAccount(userId: string): Promise<void> {
    await db.update(schema.accountSettings)
      .set({ accountStatus: 'deactivated', deactivatedAt: new Date() })
      .where(eq(schema.accountSettings.userId, userId));
    await db.update(schema.users).set({ suspended: true })
      .where(eq(schema.users.id, userId));
  }

  async scheduleAccountDeletion(userId: string): Promise<void> {
    await db.update(schema.accountSettings)
      .set({ deleteScheduledAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })
      .where(eq(schema.accountSettings.userId, userId));
  }

  // Poll and quiz methods
  async createPoll(pollData: InsertPoll & { options: InsertPollOption[] }): Promise<PollWithOptions> {
    const { options, ...pollInput } = pollData;
    const [poll] = await db.insert(schema.polls).values(pollInput).returning();
    const createdOptions = await Promise.all(
      options.map(opt => db.insert(schema.pollOptions).values({ ...opt, pollId: poll.id }).returning().then(result => result[0]))
    );
    return { ...poll, options: createdOptions };
  }

  async getPoll(id: string): Promise<PollWithOptions | undefined> {
    const [poll] = await db.select().from(schema.polls).where(eq(schema.polls.id, id));
    if (!poll) return undefined;
    const options = await db.select().from(schema.pollOptions).where(eq(schema.pollOptions.pollId, id));
    return { ...poll, options };
  }

  async getVideoPollsByTiming(videoId: string): Promise<PollWithOptions[]> {
    const polls = await db.select().from(schema.polls)
      .where(eq(schema.polls.videoId, videoId))
      .orderBy(schema.polls.timingSeconds);
    
    const pollsWithOptions = await Promise.all(
      polls.map(async (poll) => {
        const options = await db.select().from(schema.pollOptions)
          .where(eq(schema.pollOptions.pollId, poll.id))
          .orderBy(schema.pollOptions.order);
        return { ...poll, options };
      })
    );
    return pollsWithOptions;
  }

  async getVideoPolls(videoId: string): Promise<PollWithOptions[]> {
    return this.getVideoPollsByTiming(videoId);
  }

  async updatePoll(id: string, updates: Partial<InsertPoll>): Promise<Poll | undefined> {
    const [updated] = await db.update(schema.polls)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.polls.id, id)).returning();
    return updated;
  }

  async deletePoll(id: string): Promise<void> {
    await db.delete(schema.pollResponses).where(eq(schema.pollResponses.pollId, id));
    await db.delete(schema.pollOptions).where(eq(schema.pollOptions.pollId, id));
    await db.delete(schema.polls).where(eq(schema.polls.id, id));
  }

  async createPollOption(option: InsertPollOption): Promise<PollOption> {
    const [created] = await db.insert(schema.pollOptions).values(option).returning();
    return created;
  }

  async updatePollOption(id: string, updates: Partial<InsertPollOption>): Promise<PollOption | undefined> {
    const [updated] = await db.update(schema.pollOptions)
      .set(updates)
      .where(eq(schema.pollOptions.id, id)).returning();
    return updated;
  }

  async deletePollOption(id: string): Promise<void> {
    await db.delete(schema.pollResponses).where(eq(schema.pollResponses.optionId, id));
    await db.delete(schema.pollOptions).where(eq(schema.pollOptions.id, id));
  }

  async createPollResponse(response: InsertPollResponse): Promise<PollResponse> {
    const [created] = await db.insert(schema.pollResponses).values(response).returning();
    return created;
  }

  async getPollStats(pollId: string): Promise<PollWithStats | undefined> {
    const [poll] = await db.select().from(schema.polls).where(eq(schema.polls.id, pollId));
    if (!poll) return undefined;

    const options = await db.select().from(schema.pollOptions)
      .where(eq(schema.pollOptions.pollId, pollId))
      .orderBy(schema.pollOptions.order);

    const responses = await db.select().from(schema.pollResponses)
      .where(eq(schema.pollResponses.pollId, pollId));

    const totalResponses = responses.length;

    const optionsWithStats = options.map(option => {
      const responseCount = responses.filter(r => r.optionId === option.id).length;
      const percentage = totalResponses > 0 ? (responseCount / totalResponses) * 100 : 0;
      return { ...option, responseCount, percentage };
    });

    return { ...poll, options: optionsWithStats, totalResponses };
  }

  async getUserPollResponse(pollId: string, userId: string | null, ipAddress?: string): Promise<PollResponse | undefined> {
    if (userId) {
      const [response] = await db.select().from(schema.pollResponses)
        .where(and(eq(schema.pollResponses.pollId, pollId), eq(schema.pollResponses.userId, userId)));
      return response;
    }
    if (ipAddress) {
      const [response] = await db.select().from(schema.pollResponses)
        .where(and(eq(schema.pollResponses.pollId, pollId), eq(schema.pollResponses.ipAddress, ipAddress)));
      return response;
    }
    return undefined;
  }
}

export const storage = new DbStorage();
