# KOSCOCO Short Content Competition Platform

## Project Overview
KOSCOCO (KOZZII Short Content Competition) is a comprehensive video competition platform for Cameroon creators. The platform enables multi-category registration, video uploads with moderation, public voting, phase progression, and an affiliate program.

## Current Status
- **Design Phase**: Complete - Beautiful frontend prototype with red/black/white branding
- **Database Schema**: Defined with tables for users, categories, videos, votes, phases, registrations, affiliates, and referrals  
- **Authentication**: Replit Auth integration in progress
- **Object Storage**: Configured for video uploads

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

## Recent Updates
- Created complete database schema for all entities
- Integrated object storage for video files
- Implemented storage interface with CRUD operations
- Updated user schema for Replit Auth compatibility
- Created seed data for categories and phases

## Next Steps
1. Complete Replit Auth integration
2. Build registration flow with category selection
3. Implement video upload with object storage
4. Create admin dashboard for moderation
5. Add voting and leaderboard functionality
6. Build user and affiliate dashboards
7. Integrate payment processing (Flutterwave)
