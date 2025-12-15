# KOSCOCO Feature Matrix

## Overview
This document maps all features, pages, API routes, and database tables in the KOSCOCO application.

---

## 1. Authentication & User Management

### Pages
| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | User login with email/password, 2FA support |
| Register | `/register` | User signup with email verification OTP |
| ForgotPassword | `/forgot-password` | Password reset request |
| ResetPassword | `/reset-password` | Password reset with token |
| VerifyEmail | `/verify-email` | Email verification |
| EditProfile | `/edit-profile` | User profile editing |

### API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/user` | GET | Yes | Get current user |
| `/api/signup` | POST | No | Register new user |
| `/api/signup/verify-otp` | POST | No | Verify signup OTP |
| `/api/signup/resend-otp` | POST | No | Resend OTP |
| `/api/login` | POST | No | User login |
| `/api/login/2fa` | POST | No | 2FA verification |
| `/api/logout` | POST | Yes | User logout |
| `/api/2fa/setup` | GET | Yes | Get 2FA setup QR |
| `/api/2fa/enable` | POST | Yes | Enable 2FA |
| `/api/2fa/disable` | POST | Yes | Disable 2FA |
| `/api/2fa/status` | GET | Yes | Check 2FA status |

### Database Tables
- `users` - User accounts
- `sessions` - Session management
- `loginSessions` - Login history

---

## 2. Video Management

### Pages
| Page | Route | Description |
|------|-------|-------------|
| Upload | `/upload` | Video upload form |
| VideoPlayer | `/video/:permalink` | TikTok-style video player |
| CategoryVideos | `/category/:id` | Videos by category |
| SearchResults | `/search` | Video search results |

### API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/videos` | POST | Yes | Create video |
| `/api/videos/upload-url` | POST | Yes | Get upload URL |
| `/api/videos/upload` | POST | Yes | Upload video file |
| `/api/videos/user` | GET | Yes | Get user's videos |
| `/api/videos/feed` | GET | No | Get video feed |
| `/api/videos/search` | GET | No | Search videos |
| `/api/videos/category/:id` | GET | No | Videos by category |
| `/api/videos/:id` | GET | No | Get single video |
| `/api/videos/:id/cdn-url` | GET | No | Get CDN URL |
| `/api/videos/:id/status` | PATCH | Yes | Update video status |
| `/api/videos/:id/metadata` | PATCH | Yes | Update video metadata |
| `/api/videos/:id` | DELETE | Yes | Delete video |
| `/api/videos/pending` | GET | Yes | Get pending videos |
| `/api/videos/video-of-the-day` | GET | No | Get featured video |

### Database Tables
- `videos` - Video metadata
- `categories` - Video categories
- `watchHistory` - User watch history

---

## 3. Competition & Voting

### Pages
| Page | Route | Description |
|------|-------|-------------|
| Register | `/register` | Competition registration |
| Leaderboard | `/leaderboard` | Video rankings |
| Prizes | `/prizes` | Prize information |
| CompetitionRules | `/rules` | Competition rules |

### API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/registrations` | POST | Yes | Create registration |
| `/api/registrations/user` | GET | Yes | Get user registrations |
| `/api/registrations/status` | GET | No | Get registration status |
| `/api/payments/verify` | POST | Yes | Verify payment |
| `/api/payments/webhook` | POST | No | Payment webhook |
| `/api/votes` | POST | No | Create vote |
| `/api/votes/video/:id` | GET | No | Get vote count |
| `/api/votes/user` | GET | Yes | Get user votes |
| `/api/votes/purchase/initiate` | POST | Yes | Initiate paid vote |
| `/api/votes/purchase/callback` | POST | Yes | Paid vote callback |

### Database Tables
- `registrations` - Competition registrations
- `phases` - Competition phases
- `votes` - Free votes
- `votePurchases` - Paid vote purchases
- `paidVotes` - Paid votes

---

## 4. Likes & Comments

### API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/likes` | POST | No | Create like |
| `/api/likes` | DELETE | No | Remove like |
| `/api/likes/video/:id` | GET | No | Get like count |
| `/api/likes/user` | GET | Yes | Get user likes |
| `/api/videos/:id/comments` | GET | No | Get comments |
| `/api/videos/:id/comments` | POST | Yes | Create comment |
| `/api/comments/:id` | DELETE | Yes | Delete comment |

### Database Tables
- `likes` - Video likes
- `comments` - Video comments

---

## 5. Follow System

### API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/users/:id/follow` | POST | Yes | Follow user |
| `/api/users/:id/follow` | DELETE | Yes | Unfollow user |
| `/api/users/:id/follow-status` | GET | No | Get follow status |

### Database Tables
- `follows` - Follow relationships

---

## 6. Affiliate Program

### Pages
| Page | Route | Description |
|------|-------|-------------|
| AffiliateProgram | `/affiliate` | Affiliate info |
| AffiliateDashboard | `/affiliate/dashboard` | Affiliate dashboard |
| AffiliateLogin | `/affiliate/login` | Affiliate login |
| AffiliateTerms | `/affiliate/terms` | Affiliate terms |

### API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/affiliates` | POST | No | Register affiliate |
| `/api/affiliates/me` | GET | Yes | Get affiliate profile |
| `/api/affiliates/referrals` | GET | Yes | Get referrals |
| `/api/affiliates/payouts` | GET | Yes | Get payouts |
| `/api/affiliates/payouts` | POST | Yes | Request payout |

### Database Tables
- `affiliates` - Affiliate accounts
- `referrals` - Referral tracking
- `payoutRequests` - Payout requests
- `affiliateCampaigns` - Marketing campaigns
- `marketingAssets` - Marketing materials

---

## 7. Advertising System

### Pages
| Page | Route | Description |
|------|-------|-------------|
| Advertise | `/advertise` | Advertiser info |
| AdvertiserDashboard | `/advertiser/dashboard` | Advertiser dashboard |
| AdvertiserLogin | `/advertiser/login` | Advertiser login |
| AdvertiserSignup | `/advertiser/signup` | Advertiser registration |
| CreateAd | `/create-ad` | Create advertisement |
| CreateCampaign | `/create-campaign` | Create campaign |
| EditCampaign | `/edit-campaign/:id` | Edit campaign |

### API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/advertisers` | POST | No | Register advertiser |
| `/api/advertisers/me` | GET | Yes | Get advertiser profile |
| `/api/ads` | POST | Yes | Create ad |
| `/api/ads/serve/:type` | GET | No | Serve ads |
| `/api/ads/:id/impression` | POST | No | Track impression |
| `/api/ads/:id/click` | POST | No | Track click |
| `/api/ad-campaigns` | GET/POST | Yes | Campaign CRUD |

### Database Tables
- `advertisers` - Advertiser accounts
- `adCampaigns` - Ad campaigns
- `ads` - Advertisements
- `adImpressions` - Impression tracking
- `adClicks` - Click tracking
- `adPayments` - Ad payments

---

## 8. Judge System

### Pages
| Page | Route | Description |
|------|-------|-------------|
| Judges | `/judges` | Judge profiles |
| JudgeLogin | `/judge/login` | Judge login |
| JudgeDashboard | `/judge/dashboard` | Judge dashboard |
| JudgeProfile | `/judge/:id` | Judge profile |

### API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/judges` | GET | No | Get all judges |
| `/api/judges/:id` | GET | No | Get judge profile |
| `/api/judge/videos/pending` | GET | Judge | Get pending videos |
| `/api/judge/videos/completed` | GET | Judge | Get completed videos |
| `/api/videos/:id/score` | POST | Judge | Submit score |
| `/api/videos/:id/scores` | GET | No | Get video scores |

### Database Tables
- `judgeScores` - Judge scores

---

## 9. Admin Dashboard

### Pages
| Page | Route | Description |
|------|-------|-------------|
| AdminDashboard | `/admin` | Admin dashboard |

### API Endpoints (Admin Protected)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/users` | GET | Get all users |
| `/api/admin/users/:id/suspend` | POST | Suspend user |
| `/api/admin/users/:id/unsuspend` | POST | Unsuspend user |
| `/api/admin/videos/approved` | GET | Get approved videos |
| `/api/admin/videos/rejected` | GET | Get rejected videos |
| `/api/admin/phases/:id/activate` | POST | Activate phase |
| `/api/admin/select-top-500` | POST | Select top 500 |
| `/api/admin/registrations/toggle` | POST | Toggle registrations |
| `/api/admin/sms/send` | POST | Send SMS |
| `/api/admin/sms/bulk` | POST | Bulk SMS |
| `/api/admin/newsletter/campaigns` | GET/POST | Newsletter campaigns |

### Database Tables
- `systemSettings` - System configuration
- `smsMessages` - SMS history
- `emailCampaigns` - Email campaigns
- `newsletterSubscribers` - Newsletter subscribers

---

## 10. Creator Dashboard

### Pages
| Page | Route | Description |
|------|-------|-------------|
| CreatorDashboard | `/creator/dashboard` | Creator dashboard |
| Dashboard | `/dashboard` | User dashboard |

### API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/creator/stats` | GET | Yes | Get creator stats |
| `/api/creator/videos` | GET | Yes | Get creator videos |
| `/api/creator/profile` | GET | Yes | Get creator profile |
| `/api/creator/notifications` | GET | Yes | Get notifications |
| `/api/creator/scheduled-videos` | GET/POST | Yes | Scheduled videos |

### Database Tables
- `notifications` - User notifications
- `notificationPreferences` - Notification settings
- `scheduledVideos` - Scheduled video publishing

---

## 11. Watchlist & Favorites

### API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/watchlists` | GET/POST | Yes | Watchlist CRUD |
| `/api/watchlists/:id` | GET/PATCH/DELETE | Yes | Watchlist item |
| `/api/watchlists/:id/videos` | GET/POST | Yes | Watchlist videos |
| `/api/favorites` | GET/POST | Yes | Favorites CRUD |
| `/api/favorites/:id` | DELETE | Yes | Remove favorite |

### Database Tables
- `watchlists` - Watchlists
- `watchlistVideos` - Watchlist items
- `favorites` - Favorite videos

---

## 12. Polls & Quizzes

### API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/polls` | GET/POST | Yes | Poll CRUD |
| `/api/polls/:id` | GET/PATCH/DELETE | Yes | Poll item |
| `/api/polls/:id/respond` | POST | No | Submit response |
| `/api/polls/:id/results` | GET | No | Get results |

### Database Tables
- `polls` - Polls
- `pollOptions` - Poll options
- `pollResponses` - Poll responses

---

## 13. Static/Info Pages

### Pages
| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Homepage |
| Categories | `/categories` | Category listing |
| FAQ | `/faq` | FAQ page |
| Contact | `/contact` | Contact form |
| HowItWorks | `/how-it-works` | How it works |
| Terms | `/terms` | Terms of service |
| PrivacyPolicy | `/privacy` | Privacy policy |
| Help | `/help` | Help page |
| ThankYou | `/thank-you` | Thank you page |

---

## 14. Storage & CDN

### API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/storage/status` | GET | Admin | Check storage status |
| `/api/storage/files` | GET | Admin | List files |
| `/api/storage/upload` | POST | Admin | Upload file |
| `/api/bunny/status` | GET | No | Check BunnyCDN status |
| `/api/bunny/videos` | GET | Admin | List Bunny videos |

---

## Test Priority Matrix

### P0 (Critical Path)
1. User signup with OTP verification
2. User login with 2FA
3. Competition registration with payment
4. Video upload and approval
5. Voting (free and paid)
6. Payment webhook processing

### P1 (High Priority)
1. Like/unlike videos
2. Comments CRUD
3. Follow/unfollow creators
4. Search functionality
5. Leaderboard display
6. Admin video moderation

### P2 (Medium Priority)
1. Affiliate registration
2. Advertiser features
3. Judge scoring
4. Watchlists/favorites
5. Polls and quizzes
6. SMS/email notifications
