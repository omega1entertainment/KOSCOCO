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
  phone: varchar("phone").notNull(),
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
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: varchar("two_factor_secret"),
  twoFactorTempSecret: varchar("two_factor_temp_secret"),
  twoFactorBackupCodes: jsonb("two_factor_backup_codes"),
  twoFactorEnabledAt: timestamp("two_factor_enabled_at"),
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

export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  isSelectedForTop500: boolean("is_selected_for_top_500").default(false).notNull(),
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
  commissionRate: integer("commission_rate").default(20).notNull(),
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

export const affiliateCampaigns = pgTable("affiliate_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  objective: text("objective"),
  targetAudience: text("target_audience"),
  status: text("status").notNull().default('active'),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: integer("budget"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const marketingAssets = pgTable("marketing_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => affiliateCampaigns.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  downloadUrl: text("download_url"),
  previewUrl: text("preview_url"),
  dimensions: text("dimensions"),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  location: text("location"),
  country: text("country"),
  interests: text("interests").array(),
  status: text("status").notNull().default('subscribed'),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_subscribers_status").on(table.status),
  index("idx_subscribers_email").on(table.email),
]);

export const emailCampaigns = pgTable("email_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  htmlContent: text("html_content"),
  status: text("status").notNull().default('draft'),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  sentAt: timestamp("sent_at"),
  scheduledFor: timestamp("scheduled_for"),
  totalRecipients: integer("total_recipients").default(0).notNull(),
  totalSent: integer("total_sent").default(0).notNull(),
  totalOpened: integer("total_opened").default(0).notNull(),
  totalClicked: integer("total_clicked").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_email_campaigns_status").on(table.status),
  index("idx_email_campaigns_created_by").on(table.createdBy),
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
  commissionRate: true,
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

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  subscribedAt: true,
  createdAt: true,
}).extend({
  email: z.string().email("Invalid email address"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  country: z.string().optional(),
  interests: z.array(z.string()).optional(),
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentAt: true,
  totalSent: true,
  totalOpened: true,
  totalClicked: true,
});

export type InsertCmsContent = z.infer<typeof insertCmsContentSchema>;
export type CmsContent = typeof cmsContent.$inferSelect;

export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type SelectUser = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertPhase = z.infer<typeof insertPhaseSchema>;
export type Phase = typeof phases.$inferSelect;

export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type SystemSettings = typeof systemSettings.$inferSelect;

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

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'vote', 'comment', 'milestone', 'phase_achievement', 'subscription', 'system'
  title: text("title").notNull(),
  message: text("message"),
  relatedId: varchar("related_id"), // video id, registration id, etc.
  data: jsonb("data"), // Additional data like videoId, commentId, etc.
  actionUrl: text("action_url"), // Link to navigate when clicked
  read: boolean("read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_notifications_user").on(table.userId),
  index("idx_notifications_read").on(table.read),
  index("idx_notifications_created").on(table.createdAt),
]);

// Notification preferences for push, email, sms
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  emailEnabled: boolean("email_enabled").default(true).notNull(),
  pushEnabled: boolean("push_enabled").default(true).notNull(),
  smsEnabled: boolean("sms_enabled").default(false).notNull(),
  voteNotifications: boolean("vote_notifications").default(true).notNull(),
  commentNotifications: boolean("comment_notifications").default(true).notNull(),
  milestoneNotifications: boolean("milestone_notifications").default(true).notNull(),
  phaseNotifications: boolean("phase_notifications").default(true).notNull(),
  subscriptionNotifications: boolean("subscription_notifications").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({ id: true, updatedAt: true });
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;

// Activity log table
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // 'login', 'upload', 'vote', 'edit', etc.
  description: text("description"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"), // additional context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Login sessions table (for session management)
export const loginSessions = pgTable("login_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  deviceName: text("device_name"),
  deviceType: text("device_type"), // 'mobile', 'tablet', 'desktop'
  location: text("location"),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Email preferences table
export const emailPreferences = pgTable("email_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  competitionUpdates: boolean("competition_updates").default(true).notNull(),
  votingNotifications: boolean("voting_notifications").default(true).notNull(),
  newsletters: boolean("newsletters").default(true).notNull(),
  resultNotifications: boolean("result_notifications").default(true).notNull(),
  newFeatures: boolean("new_features").default(true).notNull(),
  adminMessages: boolean("admin_messages").default(true).notNull(),
  marketingEmails: boolean("marketing_emails").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User dashboard preferences table
export const dashboardPreferences = pgTable("dashboard_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  theme: text("theme").default('dark').notNull(), // 'light', 'dark'
  language: text("language").default('en').notNull(),
  favoriteWidgets: text("favorite_widgets").array(),
  widgetOrder: jsonb("widget_order"), // order of widgets on dashboard
  defaultTab: text("default_tab").default('overview').notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User account status/management table
export const accountSettings = pgTable("account_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: varchar("two_factor_secret"),
  twoFactorBackupCodes: text("two_factor_backup_codes").array(),
  accountStatus: text("account_status").default('active').notNull(), // 'active', 'deactivated', 'deleted'
  deactivatedAt: timestamp("deactivated_at"),
  deleteScheduledAt: timestamp("delete_scheduled_at"),
  connectedGoogle: boolean("connected_google").default(false).notNull(),
  connectedFacebook: boolean("connected_facebook").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Interactive polls table
export const polls = pgTable("polls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  question: text("question").notNull(),
  type: text("type").notNull(), // 'poll', 'quiz'
  timingSeconds: integer("timing_seconds").notNull(), // when to show the poll in video (seconds)
  duration: integer("duration").notNull(), // how long poll is available (seconds)
  isRequired: boolean("is_required").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Poll options/answers table
export const pollOptions = pgTable("poll_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull().references(() => polls.id),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").default(false).notNull(), // for quizzes
  order: integer("order").notNull(), // display order
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Poll responses table
export const pollResponses = pgTable("poll_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull().references(() => polls.id),
  optionId: varchar("option_id").notNull().references(() => pollOptions.id),
  userId: varchar("user_id").references(() => users.id),
  ipAddress: text("ip_address"),
  respondedAt: timestamp("responded_at").defaultNow().notNull(),
}, (table) => [
  // Unique constraint: one response per authenticated user per poll
  unique("unique_response_user").on(table.pollId, table.userId),
  // Unique constraint: one response per IP address per poll (for anonymous)
  unique("unique_response_ip").on(table.pollId, table.ipAddress),
]);

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });
export const insertLoginSessionSchema = createInsertSchema(loginSessions).omit({ id: true, createdAt: true });
export const insertEmailPreferencesSchema = createInsertSchema(emailPreferences).omit({ id: true, updatedAt: true });
export const insertDashboardPreferencesSchema = createInsertSchema(dashboardPreferences).omit({ id: true, updatedAt: true });
export const insertAccountSettingsSchema = createInsertSchema(accountSettings).omit({ id: true, updatedAt: true });

export const insertPollSchema = createInsertSchema(polls).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPollOptionSchema = createInsertSchema(pollOptions).omit({ id: true, createdAt: true });
export const insertPollResponseSchema = createInsertSchema(pollResponses).omit({ id: true, respondedAt: true });

export const insertAffiliateCampaignSchema = createInsertSchema(affiliateCampaigns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMarketingAssetSchema = createInsertSchema(marketingAssets).omit({ id: true, createdAt: true, updatedAt: true });

export const apiTracking = pgTable("api_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").references(() => affiliates.id),
  campaignId: varchar("campaign_id").references(() => affiliateCampaigns.id),
  endpoint: varchar("endpoint"),
  method: varchar("method"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  responseStatus: integer("response_status"),
  isSuspicious: boolean("is_suspicious").default(false).notNull(),
  isBot: boolean("is_bot").default(false).notNull(),
  clickCount: integer("click_count").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_api_tracking_affiliate").on(table.affiliateId),
  index("idx_api_tracking_created").on(table.createdAt),
]);

export const postbackUrls = pgTable("postback_urls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => affiliates.id),
  endpointUrl: text("endpoint_url").notNull(),
  eventType: text("event_type").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_postback_urls_affiliate").on(table.affiliateId),
]);

export const fraudAlerts = pgTable("fraud_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").references(() => affiliates.id),
  alertType: text("alert_type").notNull(),
  suspiciousPattern: varchar("suspicious_pattern"),
  ipAddress: text("ip_address"),
  clickCount: integer("click_count"),
  isResolved: boolean("is_resolved").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_fraud_alerts_created").on(table.createdAt),
]);

export const insertApiTrackingSchema = createInsertSchema(apiTracking).omit({ id: true, createdAt: true });
export const insertPostbackUrlSchema = createInsertSchema(postbackUrls).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFraudAlertSchema = createInsertSchema(fraudAlerts).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

export type InsertLoginSession = z.infer<typeof insertLoginSessionSchema>;
export type LoginSession = typeof loginSessions.$inferSelect;

export type InsertEmailPreferences = z.infer<typeof insertEmailPreferencesSchema>;
export type EmailPreferences = typeof emailPreferences.$inferSelect;

export type InsertDashboardPreferences = z.infer<typeof insertDashboardPreferencesSchema>;
export type DashboardPreferences = typeof dashboardPreferences.$inferSelect;

export type InsertAccountSettings = z.infer<typeof insertAccountSettingsSchema>;
export type AccountSettings = typeof accountSettings.$inferSelect;

export type InsertPoll = z.infer<typeof insertPollSchema>;
export type Poll = typeof polls.$inferSelect;

export type InsertPollOption = z.infer<typeof insertPollOptionSchema>;
export type PollOption = typeof pollOptions.$inferSelect;

export type InsertPollResponse = z.infer<typeof insertPollResponseSchema>;
export type PollResponse = typeof pollResponses.$inferSelect;

export type PollWithOptions = Poll & { options: PollOption[] };

export type InsertAffiliateCampaign = z.infer<typeof insertAffiliateCampaignSchema>;
export type AffiliateCampaign = typeof affiliateCampaigns.$inferSelect;

export type InsertMarketingAsset = z.infer<typeof insertMarketingAssetSchema>;
export type MarketingAsset = typeof marketingAssets.$inferSelect;

export type InsertApiTracking = z.infer<typeof insertApiTrackingSchema>;
export type ApiTracking = typeof apiTracking.$inferSelect;

export type InsertPostbackUrl = z.infer<typeof insertPostbackUrlSchema>;
export type PostbackUrl = typeof postbackUrls.$inferSelect;

export type InsertFraudAlert = z.infer<typeof insertFraudAlertSchema>;
export type FraudAlert = typeof fraudAlerts.$inferSelect;

export type PollWithStats = Poll & { 
  options: (PollOption & { responseCount: number; percentage: number })[];
  totalResponses: number;
};

// SMS Messages table for tracking sent SMS
export const smsMessages = pgTable("sms_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  to: text("to").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default('pending'),
  error: text("error"),
  providerMessageSid: text("provider_message_sid"),
  userId: varchar("user_id").references(() => users.id),
  sentBy: varchar("sent_by").references(() => users.id),
  messageType: text("message_type").notNull().default('notification'),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_sms_messages_user").on(table.userId),
  index("idx_sms_messages_status").on(table.status),
  index("idx_sms_messages_created").on(table.createdAt),
]);

export const insertSmsMessageSchema = createInsertSchema(smsMessages).omit({ 
  id: true, 
  createdAt: true,
  sentAt: true,
  deliveredAt: true,
  providerMessageSid: true,
});

export type InsertSmsMessage = z.infer<typeof insertSmsMessageSchema>;
export type SmsMessage = typeof smsMessages.$inferSelect;

// ============= WATCHLISTS & FAVORITES =============
export const watchlists = pgTable("watchlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false).notNull(),
  isDefault: boolean("is_default").default(false).notNull(), // "Watch Later" default list
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_watchlists_user").on(table.userId),
]);

export const watchlistVideos = pgTable("watchlist_videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  watchlistId: varchar("watchlist_id").notNull().references(() => watchlists.id, { onDelete: 'cascade' }),
  videoId: varchar("video_id").notNull().references(() => videos.id, { onDelete: 'cascade' }),
  addedAt: timestamp("added_at").defaultNow().notNull(),
}, (table) => [
  index("idx_watchlist_videos_watchlist").on(table.watchlistId),
  unique("unique_watchlist_video").on(table.watchlistId, table.videoId),
]);

export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  videoId: varchar("video_id").notNull().references(() => videos.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_favorites_user").on(table.userId),
  unique("unique_user_favorite").on(table.userId, table.videoId),
]);

export const insertWatchlistSchema = createInsertSchema(watchlists).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWatchlistVideoSchema = createInsertSchema(watchlistVideos).omit({ id: true, addedAt: true });
export const insertFavoriteSchema = createInsertSchema(favorites).omit({ id: true, createdAt: true });

export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type Watchlist = typeof watchlists.$inferSelect;
export type InsertWatchlistVideo = z.infer<typeof insertWatchlistVideoSchema>;
export type WatchlistVideo = typeof watchlistVideos.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

// ============= SCHEDULED PUBLISHING =============
export const scheduledVideos = pgTable("scheduled_videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: text("status").notNull().default('scheduled'), // 'scheduled', 'published', 'cancelled', 'failed'
  publishedAt: timestamp("published_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_scheduled_videos_user").on(table.userId),
  index("idx_scheduled_videos_scheduled").on(table.scheduledAt),
  index("idx_scheduled_videos_status").on(table.status),
]);

export const publishingAnalytics = pgTable("publishing_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => categories.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  hourOfDay: integer("hour_of_day").notNull(), // 0-23
  avgEngagement: integer("avg_engagement").default(0).notNull(),
  publishCount: integer("publish_count").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertScheduledVideoSchema = createInsertSchema(scheduledVideos).omit({ id: true, createdAt: true, updatedAt: true, publishedAt: true, failureReason: true });
export const insertPublishingAnalyticsSchema = createInsertSchema(publishingAnalytics).omit({ id: true, updatedAt: true });

export type InsertScheduledVideo = z.infer<typeof insertScheduledVideoSchema>;
export type ScheduledVideo = typeof scheduledVideos.$inferSelect;
export type InsertPublishingAnalytics = z.infer<typeof insertPublishingAnalyticsSchema>;
export type PublishingAnalytics = typeof publishingAnalytics.$inferSelect;

// ============= PERSONALIZED RECOMMENDATIONS =============
export const recommendationEvents = pgTable("recommendation_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  videoId: varchar("video_id").notNull().references(() => videos.id, { onDelete: 'cascade' }),
  eventType: text("event_type").notNull(), // 'watch', 'like', 'vote', 'share', 'comment', 'skip', 'not_interested'
  watchDuration: integer("watch_duration"), // in seconds
  completionRate: integer("completion_rate"), // percentage 0-100
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_recommendation_events_user").on(table.userId),
  index("idx_recommendation_events_video").on(table.videoId),
  index("idx_recommendation_events_created").on(table.createdAt),
]);

export const userRecommendations = pgTable("user_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  videoId: varchar("video_id").notNull().references(() => videos.id, { onDelete: 'cascade' }),
  score: integer("score").notNull(), // 0-100 relevance score
  reason: text("reason").notNull(), // 'similar_category', 'trending', 'watch_history', 'popular'
  shown: boolean("shown").default(false).notNull(),
  clicked: boolean("clicked").default(false).notNull(),
  dismissed: boolean("dismissed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  index("idx_user_recommendations_user").on(table.userId),
  index("idx_user_recommendations_score").on(table.score),
]);

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  preferredCategories: text("preferred_categories").array(),
  preferredSubcategories: text("preferred_subcategories").array(),
  excludedCategories: text("excluded_categories").array(),
  contentLengthPreference: text("content_length_preference"), // 'short', 'medium', 'long', 'any'
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRecommendationEventSchema = createInsertSchema(recommendationEvents).omit({ id: true, createdAt: true });
export const insertUserRecommendationSchema = createInsertSchema(userRecommendations).omit({ id: true, createdAt: true });
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, updatedAt: true });

export type InsertRecommendationEvent = z.infer<typeof insertRecommendationEventSchema>;
export type RecommendationEvent = typeof recommendationEvents.$inferSelect;
export type InsertUserRecommendation = z.infer<typeof insertUserRecommendationSchema>;
export type UserRecommendation = typeof userRecommendations.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

// Combined types for UI
export type WatchlistWithVideos = Watchlist & { videos: (WatchlistVideo & { video: Video })[] };
export type NotificationWithData = Notification & { video?: Video };
export type ScheduledVideoWithDetails = ScheduledVideo & { video: Video };

// ============= VIDEO COMMENTS =============
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_comments_video").on(table.videoId),
  index("idx_comments_user").on(table.userId),
  index("idx_comments_created").on(table.createdAt),
]);

export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true }).extend({
  content: z.string().min(1, "Comment cannot be empty").max(500, "Comment is too long"),
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type CommentWithUser = Comment & {
  user: {
    id: string;
    username: string | null;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
};
