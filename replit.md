# KOSCOCO Short Content Competition Platform

## Project Overview
KOSCOCO (KOZZII Short Content Competition) is a comprehensive video competition platform for Cameroon creators. The platform enables multi-category registration, video uploads with moderation, public voting, phase progression, and an affiliate program.

## Current Status
- **Design Phase**: ✅ Complete - Beautiful frontend prototype with red/black/white branding
- **Database Schema**: ✅ Complete - All tables created with proper relationships and constraints
- **Authentication**: ✅ Complete - Replit Auth fully integrated with session management
- **Object Storage**: ✅ Configured and ready for video uploads  
- **Registration Flow**: ✅ Complete - Multi-category selection with fee calculation and referral support
- **Video Upload System**: ✅ Backend routes complete - Frontend UI pending

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
- Backend API complete and ready for frontend integration

## Next Steps
1. Build video upload frontend UI with ObjectUploader component
2. Create admin dashboard for video moderation
3. Implement public voting system with vote tracking
4. Build leaderboard with real-time rankings per category and phase
5. Implement opt-in affiliate program with referral tracking dashboard
6. Create category browsing pages with filtering and video display
7. Build user dashboard showing registrations, uploaded videos, and performance stats
8. Integrate payment processing (Flutterwave)
