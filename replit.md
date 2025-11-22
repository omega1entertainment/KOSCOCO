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

## Backend Affiliate Management Features (Latest Addition)
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

## External Dependencies
- **Database**: PostgreSQL (managed by Neon) with Drizzle ORM
- **Object Storage**: Replit Object Storage
- **Authentication**: Passport.js, bcrypt
- **Payment Gateway**: Flutterwave
- **Email Service**: Resend
- **Frontend Libraries**: React, Tailwind CSS, Shadcn UI, Wouter, react-hook-form, Zod
- **Backend Libraries**: Express.js, Node.js
- **Fonts**: Bebas Neue, Play, Inter