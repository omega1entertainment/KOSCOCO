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
    - **SMS Messaging System**: Admin-only SMS messaging via Twilio with template system (registration, payment, video status, phase updates, winner announcements). Supports individual user targeting, custom messages, and broadcast messaging. Full message delivery tracking and logging in database.

## External Dependencies
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Object Storage**: Replit Object Storage
- **Authentication**: Passport.js, bcrypt
- **Payment Gateway**: Flutterwave
- **Email Service**: Resend
- **SMS Service**: Twilio
- **Frontend Libraries**: React, Tailwind CSS, Shadcn UI, Wouter, react-hook-form, Zod
- **Backend Libraries**: Express.js, Node.js
- **Fonts**: Bebas Neue, Play, Inter

## Recent Changes (December 1, 2025)
- Implemented complete SMS messaging system with Twilio integration
- Added `sms_messages` database table with full schema and indexes
- Created `smsService.ts` with Twilio client, template system, E.164 phone formatting, and validation
- Added admin-only SMS API endpoints (/api/admin/sms/*) with full Zod validation for:
  - Sending individual SMS messages
  - Sending SMS to specific users with templates (welcome, reminder, thankYou, phaseUpdate)
  - Broadcasting SMS to multiple recipients
  - Checking SMS service status and retrieving message history
- Added SMS Testing tab to Admin Dashboard for quick testing
- SMS functionality requires Twilio credentials: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
