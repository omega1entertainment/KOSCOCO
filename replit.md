# KOSCOCO Short Content Competition Platform

## Overview
KOSCOCO (KOZZII Short Content Competition) is a comprehensive video competition platform designed for Cameroonian creators. Its primary purpose is to facilitate multi-category video competitions, including features like user registration, video uploads with moderation, public voting, phased progression, and an affiliate program. The platform aims to be the go-to destination for short-form content creators in Cameroon, fostering talent and offering significant cash prizes.

## User Preferences
I prefer simple language and clear, concise explanations. I want iterative development with frequent, small updates rather than large, infrequent ones. Please ask for my approval before making any major architectural changes or introducing new dependencies. I value a clean, readable codebase and prefer modern best practices.

## System Architecture
The platform is built with a modern web stack:
- **Frontend**: React, Tailwind CSS, Shadcn UI for a responsive and aesthetically pleasing user interface, utilizing `Wouter` for routing. The design adheres to a red/black/white branding scheme with yellow accents for key callouts.
- **Backend**: Node.js with Express.js for a robust and scalable API.
- **Database**: PostgreSQL (managed by Neon) is used with Drizzle ORM for a database-first approach, ensuring data integrity and efficient querying.
- **Authentication**: Username/password authentication with Passport-local and bcrypt for secure user management, storing sessions in PostgreSQL.
- **Object Storage**: Replit Object Storage is configured with an ACL framework for secure and efficient video uploads.
- **UI/UX Decisions**:
    - **Branding**: Primary Red (#DC2626), Secondary Black, Accent White, Featured Yellow (#FBBF24).
    - **Components**: Utilizes Shadcn UI for consistent and accessible components.
    - **Dark Mode**: Theme toggle in navigation with localStorage persistence and smooth transitions.
    - **Navigation**: Features a `TopBar` for contact info and social media, and a `NavigationHeader` with conditional rendering based on user authentication status and theme toggle. Both components are rendered at the app level (App.tsx) to ensure consistent navigation across all pages, with a `Footer` also included at the bottom of every page.
    - **Content Display**: Video galleries, leaderboards with real-time rankings, and user dashboards are designed for clarity and ease of use.
    - **Competition Structure**: Organized into five distinct phases, with specific categories for video submissions.
- **Technical Implementations**:
    - **Full-stack TypeScript**: Ensures type safety across the entire application.
    - **RESTful API Design**: For clear and consistent communication between frontend and backend.
    - **Video Upload System**: Supports specific file formats, size, and duration limits, with a moderation queue.
    - **Voting System**: Public voting with anti-spam measures and judge scoring components (creativity, quality).
    - **Affiliate Program**: Opt-in system with unique referral links and 20% commission tracking. Accepts both authenticated and non-authenticated users; for new users, creates both user account and affiliate record in a single transaction.
    - **Payment Integration**: Flutterwave for secure and localized payment processing (XAF currency).
    - **Leaderboard**: Real-time, category, and phase-filtered rankings.
    - **User Dashboard**: Centralized view for user's registrations, videos, votes, and statistics.
    - **Admin Dashboard**: Dedicated interface for video moderation (approve/reject) and phase management (activate/complete phases).
    - **Phase Progression**: Competition organized in 5 phases (TOP 100, TOP 50, TOP 10, TOP 3, GRAND FINALE) with admin controls to transition between phases. Only one phase can be active at a time. Registration and uploads respect the current active phase.

## Recent Changes (Latest)
- **Dark Mode Toggle** (Nov 13, 2024): Implemented theme switching functionality with user preference persistence:
  - Added ThemeProvider component with localStorage persistence and system preference detection
  - Created ThemeToggle component with sun/moon icons in navigation header
  - Theme toggle available in both desktop and mobile navigation
  - Smooth theme transitions using useLayoutEffect to prevent flash
  - Respects user's system dark mode preference on first visit
- **Paid Voting System** (Nov 13, 2024): Integrated payment modal for purchasing votes:
  - VotePaymentModal component allows users to purchase 1-1000 votes at 50 XAF per vote
  - Secure Flutterwave integration with signature verification
  - Server-side amount validation and webhook verification
  - Combined vote counting (free + paid votes) across leaderboard and stats
  - Vote button opens payment modal instead of direct voting
- **Email Verification System** (Nov 4, 2024): Implemented comprehensive email verification for user accounts:
  - Added `emailVerified`, `verificationToken`, `verificationTokenExpiry` fields to users table
  - Integrated Resend email service for sending verification emails
  - Automatic verification email sent upon user signup
  - Email verification page (/verify-email) with token validation
  - Dashboard banner for unverified users with resend email functionality
  - Middleware protection: video uploads require verified email (isEmailVerified)
  - Backend routes: POST /api/verify-email (token verification), POST /api/resend-verification (resend email)
- **Affiliate Payout System** (Nov 4, 2024): Implemented complete payout request and approval workflow for affiliates:
  - Added `payout_requests` table with status tracking (pending/approved/rejected)
  - Available balance calculation: total earnings minus requested/paid amounts
  - Minimum withdrawal threshold: 5,000 FCFA
  - Support for multiple payment methods: Mobile Money, Bank Transfer, PayPal
  - Affiliate Dashboard: Payout request form with payment details and history display
  - Admin Dashboard: New Payout Management tab with approve/reject functionality and rejection reason tracking
  - Admin approval process records timestamp and admin user who processed the request
- **Phase Progression System** (Nov 4, 2024): Implemented complete phase management with admin controls to activate/complete phases, ensuring only one phase is active at a time. Added Phase Management tab to Admin Dashboard with visual status indicators and date tracking.
- **Navigation Enhancement** (Nov 4, 2024): Moved TopBar, NavigationHeader, and Footer to App.tsx root level so they appear consistently on all pages across the entire application
- **Affiliate Program Enhancement** (Nov 4, 2024): Updated to accept both authenticated and non-authenticated users with dual-mode endpoint that creates accounts and affiliate records in one transaction
- **Phase 1 Completed**: Payment foundation with Flutterwave integration, verification, webhooks, and retry flow
- **Phase 2 Completed**: Voting system with database-level duplicate prevention, leaderboard with judge score aggregation, and phase progression logic
- **Database Enhancements**: Added unique constraints on votes (video_id, user_id) and (video_id, ip_address) to prevent duplicate votes even under race conditions
- **Performance Optimizations**: Created indexes on votes.video_id and judge_scores.video_id for efficient leaderboard queries

## External Dependencies
- **Database**: PostgreSQL (managed by Neon)
- **Object Storage**: Replit Object Storage
- **Authentication**: Passport.js, bcrypt
- **Payment Gateway**: Flutterwave (SDKs: `flutterwave-react-v3`, `flutterwave-node-v3`)
- **Email Service**: Resend (for email verification and notifications)
- **Frontend Libraries**: React, Tailwind CSS, Shadcn UI, Wouter, react-hook-form, Zod
- **Backend Libraries**: Express.js, Node.js, Drizzle ORM
- **Fonts**: Bebas Neue, Play, Inter