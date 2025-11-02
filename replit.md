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
    - **Navigation**: Features a `TopBar` for contact info and social media, and a `NavigationHeader` with conditional rendering based on user authentication status.
    - **Content Display**: Video galleries, leaderboards with real-time rankings, and user dashboards are designed for clarity and ease of use.
    - **Competition Structure**: Organized into five distinct phases, with specific categories for video submissions.
- **Technical Implementations**:
    - **Full-stack TypeScript**: Ensures type safety across the entire application.
    - **RESTful API Design**: For clear and consistent communication between frontend and backend.
    - **Video Upload System**: Supports specific file formats, size, and duration limits, with a moderation queue.
    - **Voting System**: Public voting with anti-spam measures and judge scoring components (creativity, quality).
    - **Affiliate Program**: Opt-in system with unique referral links and 20% commission tracking.
    - **Payment Integration**: Flutterwave for secure and localized payment processing (XAF currency).
    - **Leaderboard**: Real-time, category, and phase-filtered rankings.
    - **User Dashboard**: Centralized view for user's registrations, videos, votes, and statistics.
    - **Admin Dashboard**: Dedicated interface for video moderation (approve/reject).

## Recent Changes (Latest)
- **Phase 1 Completed**: Payment foundation with Flutterwave integration, verification, webhooks, and retry flow
- **Phase 2 (Partial)**: Voting system with database-level duplicate prevention and leaderboard with judge score aggregation
- **Database Enhancements**: Added unique constraints on votes (video_id, user_id) and (video_id, ip_address) to prevent duplicate votes even under race conditions
- **Performance Optimizations**: Created indexes on votes.video_id and judge_scores.video_id for efficient leaderboard queries

## External Dependencies
- **Database**: PostgreSQL (managed by Neon)
- **Object Storage**: Replit Object Storage
- **Authentication**: Passport.js, bcrypt
- **Payment Gateway**: Flutterwave (SDKs: `flutterwave-react-v3`, `flutterwave-node-v3`)
- **Frontend Libraries**: React, Tailwind CSS, Shadcn UI, Wouter, react-hook-form, Zod
- **Backend Libraries**: Express.js, Node.js, Drizzle ORM
- **Fonts**: Bebas Neue, Play, Inter