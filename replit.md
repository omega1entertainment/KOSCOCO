# KOSCOCO Short Content Competition Platform

## Overview
KOSCOCO (KOZZII Short Content Competition) is a comprehensive video competition platform designed for Cameroonian creators. Its primary purpose is to facilitate multi-category video competitions, including features like user registration, video uploads with moderation, public voting, phased progression, and an affiliate program. The platform aims to be the go-to destination for short-form content creators in Cameroon, fostering talent and offering significant cash prizes.

## User Preferences
I prefer simple language and clear, concise explanations. I want iterative development with frequent, small updates rather than large, infrequent ones. Please ask for my approval before making any major architectural changes or introducing new dependencies. I value a clean, readable codebase and prefer modern best practices.

## System Architecture
The platform is built with a modern web stack.
- **UI/UX Decisions**:
    - **Branding**: Primary Red (#DC2626), Secondary Black, Accent White, Featured Yellow (#FBBF24).
    - **Components**: Utilizes Shadcn UI for consistent and accessible components.
    - **Theme**: Dark mode by default, with a toggle for light mode and localStorage persistence.
    - **Navigation**: `TopBar` for contact info and social media, `NavigationHeader` with conditional rendering based on authentication and theme toggle. A `Footer` is also included. These are rendered at the app level for consistency.
    - **Content Display**: Video galleries, leaderboards with real-time rankings, and user dashboards are designed for clarity and ease of use.
- **Technical Implementations**:
    - **Full-stack TypeScript**: Ensures type safety across the entire application.
    - **RESTful API Design**: For clear and consistent communication between frontend and backend.
    - **Video Management**: Supports specific file formats, size, and duration limits, with a moderation queue.
    - **Voting System**: Public voting with anti-spam measures, judge scoring components, and a paid voting system integrated with Flutterwave.
    - **Affiliate Program**: Opt-in system with unique referral links and 20% commission tracking. Supports both authenticated and non-authenticated users, creating accounts and affiliate records in one transaction. Includes comprehensive payout request and approval workflow with admin management endpoints.
    - **Competition Structure**: Organized into five distinct phases (TOP 100, TOP 50, TOP 10, TOP 3, GRAND FINALE), with admin controls to transition between phases, ensuring only one phase is active at a time.
    - **User and Admin Dashboards**: Centralized views for user statistics and administrative tasks like video moderation, phase management, advertiser account approval, and comprehensive user management.
    - **Admin User Management**: Complete user oversight with searchable table showing all registered users, their roles (admin/judge/contestant), verification status, join dates, and location. Accessible via Users tab in admin dashboard.
    - **Email Verification**: Comprehensive system using Resend for user account verification.
    - **Advertising System**: MVP ad system with Skippable In-Stream Video and Overlay Banner ad types, including advertiser account approval, ad creation, serving, and impression/click tracking.
    - **Watch History**: Tracks user video watch history with duration, completion status, and provides a dashboard view.
    - **Picture-in-Picture**: Video player supports PiP mode for enhanced multitasking.
    - **Video of the Day**: Daily rotating featured video on the homepage.
    - **Newsletter System**: WYSIWYG email campaign creation with newsletter subscriber management. Automated welcome emails with branded imagery sent to new subscribers.

## Backend Affiliate Management Features
- **Admin Affiliate Management**:
    - GET `/api/admin/affiliates` - List all affiliates with summary stats (pending payouts, total paid out)
    - GET `/api/admin/affiliates/:id` - Get affiliate details with complete referral history and payout requests
    - PATCH `/api/admin/affiliates/:id/status` - Update affiliate status (active/suspended/inactive)
- **Admin Payout Management**:
    - GET `/api/admin/payout-requests` - List all payout requests with affiliate details, supports status filtering
    - PATCH `/api/admin/payout-requests/:id/approve` - Approve payout request
    - PATCH `/api/admin/payout-requests/:id/reject` - Reject payout with reason
- **Affiliate Dashboard Endpoints**:
    - GET `/api/affiliate/dashboard` - Comprehensive dashboard with stats including conversion rate, pending/completed referrals, earnings summary
    - GET `/api/affiliate/referrals` - Get all referrals for authenticated affiliate
    - GET `/api/affiliate/payout/history` - View payout request history and available balance
    - POST `/api/affiliate/payout/request` - Submit new payout request (with minimum threshold validation)

## Newsletter System
- **Frontend Admin Dashboard**: Newsletter management tab with subscriber list and email campaign builder using ReactQuill WYSIWYG editor
- **Newsletter Welcome Email**: 
    - Automatically sent to new subscribers via Resend email service
    - Professional HTML template with KOSCOCO branding (Primary Red #DC2626)
    - Includes featured KOSCOCO imagery and gradient header
    - Benefits section highlighting: Competition Updates, Creator Tips, Exclusive Opportunities, Community Highlights, Insider News
    - Call-to-action button for platform exploration
    - Unsubscribe link and footer with contact information
    - Graceful error handling - newsletter signup succeeds even if email fails
    - "Thank You For Subscribing!" success toast message with branding
- **Public Subscription Endpoint**: POST `/api/newsletter/subscribe` - No authentication required, validates with Zod schema, prevents duplicate emails
- **Admin Newsletter Endpoints**:
    - GET `/api/admin/newsletter/subscribers` - List all newsletter subscribers
    - POST `/api/admin/newsletter/subscribers` - Add new subscriber via admin
    - PATCH `/api/admin/newsletter/subscribers/:id` - Update subscriber details
    - DELETE `/api/admin/newsletter/subscribers/:id` - Remove subscriber
    - GET `/api/admin/newsletter/campaigns` - List all email campaigns
    - POST `/api/admin/newsletter/campaigns` - Create new campaign with WYSIWYG editor
    - PATCH `/api/admin/newsletter/campaigns/:id` - Update campaign draft
    - POST `/api/admin/newsletter/campaigns/:id/send` - Send campaign to subscribers
    - DELETE `/api/admin/newsletter/campaigns/:id` - Delete campaign

## Interactive Polls and Quizzes (Latest Addition)
Interactive polls and quizzes embedded within videos to increase viewer engagement and gather feedback:
- **Poll Types**: Supports both simple polls (for feedback/engagement) and quizzes (with correct answers for educational content)
- **Timing Control**: Set exact seconds in video when poll should appear
- **Duration**: Configure how long the poll stays visible for responses
- **Requirements**: Option to make polls required before viewing completion
- **Quiz Features**: Mark correct answers, display results with statistics
- **Creator Tools**: 
    - Poll Manager component in CreatorDashboard My Videos tab
    - Create/edit/delete polls with intuitive interface
    - Configure poll timing, duration, and questions with multiple choice options
- **Viewer Experience**: 
    - Non-intrusive poll popups during video playback
    - Real-time response submission (authenticated or anonymous)
    - Immediate feedback on quiz answers
    - View aggregate poll statistics and results
    - Anti-spam: One response per user per poll
- **Database Schema**: 
    - `polls` table: videoId, question, type (poll/quiz), timing, duration, isRequired
    - `pollOptions` table: question options with correct answer marking for quizzes
    - `pollResponses` table: track all responses with user/IP tracking
- **API Endpoints**:
    - POST `/api/videos/:videoId/polls` - Create new poll (authenticated creator only)
    - GET `/api/videos/:videoId/polls` - Get all polls for a video
    - GET `/api/polls/:pollId` - Get poll details with options
    - GET `/api/polls/:pollId/stats` - Get aggregate response statistics
    - PATCH `/api/polls/:pollId` - Update poll (authenticated creator only)
    - DELETE `/api/polls/:pollId` - Delete poll (authenticated creator only)
    - POST `/api/polls/:pollId/respond` - Submit response to poll (all users)
- **Frontend Components**: 
    - `PollManager.tsx` - Interface for creators to create/manage polls
    - `PollViewer.tsx` - Component for viewers to respond to polls and see results
    - `usePoll.ts` - Custom hooks for poll queries and mutations

## Creator Dashboard
Comprehensive user account dashboard at `/creator` with 7 tabs:
- **Overview Tab**: Quick stats (Total Videos, Views, Votes, Ranking) with quick action buttons
- **My Videos Tab**: Manage all uploaded videos with edit, delete, and view options
- **Profile Tab**: Display user information (name, email, username, location, age, member since, verification status)
- **Competitions Tab**: View all competition registrations, categories entered, payment status, and amounts
- **Watch History Tab**: Track recently watched videos with thumbnails, dates, and completion status (latest 20)
- **Earnings Tab**: 
    - View affiliate status and earnings summary
    - Display referral code with one-click copy functionality
    - Show total earnings, referrals, and pending/completed payouts
    - Quick link to full affiliate dashboard
    - CTA to join affiliate program if not already member
- **Settings Tab**: Placeholders for account preferences (change password, email preferences, delete account)
- **Backend Endpoints**:
    - GET `/api/creator/profile` - Fetch authenticated user's profile information
    - GET `/api/creator/competitions` - Fetch user's competition registrations with category details
    - GET `/api/creator/watch-history` - Fetch user's watch history (latest 20) with video details
    - GET `/api/creator/earnings` - Fetch user's affiliate earnings and payout information
- **Features**: Profile avatars with fallbacks, empty states with CTAs, loading spinners, responsive design for mobile/desktop

## Advertising System
- **Advertise Page**: Centralized advertising hub at `/advertise` accessible from main navigation menu
- **Independent Advertiser Accounts**: Completely separate from creator/user accounts
- **Account Status Tracking**: Pending, approved, or suspended advertiser accounts
- **Wallet-Based System**: Advertisers manage funds and campaign budgets through wallet
- **Advertiser Account Features**:
    - GET `/api/advertiser/current` - Get current advertiser account details (if exists)
    - Multi-campaign management
    - 5 different ad types supported
    - Real-time analytics and performance tracking
    - Category and demographic-based targeting
- **Advertise Page Flows**:
    - **Not Logged In**: Shows advertising benefits and encourages login/registration
    - **Logged In, No Advertiser Account**: Displays onboarding with 4-step setup process and CTA to create advertiser account
    - **Has Advertiser Account**: Shows account status, wallet balance, total spent, and quick access to dashboard and campaign creation
- **Advertiser Account Requirements**: Company name, contact info, business type, country, and approval process

## External Dependencies
- **Database**: PostgreSQL (managed by Neon) with Drizzle ORM
- **Object Storage**: Replit Object Storage
- **Authentication**: Passport.js, bcrypt
- **Payment Gateway**: Flutterwave
- **Email Service**: Resend
- **Frontend Libraries**: React, Tailwind CSS, Shadcn UI, Wouter, react-hook-form, Zod
- **Backend Libraries**: Express.js, Node.js
- **Fonts**: Bebas Neue, Play, Inter