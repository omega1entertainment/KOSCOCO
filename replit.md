# KOSCOCO Short Content Competition Platform

## Overview
KOSCOCO is a video competition platform for Cameroonian creators. It enables multi-category video competitions with features like user registration, moderated video uploads, public voting, phased progression, and an affiliate program. The platform aims to be the leading destination for short-form content creators in Cameroon, fostering talent and offering significant cash prizes.

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
    - **Affiliate Program**: Opt-in system with unique referral links, 20% commission tracking, and comprehensive payout workflow. Supports integrated account creation for affiliates.
    - **Competition Structure**: Seven distinct phases (e.g., TOP 500, TOP 100), managed by admin controls to ensure one active phase.
    - **Automatic Top 500 Selection**: Videos automatically selected per category based on likes, triggered by admin.
    - **Dashboards**: Separate user and admin dashboards for statistics, moderation, phase management, advertiser approval, and user management.
    - **Email Verification**: Comprehensive system using Resend.
    - **Advertising System**: MVP supports Skippable In-Stream Video and Overlay Banner ads, including advertiser account approval, ad creation, serving, and tracking.
    - **Watch History**: Tracks user video watch duration and completion, displayed in a dashboard.
    - **Picture-in-Picture**: Video player supports PiP mode.
    - **Video of the Day**: Daily featured video on the homepage, selected based on the previous day's highest views.
    - **Newsletter System**: WYSIWYG email campaign creation, subscriber management, and automated welcome emails.
    - **FAQ System**: Bilingual (English/French) FAQ page with categorized questions.
    - **Interactive Polls and Quizzes**: Embedded within videos for engagement, with timing control, duration settings, and creator management tools. Supports anonymous or authenticated responses.
    - **Mobile Feed Experience**: TikTok-style full-screen vertical video feed with smooth scroll detection, auto-play, and disabled interactions during scrolling to prevent accidental clicks.
    - **Progressive Web App (PWA)**: Installable web app on mobile devices (iOS/Android) with native app-like experience and offline support via manifest.json.

## External Dependencies
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Object Storage**: Replit Object Storage
- **Authentication**: Passport.js, bcrypt
- **Payment Gateway**: Flutterwave
- **Email Service**: Resend
- **Frontend Libraries**: React, Tailwind CSS, Shadcn UI, Wouter, react-hook-form, Zod
- **Backend Libraries**: Express.js, Node.js
- **Fonts**: Bebas Neue, Play, Inter