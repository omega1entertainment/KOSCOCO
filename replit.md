# KOSCOCO Short Content Competition Platform

## Project Overview
KOSCOCO (KOZZII Short Content Competition) is a comprehensive video competition platform for Cameroon creators. The platform enables multi-category registration, video uploads with moderation, public voting, phase progression, and an affiliate program.

## Current Status - ALL MVP FEATURES COMPLETE ✅
- **Design Phase**: ✅ Complete - Beautiful frontend prototype with red/black/white branding
- **Database Schema**: ✅ Complete - All tables created with proper relationships and constraints
- **Authentication**: ✅ Complete - Replit Auth fully integrated with session management
- **Object Storage**: ✅ Complete - Configured with ACL framework for secure video uploads
- **Registration Flow**: ✅ Complete - Multi-category selection with fee calculation and referral support
- **Video Upload System**: ✅ Complete - Full UI with file validation, progress tracking, and moderation
- **Category Browsing**: ✅ Complete - Video gallery with filtering and playback
- **Admin Dashboard**: ✅ Complete - Video moderation queue with approve/reject controls
- **Voting System**: ✅ Complete - Public voting with anti-spam measures (one vote per user/IP)
- **Leaderboard**: ✅ Complete - Real-time rankings by category and phase
- **User Dashboard**: ✅ Complete - Shows registrations, videos, votes, and statistics
- **Affiliate Program**: ✅ Complete - Opt-in enrollment, referral tracking, 20% commission

## Theme Colors
- Primary: Red (#DC2626)
- Secondary: Black
- Accent: White
- Featured: Yellow (#FBBF24) for key callouts

## Competition Structure

### Categories
1. **Music & Dance** - Singing, Dancing
2. **Comedy & Performing Arts** - Skits, Stand-up, Monologue, Acting, Movie content
3. **Fashion & Lifestyle** - Cooking, Events, Decor, Sports, Travel, Vlogging, Fashion, Hair, Makeup, Beauty, Reviews
4. **Education & Learning** - DIY, Tutorials, Documentary, Business & Finance, News, Motivational Speaking
5. **Gospel Choirs** - Acapella, Choir Music

### Competition Phases
1. **Phase 1: TOP 100** - Initial submissions
2. **Phase 2: TOP 50** - Top performers advance
3. **Phase 3: TOP 10** - Final selections
4. **Phase 4: TOP 3** - Category winners
5. **Phase 5: GRAND FINALE** - Ultimate winner crowned

## Key Features

### User Registration
- Multi-category selection
- Fee calculation: 2500 FCFA per category
- Age verification (18+ or with parental consent)
- Payment integration (Flutterwave - planned for next phase)

### Video Upload
- Max 2 videos per registered category
- File size limit: 512MB
- Duration: 1-3 minutes
- Formats: MP4, MPEG4, WebM, MOV, FLV
- Moderation queue before going live

### Voting System
- Public voting (60% of total score)
- Multiple votes allowed per user
- Judge scoring for creativity (30%) and quality (10%)
- Real-time leaderboards per category and phase

### Affiliate Program (Opt-in)
- Separate from competition registration
- 20% commission on paid registrations
- Unique referral codes
- Tracking dashboard for affiliates
- Can be enabled by users or backend admins

## Technical Stack
- Frontend: React, Tailwind CSS, Shadcn UI, Wouter
- Backend: Express.js, Node.js
- Database: PostgreSQL (Neon)
- Auth: Replit Auth (OpenID Connect)
- Storage: Replit Object Storage
- Fonts: Bebas Neue (display), Play, Inter

## Architecture Notes
- Database-first approach with Drizzle ORM
- Full-stack TypeScript
- RESTful API design
- Session-based authentication with PostgreSQL storage

## Recent Updates (Session 1)
**Database & Authentication (Tasks 1-2):**
- Created comprehensive database schema with 9 tables (users, sessions, categories, phases, registrations, videos, votes, judge_scores, affiliates, referrals)
- Added unique constraints on phases table (name, number) to prevent duplicate active phases
- Restricted seed endpoint to admin-only access for security
- Fully integrated Replit Auth with OpenID Connect, passport, session storage in PostgreSQL
- Implemented auth middleware and frontend hooks

**Registration Flow (Task 3):**
- Created POST /api/registrations endpoint with authentication required
- Validates category selection and calculates fees (2500 FCFA per category)
- Checks for active phase before allowing registration
- Supports optional referral codes with 20% commission tracking
- Built comprehensive Register page with category cards, real-time fee calculation, and referral code support
- Fixed UX issues: proper loading states, invalid referral code feedback, redirect to home after registration
- Wired all "Register" buttons on Home page to registration flow

**Video Upload System (Task 4):**
- Integrated object storage with ACL policy framework
- Created video upload routes: upload URL generation, video creation with metadata, video retrieval (user/category/pending)
- Implemented admin-only moderation endpoints (pending videos, status updates)
- Added video ownership and access control
- Validates user registration before allowing video uploads per category
- Built comprehensive Upload page with file validation (size, duration, format), metadata extraction, progress tracking
- Two-step upload flow: presigned URL generation + direct upload to object storage

**Category Browsing & Video Playback (Task 5):**
- Created Categories page displaying all 5 competition categories
- Built CategoryVideos page with subcategory filtering and video grid
- Implemented VideoPlayer page with video playback, metadata display, and voting integration
- Browse-to-watch flow: Categories → Category Videos → Video Player
- Backend restricts video access to approved videos only (403 for pending/rejected)

**Admin Moderation Dashboard (Task 6):**
- Created AdminDashboard with authentication gating (admin-only access)
- Displays pending videos queue with inline video preview
- Approve/reject controls with toast notifications and cache invalidation
- Proper error handling for 403 (access denied) and generic errors

**Public Voting System (Task 7):**
- Implemented POST /api/votes with duplicate prevention (one vote per user/IP per video)
- Voting restricted to approved videos only
- GET /api/votes/video/:videoId returns vote count for display
- VideoPlayer integrates voting UI with real-time count updates

**Leaderboard (Task 8):**
- Real-time rankings with category AND phase filtering
- SQL aggregation with COUNT/LEFT JOIN for vote counts
- Dual dropdown selectors for category/phase filtering
- Trophy rankings display with hover effects and clickable video cards

**User Dashboard (Task 9):**
- Displays user registrations with payment status badges
- Shows uploaded videos with approval status (pending/approved/rejected)
- Lists votes cast by user with video titles
- Statistics cards: total videos, votes received (SQL aggregated), votes cast
- Optimized getUserStats with 3 efficient SQL queries (no N+1)

**Affiliate Program (Task 10):**
- Opt-in enrollment creates affiliate record with unique referral code (format: REF-XXXXXXXX)
- Fixed registration logic to create ONE registration with all categories (categoryIds array + totalFee)
- Referral creation with 20% commission calculation on total registration fee
- Affiliate dashboard shows: earnings stats, referral code with copy button, referrals list with joined registration data
- Commission tracking: getAffiliateReferrals joins registration data for display

**Auth & Bug Fixes:**
- Fixed auth routes: /api/login and /api/logout (were incorrectly /api/auth/login and /api/auth/logout)
- Fixed apiRequest parameter order: (url, method, data) to match all usages
- Fixed login button in Home.tsx by adding onLoginClick handler to NavigationHeader
- All features tested end-to-end with Playwright and passing

**Affiliate Flow Improvements (Session 2):**
- Split affiliate program into two pages:
  - `/affiliate` - Enrollment page with benefits and "Enroll Now" button
  - `/affiliate/dashboard` - Dashboard showing stats, referral code, and referrals list
- After successful enrollment, users are automatically redirected to dashboard
- Already-enrolled users visiting /affiliate are redirected to /affiliate/dashboard
- Added "Affiliate Program" link to navigation header
- Fixed React warning by using useEffect for redirect logic

**Referral Link System (Session 3):**
- Converted referral code system to referral link system
- Referral links format: `${window.location.origin}/register?ref=REF-XXXXXXXX`
- Updated AffiliateDashboard to display full referral link with copy button
- Register page automatically reads and pre-fills referral code from URL query parameter
- Shows toast notification "Referral Code Applied" when referral link is used
- Added dropdown submenu to NavigationHeader for Affiliate Program:
  - Desktop: Dropdown with "Join Program" and "My Dashboard" options
  - Mobile: Collapsible section with same options
- Fixed toast error for registration success message (totalAmount undefined)
- All referral link flows tested end-to-end with Playwright

**Comprehensive Affiliate Signup Page (Session 3):**
- Created professional affiliate signup page at `/affiliate` based on example
- Three benefit cards highlighting: 20% commission (500 FCFA), easy sharing, earnings tracking
- "How It Works" section with 5-step process explanation
- Signup form with validation (react-hook-form + zod):
  - Name (auto-filled from user.firstName + user.lastName, disabled)
  - Email (auto-filled from user.email, disabled)
  - Website/Social Media (optional)
  - How Will You Promote (required, min 10 chars)
  - Terms and Conditions checkbox (required)
- Form submissions POST to /api/affiliate/opt-in with additional metadata
- Success flow: Toast notification → Auto-redirect to /affiliate/dashboard after 1.5s
- Already-enrolled users automatically redirected to dashboard
- Tested end-to-end with Playwright

**How It Works Page with Animations (Session 3):**
- Created stunning `/how-it-works` page with beautiful framer-motion animations
- Hero section with floating Sparkles icon and CTA
- Four competition stats cards with hover animations (scale + rotate icons)
- Six-step process guide with alternating layouts and gradient badges (01-06)
- Each step features:
  - **AI-generated custom images** (6 total) replacing previous icons:
    - Registration and category selection scene
    - Video upload and content creation scene
    - Content approval and moderation scene
    - Public voting and engagement scene
    - Phase progression and advancement scene
    - Winning prizes and celebration scene
  - Images animated with scale/rotate effects (subtle 3° rotation)
  - Gradient backgrounds (red → orange → yellow → green → blue → purple)
  - Rounded corners, shadows, and decorative overlays on images
  - Checkmark highlights list
  - Scroll-triggered entrance animations
- Scoring section (60% Public Votes, 30% Creativity, 10% Quality)
  - Animated circular backgrounds with continuous rotation
  - Hover effects that lift cards
- CTA section with animated Trophy icon and dual action buttons
- All animations optimized for smooth performance
- Fully responsive design with alternating image/content layout
- Tested end-to-end with Playwright

## Next Steps
1. ✅ All MVP features complete and tested
2. 🔜 Integrate payment processing (Flutterwave) for registration fees
3. 🔜 Add judge scoring system (creativity 30%, quality 10%)
4. 🔜 Implement phase progression automation
5. 🔜 Add email notifications for registration, video approval, phase advancement
6. 🔜 Create mobile-responsive improvements
7. 🔜 Add analytics dashboard for admins
8. 🔜 Deploy to production
