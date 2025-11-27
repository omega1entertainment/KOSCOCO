# KOSCOCO Competition Platform Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from leading video content platforms (YouTube, TikTok) and competition platforms (The Voice, Got Talent digital experiences) while creating a unique identity suited for KOSCOCO's vibrant competitive nature.

**Core Principles**:
- Content-First: Video submissions are the hero
- Competition Energy: Bold, dynamic layouts that convey excitement
- Clear Hierarchy: Easy navigation through categories, phases, and features
- Trust & Credibility: Professional presentation for a legitimate competition

---

## Typography System

**Font Families**:
- Primary: **Inter** (Google Fonts) - Clean, modern sans-serif for UI elements, body text, and data
- Accent: **Bebas Neue** (Google Fonts) - Bold, condensed display font for competition branding, phase announcements, and high-impact headlines

**Type Scale**:
- Display/Hero: text-6xl to text-8xl (Bebas Neue, uppercase, tracking-wide)
- Section Headers: text-4xl to text-5xl (Bebas Neue, uppercase)
- Subsection Headers: text-2xl to text-3xl (Inter, font-bold)
- Body Text: text-base to text-lg (Inter, font-normal)
- Small/Meta: text-sm (Inter, font-medium)
- Micro/Labels: text-xs (Inter, font-semibold, uppercase, tracking-wider)

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16, 20, 24** for consistency
- Component padding: p-4, p-6, p-8
- Section spacing: py-12, py-16, py-20, py-24
- Grid gaps: gap-4, gap-6, gap-8
- Element margins: mb-4, mb-6, mb-8, mb-12

**Container Strategy**:
- Full-width sections: w-full with inner max-w-7xl mx-auto px-4
- Content sections: max-w-6xl mx-auto
- Text content: max-w-4xl

**Grid Patterns**:
- Video grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Category cards: grid-cols-2 md:grid-cols-3 lg:grid-cols-5
- Leaderboard: Single column with responsive horizontal scrolling for data tables
- Feature sections: grid-cols-1 md:grid-cols-2 for text/image splits

---

## Component Library

### Navigation
**Main Header**: 
- Sticky navigation with KOSCOCO logo (left)
- Desktop: Horizontal menu items (Categories, How It Works, Leaderboard, Prizes)
- CTA buttons group: "Register" (primary) + "Login" (secondary)
- Mobile: Hamburger menu with slide-out drawer
- Competition phase indicator badge (e.g., "PHASE 2: TOP 50 ACTIVE")

### Homepage Sections

**Hero Section** (h-screen, flex items-center):
- Large background image showcasing dynamic competition energy (performers, creators in action)
- Overlay gradient for text readability
- Centered content:
  - Competition logo/title (Bebas Neue, text-7xl)
  - Tagline: "Cameroon's Next Big Content Creator" (text-2xl)
  - Quick stats row: "5 Categories • 8 Weeks • Cash Prizes"
  - Dual CTAs: "Enter Competition" (primary, large, px-12 py-4) + "Watch Entries" (secondary, ghost style with backdrop-blur)
- Countdown timer to next phase (if active)

**Categories Showcase** (py-20):
- Section header with phase indicator
- 5-column grid on desktop, scrollable on mobile
- Large category cards with:
  - Icon representation (use Heroicons)
  - Category name (Bebas Neue, text-3xl)
  - Subcategory count badge
  - Entry count/"View Entries" link
  - Hover: subtle scale transform

**How It Works - Competition Flow** (py-24):
- Timeline visualization showing 5 phases
- Horizontal stepper with connecting lines
- Each phase node includes:
  - Phase number badge
  - Phase name (TOP 100, TOP 50, etc.)
  - Brief description
  - Icons showing progression arrows
- Visual emphasis on current active phase

**Featured Videos Section** (py-20):
- "Trending Now" or "Top Entries This Week"
- 3-4 column video grid
- Video cards include:
  - Thumbnail with play overlay icon
  - Video title
  - Creator name and avatar (small, rounded-full)
  - Category badge
  - Vote count + view count (inline, text-sm)
  - Share icon button

**Registration Explainer** (py-20):
- 2-column layout (60/40 split)
- Left: Step-by-step registration process with numbered items
- Right: Pricing calculator mockup showing fee structure
- Clear CTA: "Register Now for 2500 FCFA"

**Leaderboard Preview** (py-24):
- "Current Leaders" section
- Tabbed interface for categories
- Top 10 display in table format:
  - Rank badge (#1 gets special treatment - larger, prominent)
  - Creator avatar + name
  - Video thumbnail (small)
  - Vote count with progress bar
  - Score breakdown (engagement/creativity/quality)

**Prizes & Rewards** (py-20):
- 3-column grid showing prize tiers
- Center column (Grand Prize) elevated and larger
- Each tier shows: rank badge, prize description, prize amount placeholder
- Referral program teaser section below

**Trust Indicators** (py-16):
- Partner logos (if any)
- Testimonial cards from past participants (if applicable)
- Social proof: "Join 1000+ Creators Already Competing"

**Footer** (py-16):
- 4-column layout: About, Categories, Support, Social
- Newsletter signup form
- Legal links (Terms, Privacy, Rules)
- Social media icons (Heroicons)
- Contact: support@koscoco.africa

### Video Entry Pages

**Category Browse View**:
- Sticky category filter bar with pills/chips for subcategories
- Sort options: Trending, Most Voted, Recent, Top Rated
- Infinite scroll video grid
- Each video card: aspect-16/9 thumbnail, title truncate, creator info, vote button (prominent), share button

**Video Player Page**:
- Large player (aspect-16/9, max-w-5xl)
- Below player: Title (text-3xl), creator profile (flex items-center with avatar), upload date, category badges
- Engagement row: Large vote button with count, share buttons (WhatsApp, Facebook, Twitter), view count
- Video description (expandable)
- Related videos sidebar (on desktop) or below (mobile)

### User Dashboard

**Participant Dashboard**:
- Welcome header with user avatar and stats summary
- Card-based layout with sections:
  - "My Registrations" - categories enrolled in
  - "My Videos" (2 per category limit indicator) - upload status badges
  - "My Performance" - votes, views, current ranking per category
  - Upload new video CTA (if slots available)

**Upload Interface**:
- Multi-step form (stepper UI):
  - Step 1: Select category (only show registered categories)
  - Step 2: Upload video (drag-drop zone, progress bar, file validation feedback)
  - Step 3: Video details (title, description, featured image upload)
  - Step 4: Review & Submit (checkbox for rules agreement)
- Clear file requirements display (512MB, 1-3min, formats)

**Referral/Affiliate Dashboard** (separate from participant):
- Stats cards: Clicks, Conversions, Earnings
- Referral link display with copy button
- Referral history table
- Commission withdrawal interface

### Admin Panel

**Dark-themed Dashboard** (contrast from public site):
- Sidebar navigation: Users, Videos, Categories, Phases, Analytics, Settings
- Video moderation queue with thumbnail previews
- Bulk actions (approve, reject)
- Phase management controls with date pickers
- Analytics charts for registrations, views, votes over time

---

## Form Components

**Input Fields**:
- Floating labels or top-aligned labels (Inter, text-sm, font-medium)
- Border style with focus ring
- Height: h-12 for standard inputs
- Error states with red accent and icon
- Helper text below (text-sm)

**Buttons**:
- Primary: Solid fill, rounded-lg, px-6 py-3, text-base font-semibold
- Secondary: Outlined style, same padding
- Ghost: Transparent with hover fill
- Icon buttons: Square, p-3, rounded-full
- Disabled state: reduced opacity

**Select/Dropdowns**:
- Custom styled with chevron icon
- Multi-select with checkbox options for category registration

---

## Animations

**Minimal, Purposeful Motion**:
- Page transitions: Simple fade-in
- Card hovers: transform scale-105, transition-transform duration-200
- Button hovers: No custom animations (use default)
- Loading states: Spinner for async actions, skeleton screens for content loading
- Vote button: Gentle pulse animation on successful vote
- NO scroll-triggered animations

---

## Icons

**Heroicons (via CDN)** - outline style for UI, solid for emphasis:
- Navigation: home, film, trophy, user-circle
- Actions: play, heart, share, upload-cloud
- Categories: musical-note, face-smile, sparkles, academic-cap, users
- UI: chevron-down, check, x-mark, bars-3

---

## Images

**Hero Section**: 
Large, vibrant image (1920x1080 min) showing energetic Cameroonian content creators - musicians dancing, comedians performing, fashion creators, educators teaching. Image should convey diversity of competition categories and youthful energy. Use overlay gradient (black to transparent, opacity-60) for text readability.

**Category Cards**: 
Abstract illustrations or photos representing each category - musical instruments for Music & Dance, microphone for Comedy, fashion items for Fashion & Lifestyle, books/laptop for Education, gospel choir singing for Gospel Choirs.

**Video Thumbnails**: 
User-uploaded featured images, aspect-16/9, with play button overlay icon centered.

**About/Trust Section**: 
Photos of competition organizers, judges panel, or past event moments (if available).

**Empty States**: 
Friendly illustrations for "No videos yet," "Upload your first video," using minimalist line art style.

---

## Responsive Behavior

**Breakpoints**:
- Mobile: base (< 768px) - single column, stacked navigation
- Tablet: md (768px+) - 2-column grids, visible nav items
- Desktop: lg (1024px+) - full multi-column layouts
- Wide: xl (1280px+) - max content width, more breathing room

**Mobile Priorities**:
- Bottom navigation for quick actions (Home, Categories, Upload, Profile)
- Simplified video cards (smaller thumbnails, vertical layout)
- Collapsible filters and sort options
- Touch-friendly tap targets (min-h-12)

---

## Accessibility

- Semantic HTML5 elements throughout
- ARIA labels for icon-only buttons
- Keyboard navigation support for all interactive elements
- Focus states visible with ring offsets
- Alt text for all images
- Contrast ratios meeting WCAG AA standards (verify with theme colors)
- Form field labels always associated with inputs
- Loading states announced to screen readers