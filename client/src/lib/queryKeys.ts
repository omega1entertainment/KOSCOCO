/**
 * Centralized query key factory for React Query
 * Ensures consistent query keys across the entire app
 * Prevents duplicate data and enables proper cache invalidation
 */

export const queryKeys = {
  // Videos
  videos: {
    all: ["/api/videos"] as const,
    byId: (id: string) => ["/api/videos", id] as const,
    byCategory: (categoryId: string) => ["/api/videos/category", categoryId] as const,
    pending: ["/api/videos/pending"] as const,
    videoOfTheDay: ["/api/videos/video-of-the-day"] as const,
  },

  // Likes
  likes: {
    all: ["/api/likes"] as const,
    byVideo: (videoId: string) => ["/api/likes/video", videoId] as const,
    byUser: ["/api/likes/user"] as const,
  },

  // Votes
  votes: {
    all: ["/api/votes"] as const,
    byVideo: (videoId: string) => ["/api/votes/video", videoId] as const,
    byUser: ["/api/votes/user"] as const,
  },

  // Views & Watch History
  watchHistory: {
    all: ["/api/watch-history"] as const,
    creator: ["/api/creator/watch-history"] as const,
  },

  // Judge Scores
  judgeScores: {
    byVideo: (videoId: string) => ["/api/videos", videoId, "scores"] as const,
  },

  // Categories
  categories: {
    all: ["/api/categories"] as const,
    videoCounts: ["/api/categories/video-counts"] as const,
  },

  // Ads
  ads: {
    overlayServe: ["/api/ads/serve/overlay"] as const,
    skippableInStreamServe: ["/api/ads/serve/skippable_instream"] as const,
  },

  // Stats
  stats: {
    home: ["/api/stats/home"] as const,
    creator: ["/api/creator/stats"] as const,
  },

  // Creator Dashboard
  creator: {
    profile: ["/api/creator/profile"] as const,
    videos: ["/api/creator/videos"] as const,
    competitions: ["/api/creator/competitions"] as const,
    earnings: ["/api/creator/earnings"] as const,
  },

  // Admin Dashboard
  admin: {
    users: ["/api/admin/users"] as const,
    judges: ["/api/admin/judges"] as const,
    payouts: ["/api/admin/payouts"] as const,
  },

  // Auth
  auth: {
    user: ["/api/auth/user"] as const,
  },

  // Phases
  phases: {
    all: ["/api/phases"] as const,
    active: ["/api/phases/active"] as const,
  },
};
