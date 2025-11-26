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
  type: text("type").notNull(), // 'vote', 'upload', 'competition', 'system', 'message'
  title: text("title").notNull(),
  message: text("message"),
  relatedId: varchar("related_id"), // video id, registration id, etc.
  read: boolean("read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
export type PollWithStats = Poll & { 
  options: (PollOption & { responseCount: number; percentage: number })[];
  totalResponses: number;
};

// ============================================
// KOZZII PLATFORM EXTENSIONS
// ============================================

// Competitions framework (KOSCOCO becomes one of many competitions)
export const competitions = pgTable("competitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // KOSCOCO, MY MOM CAN DANCE, TRIBAL DANCE LEAGUE, etc.
  slug: text("slug").notNull().unique(),
  description: text("description"),
  bannerUrl: text("banner_url"),
  logoUrl: text("logo_url"),
  registrationFee: integer("registration_fee").default(0).notNull(), // in local currency
  status: text("status").notNull().default('upcoming'), // upcoming, active, completed, archived
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isDefault: boolean("is_default").default(false).notNull(), // for KOSCOCO
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Follows system for Following tab
export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  followingId: varchar("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("unique_follow").on(table.followerId, table.followingId),
  index("idx_follows_follower").on(table.followerId),
  index("idx_follows_following").on(table.followingId),
]);

// African-themed gift catalog
export const gifts = pgTable("gifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  iconUrl: text("icon_url").notNull(), // African-themed icon
  priceUsd: integer("price_usd").notNull(), // price in cents (e.g., 100 = $1.00)
  tier: text("tier").notNull().default('small'), // small, medium, large, luxury
  animationUrl: text("animation_url"), // animation file URL
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Gift transactions
export const giftTransactions = pgTable("gift_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id), // content creator
  videoId: varchar("video_id").notNull().references(() => videos.id),
  giftId: varchar("gift_id").notNull().references(() => gifts.id),
  quantity: integer("quantity").default(1).notNull(),
  amountPaidUsd: integer("amount_paid_usd").notNull(), // total amount paid in cents
  amountPaidLocal: integer("amount_paid_local").notNull(), // amount in local currency
  creatorShare: integer("creator_share").notNull(), // 65% to creator
  platformShare: integer("platform_share").notNull(), // 35% to platform
  currency: text("currency").notNull().default('XAF'),
  txRef: text("tx_ref").notNull().unique(),
  flwRef: text("flw_ref").unique(),
  status: text("status").notNull().default('pending'), // pending, completed, failed, refunded
  paymentData: jsonb("payment_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_gift_sender").on(table.senderId),
  index("idx_gift_recipient").on(table.recipientId),
  index("idx_gift_video").on(table.videoId),
  index("idx_gift_status").on(table.status),
]);

// Creator wallets
export const creatorWallets = pgTable("creator_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  totalEarnings: integer("total_earnings").default(0).notNull(), // lifetime earnings in local currency
  availableBalance: integer("available_balance").default(0).notNull(), // available for withdrawal
  pendingBalance: integer("pending_balance").default(0).notNull(), // pending verification
  totalWithdrawn: integer("total_withdrawn").default(0).notNull(),
  currency: text("currency").notNull().default('XAF'),
  lastWithdrawalAt: timestamp("last_withdrawal_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Creator wallet transactions (detailed ledger)
export const walletTransactions = pgTable("wallet_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull().references(() => creatorWallets.id),
  type: text("type").notNull(), // gift_received, withdrawal, bonus, adjustment
  amount: integer("amount").notNull(), // positive for credit, negative for debit
  balanceAfter: integer("balance_after").notNull(),
  description: text("description"),
  referenceId: varchar("reference_id"), // gift transaction id, withdrawal id, etc.
  referenceType: text("reference_type"), // gift_transaction, withdrawal_request
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_wallet_transactions_wallet").on(table.walletId),
  index("idx_wallet_transactions_type").on(table.type),
]);

// Creator withdrawal requests
export const creatorWithdrawals = pgTable("creator_withdrawals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull().references(() => creatorWallets.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default('XAF'),
  paymentMethod: text("payment_method").notNull(), // bank_transfer, mobile_money, etc.
  accountDetails: jsonb("account_details").notNull(), // bank account or mobile money details
  status: text("status").notNull().default('pending'), // pending, approved, processing, completed, rejected
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  rejectionReason: text("rejection_reason"),
  transactionRef: text("transaction_ref"), // external payment reference
}, (table) => [
  index("idx_creator_withdrawals_wallet").on(table.walletId),
  index("idx_creator_withdrawals_status").on(table.status),
]);

// Creator verification badges
export const creatorVerification = pgTable("creator_verification", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  blueTick: boolean("blue_tick").default(false).notNull(), // identity verification
  redStar: boolean("red_star").default(false).notNull(), // celebrity/milestone status
  blueTickVerifiedAt: timestamp("blue_tick_verified_at"),
  redStarGrantedAt: timestamp("red_star_granted_at"),
  followerCount: integer("follower_count").default(0).notNull(),
  canPostExclusive: boolean("can_post_exclusive").default(false).notNull(), // requires 5000+ followers or red star
  canGoLivePaid: boolean("can_go_live_paid").default(false).notNull(), // requires 500+ followers and blue tick
  verificationDocuments: jsonb("verification_documents"), // uploaded ID documents
  verificationStatus: text("verification_status").default('none'), // none, pending, verified, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Exclusive/Paid content
export const exclusiveContent = pgTable("exclusive_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().unique().references(() => videos.id),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  priceUsd: integer("price_usd").notNull(), // price in cents (10-5000 cents = $0.10-$50.00)
  previewDuration: integer("preview_duration").default(5).notNull(), // seconds of free preview
  totalPurchases: integer("total_purchases").default(0).notNull(),
  totalRevenue: integer("total_revenue").default(0).notNull(), // in local currency
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_exclusive_creator").on(table.creatorId),
]);

// Exclusive content purchases
export const exclusivePurchases = pgTable("exclusive_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  exclusiveContentId: varchar("exclusive_content_id").notNull().references(() => exclusiveContent.id),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  amountPaidUsd: integer("amount_paid_usd").notNull(),
  amountPaidLocal: integer("amount_paid_local").notNull(),
  creatorShare: integer("creator_share").notNull(), // 65%
  platformShare: integer("platform_share").notNull(), // 35%
  currency: text("currency").notNull().default('XAF'),
  txRef: text("tx_ref").notNull().unique(),
  flwRef: text("flw_ref").unique(),
  status: text("status").notNull().default('pending'),
  paymentData: jsonb("payment_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("unique_exclusive_purchase").on(table.exclusiveContentId, table.buyerId),
  index("idx_exclusive_purchases_buyer").on(table.buyerId),
]);

// User wallet for purchasing gifts/exclusive content
export const userWallets = pgTable("user_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  balance: integer("balance").default(0).notNull(), // in local currency
  totalDeposited: integer("total_deposited").default(0).notNull(),
  totalSpent: integer("total_spent").default(0).notNull(),
  currency: text("currency").notNull().default('XAF'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User wallet deposits
export const walletDeposits = pgTable("wallet_deposits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull().references(() => userWallets.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  amountUsd: integer("amount_usd").notNull(), // in cents
  amountLocal: integer("amount_local").notNull(),
  currency: text("currency").notNull().default('XAF'),
  txRef: text("tx_ref").notNull().unique(),
  flwRef: text("flw_ref").unique(),
  status: text("status").notNull().default('pending'),
  paymentData: jsonb("payment_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_wallet_deposits_wallet").on(table.walletId),
  index("idx_wallet_deposits_status").on(table.status),
]);

// Platform revenue share configuration (adjustable from backend)
export const platformConfig = pgTable("platform_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

// Affiliate campaigns
export const affiliateCampaigns = pgTable("affiliate_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  commissionPercentage: integer("commission_percentage").notNull().default(20),
  status: text("status").notNull().default('active'),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Commission tiers for affiliates
export const commissionTiers = pgTable("commission_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => affiliates.id),
  referralThreshold: integer("referral_threshold").notNull(),
  commissionPercentage: integer("commission_percentage").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Fraud detection alerts
export const fraudAlerts = pgTable("fraud_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => affiliates.id),
  alertType: text("alert_type").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull().default('medium'),
  status: text("status").notNull().default('pending'),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Affiliate performance metrics (daily snapshot)
export const affiliateMetrics = pgTable("affiliate_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => affiliates.id),
  date: timestamp("date").notNull(),
  clicks: integer("clicks").default(0).notNull(),
  conversions: integer("conversions").default(0).notNull(),
  revenue: integer("revenue").default(0).notNull(),
  ctr: text("ctr"),
  conversionRate: text("conversion_rate"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas for Affiliate tables
export const insertAffiliateCampaignSchema = createInsertSchema(affiliateCampaigns).omit({
  id: true,
  createdAt: true,
});

export const insertCommissionTierSchema = createInsertSchema(commissionTiers).omit({
  id: true,
  createdAt: true,
});

export const insertFraudAlertSchema = createInsertSchema(fraudAlerts).omit({
  id: true,
  resolvedAt: true,
  createdAt: true,
});

export const insertAffiliateMetricsSchema = createInsertSchema(affiliateMetrics).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for KOZZII tables
export const insertCompetitionSchema = createInsertSchema(competitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export const insertGiftSchema = createInsertSchema(gifts).omit({
  id: true,
  createdAt: true,
});

export const insertGiftTransactionSchema = createInsertSchema(giftTransactions).omit({
  id: true,
  createdAt: true,
  flwRef: true,
  paymentData: true,
});

export const insertCreatorWalletSchema = createInsertSchema(creatorWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertCreatorWithdrawalSchema = createInsertSchema(creatorWithdrawals).omit({
  id: true,
  requestedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  processedAt: true,
});

export const insertCreatorVerificationSchema = createInsertSchema(creatorVerification).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExclusiveContentSchema = createInsertSchema(exclusiveContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalPurchases: true,
  totalRevenue: true,
});

export const insertExclusivePurchaseSchema = createInsertSchema(exclusivePurchases).omit({
  id: true,
  createdAt: true,
  flwRef: true,
  paymentData: true,
});

export const insertUserWalletSchema = createInsertSchema(userWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletDepositSchema = createInsertSchema(walletDeposits).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  flwRef: true,
  paymentData: true,
});

export const insertPlatformConfigSchema = createInsertSchema(platformConfig).omit({
  id: true,
  updatedAt: true,
});

// KOZZII Types
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type Competition = typeof competitions.$inferSelect;

export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;

export type InsertGift = z.infer<typeof insertGiftSchema>;
export type Gift = typeof gifts.$inferSelect;

export type InsertGiftTransaction = z.infer<typeof insertGiftTransactionSchema>;
export type GiftTransaction = typeof giftTransactions.$inferSelect;

export type InsertCreatorWallet = z.infer<typeof insertCreatorWalletSchema>;
export type CreatorWallet = typeof creatorWallets.$inferSelect;

export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;

export type InsertCreatorWithdrawal = z.infer<typeof insertCreatorWithdrawalSchema>;
export type CreatorWithdrawal = typeof creatorWithdrawals.$inferSelect;

export type InsertCreatorVerification = z.infer<typeof insertCreatorVerificationSchema>;
export type CreatorVerification = typeof creatorVerification.$inferSelect;

export type InsertExclusiveContent = z.infer<typeof insertExclusiveContentSchema>;
export type ExclusiveContent = typeof exclusiveContent.$inferSelect;

export type InsertExclusivePurchase = z.infer<typeof insertExclusivePurchaseSchema>;
export type ExclusivePurchase = typeof exclusivePurchases.$inferSelect;

export type InsertUserWallet = z.infer<typeof insertUserWalletSchema>;
export type UserWallet = typeof userWallets.$inferSelect;

export type InsertWalletDeposit = z.infer<typeof insertWalletDepositSchema>;
export type WalletDeposit = typeof walletDeposits.$inferSelect;

export type InsertPlatformConfig = z.infer<typeof insertPlatformConfigSchema>;
export type PlatformConfig = typeof platformConfig.$inferSelect;

// Extended types for KOZZII
export type GiftWithDetails = Gift & {
  totalSent: number;
};

export type CreatorWalletWithStats = CreatorWallet & {
  pendingWithdrawals: number;
  recentTransactions: WalletTransaction[];
};

export type VideoFeedItem = Video & {
  likeCount: number;
  voteCount: number;
  giftCount: number;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    username: string | null;
    profileImageUrl: string | null;
    blueTick: boolean;
    redStar: boolean;
    followerCount: number;
  };
  isFollowing: boolean;
  isLiked: boolean;
  isExclusive: boolean;
  exclusivePrice?: number;
  competitionName?: string;
};

export type CreatorProfile = User & {
  followerCount: number;
  followingCount: number;
  totalVideos: number;
  totalLikes: number;
  blueTick: boolean;
  redStar: boolean;
  isFollowing: boolean;
};
