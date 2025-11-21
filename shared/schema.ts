import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  username: varchar("username").unique(),
  password: varchar("password"),
  googleId: varchar("google_id").unique(),
  facebookId: varchar("facebook_id").unique(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  age: integer("age"),
  location: text("location"),
  parentalConsent: boolean("parental_consent").default(false),
  isAdmin: boolean("is_admin").default(false),
  isJudge: boolean("is_judge").default(false),
  isModerator: boolean("is_moderator").default(false),
  isContentManager: boolean("is_content_manager").default(false),
  isAffiliateManager: boolean("is_affiliate_manager").default(false),
  judgeName: text("judge_name"),
  judgeBio: text("judge_bio"),
  judgePhotoUrl: text("judge_photo_url"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  suspended: boolean("suspended").default(false).notNull(),
  verificationToken: varchar("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  resetPasswordToken: varchar("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  subcategories: text("subcategories").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const phases = pgTable("phases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  number: integer("number").notNull().unique(),
  status: text("status").notNull().default('upcoming'),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const registrations = pgTable("registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  categoryIds: text("category_ids").array().notNull(),
  totalFee: integer("total_fee").notNull(),
  amountPaid: integer("amount_paid").default(0).notNull(),
  paymentStatus: text("payment_status").notNull().default('pending'),
  referralCode: text("referral_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  phaseId: varchar("phase_id").references(() => phases.id),
  subcategory: text("subcategory").notNull(),
  title: text("title").notNull(),
  slug: text("slug").unique(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration").notNull(),
  fileSize: integer("file_size").notNull(),
  status: text("status").notNull().default('pending'),
  views: integer("views").default(0).notNull(),
  moderationStatus: text("moderation_status").default('pending'),
  moderationCategories: text("moderation_categories").array(),
  moderationReason: text("moderation_reason"),
  moderatedAt: timestamp("moderated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const votes = pgTable("votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  userId: varchar("user_id").references(() => users.id),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Unique constraint: one vote per authenticated user per video
  unique("unique_vote_user").on(table.videoId, table.userId),
  // Unique constraint: one vote per IP address per video (for anonymous votes)
  unique("unique_vote_ip").on(table.videoId, table.ipAddress),
]);

export const votePurchases = pgTable("vote_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  voteCount: integer("vote_count").notNull(),
  amount: integer("amount").notNull(),
  txRef: text("tx_ref").notNull().unique(),
  flwRef: text("flw_ref").unique(),
  status: text("status").notNull().default('pending'),
  paymentData: jsonb("payment_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const paidVotes = pgTable("paid_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseId: varchar("purchase_id").notNull().references(() => votePurchases.id),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Unique constraint: one paid_votes record per purchase
  unique("unique_purchase_paid_votes").on(table.purchaseId, table.videoId),
  // Index for efficient leaderboard aggregation
  index("idx_paid_votes_video_id").on(table.videoId),
]);

export const judgeScores = pgTable("judge_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  judgeId: varchar("judge_id").notNull().references(() => users.id),
  creativityScore: integer("creativity_score").notNull(),
  qualityScore: integer("quality_score").notNull(),
  totalScore: integer("total_score").notNull(),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Unique constraint: one score per judge per video
  unique("unique_judge_video_score").on(table.videoId, table.judgeId),
]);

export const affiliates = pgTable("affiliates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  referralCode: text("referral_code").notNull().unique(),
  totalReferrals: integer("total_referrals").default(0).notNull(),
  totalEarnings: integer("total_earnings").default(0).notNull(),
  status: text("status").notNull().default('active'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => affiliates.id),
  registrationId: varchar("registration_id").notNull().references(() => registrations.id),
  commission: integer("commission").notNull(),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payoutRequests = pgTable("payout_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => affiliates.id),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default('pending'),
  paymentMethod: text("payment_method").notNull(),
  accountDetails: text("account_details").notNull(),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  processedBy: varchar("processed_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
});

export const likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  userId: varchar("user_id").references(() => users.id),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("unique_like_user").on(table.videoId, table.userId),
  unique("unique_like_ip").on(table.videoId, table.ipAddress),
  index("idx_likes_video_id").on(table.videoId),
]);

export const watchHistory = pgTable("watch_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  watchedAt: timestamp("watched_at").defaultNow().notNull(),
  watchDuration: integer("watch_duration"),
  completed: boolean("completed").default(false).notNull(),
}, (table) => [
  index("idx_watch_history_user_id").on(table.userId),
  index("idx_watch_history_video_id").on(table.videoId),
  index("idx_watch_history_watched_at").on(table.watchedAt),
]);

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  reportedBy: varchar("reported_by").references(() => users.id),
  reason: text("reason").notNull(),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
}, (table) => [
  index("idx_reports_video_id").on(table.videoId),
  index("idx_reports_status").on(table.status),
]);

export const advertisers = pgTable("advertisers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  companyName: text("company_name").notNull(),
  companyWebsite: text("company_website"),
  companyDescription: text("company_description"),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone"),
  businessType: text("business_type").notNull(),
  country: text("country").notNull(),
  logoUrl: text("logo_url"),
  status: text("status").notNull().default('pending'),
  verifiedAt: timestamp("verified_at"),
  totalSpent: integer("total_spent").default(0).notNull(),
  walletBalance: integer("wallet_balance").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adCampaigns = pgTable("ad_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id").notNull().references(() => advertisers.id),
  name: text("name").notNull(),
  objective: text("objective").notNull(),
  budget: integer("budget").notNull(),
  budgetType: text("budget_type").notNull().default('total'),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default('draft'),
  totalSpent: integer("total_spent").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_campaigns_advertiser").on(table.advertiserId),
  index("idx_campaigns_status").on(table.status),
]);

export const ads = pgTable("ads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => adCampaigns.id),
  advertiserId: varchar("advertiser_id").notNull().references(() => advertisers.id),
  adType: text("ad_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"),
  thumbnailUrl: text("thumbnail_url"),
  destinationUrl: text("destination_url").notNull(),
  ctaText: text("cta_text"),
  duration: integer("duration"),
  skipAfterSeconds: integer("skip_after_seconds"),
  targetAudience: jsonb("target_audience"),
  pricingModel: text("pricing_model").notNull(),
  bidAmount: integer("bid_amount").notNull(),
  dailyBudget: integer("daily_budget"),
  status: text("status").notNull().default('pending'),
  approvalStatus: text("approval_status").notNull().default('pending'),
  rejectionReason: text("rejection_reason"),
  totalImpressions: integer("total_impressions").default(0).notNull(),
  totalClicks: integer("total_clicks").default(0).notNull(),
  totalViews: integer("total_views").default(0).notNull(),
  totalSpent: integer("total_spent").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
}, (table) => [
  index("idx_ads_campaign").on(table.campaignId),
  index("idx_ads_advertiser").on(table.advertiserId),
  index("idx_ads_status").on(table.status),
  index("idx_ads_type").on(table.adType),
  index("idx_ads_approval").on(table.approvalStatus),
]);

export const adPayments = pgTable("ad_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id").notNull().references(() => advertisers.id),
  campaignId: varchar("campaign_id").references(() => adCampaigns.id),
  amount: integer("amount").notNull(),
  paymentType: text("payment_type").notNull(),
  txRef: text("tx_ref").notNull().unique(),
  flwRef: text("flw_ref").unique(),
  status: text("status").notNull().default('pending'),
  paymentData: jsonb("payment_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_payments_advertiser").on(table.advertiserId),
  index("idx_payments_status").on(table.status),
]);

export const adImpressions = pgTable("ad_impressions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adId: varchar("ad_id").notNull().references(() => ads.id),
  userId: varchar("user_id").references(() => users.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  country: text("country"),
  deviceType: text("device_type"),
  viewDuration: integer("view_duration"),
  wasSkipped: boolean("was_skipped").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_impressions_ad").on(table.adId),
  index("idx_impressions_created").on(table.createdAt),
]);

export const adClicks = pgTable("ad_clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adId: varchar("ad_id").notNull().references(() => ads.id),
  impressionId: varchar("impression_id").references(() => adImpressions.id),
  userId: varchar("user_id").references(() => users.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_clicks_ad").on(table.adId),
  index("idx_clicks_created").on(table.createdAt),
]);

export const cmsContent = pgTable("cms_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  section: text("section").notNull(),
  key: text("key").notNull(),
  label: text("label").notNull(),
  value: jsonb("value"),
  type: text("type").notNull().default('text'),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
}, (table) => [
  unique("unique_cms_section_key").on(table.section, table.key),
]);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertPhaseSchema = createInsertSchema(phases).omit({
  id: true,
  createdAt: true,
});

export const insertRegistrationSchema = createInsertSchema(registrations).omit({
  id: true,
  createdAt: true,
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
});

export const insertVotePurchaseSchema = createInsertSchema(votePurchases).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  flwRef: true,
  paymentData: true,
});

export const insertPaidVoteSchema = createInsertSchema(paidVotes).omit({
  id: true,
  createdAt: true,
});

export const insertJudgeScoreSchema = createInsertSchema(judgeScores).omit({
  id: true,
  createdAt: true,
});

export const insertAffiliateSchema = createInsertSchema(affiliates).omit({
  id: true,
  createdAt: true,
  totalReferrals: true,
  totalEarnings: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});

export const insertPayoutRequestSchema = createInsertSchema(payoutRequests).omit({
  id: true,
  requestedAt: true,
  processedAt: true,
  processedBy: true,
  rejectionReason: true,
});

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

export const insertWatchHistorySchema = createInsertSchema(watchHistory).omit({
  id: true,
  watchedAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  reviewedBy: true,
});

export const insertAdvertiserSchema = createInsertSchema(advertisers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalSpent: true,
  walletBalance: true,
  verifiedAt: true,
});

export const insertAdCampaignSchema = createInsertSchema(adCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalSpent: true,
});

export const insertAdSchema = createInsertSchema(ads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalImpressions: true,
  totalClicks: true,
  totalViews: true,
  totalSpent: true,
  approvedAt: true,
  approvedBy: true,
});

export const insertAdPaymentSchema = createInsertSchema(adPayments).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  flwRef: true,
  paymentData: true,
});

export const insertAdImpressionSchema = createInsertSchema(adImpressions).omit({
  id: true,
  createdAt: true,
});

export const insertAdClickSchema = createInsertSchema(adClicks).omit({
  id: true,
  createdAt: true,
});

export const insertCmsContentSchema = createInsertSchema(cmsContent).omit({
  id: true,
  updatedAt: true,
}).extend({
  value: z.any().optional(),
});

export type InsertCmsContent = z.infer<typeof insertCmsContentSchema>;
export type CmsContent = typeof cmsContent.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type SelectUser = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertPhase = z.infer<typeof insertPhaseSchema>;
export type Phase = typeof phases.$inferSelect;

export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrations.$inferSelect;

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;

// Extended video type with aggregated engagement metrics
export type VideoWithStats = Video & {
  likeCount: number;
  voteCount: number;
};

// Leaderboard entry with scoring formula
export type LeaderboardEntry = Video & {
  voteCount: number;
  likeCount: number;
  totalJudgeScore: number;
  rank: number;
  normalizedVotes: number;
  avgCreativityScore: number;
  avgQualityScore: number;
  overallScore: number;
};

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

export type InsertVotePurchase = z.infer<typeof insertVotePurchaseSchema>;
export type VotePurchase = typeof votePurchases.$inferSelect;

export type InsertPaidVote = z.infer<typeof insertPaidVoteSchema>;
export type PaidVote = typeof paidVotes.$inferSelect;

export type InsertJudgeScore = z.infer<typeof insertJudgeScoreSchema>;
export type JudgeScore = typeof judgeScores.$inferSelect;

// Judge-specific types
export type JudgeProfile = {
  id: string;
  judgeName: string | null;
  judgeBio: string | null;
  judgePhotoUrl: string | null;
  email: string;
  firstName: string;
  lastName: string;
};

export type JudgeWithStats = JudgeProfile & {
  totalVideosScored: number;
  averageCreativityScore: number;
  averageQualityScore: number;
};

export type JudgeScoreWithVideo = JudgeScore & {
  video: Video & {
    category: { id: string; name: string; } | null;
    creator: { id: string; firstName: string; lastName: string; judgeName: string | null; } | null;
  };
};

export type VideoForJudging = Video & {
  voteCount: number;
  likeCount: number;
  category: { id: string; name: string; } | null;
  creator: { id: string; firstName: string; lastName: string; judgeName: string | null; } | null;
};

export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
export type Affiliate = typeof affiliates.$inferSelect;

export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

export type InsertPayoutRequest = z.infer<typeof insertPayoutRequestSchema>;
export type PayoutRequest = typeof payoutRequests.$inferSelect;

export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;

export type InsertWatchHistory = z.infer<typeof insertWatchHistorySchema>;
export type WatchHistory = typeof watchHistory.$inferSelect;

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export type InsertAdvertiser = z.infer<typeof insertAdvertiserSchema>;
export type Advertiser = typeof advertisers.$inferSelect;

export type InsertAdCampaign = z.infer<typeof insertAdCampaignSchema>;
export type AdCampaign = typeof adCampaigns.$inferSelect;

export type InsertAd = z.infer<typeof insertAdSchema>;
export type Ad = typeof ads.$inferSelect;

export type InsertAdPayment = z.infer<typeof insertAdPaymentSchema>;
export type AdPayment = typeof adPayments.$inferSelect;

export type InsertAdImpression = z.infer<typeof insertAdImpressionSchema>;
export type AdImpression = typeof adImpressions.$inferSelect;

export type InsertAdClick = z.infer<typeof insertAdClickSchema>;
export type AdClick = typeof adClicks.$inferSelect;

export type AdWithCampaign = Ad & {
  campaign: AdCampaign | null;
};

export type AdWithStats = Ad & {
  ctr: number;
  averageViewDuration: number;
  conversionRate: number;
};

export type CampaignWithStats = AdCampaign & {
  activeAds: number;
  totalImpressions: number;
  totalClicks: number;
  totalViews: number;
  averageCtr: number;
};
