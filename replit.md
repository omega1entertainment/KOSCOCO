# KOSCOCO Short Content Competition Platform

## Overview
KOSCOCO is a video competition platform for Cameroonian creators. It enables multi-category video competitions with features like user registration, moderated video uploads, public voting, phased progression, affiliate programs, and SMS messaging. The platform aims to be the leading destination for short-form content creators in Cameroon, fostering talent and offering significant cash prizes.

## User Preferences
I prefer simple language and clear, concise explanations. I want iterative development with frequent, small updates rather than large, infrequent ones. Please ask for my approval before making any major architectural changes or introducing new dependencies. I value a clean, readable codebase and prefer modern best practices.

## System Architecture
The platform is built with a modern web stack, utilizing full-stack TypeScript.

- **UI/UX Decisions**:
    - **Branding**: Primary Red (#DC2626), Secondary Black, Accent White, Featured Yellow (#FBBF24).
    - **Components**: Shadcn UI for consistent and accessible components.
    - **Theme**: Dark mode by default, with a toggle for light mode and localStorage persistence.
    - **Navigation**: `TopBar`, `NavigationHeader` (auth-aware), and `Footer` for consistent app-level navigation.
    - **Content Display**: Designed for clarity with video galleries, real-time leaderboards, and user dashboards.

- **Technical Implementations**:
    - **RESTful API**: For clear communication between frontend and backend.
    - **Video Management**: Supports specific formats, size/duration limits, and a moderation queue.
    - **Voting System**: Public voting with anti-spam, judge scoring, and Flutterwave-integrated paid voting.
    - **Affiliate Program**: Opt-in system with unique referral links, 20% commission tracking, and comprehensive payout workflow. Supports integrated account creation for affiliates. Referral codes preserved across login redirects using sessionStorage.
    - **Competition Structure**: Seven distinct phases (e.g., TOP 500, TOP 100), managed by admin controls to ensure one active phase.
    - **Automatic Top 500 Selection**: Videos automatically selected per category based on likes, triggered by admin.
    - **Dashboards**: 
      - **Admin Dashboard Overview**: Central stats display showing Total Users, Total Videos, Total Views, Suspended Users, and Unverified Emails
      - Separate user and admin dashboards for statistics, moderation, phase management, advertiser approval, and user management.
    - **Email Verification**: Comprehensive system using Resend.
    - **Advertising System**: MVP supports Skippable In-Stream Video and Overlay Banner ads, including advertiser account approval, ad creation, serving, and tracking.
    - **Watch History**: Tracks user video watch duration and completion, displayed in a dashboard.
    - **Picture-in-Picture**: Video player supports PiP mode.
    - **Video of the Day**: Daily featured video on the homepage, selected based on the previous day's highest views.
    - **Newsletter System**: WYSIWYG email campaign creation, subscriber management, and automated welcome emails.
    - **FAQ System**: Bilingual (English/French) FAQ page with categorized questions.
    - **Interactive Polls and Quizzes**: Embedded within videos for engagement, with timing control, duration settings, and creator management tools. Supports anonymous or authenticated responses.
    - **SMS Messaging System**: Admin-only SMS messaging via Twilio with complete management interface. Features include:
      - Direct SMS sending to phone numbers
      - Pre-built templates (welcome, reminder, thankYou, phaseUpdate)
      - Message history with delivery status tracking
      - Real-time analytics (total, sent, failed, success rate)
      - Retry failed messages with one-click
      - Filter messages by date range, status, and type
      - Full message logging in database with timestamps

## External Dependencies
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Object Storage**: Replit Object Storage
- **CDN/Video Streaming**: BunnyCDN Stream (optional, enhances video delivery)
- **Authentication**: Passport.js, bcrypt
- **Payment Gateway**: Flutterwave
- **Email Service**: Resend
- **SMS Service**: Twilio
- **Frontend Libraries**: React, Tailwind CSS, Shadcn UI, Wouter, react-hook-form, Zod
- **Backend Libraries**: Express.js, Node.js
- **Fonts**: Bebas Neue, Play, Inter

## Recent Changes (December 13, 2025)

**Video Upload Migration to Bunny Storage (In Progress)**
- Modified `/api/videos/upload-url` to detect Bunny Storage configuration and return appropriate paths
- Modified `/api/videos/upload` to upload videos and thumbnails to Bunny Storage when configured
- Modified `/api/videos` to:
  - Detect Bunny paths using `isBunnyPath()` function (checks for `/videos/` or `/thumbnails/` prefix)
  - Skip GCS ACL policies for Bunny paths
  - Download from Bunny Storage for moderation
  - Pass `useBunny` flag to compression function
- Updated `server/videoCompression.ts`:
  - Added `useBunny` parameter to `compressVideo()` and `compressVideoInBackground()`
  - Download from Bunny Storage when `useBunny` is true
  - Upload compressed videos to Bunny Storage when `useBunny` is true
- Updated `client/src/pages/Upload.tsx` to pass `storageType` field from upload-url response to upload endpoint
- Backward compatible: Falls back to GCS/Replit Object Storage when Bunny is not configured
- Still needed: Update video streaming/playback to serve from Bunny CDN URLs

**Bunny Storage Integration for File Storage (Completed)**
- Installed `bunnycdn-storage` package for Bunny Storage API integration
- Created `server/bunnyStorageService.ts` with:
  - Storage client initialization with region support
  - File upload (buffer-based)
  - File download and deletion
  - Directory listing
  - CDN URL generation for public access
- Added API endpoints (admin-only):
  - `GET /api/storage/status` - Check if Bunny Storage is configured
  - `GET /api/storage/files` - List files in a directory
  - `POST /api/storage/upload` - Upload file with form data
  - `GET /api/storage/download/*` - Download file
  - `DELETE /api/storage/files/*` - Delete file
  - `GET /api/storage/cdn-url/*` - Get CDN URL for a file
- Environment variables required:
  - `BUNNY_STORAGE_API_KEY` - Storage zone password/API key
  - `BUNNY_STORAGE_ZONE` - Storage zone name
  - `BUNNY_STORAGE_REGION` - Region code (de, ny, la, sg, etc.) - optional, defaults to 'de'
  - `BUNNY_STORAGE_CDN_URL` - (Optional) CDN URL for public access

**File Storage Management UI (Completed)**
- Created `client/src/components/FileStorageManagement.tsx`:
  - Browse files and folders with table view
  - Navigate directories with back button and path display
  - Upload files to any path with dialog
  - Delete files with confirmation dialog
  - Copy CDN URLs to clipboard
  - Download files directly
  - Proper path handling for Bunny Storage API compatibility
- Added "Storage" tab to Admin Dashboard for file management

**BunnyCDN Integration for Video Streaming (Completed)**
- Installed `bunnycdn-stream` package for BunnyCDN Stream API integration
- Created `server/bunnyCdnService.ts` with:
  - Stream API client initialization
  - Video upload (buffer and URL-based)
  - Video info retrieval, deletion, and listing
  - CDN URL generation (embed, HLS, thumbnail)
  - Pull zone URL transformation (preserves signed URL query parameters)
- Added API endpoints (admin-only):
  - `GET /api/bunny/status` - Check if BunnyCDN is configured
  - `GET /api/bunny/videos` - List videos from BunnyCDN library
  - `GET /api/bunny/videos/:id` - Get video info
  - `POST /api/bunny/upload` - Upload video to BunnyCDN from URL
  - `DELETE /api/bunny/videos/:id` - Delete video
  - `GET /api/bunny/urls/:videoId` - Get embed/HLS/thumbnail URLs
- Updated existing CDN URL endpoints to use BunnyCDN pull zone when configured
- Environment variables required:
  - `BUNNY_STREAM_API_KEY` - Stream API key
  - `BUNNY_VIDEO_LIBRARY_ID` - Video library ID
  - `BUNNY_CDN_HOSTNAME` - CDN hostname (e.g., vz-xxx.b-cdn.net)
  - `BUNNY_PULL_ZONE_URL` - (Optional) Pull zone URL for caching

## Recent Changes (December 5, 2025)

**Creator Follow Feature (Completed)**
- Added follows table to database with followerId, followingId, unique constraint, and indexes
- Storage methods: followUser, unfollowUser, isFollowing, getFollowersCount, getFollowingCount
- API endpoints:
  - `POST /api/users/:userId/follow` - Follow a creator (auth required)
  - `DELETE /api/users/:userId/follow` - Unfollow a creator (auth required)
  - `GET /api/users/:userId/follow-status` - Get follow status and follower count
- UI integration in TikTok-style video player:
  - Follow button with UserPlus icon next to creator info
  - Follower count display
  - Auth-gated follow/unfollow actions
  - Per-creator follow state tracking

**Video Comments Feature (Completed)**
- Added comments table to database with videoId, userId, content, and createdAt fields
- Storage methods: createComment, getVideoComments (with pagination), getCommentCount, deleteComment
- API endpoints:
  - `GET /api/videos/:videoId/comments` - Fetch comments with pagination (limit, offset)
  - `POST /api/videos/:videoId/comments` - Create comment (auth required)
  - `DELETE /api/comments/:id` - Delete comment (admin only)
- UI integration in TikTok-style video player:
  - Comment button with count in action bar (right side)
  - Sliding comments panel from bottom
  - Real-time comment posting with auth gate
  - User avatars and display names
  - Timestamp display with relative formatting
  - Optimistic updates on comment submission

## Recent Changes (December 4, 2025)

**Email OTP Verification for Signup (Completed)**
- Implemented mandatory email OTP verification during signup flow
- Added OTP generation and email sending functions to emailService.ts:
  - `generateOTP()` - Generates 6-digit numeric codes
  - `getOTPExpiry()` - Sets 10-minute expiry for codes
  - `sendOTPEmail()` - Sends branded verification email via Resend
- Modified signup flow in auth.ts:
  - `/api/signup` - Validates form, stores pending signup in session, sends OTP email, returns `{requiresOTP: true}`
  - `/api/signup/verify-otp` - Validates OTP code, creates user account on success, auto-logs in user
  - `/api/signup/resend-otp` - Generates and sends new OTP code
- Frontend OTP verification dialog in Login.tsx:
  - Shows after initial signup form submission
  - 6-digit code input with monospace styling
  - Resend code functionality
  - 10-minute expiry notice
- Security: User accounts are only created after successful email verification

## Recent Changes (December 1, 2025)

**Two-Factor Authentication (2FA) Implementation (Completed)**
- Implemented TOTP-based 2FA using otplib, compatible with Google Authenticator, Authy, etc.
- Database fields added to users table: twoFactorEnabled, twoFactorSecret, twoFactorTempSecret, twoFactorBackupCodes, twoFactorEnabledAt
- Backend service (server/twoFactorService.ts) for TOTP generation, verification, and backup code management
- API Endpoints:
  - `/api/2fa/setup` - Generate QR code and secret for setup
  - `/api/2fa/enable` - Verify code and activate 2FA
  - `/api/2fa/disable` - Disable 2FA with password and code verification
  - `/api/2fa/backup/regenerate` - Generate new backup codes
  - `/api/2fa/status` - Check if 2FA is enabled
  - `/api/login/2fa` - Verify 2FA code during login (session-based)
- Login flow updated to show 2FA dialog when required
- Reusable TwoFactorSettings component added to User Dashboard, Affiliate Dashboard, and Admin Dashboard (Security tab)
- Backup codes safeguards:
  - Codes persisted to localStorage until explicitly acknowledged
  - Dialog prevents closure via ESC key, click outside, or interactions
  - beforeunload warning prevents page refresh/close without saving
  - Codes automatically restored if user navigates away and returns
  - "I've Saved My Codes" button disabled until copy/download action taken
- Input validation: 6-digit numeric codes for TOTP, 8+ char alphanumeric for backup codes

**Phase 1 - SMS Foundation (Completed)**
- Implemented complete SMS messaging system with Twilio integration
- Added `sms_messages` database table with full schema and indexes
- Created `smsService.ts` with Twilio client, template system, E.164 phone formatting
- Added admin-only SMS API endpoints with full Zod validation

**Phase 2 - SMS Management Enhancement (Completed)**
- Added SMS filtering methods (by date range, status, message type)
- Added SMS analytics and statistics tracking
- Created new API endpoints:
  - `/api/admin/sms/history` - Filter messages by status/type/date
  - `/api/admin/sms/analytics` - Get SMS statistics and success rates
  - `/api/admin/sms/retry-failed` - Retry failed messages
- Enhanced Admin Dashboard SMS tab with:
  - Three-tab interface (Send, Analytics, History)
  - Real-time statistics display
  - Message history with delivery status badges
  - One-click retry for failed messages
- SMS credentials configured: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER

## Next Steps for SMS (Future Enhancements)
- Bulk SMS campaigns with user/subscriber selection
- SMS templates management UI (create/edit/delete custom templates)
- Schedule SMS sends for future dates
- Advanced filtering and export functionality
- SMS cost tracking and budgeting
