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
    - **Navigation**: Consistent `TopBar`, `NavigationHeader` (auth-aware), and `Footer`.
    - **Content Display**: Video galleries, real-time leaderboards, and user dashboards.

- **Technical Implementations**:
    - **RESTful API**: For frontend-backend communication.
    - **Video Management**: Supports specific formats, size/duration limits, and a moderation queue.
    - **Voting System**: Public voting with anti-spam, judge scoring, and Flutterwave-integrated paid voting.
    - **Affiliate Program**: Opt-in system with unique referral links, 20% commission tracking, and payout workflow.
    - **Competition Structure**: Seven distinct phases managed by admin controls to ensure one active phase.
    - **Automatic Top 500 Selection**: Videos automatically selected per category based on likes.
    - **Dashboards**: Separate user and admin dashboards for statistics, moderation, phase management, advertiser approval, and user management.
    - **Email Verification**: Comprehensive system using Resend.
    - **Advertising System**: Supports Skippable In-Stream Video and Overlay Banner ads, including advertiser approval, ad creation, serving, and tracking.
    - **Watch History**: Tracks user video watch duration and completion.
    - **Picture-in-Picture**: Video player supports PiP mode.
    - **Video of the Day**: Daily featured video on the homepage based on previous day's highest views.
    - **Newsletter System**: WYSIWYG email campaign creation, subscriber management, and automated welcome emails.
    - **FAQ System**: Bilingual (English/French) FAQ page with categorized questions.
    - **Interactive Polls and Quizzes**: Embedded within videos for engagement.
    - **SMS Messaging System**: Admin-only SMS messaging via Twilio with a complete management interface, including direct sending, templates, history, analytics, and retry functionality.
    - **Creator Follow Feature**: Allows users to follow creators with associated metrics and UI integration.
    - **Video Comments Feature**: Enables users to comment on videos with real-time posting, pagination, and moderation.
    - **Email OTP Verification**: Mandatory email OTP verification during signup for enhanced security.
    - **Two-Factor Authentication (2FA)**: TOTP-based 2FA using `otplib` with QR code setup, enable/disable functionality, backup codes, and integration into the login flow and user dashboards.
    - **File Storage Management**: Admin UI for browsing, uploading, deleting, and managing files in connected object storage (e.g., Bunny Storage).
    - **CDN Integration**: Supports BunnyCDN for enhanced video delivery and streaming.

## External Dependencies
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Object Storage**: Replit Object Storage, Bunny Storage
- **CDN/Video Streaming**: BunnyCDN Stream
- **Authentication**: Passport.js, bcrypt, otplib
- **Payment Gateway**: Flutterwave
- **Email Service**: Resend
- **SMS Service**: Twilio
- **Frontend Libraries**: React, Tailwind CSS, Shadcn UI, Wouter, react-hook-form, Zod
- **Backend Libraries**: Express.js, Node.js
- **Fonts**: Bebas Neue, Play, Inter