# RBDCYE.ORG — Public-Facing Digital Architecture
## Rohamaa Baynahum Charity Foundation (جمعية رُحماء بينهم)

**Architecture Version:** 1.0  
**Last Updated:** September 2026  
**Platform:** NexoraOS™ Public Gateway Layer  
**Domain:** rbdcye.org (Rohamaa Baynahum Digital Charity Ecosystem)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [User Journey Architecture](#2-user-journey-architecture)
3. [Content Strategy](#3-content-strategy)
4. [Engagement Features](#4-engagement-features)
5. [Marketing Automation](#5-marketing-automation)
6. [Analytics & Intelligence](#6-analytics--intelligence)
7. [Technical Architecture](#7-technical-architecture)
8. [File Structure & Component Map](#8-file-structure--component-map)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. Architecture Overview

### 1.1 System Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RBDCYE.ORG DIGITAL ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    PUBLIC WEBSITE LAYER (React SPA)                   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │Homepage  │ │Programs  │ │Donate    │ │Stories   │ │Contact   │  │  │
│  │  │Portal    │ │Hub       │ │Gateway   │ │& Impact  │ │& About   │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    API GATEWAY LAYER (Express/REST)                   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │Public    │ │Donation  │ │Content   │ │Analytics │ │Webhook   │  │  │
│  │  │API       │ │API       │ │API       │ │API       │ │Handler   │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    DATA & INTEGRATION LAYER                          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │Neon      │ │Redis     │ │Email     │ │WhatsApp  │ │Social    │  │  │
│  │  │PostgreSQL│ │Cache     │ │Provider  │ │API       │ │Media API │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    NEXORAOS ERP™ BACKEND (Existing)                   │  │
│  │  FR-06 Service Delivery │ FR-08 Funding │ FR-07 Community           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Mobile-First** | All components responsive, touch-optimized, offline-capable |
| **RTL-Native** | Full Arabic support with automatic LTR/RTL switching |
| **Performance** | <100ms interactions, <3s full page load, 95+ Lighthouse |
| **Accessibility** | WCAG 2.1 AA compliance, screen reader support |
| **Offline-First** | Service worker caching, queue for submissions |
| **Privacy-First** | GDPR-compliant, minimal data collection, consent management |

---

## 2. User Journey Architecture

### 2.1 Beneficiary Journey

```
DISCOVER ──→ APPLY ──→ RECEIVE ──→ FEEDBACK
   │            │           │            │
   ▼            ▼           ▼            ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│SEO     │ │Smart   │ │Real-   │ │Impact  │
│Social  │ │Form    │ │Time    │ │Survey  │
│WhatsApp│ │AI Assist│ │Track   │ │Rating  │
│Referral│ │Progress│ │Updates │ │Testimony│
└────────┘ └────────┘ └────────┘ └────────┘
```

#### Component Implementation

```typescript
// src/features/beneficiary/journey/BeneficiaryJourneyProvider.tsx
interface BeneficiaryJourneyState {
  stage: 'discover' | 'apply' | 'receive' | 'feedback';
  programId: string;
  applicationId?: string;
  status: 'pending' | 'approved' | 'in-progress' | 'completed';
  milestones: JourneyMilestone[];
  feedback?: BeneficiaryFeedback;
}

// src/features/beneficiary/journey/components/
// ├── DiscoverView.tsx          — Program discovery & eligibility check
// ├── SmartApplicationForm.tsx  — Multi-step form with AI assistance
// ├── ApplicationTracker.tsx    — Real-time application status
// ├── ServiceDeliveryView.tsx   — Track aid delivery
// ├── FeedbackForm.tsx          — Post-service feedback
// └── JourneyProgressStepper.tsx — Visual progress indicator
```

#### API Endpoints

```typescript
// api/v2/beneficiary-journey.ts
GET    /api/v2/beneficiary/programs                    // List available programs
GET    /api/v2/beneficiary/programs/:id/eligibility    // Check eligibility
POST   /api/v2/beneficiary/applications                // Submit application
GET    /api/v2/beneficiary/applications/:id/status     // Track status
POST   /api/v2/beneficiary/feedback                    // Submit feedback
GET    /api/v2/beneficiary/impact-summary/:id          // Personal impact summary
```

### 2.2 Donor Journey

```
DISCOVER ──→ TRUST ──→ DONATE ──→ TRACK IMPACT ──→ REPEAT
   │            │          │              │              │
   ▼            ▼          ▼              ▼              ▼
┌────────┐ ┌────────┐ ┌────────┐    ┌────────┐    ┌────────┐
│Impact  │ │Trans-  │ │Multi-  │    │Live    │    │Auto-   │
│Stories │ │parency │ │Payment │    │Dashboard│   │Recurring│
│Social  │ │Reports │ │Methods │    │Stories │    │Nudges  │
│Proof   │ │Ratings │ │QR Code │    │Updates │    │Gratitude│
└────────┘ └────────┘ └────────┘    └────────┘    └────────┘
```

#### Component Implementation

```typescript
// src/features/donor/journey/DonorJourneyProvider.tsx
interface DonorJourneyState {
  stage: 'discover' | 'trust' | 'donate' | 'track' | 'repeat';
  donorProfile?: DonorProfile;
  donations: DonationRecord[];
  impactReports: ImpactReport[];
  recurringSetup?: RecurringDonation;
}

// src/features/donor/journey/components/
// ├── DonationLandingPage.tsx     — Compelling donation entry
// ├── ImpactShowcase.tsx          — Visual impact stories
// ├── TrustSignals.tsx            — Ratings, licenses, transparency
// ├── DonationForm.tsx            — Multi-currency donation form
// ├── PaymentGateway.tsx          — Payment method selection
// ├── DonationConfirmation.tsx    — Success & receipt
// ├── ImpactDashboard.tsx         — Donor-specific impact view
// ├── RecurringDonationSetup.tsx  — Monthly giving setup
// ├── DonorGratitudeWall.tsx      — Thank you recognition
// └── ReEngagementNudge.tsx       — Smart re-engagement prompts
```

#### API Endpoints

```typescript
// api/v2/donor-journey.ts
GET    /api/v2/donor/impact-stories                    // Public impact stories
GET    /api/v2/donor/transparency-report               // Financial transparency
POST   /api/v2/donor/donations                          // Process donation
GET    /api/v2/donor/donations/:id/receipt              // Download receipt
GET    /api/v2/donor/impact-dashboard/:donorId          // Personal impact view
POST   /api/v2/donor/recurring                          // Setup recurring
GET    /api/v2/donor/impact-updates/:donorId            // Latest updates
```

### 2.3 Volunteer Journey

```
DISCOVER ──→ APPLY ──→ ONBOARD ──→ CONTRIBUTE ──→ RECOGNITION
   │            │           │            │              │
   ▼            ▼           ▼            ▼              ▼
┌────────┐ ┌────────┐ ┌────────┐   ┌────────┐    ┌────────┐
│Program │ │Digital │ │Training│   │Task    │    │Badges  │
│Showcase│ │Apply   │ │Modules │   │Board   │    │Leader- │
│Stories │ │Form    │ │Orientation│ │Field  │    │board   │
└────────┘ └────────┘ └────────┘   └────────┘    └────────┘
```

#### Component Implementation

```typescript
// src/features/volunteer/journey/VolunteerJourneyProvider.tsx
interface VolunteerJourneyState {
  stage: 'discover' | 'apply' | 'onboard' | 'contribute' | 'recognition';
  profile?: VolunteerProfile;
  assignments: VolunteerAssignment[];
  badges: VolunteerBadge[];
  hoursLogged: number;
  impactScore: number;
}

// src/features/volunteer/journey/components/
// ├── VolunteerLanding.tsx         — Why volunteer?
// ├── VolunteerApplicationForm.tsx — Skills-based matching
// ├── OnboardingChecklist.tsx      — Training & orientation
// ├── TaskBoard.tsx                — Available assignments
// ├── FieldCheckIn.tsx             — GPS check-in/out
// ├── HoursTracker.tsx             — Time logging
// ├── BadgeShowcase.tsx            — Achievement badges
// ├── VolunteerLeaderboard.tsx     — Community recognition
// └── ImpactSummary.tsx            — Personal contribution view
```

### 2.4 Employee/Admin Journey

```
MANAGE ──→ ANALYZE ──→ REPORT ──→ OPTIMIZE
   │            │          │           │
   ▼            ▼          ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Dashboard│ │BI      │ │Auto    │ │AI      │
│Overview│ │Analytics│ │Reports │ │Recomm- │
│Quick   │ │Trends  │ │Export  │ │endations│
│Actions │ │KPIs    │ │Share   │ │Predict │
└────────┘ └────────┘ └────────┘ └────────┘
```

---

## 3. Content Strategy

### 3.1 Content Types Matrix

| Content Type | Purpose | Freshness | Format | Location |
|--------------|---------|-----------|--------|----------|
| **Impact Stories** | Build trust, emotional connection | Weekly | Video + Text + Photos | `/stories/:slug` |
| **Program Pages** | Inform about services | Monthly | Text + Infographics | `/programs/:id` |
| **Impact Reports** | Transparency, accountability | Quarterly | PDF + Interactive | `/reports/:year/:quarter` |
| **Testimonials** | Social proof | Bi-weekly | Video + Audio + Text | `/testimonials` |
| **FAQ** | Reduce support load | As needed | Text + Searchable | `/faq` |
| **Educational** | Community empowerment | Weekly | Blog + Video | `/learn/:topic` |
| **News/Updates** | Keep stakeholders informed | Daily | Text + Images | `/news` |
| **Annual Reports** | Comprehensive overview | Annual | PDF + Interactive | `/reports/annual/:year` |

### 3.2 Content Freshness Strategy

```typescript
// src/features/content/ContentFreshnessConfig.ts
export const CONTENT_FRESHNESS = {
  impactStories: {
    updateFrequency: 'weekly',
    archiveAfter: '12 months',
    featured: { refreshInterval: '3 days', maxFeatured: 3 },
    categories: ['education', 'relief', 'health', 'water', 'orphan', 'empowerment'],
  },
  programPages: {
    updateFrequency: 'monthly',
    dataRefresh: 'daily',
    beneficiaries: { autoUpdate: true, source: 'serviceDeliveryAPI' },
  },
  impactReports: {
    updateFrequency: 'quarterly',
    formats: ['pdf', 'interactive', 'summary'],
    languages: ['ar', 'en'],
  },
  testimonials: {
    updateFrequency: 'bi-weekly',
    moderation: 'required',
    mediaTypes: ['video', 'audio', 'text', 'photo'],
  },
  newsUpdates: {
    updateFrequency: 'daily',
    categories: ['announcement', 'field-update', 'donor-recognition', 'partner-news'],
  },
  educational: {
    updateFrequency: 'weekly',
    topics: ['hygiene', 'nutrition', 'literacy', 'vocational', 'legal-rights'],
  },
};
```

### 3.3 Multi-Format Content Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTENT CREATION PIPELINE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  FIELD_capture ──→ CONTENT_process ──→ CONTENT_store ──→ PUBLISH │
│       │                │                    │               │      │
│       ▼                ▼                    ▼               ▼      │
│  ┌─────────┐    ┌──────────┐        ┌──────────┐    ┌─────────┐ │
│  │Mobile   │    │Edit &    │        │Media     │    │Multi-   │ │
│  │App      │    │Translate │        │Library   │    │Channel  │ │
│  │Camera   │    │AI Assist │        │CDN       │    │Distribute│ │
│  │GPS      │    │Review    │        │Optimize  │    │Web/App  │ │
│  │Forms    │    │Approve   │        │Archive   │    │Social   │ │
│  └─────────┘    └──────────┘        └──────────┘    └─────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Content Database Schema

```sql
-- Content Management Tables
CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- story, program, report, testimonial, faq, educational, news
  title_ar TEXT NOT NULL,
  title_en TEXT,
  excerpt_ar TEXT,
  excerpt_en TEXT,
  body_ar TEXT,
  body_en TEXT,
  featured_image_url TEXT,
  media_gallery JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  category VARCHAR(100),
  author_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft', -- draft, review, published, archived
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  seo_meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.content_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL, -- image, video, audio, document
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text_ar TEXT,
  alt_text_en TEXT,
  file_size INTEGER,
  duration_seconds INTEGER,
  transcription TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.content_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  locale VARCHAR(5) NOT NULL, -- ar, en
  translated_text TEXT NOT NULL,
  translator_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Engagement Features

### 4.1 Social Sharing Mechanics

```typescript
// src/features/engagement/social/SocialSharingEngine.ts
export const SHARE_CONFIG = {
  platforms: {
    whatsapp: {
      enabled: true,
      shareUrl: (url: string, text: string) => 
        `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      icon: 'MessageCircle',
      color: '#25D366',
    },
    facebook: {
      enabled: true,
      shareUrl: (url: string) => 
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: 'Facebook',
      color: '#1877F2',
    },
    twitter: {
      enabled: true,
      shareUrl: (url: string, text: string) => 
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      icon: 'Twitter',
      color: '#1DA1F2',
    },
    telegram: {
      enabled: true,
      shareUrl: (url: string, text: string) => 
        `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      icon: 'Send',
      color: '#0088cc',
    },
    linkedin: {
      enabled: true,
      shareUrl: (url: string) => 
        `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}`,
      icon: 'Linkedin',
      color: '#0A66C2',
    },
  },
  shareTriggers: {
    afterDonation: true,
    afterImpactView: true,
    onStoryCompletion: true,
    onMilestone: true,
  },
  shareRewards: {
    enabled: true,
    pointsPerShare: 10,
    badges: ['social-ambassador', 'impact-spreader', 'community-champion'],
  },
};

// src/features/engagement/social/components/
// ├── ShareButton.tsx             — Platform-specific share button
// ├── ShareModal.tsx              — Multi-platform share dialog
// ├── ShareTracker.tsx            — Track share analytics
// ├── SocialFeed.tsx              — Embedded social feed
// └── WhatsAppWidget.tsx          — WhatsApp chat integration
```

### 4.2 Community Forum/Discussion

```typescript
// src/features/community/forum/ForumSystem.ts
interface ForumCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  icon: string;
  threadCount: number;
  lastActivity: Date;
}

interface ForumThread {
  id: string;
  categoryId: string;
  title: string;
  author: ForumUser;
  content: string;
  replies: ForumReply[];
  tags: string[];
  pinned: boolean;
  locked: boolean;
  viewCount: number;
  replyCount: number;
  createdAt: Date;
  lastReplyAt: Date;
}

// src/features/community/forum/components/
// ├── ForumLayout.tsx             — Forum wrapper
// ├── ForumCategoryList.tsx       — Category navigation
// ├── ForumThreadList.tsx         — Thread listing
// ├── ForumThreadView.tsx         — Thread detail + replies
// ├── ForumNewThread.tsx          — Create new thread
// ├── ForumReplyForm.tsx          — Reply to thread
// ├── ForumSearch.tsx             — Search threads
// └── ForumModeration.tsx         — Moderation tools
```

### 4.3 Live Updates & Notifications

```typescript
// src/features/engagement/notifications/NotificationSystem.ts
export const NOTIFICATION_CHANNELS = {
  inApp: { enabled: true, maxVisible: 5, persistDays: 30 },
  email: { enabled: true, digestFrequency: 'daily' },
  push: { enabled: true, vapidKey: process.env.VAPID_PUBLIC_KEY },
  sms: { enabled: false, provider: 'twilio' },
  whatsapp: { enabled: true, businessAccountId: process.env.WABA_ID },
};

export const NOTIFICATION_TYPES = {
  donation: {
    received: { titleAr: 'تم استلام تبرعك', priority: 'high' },
    receipt: { titleAr: 'إيصال تبرعك جاهز', priority: 'medium' },
    impact: { titleAr: 'تحديث أثر تبرعك', priority: 'medium' },
  },
  beneficiary: {
    applicationUpdate: { titleAr: 'تحديث طلبك', priority: 'high' },
    serviceDelivery: { titleAr: 'تحديث الخدمة', priority: 'high' },
    feedback: { titleAr: 'نحب نسمع منك', priority: 'low' },
  },
  volunteer: {
    newAssignment: { titleAr: 'مهمة جديدة', priority: 'high' },
    hoursApproved: { titleAr: 'تم اعتماد ساعاتك', priority: 'medium' },
    badgeEarned: { titleAr: 'حصلت على شارة جديدة', priority: 'low' },
  },
  community: {
    threadReply: { titleAr: 'رد جديد على منشورك', priority: 'low' },
    mention: { titleAr: 'تم ذكرك', priority: 'medium' },
    eventReminder: { titleAr: 'تذكير بحدث قادم', priority: 'medium' },
  },
  system: {
    maintenance: { titleAr: 'صيانة مجدولة', priority: 'medium' },
    announcement: { titleAr: 'إعلان هام', priority: 'high' },
  },
};

// src/features/engagement/notifications/components/
// ├── NotificationCenter.tsx      — Notification dropdown
// ├── NotificationBell.tsx        — Bell icon with badge
// ├── NotificationPreferences.tsx — User preferences
// ├── PushNotificationSetup.tsx   — Browser push setup
// └── NotificationToast.tsx       — Toast notifications
```

### 4.4 Gamification System

```typescript
// src/features/engagement/gamification/GamificationEngine.ts
export const BADGE_DEFINITIONS = {
  // Donor Badges
  'first-donor': { nameAr: 'أول متبرع', icon: '🌟', criteria: { donations: 1 } },
  'generous-heart': { nameAr: 'قلب كريم', icon: '❤️', criteria: { totalAmount: 1000 } },
  'monthly-champion': { nameAr: 'بطل الشهري', icon: '🏆', criteria: { recurringMonths: 6 } },
  'impact-ambassador': { nameAr: 'سفير الأثر', icon: '🌍', criteria: { shares: 50 } },
  
  // Volunteer Badges
  'first-volunteer': { nameAr: 'أول متطوع', icon: '🤝', criteria: { hours: 1 } },
  'dedicated-server': { nameAr: 'مخدوم مخلص', icon: '⭐', criteria: { hours: 100 } },
  'field-hero': { nameAr: 'بطل الميدان', icon: '🦸', criteria: { fieldCheckIns: 25 } },
  'mentor-master': { nameAr: 'استاذي المعلّم', icon: '📚', criteria: { mentored: 5 } },
  
  // Community Badges
  'community-starter': { nameAr: 'بادئ المجتمع', icon: '💬', criteria: { threads: 10 } },
  'helpful-hand': { nameAr: 'يد المساعدة', icon: '🤲', criteria: { helpfulReplies: 25 } },
  'knowledge-sharer': { nameAr: 'مشارك المعرفة', icon: '📖', criteria: { educationalShares: 20 } },
  
  // Beneficiary Badges
  'feedback-champion': { nameAr: 'بطل الملاحظات', icon: '📝', criteria: { feedbacks: 5 } },
  'story-sharer': { nameAr: 'شارك قصتك', icon: '🎥', criteria: { storiesShared: 3 } },
};

export const LEADERBOARD_CONFIG = {
  categories: ['donors', 'volunteers', 'community', 'ambassadors'],
  timeframes: ['weekly', 'monthly', 'quarterly', 'all-time'],
  displayCount: 10,
  anonymize: true, // Show first name + last initial only
  refreshInterval: '1 hour',
};

export const IMPACT_POINTS = {
  donation: { perYER: 0.1, perUSD: 10 },
  volunteer: { perHour: 50 },
  share: { perShare: 10 },
  feedback: { perFeedback: 25 },
  referral: { perReferral: 100 },
  forumPost: { perPost: 5 },
  educationalComplete: { perModule: 30 },
};

// src/features/engagement/gamification/components/
// ├── BadgeShowcase.tsx           — Display user badges
// ├── BadgeEarnedModal.tsx        — Celebration modal
// ├── LeaderboardView.tsx         — Leaderboard display
// ├── ImpactScoreCard.tsx         — Points & level display
// ├── ProgressTracker.tsx         — Badge progress bars
// └── AchievementTimeline.tsx     — Achievement history
```

### 4.5 WhatsApp/Social Media Integration

```typescript
// src/features/engagement/whatsapp/WhatsAppIntegration.ts
export const WHATSAPP_CONFIG = {
  businessAccountId: process.env.WABA_ID,
  phoneNumberId: process.env.WHATSAPP_PHONE_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  webhookVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  
  templates: {
    donationConfirmation: {
      name: 'donation_confirmation_ar',
      language: 'ar',
      components: [
        { type: 'header', parameters: [{ type: 'image', image: { link: '{{receipt_image_url}}' } }] },
        { type: 'body', parameters: [
          { type: 'text', text: '{{donor_name}}' },
          { type: 'text', text: '{{amount}}' },
          { type: 'text', text: '{{date}}' },
        ]},
      ],
    },
    impactUpdate: {
      name: 'impact_update_ar',
      language: 'ar',
      components: [
        { type: 'body', parameters: [
          { type: 'text', text: '{{donor_name}}' },
          { type: 'text', text: '{{impact_summary}}' },
          { type: 'text', text: '{{story_link}}' },
        ]},
      ],
    },
    beneficiaryUpdate: {
      name: 'beneficiary_status_ar',
      language: 'ar',
      components: [
        { type: 'body', parameters: [
          { type: 'text', text: '{{beneficiary_name}}' },
          { type: 'text', text: '{{status}}' },
          { type: 'text', text: '{{next_steps}}' },
        ]},
      ],
    },
  },
  
  chatbot: {
    enabled: true,
    intents: [
      'donate',
      'check_status',
      'learn_programs',
      'contact_human',
      'get_receipt',
      'share_story',
    ],
    fallbackToHuman: true,
    maxAutoReplies: 3,
  },
};

// src/features/engagement/whatsapp/components/
// ├── WhatsAppWidget.tsx          — Floating WhatsApp button
// ├── WhatsAppChat.tsx            — Embedded chat
// ├── WhatsAppStatus.tsx          — Order/delivery status
// └── WhatsAppShare.tsx           — Share to WhatsApp
```

---

## 5. Marketing Automation

### 5.1 Email Sequences

```typescript
// src/features/marketing/email/EmailSequenceConfig.ts
export const EMAIL_SEQUENCES = {
  welcome: {
    name: 'Welcome Sequence',
    trigger: 'first_registration',
    emails: [
      {
        delay: '0 minutes',
        template: 'welcome_immediate',
        subjectAr: 'مرحباً {{name}} في عائلة رُحماء 💚',
        subjectEn: 'Welcome {{name}} to Rohamaa Family',
        content: {
          heroImage: '/images/welcome-hero.jpg',
          cta: { textAr: 'اكتشف برامجنا', url: '/programs' },
        },
      },
      {
        delay: '2 days',
        template: 'welcome_story',
        subjectAr: 'قصة أثرت فينا — شاركك أثرك',
        content: {
          featuredStory: 'latest_impact_story',
          cta: { textAr: 'شاهد القصة', url: '/stories/latest' },
        },
      },
      {
        delay: '7 days',
        template: 'welcome_engage',
        subjectAr: 'كيف يمكنك المساهمة اليوم',
        content: {
          actions: ['donate', 'volunteer', 'share'],
          personalized: true,
        },
      },
    ],
  },
  
  donationConfirmation: {
    name: 'Donation Confirmation',
    trigger: 'donation_completed',
    emails: [
      {
        delay: '0 minutes',
        template: 'donation_receipt',
        subjectAr: 'إيصال تبرعك — {{amount}} {{currency}}',
        content: {
          receipt: true,
          taxDeductible: true,
          shareButtons: true,
        },
      },
      {
        delay: '7 days',
        template: 'donation_impact_first',
        subjectAr: 'أثر تبرعك بدأ يظهر ✨',
        content: {
          impactSummary: true,
          beneficiaryStory: true,
          cta: { textAr: 'شاهد الأثر', url: '/impact/dashboard' },
        },
      },
      {
        delay: '30 days',
        template: 'donation_impact_update',
        subjectAr: 'تقرير أثر تبرعك الشهري',
        content: {
          monthlyReport: true,
          progressToGoal: true,
          recurringNudge: true,
        },
      },
    ],
  },
  
  reEngagement: {
    name: 'Re-engagement Sequence',
    trigger: 'inactive_30_days',
    emails: [
      {
        delay: '0 days',
        template: 'reengage_miss_you',
        subjectAr: 'اشتقنا لك — آخر أخبار رُحماء',
        content: {
          latestImpact: true,
          newPrograms: true,
          cta: { textAr: 'اكتشف ما فاتك', url: '/latest' },
        },
      },
      {
        delay: '14 days',
        template: 'reengage_urgent_need',
        subjectAr: 'حاجة عاجلة — مشاركتك تصنع الفرق',
        content: {
          urgentCase: true,
          socialProof: true,
          cta: { textAr: 'ساعد الآن', url: '/donate/urgent' },
        },
      },
      {
        delay: '30 days',
        template: 'reengage_last_chance',
        subjectAr: 'لا تفوّت فرصة الأثر',
        content: {
          annualImpact: true,
          thankYou: true,
          easyActions: true,
        },
      },
    ],
  },
  
  impactUpdates: {
    name: 'Impact Update Series',
    trigger: 'monthly',
    emails: [
      {
        delay: '1st of month',
        template: 'monthly_impact',
        subjectAr: 'تقرير أثرك — {{month}} {{year}}',
        content: {
          personalImpact: true,
          orgImpact: true,
          upcomingPrograms: true,
          sharePrompt: true,
        },
      },
    ],
  },
};
```

### 5.2 Push Notifications Strategy

```typescript
// src/features/marketing/push/PushNotificationStrategy.ts
export const PUSH_STRATEGY = {
  optIn: {
    timing: 'after_first_action', // Don't ask immediately
    message: {
      ar: 'افتح الإشعارات لتتابع أثر تبرعاتك لحظة بلحظة',
      en: 'Enable notifications to track your donations in real-time',
    },
    respectChoice: true,
    askAgainAfter: '30 days',
  },
  
  segments: {
    donors: {
      frequency: 'max 3/week',
      bestTimes: ['10:00', '14:00', '20:00'],
      content: ['impact-updates', 'new-campaigns', 'gratitude'],
    },
    volunteers: {
      frequency: 'max 5/week',
      bestTimes: ['08:00', '12:00', '18:00'],
      content: ['new-assignments', 'schedule-changes', 'achievements'],
    },
    beneficiaries: {
      frequency: 'max 2/week',
      bestTimes: ['09:00', '15:00'],
      content: ['application-updates', 'service-updates', 'feedback-requests'],
    },
    community: {
      frequency: 'max 4/week',
      bestTimes: ['11:00', '19:00'],
      content: ['forum-activity', 'events', 'educational-content'],
    },
  },
  
  rules: {
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    timezone: 'Asia/Aden',
    maxPerDay: 5,
    minInterval: '2 hours',
    deduplicateWindow: '24 hours',
  },
};
```

### 5.3 Social Media Content Calendar

```typescript
// src/features/marketing/social/SocialMediaCalendar.ts
export const CONTENT_CALENDAR = {
  platforms: {
    facebook: {
      postingFrequency: 'daily',
     最佳Times: ['10:00', '14:00', '20:00'],
      contentMix: {
        impactStories: 0.3,
        educational: 0.2,
        behindTheScenes: 0.15,
        callsToAction: 0.15,
        userGenerated: 0.1,
        communityHighlights: 0.1,
      },
      features: ['live', 'stories', 'reels', 'groups'],
    },
    instagram: {
      postingFrequency: 'daily',
     最佳Times: ['09:00', '12:00', '18:00'],
      contentMix: {
        photos: 0.4,
        reels: 0.3,
        stories: 0.2,
        carousels: 0.1,
      },
      hashtags: {
        primary: ['#رُحماء', '#Rohamaa', '#YemenCharity'],
        secondary: ['#HumanitarianAid', '#Yemen', '#CharityWork'],
        campaign: [], // Dynamic per campaign
      },
    },
    twitter: {
      postingFrequency: '3-5/day',
     最佳Times: ['08:00', '12:00', '17:00', '21:00'],
      contentMix: {
        threads: 0.3,
        quickUpdates: 0.3,
        retweets: 0.2,
        engagementTweets: 0.2,
      },
    },
    youtube: {
      postingFrequency: 'weekly',
      contentTypes: ['impact-documentaries', 'testimonials', 'educational', 'behind-the-scenes'],
      shorts: { frequency: '3/week', maxDuration: 60 },
    },
    tiktok: {
      postingFrequency: '3-4/week',
      contentTypes: ['before-after', 'day-in-the-life', 'educational', 'emotional'],
      maxDuration: 60,
    },
  },
  
  contentPillars: [
    { nameAr: 'قصص الأثر', nameEn: 'Impact Stories', weight: 0.35 },
    { nameAr: 'الشفافية المالية', nameEn: 'Financial Transparency', weight: 0.20 },
    { nameAr: 'تعليمة وتمكين', nameEn: 'Education & Empowerment', weight: 0.20 },
    { nameAr: 'خلف الكواليس', nameEn: 'Behind the Scenes', weight: 0.15 },
    { nameAr: 'دعوة للعمل', nameEn: 'Calls to Action', weight: 0.10 },
  ],
  
  campaignTemplates: [
    {
      name: 'Ramadan Campaign',
      duration: '30 days',
      dailyContent: true,
      themes: ['iftar', 'zakat', 'sadaqah', 'orphan-sponsorship'],
    },
    {
      name: 'Back to School',
      duration: '21 days',
      themes: ['education', 'supplies', 'children', 'hope'],
    },
    {
      name: 'Winter Relief',
      duration: '60 days',
      themes: ['warmth', 'shelter', 'family', 'dignity'],
    },
  ],
};
```

### 5.4 SEO Content Strategy

```typescript
// src/features/marketing/seo/SEOStrategy.ts
export const SEO_CONFIG = {
  sitemap: {
    updateFrequency: 'daily',
    includeImages: true,
    includeVideos: true,
    priorities: {
      homepage: 1.0,
      programs: 0.9,
      donate: 0.9,
      stories: 0.8,
      about: 0.7,
      contact: 0.6,
      blog: 0.5,
    },
  },
  
  structuredData: {
    organization: {
      '@type': 'NGO',
      name: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
      nameEn: 'Rohamaa Baynahum Charity Foundation',
      url: 'https://rbdcye.org',
      logo: 'https://rbdcye.org/images/logo.png',
      sameAs: [
        'https://facebook.com/rohamaa',
        'https://twitter.com/rohamaa',
        'https://instagram.com/rohamaa',
        'https://youtube.com/rohamaa',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+967-XXX-XXXX',
        contactType: 'customer service',
        availableLanguage: ['Arabic', 'English'],
      },
      areaServed: {
        '@type': 'Country',
        name: 'Yemen',
      },
      knowsAbout: [
        'Humanitarian Aid',
        'Education',
        'Healthcare',
        'Water & Sanitation',
        'Orphan Care',
        'Economic Empowerment',
      ],
    },
    
    breadcrumbList: true,
    faqPage: true,
    howTo: true,
    videoObject: true,
    event: true,
    donateAction: {
      '@type': 'DonateAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://rbdcye.org/donate',
      },
      result: {
        '@type': 'DonateAction',
        name: 'Donate to Rohamaa',
      },
    },
  },
  
  keywordStrategy: {
    primaryKeywords: [
      { ar: 'تبرع لليمن', en: 'donate to yemen', volume: 'high' },
      { ar: 'جمعية رُحماء', en: 'rohamaa charity', volume: 'medium' },
      { ar: 'إغاثة يمنية', en: 'yemen relief', volume: 'high' },
      { ar: 'كفالة أيتام يمن', en: 'yemen orphan sponsorship', volume: 'medium' },
    ],
    longTailKeywords: [
      { ar: 'كيف أتبرع لجمعية رُحماء', en: 'how to donate to rohamaa' },
      { ar: 'برامج رُحماء في اليمن', en: 'rohamaa programs in yemen' },
      { ar: 'تبرعات معفاة من الضرائب', en: 'tax deductible donations yemen' },
    ],
    programKeywords: [
      { program: 'education', keywords: ['تعليم', 'education', 'مدرسة', 'school'] },
      { program: 'health', keywords: ['صحة', 'health', '医疗', 'medical'] },
      { program: 'water', keywords: ['مياه', 'water', 'نظافة', 'hygiene'] },
      { program: 'orphan', keywords: ['أيتام', 'orphan', 'كفالة', 'sponsorship'] },
      { program: 'empowerment', keywords: ['تمكين', 'empowerment', 'تدريب', 'training'] },
    ],
  },
  
  technicalSEO: {
    coreWebVitals: {
      LCP: { target: '<2.5s', critical: '>4s' },
      FID: { target: '<100ms', critical: '>300ms' },
      CLS: { target: '<0.1', critical: '>0.25' },
    },
    accessibility: {
      target: 'WCAG 2.1 AA',
      regularAudit: 'monthly',
    },
    internationalization: {
      hreflang: true,
      sitemapLanguages: ['ar', 'en'],
      defaultLanguage: 'ar',
    },
  },
};
```

---

## 6. Analytics & Intelligence

### 6.1 What to Track

```typescript
// src/features/analytics/TrackingConfig.ts
export const TRACKING_EVENTS = {
  // User Engagement
  page_view: { properties: ['page', 'referrer', 'duration', 'scroll_depth'] },
  session_start: { properties: ['device', 'browser', 'location', 'utm_source'] },
  session_end: { properties: ['duration', 'pages_viewed', 'actions_taken'] },
  
  // Donation Flow
  donate_page_view: { properties: ['source', 'campaign'] },
  donate_form_start: { properties: ['amount_suggested', 'currency'] },
  donate_form_complete: { properties: ['amount', 'currency', 'payment_method', 'recurring'] },
  donate_success: { properties: ['amount', 'currency', 'receipt_id'] },
  donate_receipt_download: { properties: ['format', 'donation_id'] },
  
  // Content Engagement
  story_view: { properties: ['story_id', 'category', 'duration', 'completion_rate'] },
  story_share: { properties: ['story_id', 'platform', 'share_type'] },
  video_play: { properties: ['video_id', 'duration', 'completion_rate'] },
  document_download: { properties: ['doc_id', 'type', 'format'] },
  
  // Program Interaction
  program_view: { properties: ['program_id', 'source'] },
  program_apply_start: { properties: ['program_id'] },
  program_apply_complete: { properties: ['program_id', 'time_to_complete'] },
  
  // Community
  forum_post: { properties: ['category', 'thread_id'] },
  forum_reply: { properties: ['thread_id', 'reply_count'] },
  badge_earned: { properties: ['badge_id', 'category'] },
  
  // Marketing
  email_open: { properties: ['campaign', 'template', 'device'] },
  email_click: { properties: ['campaign', 'link', 'position'] },
  push_received: { properties: ['campaign', 'type'] },
  push_opened: { properties: ['campaign', 'type', 'time_to_open'] },
  whatsapp_message: { properties: ['direction', 'template', 'intent'] },
  
  // Conversion
  utm_click: { properties: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] },
  conversion_goal: { properties: ['goal_type', 'value', 'attribution'] },
};

export const CUSTOM_DIMENSIONS = {
  userSegment: ['donor', 'beneficiary', 'volunteer', 'employee', 'visitor'],
  donationTier: ['micro', 'small', 'medium', 'large', 'major'],
  engagementLevel: ['inactive', 'low', 'medium', 'high', 'champion'],
  geographicRegion: ['aden', 'sanaa', 'hadramaut', 'taiz', 'hodeidah', 'ibb', 'marib', 'shabwah'],
};
```

### 6.2 Data Usage for Decisions

```typescript
// src/features/analytics/InsightsEngine.ts
export const INSIGHT_QUERIES = {
  donorRetention: {
    name: 'Donor Retention Rate',
    query: `
      SELECT 
        DATE_TRUNC('month', first_donation_date) as cohort,
        COUNT(DISTINCT donor_id) as initial_donors,
        COUNT(DISTINCT CASE WHEN donation_date > first_donation_date + INTERVAL '90 days' THEN donor_id END) as retained_donors,
        ROUND(COUNT(DISTINCT CASE WHEN donation_date > first_donation_date + INTERVAL '90 days' THEN donor_id END) * 100.0 / COUNT(DISTINCT donor_id), 2) as retention_rate
      FROM donations
      GROUP BY cohort
      ORDER BY cohort DESC
    `,
    actionThreshold: { retention_rate: { warning: 40, critical: 25 } },
  },
  
  programEffectiveness: {
    name: 'Program Effectiveness Score',
    query: `
      SELECT 
        p.name,
        COUNT(DISTINCT b.id) as beneficiaries_served,
        AVG(b.satisfaction_score) as avg_satisfaction,
        SUM(d.total_amount) as total_spent,
        SUM(d.total_amount) / COUNT(DISTINCT b.id) as cost_per_beneficiary,
        (AVG(b.satisfaction_score) * 0.4 + (1 - (SUM(d.total_amount) / COUNT(DISTINCT b.id) / 1000)) * 0.3 + (COUNT(DISTINCT b.id) / p.target_beneficiaries * 0.3)) as effectiveness_score
      FROM programs p
      JOIN beneficiaries b ON b.program_id = p.id
      JOIN disbursements d ON d.program_id = p.id
      GROUP BY p.id, p.name
      ORDER BY effectiveness_score DESC
    `,
  },
  
  campaignROI: {
    name: 'Campaign Return on Investment',
    query: `
      SELECT 
        c.name,
        c.budget,
        SUM(d.amount) as total_raised,
        ROUND((SUM(d.amount) - c.budget) / c.budget * 100, 2) as roi_percentage,
        COUNT(DISTINCT d.donor_id) as unique_donors,
        AVG(d.amount) as avg_donation
      FROM campaigns c
      LEFT JOIN donations d ON d.campaign_id = c.id
      WHERE c.start_date >= NOW() - INTERVAL '1 year'
      GROUP BY c.id, c.name, c.budget
      ORDER BY roi_percentage DESC
    `,
  },
  
  contentPerformance: {
    name: 'Content Performance Analysis',
    query: `
      SELECT 
        ci.content_type,
        ci.title,
        ci.view_count,
        ci.share_count,
        (ci.share_count * 100.0 / NULLIF(ci.view_count, 0)) as share_rate,
        AVG(s.time_on_page) as avg_time_on_page,
        AVG(s.scroll_depth) as avg_scroll_depth,
        COUNT(DISTINCT s.user_id) as unique_visitors
      FROM content_items ci
      JOIN content_sessions s ON s.content_id = ci.id
      WHERE ci.published_at >= NOW() - INTERVAL '30 days'
      GROUP BY ci.id
      ORDER BY share_rate DESC
    `,
  },
};
```

### 6.3 A/B Testing Framework

```typescript
// src/features/analytics/ABTestingFramework.ts
export interface ABTest {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  variants: ABVariant[];
  trafficSplit: number[]; // e.g., [50, 50] or [33, 33, 34]
  targetMetric: string;
  minimumSampleSize: number;
  significanceLevel: number; // 0.05
  power: number; // 0.8
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'running' | 'paused' | 'completed';
  results?: ABTestResults;
}

export const ACTIVE_TESTS = {
  donationFormLayout: {
    name: 'Donation Form Layout',
    variants: [
      { id: 'control', name: 'Single Page', description: 'All fields on one page' },
      { id: 'multi-step', name: 'Multi-Step', description: 'Step-by-step wizard' },
    ],
    trafficSplit: [50, 50],
    targetMetric: 'donation_completion_rate',
    minimumSampleSize: 1000,
    currentWinner: 'multi-step', // Preliminary
  },
  
  ctaColor: {
    name: 'CTA Button Color',
    variants: [
      { id: 'green', name: 'Emerald Green', color: '#059669' },
      { id: 'orange', name: 'Amber Orange', color: '#d97706' },
      { id: 'red', name: 'Charity Red', color: '#dc2626' },
    ],
    trafficSplit: [33, 33, 34],
    targetMetric: 'click_through_rate',
    minimumSampleSize: 2000,
  },
  
  socialProof: {
    name: 'Social Proof Display',
    variants: [
      { id: 'count', name: 'Donation Count', description: 'X people donated today' },
      { id: 'amount', name: 'Total Amount', description: 'Y raised this month' },
      { id: 'story', name: 'Latest Story', description: 'Featured beneficiary story' },
    ],
    trafficSplit: [33, 33, 34],
    targetMetric: 'donation_initiation_rate',
    minimumSampleSize: 1500,
  },
};
```

### 6.4 Conversion Optimization

```typescript
// src/features/analytics/ConversionOptimizer.ts
export const CONVERSION_FUNNELS = {
  donation: {
    name: 'Donation Funnel',
    steps: [
      { name: 'Landing Page', metric: 'page_views' },
      { name: 'Donate Button Click', metric: 'cta_clicks' },
      { name: 'Form Started', metric: 'form_starts' },
      { name: 'Amount Selected', metric: 'amount_selected' },
      { name: 'Payment Info Entered', metric: 'payment_started' },
      { name: 'Donation Completed', metric: 'donations_completed' },
    ],
    benchmarks: {
      landing_to_cta: 0.15,
      cta_to_form: 0.40,
      form_to_payment: 0.70,
      payment_to_complete: 0.85,
      overall: 0.035,
    },
    alerts: {
      dropBelowBenchmark: 0.7, // Alert if any step drops below 70% of benchmark
      conversionRateCritical: 0.02,
    },
  },
  
  volunteer: {
    name: 'Volunteer Application Funnel',
    steps: [
      { name: 'Volunteer Page', metric: 'page_views' },
      { name: 'Apply Click', metric: 'apply_clicks' },
      { name: 'Form Started', metric: 'form_starts' },
      { name: 'Form Completed', metric: 'form_completions' },
      { name: 'Onboarding Started', metric: 'onboarding_starts' },
      { name: 'First Assignment', metric: 'first_assignments' },
    ],
  },
  
  email: {
    name: 'Email Conversion Funnel',
    steps: [
      { name: 'Email Sent', metric: 'emails_sent' },
      { name: 'Email Delivered', metric: 'emails_delivered' },
      { name: 'Email Opened', metric: 'email_opens' },
      { name: 'Link Clicked', metric: 'email_clicks' },
      { name: 'Action Completed', metric: 'email_conversions' },
    ],
    benchmarks: {
      delivery_rate: 0.98,
      open_rate: 0.25,
      click_rate: 0.05,
      conversion_rate: 0.02,
    },
  },
};
```

---

## 7. Technical Architecture

### 7.1 Component Hierarchy

```
src/
├── features/                          # Feature modules (domain-driven)
│   ├── public-website/                # Public website feature module
│   │   ├── landing/                   # Homepage & landing pages
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ImpactCounter.tsx
│   │   │   ├── FeaturedPrograms.tsx
│   │   │   ├── LatestStories.tsx
│   │   │   ├── DonorTestimonials.tsx
│   │   │   ├── TransparencyWidget.tsx
│   │   │   ├── CallToAction.tsx
│   │   │   └── FooterLinks.tsx
│   │   ├── programs/                  # Program pages
│   │   │   ├── ProgramList.tsx
│   │   │   ├── ProgramCard.tsx
│   │   │   ├── ProgramDetail.tsx
│   │   │   ├── ProgramImpact.tsx
│   │   │   ├── ProgramMap.tsx
│   │   │   └── ProgramTimeline.tsx
│   │   ├── stories/                   # Impact stories
│   │   │   ├── StoryFeed.tsx
│   │   │   ├── StoryCard.tsx
│   │   │   ├── StoryDetail.tsx
│   │   │   ├── StoryGallery.tsx
│   │   │   ├── StoryVideo.tsx
│   │   │   └── StoryShare.tsx
│   │   ├── about/                     # About pages
│   │   │   ├── AboutHero.tsx
│   │   │   ├── TeamSection.tsx
│   │   │   ├── TimelineSection.tsx
│   │   │   ├── PartnersSection.tsx
│   │   │   ├── LicenseSection.tsx
│   │   │   └── ContactSection.tsx
│   │   └── reports/                   # Impact reports
│   │       ├── ReportList.tsx
│   │       ├── ReportCard.tsx
│   │       ├── ReportViewer.tsx
│   │       ├── ReportCharts.tsx
│   │       └── ReportDownload.tsx
│   ├── beneficiary/                   # Beneficiary journey
│   │   ├── journey/
│   │   │   ├── BeneficiaryJourneyProvider.tsx
│   │   │   ├── DiscoverView.tsx
│   │   │   ├── SmartApplicationForm.tsx
│   │   │   ├── ApplicationTracker.tsx
│   │   │   ├── ServiceDeliveryView.tsx
│   │   │   └── FeedbackForm.tsx
│   │   └── components/
│   │       ├── EligibilityChecker.tsx
│   │       ├── DocumentUpload.tsx
│   │       ├── StatusTimeline.tsx
│   │       └── ImpactReceipt.tsx
│   ├── donor/                         # Donor journey
│   │   ├── journey/
│   │   │   ├── DonorJourneyProvider.tsx
│   │   │   ├── DonationLandingPage.tsx
│   │   │   ├── DonationForm.tsx
│   │   │   ├── PaymentGateway.tsx
│   │   │   ├── DonationConfirmation.tsx
│   │   │   ├── ImpactDashboard.tsx
│   │   │   └── RecurringDonationSetup.tsx
│   │   └── components/
│   │       ├── ImpactShowcase.tsx
│   │       ├── TrustSignals.tsx
│   │       ├── DonationReceipt.tsx
│   │       ├── DonorGratitudeWall.tsx
│   │       └── ReEngagementNudge.tsx
│   ├── volunteer/                     # Volunteer journey
│   │   ├── journey/
│   │   │   ├── VolunteerJourneyProvider.tsx
│   │   │   ├── VolunteerLanding.tsx
│   │   │   ├── VolunteerApplicationForm.tsx
│   │   │   ├── OnboardingChecklist.tsx
│   │   │   ├── TaskBoard.tsx
│   │   │   └── HoursTracker.tsx
│   │   └── components/
│   │       ├── FieldCheckIn.tsx
│   │       ├── BadgeShowcase.tsx
│   │       ├── VolunteerLeaderboard.tsx
│   │       └── ImpactSummary.tsx
│   ├── community/                     # Community features
│   │   ├── forum/
│   │   │   ├── ForumLayout.tsx
│   │   │   ├── ForumCategoryList.tsx
│   │   │   ├── ForumThreadList.tsx
│   │   │   ├── ForumThreadView.tsx
│   │   │   ├── ForumNewThread.tsx
│   │   │   └── ForumSearch.tsx
│   │   ├── events/
│   │   │   ├── EventCalendar.tsx
│   │   │   ├── EventCard.tsx
│   │   │   ├── EventDetail.tsx
│   │   │   └── EventRegistration.tsx
│   │   └── education/
│   │       ├── CourseList.tsx
│   │       ├── CoursePlayer.tsx
│   │       ├── QuizComponent.tsx
│   │       └── CertificateGenerator.tsx
│   ├── engagement/                    # Engagement features
│   │   ├── social/
│   │   │   ├── ShareButton.tsx
│   │   │   ├── ShareModal.tsx
│   │   │   ├── SocialFeed.tsx
│   │   │   └── WhatsAppWidget.tsx
│   │   ├── notifications/
│   │   │   ├── NotificationCenter.tsx
│   │   │   ├── NotificationBell.tsx
│   │   │   ├── NotificationPreferences.tsx
│   │   │   └── PushNotificationSetup.tsx
│   │   └── gamification/
│   │       ├── BadgeShowcase.tsx
│   │       ├── BadgeEarnedModal.tsx
│   │       ├── LeaderboardView.tsx
│   │       ├── ImpactScoreCard.tsx
│   │       └── ProgressTracker.tsx
│   ├── marketing/                     # Marketing automation
│   │   ├── email/
│   │   │   ├── EmailTemplateEngine.tsx
│   │   │   ├── EmailPreferences.tsx
│   │   │   └── EmailAnalytics.tsx
│   │   ├── social/
│   │   │   ├── SocialMediaCalendar.tsx
│   │   │   ├── SocialScheduler.tsx
│   │   │   └── SocialAnalytics.tsx
│   │   └── seo/
│   │       ├── SEOHead.tsx
│   │       ├── SitemapGenerator.tsx
│   │       └── StructuredData.tsx
│   └── analytics/                     # Analytics & intelligence
│       ├── dashboard/
│       │   ├── AnalyticsDashboard.tsx
│       │   ├── ConversionFunnel.tsx
│       │   ├── CohortAnalysis.tsx
│       │   └── CampaignPerformance.tsx
│       └── ab-testing/
│           ├── ABTestRunner.tsx
│           ├── VariantSelector.tsx
│           └── ResultsViewer.tsx
├── components/                        # Shared components
│   ├── ui/                            # Design system components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── DatePicker.tsx
│   │   ├── Table.tsx
│   │   ├── Tabs.tsx
│   │   ├── Accordion.tsx
│   │   ├── Tooltip.tsx
│   │   └── ProgressBar.tsx
│   ├── layout/                        # Layout components
│   │   ├── PublicHeader.tsx
│   │   ├── PublicFooter.tsx
│   │   ├── MobileNavigation.tsx
│   │   ├── Sidebar.tsx
│   │   ├── PageContainer.tsx
│   │   └── Breadcrumbs.tsx
│   ├── shared/                        # Shared feature components
│   │   ├── ImpactCounter.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── SearchBar.tsx
│   │   ├── InfiniteScroll.tsx
│   │   ├── LazyLoad.tsx
│   │   └── ErrorBoundary.tsx
│   └── media/                         # Media components
│       ├── ImageWithFallback.tsx
│       ├── VideoPlayer.tsx
│       ├── AudioPlayer.tsx
│       ├── ImageGallery.tsx
│       └── DocumentViewer.tsx
├── hooks/                             # Custom hooks
│   ├── useDonation.ts
│   ├── useBeneficiary.ts
│   ├── useVolunteer.ts
│   ├── useCommunity.ts
│   ├── useAnalytics.ts
│   ├── usePushNotification.ts
│   ├── useWhatsApp.ts
│   ├── useShare.ts
│   ├── useGamification.ts
│   ├── useA/BTest.ts
│   └── useSEO.ts
├── store/                             # State management
│   ├── slices/
│   │   ├── publicWebsiteSlice.ts
│   │   ├── beneficiarySlice.ts
│   │   ├── donorSlice.ts
│   │   ├── volunteerSlice.ts
│   │   ├── communitySlice.ts
│   │   ├── engagementSlice.ts
│   │   ├── analyticsSlice.ts
│   │   └── marketingSlice.ts
│   └── index.ts
├── api/                               # API client layer
│   ├── client.ts                      # Axios/fetch configuration
│   ├── endpoints/
│   │   ├── public.ts
│   │   ├── beneficiary.ts
│   │   ├── donor.ts
│   │   ├── volunteer.ts
│   │   ├── community.ts
│   │   ├── content.ts
│   │   ├── analytics.ts
│   │   └── marketing.ts
│   └── types/
│       ├── public.ts
│       ├── beneficiary.ts
│       ├── donor.ts
│       └── shared.ts
└── utils/                             # Utility functions
    ├── formatCurrency.ts
    ├── formatDate.ts
    ├── transliterate.ts
    ├── seo.ts
    ├── analytics.ts
    └── validation.ts
```

### 7.2 State Management

```typescript
// src/store/slices/publicWebsiteSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface PublicWebsiteState {
  // Landing page
  impactStats: {
    beneficiariesServed: number;
    programsActive: number;
    governoratesCovered: number;
    totalDonations: number;
    lastUpdated: Date;
  };
  
  // Programs
  programs: Program[];
  selectedProgram: Program | null;
  programsLoading: boolean;
  
  // Stories
  stories: Story[];
  featuredStory: Story | null;
  storiesLoading: boolean;
  
  // Donor
  donorProfile: DonorProfile | null;
  donations: Donation[];
  impactDashboard: DonorImpact | null;
  
  // Volunteer
  volunteerProfile: VolunteerProfile | null;
  assignments: Assignment[];
  badges: Badge[];
  
  // Community
  forumThreads: ForumThread[];
  events: Event[];
  courses: Course[];
  
  // Engagement
  notifications: Notification[];
  unreadCount: number;
  
  // Marketing
  emailPreferences: EmailPreferences;
  pushEnabled: boolean;
  
  // Analytics
  abTests: ABTest[];
  conversionData: ConversionData;
}

const publicWebsiteSlice = createSlice({
  name: 'publicWebsite',
  initialState,
  reducers: {
    // Impact stats
    updateImpactStats: (state, action) => {
      state.impactStats = action.payload;
    },
    
    // Programs
    setPrograms: (state, action) => {
      state.programs = action.payload;
      state.programsLoading = false;
    },
    selectProgram: (state, action) => {
      state.selectedProgram = action.payload;
    },
    
    // Stories
    setStories: (state, action) => {
      state.stories = action.payload;
      state.storiesLoading = false;
    },
    setFeaturedStory: (state, action) => {
      state.featuredStory = action.payload;
    },
    
    // Donor
    setDonorProfile: (state, action) => {
      state.donorProfile = action.payload;
    },
    addDonation: (state, action) => {
      state.donations.unshift(action.payload);
    },
    
    // Volunteer
    setVolunteerProfile: (state, action) => {
      state.volunteerProfile = action.payload;
    },
    addBadge: (state, action) => {
      state.badges.push(action.payload);
    },
    
    // Community
    setForumThreads: (state, action) => {
      state.forumThreads = action.payload;
    },
    
    // Engagement
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    markNotificationRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount -= 1;
      }
    },
    
    // Marketing
    setEmailPreferences: (state, action) => {
      state.emailPreferences = action.payload;
    },
    setPushEnabled: (state, action) => {
      state.pushEnabled = action.payload;
    },
    
    // AB Testing
    setABTests: (state, action) => {
      state.abTests = action.payload;
    },
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(fetchImpactStats.pending, (state) => {
        state.impactStatsLoading = true;
      })
      .addCase(fetchImpactStats.fulfilled, (state, action) => {
        state.impactStats = action.payload;
        state.impactStatsLoading = false;
      })
      .addCase(fetchPrograms.fulfilled, (state, action) => {
        state.programs = action.payload;
        state.programsLoading = false;
      })
      .addCase(fetchStories.fulfilled, (state, action) => {
        state.stories = action.payload;
        state.storiesLoading = false;
      });
  },
});
```

### 7.3 API Design

```typescript
// src/api/endpoints/public.ts
import { apiClient } from '../client';

// Public website endpoints (no auth required)
export const publicAPI = {
  // Impact statistics
  getImpactStats: () => apiClient.get('/api/v2/public/impact-stats'),
  getLiveCounter: () => apiClient.get('/api/v2/public/live-counter'),
  
  // Programs
  getPrograms: () => apiClient.get('/api/v2/public/programs'),
  getProgramById: (id: string) => apiClient.get(`/api/v2/public/programs/${id}`),
  getProgramImpact: (id: string) => apiClient.get(`/api/v2/public/programs/${id}/impact`),
  
  // Stories
  getStories: (params?: { page?: number; limit?: number; category?: string }) =>
    apiClient.get('/api/v2/public/stories', { params }),
  getStoryBySlug: (slug: string) => apiClient.get(`/api/v2/public/stories/${slug}`),
  getFeaturedStories: () => apiClient.get('/api/v2/public/stories/featured'),
  
  // About
  getOrganizationInfo: () => apiClient.get('/api/v2/public/about'),
  getTeamMembers: () => apiClient.get('/api/v2/public/team'),
  getPartners: () => apiClient.get('/api/v2/public/partners'),
  getTimeline: () => apiClient.get('/api/v2/public/timeline'),
  
  // Reports
  getReports: () => apiClient.get('/api/v2/public/reports'),
  getReportById: (id: string) => apiClient.get(`/api/v2/public/reports/${id}`),
  downloadReport: (id: string) => apiClient.get(`/api/v2/public/reports/${id}/download`, { responseType: 'blob' }),
  
  // Search
  search: (query: string) => apiClient.get('/api/v2/public/search', { params: { q: query } }),
  
  // Newsletter
  subscribeNewsletter: (email: string) => apiClient.post('/api/v2/public/newsletter/subscribe', { email }),
  
  // Contact
  submitContactForm: (data: ContactForm) => apiClient.post('/api/v2/public/contact', data),
};

// src/api/endpoints/donor.ts
export const donorAPI = {
  // Donation processing
  createDonation: (data: DonationRequest) => apiClient.post('/api/v2/donor/donations', data),
  getDonationReceipt: (id: string) => apiClient.get(`/api/v2/donor/donations/${id}/receipt`),
  
  // Recurring donations
  setupRecurring: (data: RecurringDonationRequest) => apiClient.post('/api/v2/donor/recurring', data),
  cancelRecurring: (id: string) => apiClient.delete(`/api/v2/donor/recurring/${id}`),
  
  // Impact tracking
  getImpactDashboard: (donorId: string) => apiClient.get(`/api/v2/donor/impact/${donorId}`),
  getImpactUpdates: (donorId: string) => apiClient.get(`/api/v2/donor/impact/${donorId}/updates`),
  
  // Donor profile
  getDonorProfile: () => apiClient.get('/api/v2/donor/profile'),
  updateDonorProfile: (data: DonorProfileUpdate) => apiClient.put('/api/v2/donor/profile', data),
  
  // Transparency
  getTransparencyReport: () => apiClient.get('/api/v2/donor/transparency'),
  getFinancialStatements: () => apiClient.get('/api/v2/donor/financial-statements'),
};

// src/api/endpoints/beneficiary.ts
export const beneficiaryAPI = {
  // Program discovery
  getAvailablePrograms: () => apiClient.get('/api/v2/beneficiary/programs'),
  checkEligibility: (programId: string, data: EligibilityData) =>
    apiClient.post(`/api/v2/beneficiary/programs/${programId}/eligibility`, data),
  
  // Application
  submitApplication: (data: ApplicationRequest) => apiClient.post('/api/v2/beneficiary/applications', data),
  getApplicationStatus: (id: string) => apiClient.get(`/api/v2/beneficiary/applications/${id}`),
  
  // Service delivery
  getServiceHistory: () => apiClient.get('/api/v2/beneficiary/services'),
  getServiceDetails: (id: string) => apiClient.get(`/api/v2/beneficiary/services/${id}`),
  
  // Feedback
  submitFeedback: (data: FeedbackRequest) => apiClient.post('/api/v2/beneficiary/feedback', data),
  getFeedbackHistory: () => apiClient.get('/api/v2/beneficiary/feedback'),
};

// src/api/endpoints/volunteer.ts
export const volunteerAPI = {
  // Application
  submitApplication: (data: VolunteerApplication) => apiClient.post('/api/v2/volunteer/applications', data),
  getApplicationStatus: () => apiClient.get('/api/v2/volunteer/applications/status'),
  
  // Onboarding
  getOnboardingChecklist: () => apiClient.get('/api/v2/volunteer/onboarding'),
  completeOnboardingStep: (stepId: string) => apiClient.post(`/api/v2/volunteer/onboarding/${stepId}/complete`),
  
  // Assignments
  getAvailableAssignments: () => apiClient.get('/api/v2/volunteer/assignments/available'),
  acceptAssignment: (id: string) => apiClient.post(`/api/v2/volunteer/assignments/${id}/accept`),
  
  // Time tracking
  checkIn: (data: CheckInData) => apiClient.post('/api/v2/volunteer/checkin', data),
  checkOut: (data: CheckOutData) => apiClient.post('/api/v2/volunteer/checkout', data),
  getHoursLog: () => apiClient.get('/api/v2/volunteer/hours'),
  
  // Gamification
  getBadges: () => apiClient.get('/api/v2/volunteer/badges'),
  getLeaderboard: (timeframe: string) => apiClient.get(`/api/v2/volunteer/leaderboard/${timeframe}`),
  getImpactScore: () => apiClient.get('/api/v2/volunteer/impact-score'),
};

// src/api/endpoints/community.ts
export const communityAPI = {
  // Forum
  getForumCategories: () => apiClient.get('/api/v2/community/forum/categories'),
  getForumThreads: (params: ForumQuery) => apiClient.get('/api/v2/community/forum/threads', { params }),
  createForumThread: (data: NewThread) => apiClient.post('/api/v2/community/forum/threads', data),
  replyToThread: (threadId: string, data: NewReply) =>
    apiClient.post(`/api/v2/community/forum/threads/${threadId}/replies`, data),
  
  // Events
  getEvents: (params?: EventQuery) => apiClient.get('/api/v2/community/events', { params }),
  getEventById: (id: string) => apiClient.get(`/api/v2/community/events/${id}`),
  registerForEvent: (id: string) => apiClient.post(`/api/v2/community/events/${id}/register`),
  
  // Education
  getCourses: () => apiClient.get('/api/v2/community/education/courses'),
  getCourseById: (id: string) => apiClient.get(`/api/v2/community/education/courses/${id}`),
  enrollInCourse: (id: string) => apiClient.post(`/api/v2/community/education/courses/${id}/enroll`),
  submitQuiz: (courseId: string, quizId: string, answers: QuizAnswers) =>
    apiClient.post(`/api/v2/community/education/courses/${courseId}/quizzes/${quizId}/submit`, { answers }),
};
```

### 7.4 Caching Strategy

```typescript
// src/utils/cache/CacheStrategy.ts
export const CACHE_STRATEGIES = {
  // Static content (long cache)
  static: {
    ttl: 7 * 24 * 60 * 60, // 7 days
    staleWhileRevalidate: 24 * 60 * 60, // 24 hours
    tags: ['static'],
    paths: ['/images/', '/fonts/', '/icons/'],
  },
  
  // Semi-static content (medium cache)
  semiStatic: {
    ttl: 60 * 60, // 1 hour
    staleWhileRevalidate: 15 * 60, // 15 minutes
    tags: ['semi-static'],
    paths: ['/api/v2/public/programs', '/api/v2/public/about', '/api/v2/public/reports'],
  },
  
  // Dynamic content (short cache)
  dynamic: {
    ttl: 5 * 60, // 5 minutes
    staleWhileRevalidate: 60, // 1 minute
    tags: ['dynamic'],
    paths: ['/api/v2/public/impact-stats', '/api/v2/public/stories'],
  },
  
  // Real-time content (no cache)
  realtime: {
    ttl: 0,
    staleWhileRevalidate: 0,
    tags: ['realtime'],
    paths: ['/api/v2/public/live-counter', '/api/v2/community/forum/threads'],
  },
  
  // User-specific content (private cache)
  userSpecific: {
    ttl: 5 * 60, // 5 minutes
    staleWhileRevalidate: 60, // 1 minute
    tags: ['user-specific'],
    paths: ['/api/v2/donor/', '/api/v2/beneficiary/', '/api/v2/volunteer/'],
    private: true,
  },
};

// Redis cache configuration
export const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  keyPrefix: 'rbdcye:',
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};

// Service Worker cache configuration
export const SW_CACHE_CONFIG = {
  precache: [
    '/',
    '/index.html',
    '/manifest.json',
    '/offline.html',
  ],
  
  runtimeCache: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    {
      urlPattern: /\/api\/v2\/public\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-public',
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
    {
      urlPattern: /\.(?:png|gif|jpg|jpeg|webp|svg)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
  ],
};
```

### 7.5 Performance Budget

```typescript
// src/utils/performance/PerformanceBudget.ts
export const PERFORMANCE_BUDGETS = {
  // Bundle sizes (compressed)
  bundles: {
    main: { max: 150, warning: 120 },      // KB
    vendor: { max: 100, warning: 80 },      // KB
    chunks: { max: 50, warning: 30 },       // KB per chunk
    total: { max: 300, warning: 250 },      // KB total
  },
  
  // Core Web Vitals
  webVitals: {
    LCP: { target: 2.0, warning: 2.5, critical: 4.0 },  // seconds
    FID: { target: 50, warning: 100, critical: 300 },    // milliseconds
    CLS: { target: 0.05, warning: 0.1, critical: 0.25 }, // score
    INP: { target: 100, warning: 200, critical: 500 },   // milliseconds
    TTFB: { target: 200, warning: 400, critical: 800 },  // milliseconds
    FCP: { target: 1.0, warning: 1.5, critical: 3.0 },  // seconds
  },
  
  // Resource loading
  resources: {
    totalTransfer: { max: 1000, warning: 800 },  // KB
    totalRequests: { max: 50, warning: 40 },
    imageOptimization: { quality: 80, format: 'webp' },
    lazyLoadThreshold: '100px',
  },
  
  // Performance monitoring
  monitoring: {
    sampleRate: 0.1,  // 10% of users
    reportInterval: 60000,  // 1 minute
    alertThreshold: {
      LCP: 4000,
      FID: 300,
      CLS: 0.25,
    },
  },
};

// Performance monitoring hooks
export const usePerformanceMonitor = () => {
  const reportMetric = (metric: string, value: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance_metric', {
        event_category: 'Web Vitals',
        event_label: metric,
        value: Math.round(value),
      });
    }
  };
  
  return { reportMetric };
};
```

---

## 8. File Structure & Component Map

### 8.1 Complete File Tree

```
rbdcye.org/
├── public/
│   ├── images/
│   │   ├── logo.png
│   │   ├── logo-white.png
│   │   ├── favicon.ico
│   │   ├── og-image.jpg
│   │   ├── programs/
│   │   │   ├── education.jpg
│   │   │   ├── health.jpg
│   │   │   ├── water.jpg
│   │   │   ├── orphan.jpg
│   │   │   ├── relief.jpg
│   │   │   ├── empowerment.jpg
│   │   │   └── quran.jpg
│   │   ├── stories/
│   │   └── team/
│   ├── fonts/
│   │   └── Amiri.ttf  # Arabic font
│   ├── manifest.json
│   ├── robots.txt
│   ├── sitemap.xml
│   └── offline.html
├── src/
│   ├── features/
│   │   └── public-website/
│   │       ├── landing/
│   │       │   ├── HeroSection.tsx
│   │       │   ├── ImpactCounter.tsx
│   │       │   ├── FeaturedPrograms.tsx
│   │       │   ├── LatestStories.tsx
│   │       │   ├── DonorTestimonials.tsx
│   │       │   ├── TransparencyWidget.tsx
│   │       │   ├── CallToAction.tsx
│   │       │   ├── PartnerLogos.tsx
│   │       │   └── index.ts
│   │       ├── programs/
│   │       │   ├── ProgramList.tsx
│   │       │   ├── ProgramCard.tsx
│   │       │   ├── ProgramDetail.tsx
│   │       │   ├── ProgramImpact.tsx
│   │       │   ├── ProgramMap.tsx
│   │       │   ├── ProgramTimeline.tsx
│   │       │   └── index.ts
│   │       ├── stories/
│   │       │   ├── StoryFeed.tsx
│   │       │   ├── StoryCard.tsx
│   │       │   ├── StoryDetail.tsx
│   │       │   ├── StoryGallery.tsx
│   │       │   ├── StoryVideo.tsx
│   │       │   ├── StoryShare.tsx
│   │       │   └── index.ts
│   │       ├── about/
│   │       │   ├── AboutHero.tsx
│   │       │   ├── TeamSection.tsx
│   │       │   ├── TimelineSection.tsx
│   │       │   ├── PartnersSection.tsx
│   │       │   ├── LicenseSection.tsx
│   │       │   ├── ContactSection.tsx
│   │       │   └── index.ts
│   │       ├── donate/
│   │       │   ├── DonationLandingPage.tsx
│   │       │   ├── DonationForm.tsx
│   │       │   ├── PaymentGateway.tsx
│   │       │   ├── DonationConfirmation.tsx
│   │       │   ├── RecurringDonationSetup.tsx
│   │       │   ├── DonationReceipt.tsx
│   │       │   ├── DonorGratitudeWall.tsx
│   │       │   └── index.ts
│   │       └── reports/
│   │           ├── ReportList.tsx
│   │           ├── ReportCard.tsx
│   │           ├── ReportViewer.tsx
│   │           ├── ReportCharts.tsx
│   │           ├── ReportDownload.tsx
│   │           └── index.ts
│   ├── beneficiary/
│   │   ├── journey/
│   │   │   ├── BeneficiaryJourneyProvider.tsx
│   │   │   ├── DiscoverView.tsx
│   │   │   ├── SmartApplicationForm.tsx
│   │   │   ├── ApplicationTracker.tsx
│   │   │   ├── ServiceDeliveryView.tsx
│   │   │   ├── FeedbackForm.tsx
│   │   │   └── index.ts
│   │   └── components/
│   │       ├── EligibilityChecker.tsx
│   │       ├── DocumentUpload.tsx
│   │       ├── StatusTimeline.tsx
│   │       └── ImpactReceipt.tsx
│   ├── donor/
│   │   ├── journey/
│   │   │   ├── DonorJourneyProvider.tsx
│   │   │   ├── ImpactShowcase.tsx
│   │   │   ├── TrustSignals.tsx
│   │   │   ├── ImpactDashboard.tsx
│   │   │   ├── ReEngagementNudge.tsx
│   │   │   └── index.ts
│   │   └── components/
│   │       ├── DonationReceipt.tsx
│   │       ├── DonorGratitudeWall.tsx
│   │       └── RecurringDonationManager.tsx
│   ├── volunteer/
│   │   ├── journey/
│   │   │   ├── VolunteerJourneyProvider.tsx
│   │   │   ├── VolunteerLanding.tsx
│   │   │   ├── VolunteerApplicationForm.tsx
│   │   │   ├── OnboardingChecklist.tsx
│   │   │   ├── TaskBoard.tsx
│   │   │   ├── HoursTracker.tsx
│   │   │   └── index.ts
│   │   └── components/
│   │       ├── FieldCheckIn.tsx
│   │       ├── BadgeShowcase.tsx
│   │       ├── VolunteerLeaderboard.tsx
│   │       └── ImpactSummary.tsx
│   ├── community/
│   │   ├── forum/
│   │   │   ├── ForumLayout.tsx
│   │   │   ├── ForumCategoryList.tsx
│   │   │   ├── ForumThreadList.tsx
│   │   │   ├── ForumThreadView.tsx
│   │   │   ├── ForumNewThread.tsx
│   │   │   ├── ForumSearch.tsx
│   │   │   └── index.ts
│   │   ├── events/
│   │   │   ├── EventCalendar.tsx
│   │   │   ├── EventCard.tsx
│   │   │   ├── EventDetail.tsx
│   │   │   ├── EventRegistration.tsx
│   │   │   └── index.ts
│   │   └── education/
│   │       ├── CourseList.tsx
│   │       ├── CoursePlayer.tsx
│   │       ├── QuizComponent.tsx
│   │       ├── CertificateGenerator.tsx
│   │       └── index.ts
│   ├── engagement/
│   │   ├── social/
│   │   │   ├── ShareButton.tsx
│   │   │   ├── ShareModal.tsx
│   │   │   ├── SocialFeed.tsx
│   │   │   ├── WhatsAppWidget.tsx
│   │   │   └── index.ts
│   │   ├── notifications/
│   │   │   ├── NotificationCenter.tsx
│   │   │   ├── NotificationBell.tsx
│   │   │   ├── NotificationPreferences.tsx
│   │   │   ├── PushNotificationSetup.tsx
│   │   │   └── index.ts
│   │   └── gamification/
│   │       ├── BadgeShowcase.tsx
│   │       ├── BadgeEarnedModal.tsx
│   │       ├── LeaderboardView.tsx
│   │       ├── ImpactScoreCard.tsx
│   │       ├── ProgressTracker.tsx
│   │       └── index.ts
│   ├── marketing/
│   │   ├── email/
│   │   │   ├── EmailTemplateEngine.tsx
│   │   │   ├── EmailPreferences.tsx
│   │   │   ├── EmailAnalytics.tsx
│   │   │   └── index.ts
│   │   ├── social/
│   │   │   ├── SocialMediaCalendar.tsx
│   │   │   ├── SocialScheduler.tsx
│   │   │   ├── SocialAnalytics.tsx
│   │   │   └── index.ts
│   │   └── seo/
│   │       ├── SEOHead.tsx
│   │       ├── SitemapGenerator.tsx
│   │       ├── StructuredData.tsx
│   │       └── index.ts
│   ├── analytics/
│   │   ├── dashboard/
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── ConversionFunnel.tsx
│   │   │   ├── CohortAnalysis.tsx
│   │   │   ├── CampaignPerformance.tsx
│   │   │   └── index.ts
│   │   └── ab-testing/
│   │       ├── ABTestRunner.tsx
│   │       ├── VariantSelector.tsx
│   │       ├── ResultsViewer.tsx
│   │       └── index.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Accordion.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── PublicHeader.tsx
│   │   │   ├── PublicFooter.tsx
│   │   │   ├── MobileNavigation.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── PageContainer.tsx
│   │   │   ├── Breadcrumbs.tsx
│   │   │   └── index.ts
│   │   ├── shared/
│   │   │   ├── ImpactCounter.tsx
│   │   │   ├── LanguageSwitcher.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── InfiniteScroll.tsx
│   │   │   ├── LazyLoad.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── index.ts
│   │   └── media/
│   │       ├── ImageWithFallback.tsx
│   │       ├── VideoPlayer.tsx
│   │       ├── AudioPlayer.tsx
│   │       ├── ImageGallery.tsx
│   │       ├── DocumentViewer.tsx
│   │       └── index.ts
│   ├── hooks/
│   │   ├── useDonation.ts
│   │   ├── useBeneficiary.ts
│   │   ├── useVolunteer.ts
│   │   ├── useCommunity.ts
│   │   ├── useAnalytics.ts
│   │   ├── usePushNotification.ts
│   │   ├── useWhatsApp.ts
│   │   ├── useShare.ts
│   │   ├── useGamification.ts
│   │   ├── useABTest.ts
│   │   ├── useSEO.ts
│   │   └── index.ts
│   ├── store/
│   │   ├── slices/
│   │   │   ├── publicWebsiteSlice.ts
│   │   │   ├── beneficiarySlice.ts
│   │   │   ├── donorSlice.ts
│   │   │   ├── volunteerSlice.ts
│   │   │   ├── communitySlice.ts
│   │   │   ├── engagementSlice.ts
│   │   │   ├── analyticsSlice.ts
│   │   │   └── marketingSlice.ts
│   │   ├── index.ts
│   │   └── middleware.ts
│   ├── api/
│   │   ├── client.ts
│   │   ├── endpoints/
│   │   │   ├── public.ts
│   │   │   ├── beneficiary.ts
│   │   │   ├── donor.ts
│   │   │   ├── volunteer.ts
│   │   │   ├── community.ts
│   │   │   ├── content.ts
│   │   │   ├── analytics.ts
│   │   │   └── marketing.ts
│   │   └── types/
│   │       ├── public.ts
│   │       ├── beneficiary.ts
│   │       ├── donor.ts
│   │       ├── volunteer.ts
│   │       └── shared.ts
│   └── utils/
│       ├── formatCurrency.ts
│       ├── formatDate.ts
│       ├── transliterate.ts
│       ├── seo.ts
│       ├── analytics.ts
│       ├── validation.ts
│       ├── cache/
│       │   └── CacheStrategy.ts
│       └── performance/
│           └── PerformanceBudget.ts
├── api/
│   ├── v2/
│   │   ├── public/
│   │   │   ├── impact-stats.ts
│   │   │   ├── programs.ts
│   │   │   ├── stories.ts
│   │   │   ├── about.ts
│   │   │   ├── reports.ts
│   │   │   ├── search.ts
│   │   │   ├── newsletter.ts
│   │   │   └── contact.ts
│   │   ├── donor/
│   │   │   ├── donations.ts
│   │   │   ├── recurring.ts
│   │   │   ├── impact.ts
│   │   │   └── profile.ts
│   │   ├── beneficiary/
│   │   │   ├── programs.ts
│   │   │   ├── applications.ts
│   │   │   ├── services.ts
│   │   │   └── feedback.ts
│   │   ├── volunteer/
│   │   │   ├── applications.ts
│   │   │   ├── onboarding.ts
│   │   │   ├── assignments.ts
│   │   │   ├── hours.ts
│   │   │   └── gamification.ts
│   │   ├── community/
│   │   │   ├── forum.ts
│   │   │   ├── events.ts
│   │   │   └── education.ts
│   │   ├── content/
│   │   │   ├── items.ts
│   │   │   ├── media.ts
│   │   │   └── translations.ts
│   │   ├── analytics/
│   │   │   ├── tracking.ts
│   │   │   ├── insights.ts
│   │   │   └── ab-testing.ts
│   │   └── marketing/
│   │       ├── email.ts
│   │       ├── push.ts
│   │       ├── whatsapp.ts
│   │       └── social.ts
│   └── webhooks/
│       ├── payment-gateway.ts
│       ├── whatsapp-webhook.ts
│       ├── email-webhook.ts
│       └── analytics-webhook.ts
├── migrations/
│   └── 001_public_website_tables.sql
├── docs/
│   └── RBDCYE_PUBLIC_ARCHITECTURE.md  (this document)
└── tests/
    ├── e2e/
    │   ├── donation-flow.spec.ts
    │   ├── beneficiary-journey.spec.ts
    │   ├── volunteer-journey.spec.ts
    │   └── community-forum.spec.ts
    └── unit/
        ├── hooks/
        │   ├── useDonation.test.ts
        │   ├── useBeneficiary.test.ts
        │   └── useVolunteer.test.ts
        └── components/
            ├── DonationForm.test.tsx
            ├── SmartApplicationForm.test.tsx
            └── ForumThread.test.tsx
```

### 8.2 Database Migration

```sql
-- migrations/001_public_website_tables.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Programs table (public-facing)
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  description_ar TEXT,
  description_en TEXT,
  icon VARCHAR(50),
  image_url TEXT,
  color VARCHAR(7),
  beneficiaries_target INTEGER,
  beneficiaries_served INTEGER DEFAULT 0,
  budget DECIMAL(15, 2),
  spent DECIMAL(15, 2) DEFAULT 0,
  governorates JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'active',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Impact stories
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  title_en VARCHAR(255),
  excerpt_ar TEXT,
  excerpt_en TEXT,
  body_ar TEXT,
  body_en TEXT,
  featured_image_url TEXT,
  video_url TEXT,
  audio_url TEXT,
  gallery JSONB DEFAULT '[]',
  category VARCHAR(50),
  tags JSONB DEFAULT '[]',
  program_id UUID REFERENCES programs(id),
  beneficiary_name VARCHAR(255),
  beneficiary_age INTEGER,
  governorate VARCHAR(100),
  author_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donations
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID REFERENCES users(id),
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'YER',
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  campaign_id UUID,
  program_id UUID REFERENCES programs(id),
  recurring BOOLEAN DEFAULT FALSE,
  recurring_id UUID,
  status VARCHAR(20) DEFAULT 'pending',
  receipt_url TEXT,
  receipt_number VARCHAR(50),
  anonymous BOOLEAN DEFAULT FALSE,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring donations
CREATE TABLE public.recurring_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID REFERENCES users(id),
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'YER',
  frequency VARCHAR(20) NOT NULL, -- monthly, quarterly, annually
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  program_id UUID REFERENCES programs(id),
  status VARCHAR(20) DEFAULT 'active',
  next_payment_date DATE,
  last_payment_date DATE,
  total_donated DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Beneficiary applications
CREATE TABLE public.beneficiary_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id),
  applicant_name VARCHAR(255) NOT NULL,
  applicant_phone VARCHAR(20),
  applicant_email VARCHAR(255),
  governorate VARCHAR(100),
  district VARCHAR(100),
  family_size INTEGER,
  dependents INTEGER,
  special_needs BOOLEAN DEFAULT FALSE,
  vulnerable_category VARCHAR(50),
  data JSONB DEFAULT '{}', -- Additional program-specific data
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Volunteer applications
CREATE TABLE public.volunteer_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_name VARCHAR(255) NOT NULL,
  applicant_phone VARCHAR(20) NOT NULL,
  applicant_email VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(10),
  governorate VARCHAR(100),
  skills JSONB DEFAULT '[]',
  availability VARCHAR(50),
  motivation TEXT,
  reference_name VARCHAR(255),
  reference_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Volunteer hours tracking
CREATE TABLE public.volunteer_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  volunteer_id UUID REFERENCES volunteer_applications(id),
  check_in_time TIMESTAMPTZ NOT NULL,
  check_out_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  activity_type VARCHAR(50),
  notes TEXT,
  approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Volunteer badges
CREATE TABLE public.volunteer_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  volunteer_id UUID REFERENCES volunteer_applications(id),
  badge_id VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100),
  badge_icon VARCHAR(10),
  criteria_met JSONB DEFAULT '{}',
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(volunteer_id, badge_id)
);

-- Forum threads
CREATE TABLE public.forum_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES forum_categories(id),
  title VARCHAR(255) NOT NULL,
  author_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  tags JSONB DEFAULT '[]',
  pinned BOOLEAN DEFAULT FALSE,
  locked BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum replies
CREATE TABLE public.forum_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  parent_reply_id UUID REFERENCES forum_replies(id),
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum categories
CREATE TABLE public.forum_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description_ar TEXT,
  description_en TEXT,
  icon VARCHAR(50),
  thread_count INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_ar VARCHAR(255) NOT NULL,
  title_en VARCHAR(255),
  description_ar TEXT,
  description_en TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_url TEXT,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  registration_required BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Educational courses
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_ar VARCHAR(255) NOT NULL,
  title_en VARCHAR(255),
  description_ar TEXT,
  description_en TEXT,
  thumbnail_url TEXT,
  category VARCHAR(50),
  difficulty VARCHAR(20) DEFAULT 'beginner',
  duration_minutes INTEGER,
  modules JSONB DEFAULT '[]',
  quiz JSONB DEFAULT '{}',
  certificate_template TEXT,
  enrolled_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter subscribers
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  preferences JSONB DEFAULT '{}',
  confirmed BOOLEAN DEFAULT FALSE,
  confirmation_token VARCHAR(255),
  unsubscribed BOOLEAN DEFAULT FALSE,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact form submissions
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  category VARCHAR(50),
  status VARCHAR(20) DEFAULT 'new',
  responded_by UUID REFERENCES users(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content items (for CMS)
CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  title_en VARCHAR(255),
  excerpt_ar TEXT,
  excerpt_en TEXT,
  body_ar TEXT,
  body_en TEXT,
  featured_image_url TEXT,
  media_gallery JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  category VARCHAR(100),
  author_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  seo_meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email campaign tracking
CREATE TABLE public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  subject_ar VARCHAR(255),
  subject_en VARCHAR(255),
  template_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_type VARCHAR(20),
  browser VARCHAR(50),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(100),
  properties JSONB DEFAULT '{}',
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  country VARCHAR(100),
  city VARCHAR(100),
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B tests
CREATE TABLE public.ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hypothesis TEXT,
  variants JSONB NOT NULL,
  traffic_split JSONB NOT NULL,
  target_metric VARCHAR(100),
  minimum_sample_size INTEGER,
  status VARCHAR(20) DEFAULT 'draft',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  results JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B test assignments
CREATE TABLE public.ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES ab_tests(id),
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(100),
  variant_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_id, user_id)
);

-- Gamification points
CREATE TABLE public.gamification_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  points INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  reference_id UUID,
  reference_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_programs_slug ON public.programs(slug);
CREATE INDEX idx_programs_status ON public.programs(status);
CREATE INDEX idx_stories_slug ON public.stories(slug);
CREATE INDEX idx_stories_category ON public.stories(category);
CREATE INDEX idx_stories_published ON public.stories(published_at DESC);
CREATE INDEX idx_stories_featured ON public.stories(featured) WHERE featured = TRUE;
CREATE INDEX idx_donations_donor ON public.donations(donor_id);
CREATE INDEX idx_donations_status ON public.donations(status);
CREATE INDEX idx_donations_created ON public.created_at DESC;
CREATE INDEX idx_beneficiary_applications_program ON public.beneficiary_applications(program_id);
CREATE INDEX idx_beneficiary_applications_status ON public.beneficiary_applications(status);
CREATE INDEX idx_volunteer_applications_status ON public.volunteer_applications(status);
CREATE INDEX idx_volunteer_hours_volunteer ON public.volunteer_hours(volunteer_id);
CREATE INDEX idx_volunteer_hours_date ON public.volunteer_hours(check_in_time DESC);
CREATE INDEX idx_forum_threads_category ON public.forum_threads(category_id);
CREATE INDEX idx_forum_threads_author ON public.forum_threads(author_id);
CREATE INDEX idx_forum_replies_thread ON public.forum_replies(thread_id);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX idx_gamification_user ON public.gamification_points(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiary_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- Donors can see their own donations
CREATE POLICY "Donors can view own donations" ON public.donations
  FOR SELECT USING (auth.uid() = donor_id);

-- Beneficiaries can see their own applications
CREATE POLICY "Beneficiaries can view own applications" ON public.beneficiary_applications
  FOR SELECT USING (auth.uid() = applicant_id);

-- Volunteers can see their own applications
CREATE POLICY "Volunteers can view own applications" ON public.volunteer_applications
  FOR SELECT USING (auth.uid() = applicant_id);

-- Forum: everyone can read, authenticated users can write
CREATE POLICY "Forum threads readable by all" ON public.forum_threads
  FOR SELECT USING (true);

CREATE POLICY "Forum threads writable by authenticated" ON public.forum_threads
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Forum replies readable by all" ON public.forum_replies
  FOR SELECT USING (true);

CREATE POLICY "Forum replies writable by authenticated" ON public.forum_replies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

| Week | Deliverables |
|------|--------------|
| 1 | Project setup, component library, design tokens |
| 2 | Public header/footer, homepage hero, impact counter |
| 3 | Program listing & detail pages |
| 4 | About page, contact form, newsletter signup |

### Phase 2: Core Journeys (Weeks 5-8)

| Week | Deliverables |
|------|--------------|
| 5 | Donation form, payment gateway integration |
| 6 | Donor dashboard, impact tracking |
| 7 | Beneficiary application flow |
| 8 | Application tracker, feedback system |

### Phase 3: Content & Engagement (Weeks 9-12)

| Week | Deliverables |
|------|--------------|
| 9 | Impact stories, media gallery |
| 10 | Social sharing, WhatsApp integration |
| 11 | Push notifications, email automation |
| 12 | Gamification system, badges |

### Phase 4: Community (Weeks 13-16)

| Week | Deliverables |
|------|--------------|
| 13 | Forum system, categories |
| 14 | Event calendar, registration |
| 15 | Educational courses, certificates |
| 16 | Volunteer portal, time tracking |

### Phase 5: Optimization (Weeks 17-20)

| Week | Deliverables |
|------|--------------|
| 17 | Analytics dashboard, tracking |
| 18 | A/B testing framework |
| 19 | Performance optimization |
| 20 | SEO audit, accessibility review |

---

## Appendix A: Key Metrics Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│                    RBDCYE.ORG KEY METRICS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  VISITORS          DONATIONS         ENGAGEMENT                   │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐                 │
│  │  12,450 │      │  $45,230│      │  8,234  │                 │
│  │  Monthly │      │  Monthly │      │  Active  │                 │
│  │  Unique  │      │  Revenue │      │  Users   │                 │
│  └─────────┘      └─────────┘      └─────────┘                 │
│                                                                   │
│  CONVERSIONS       RETENTION         REACH                        │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐                 │
│  │  3.2%   │      │  42%    │      │  15,000 │                 │
│  │  Donation│      │  Donor  │      │  Social │                 │
│  │  Rate    │      │  Retain │      │  Shares │                 │
│  └─────────┘      └─────────┘      └─────────┘                 │
│                                                                   │
│  PERFORMANCE       SEO               SATISFACTION                │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐                 │
│  │  95     │      │  92     │      │  4.8/5  │                 │
│  │  Light- │      │  SEO    │      │  NPS    │                 │
│  │  house  │      │  Score  │      │  Score  │                 │
│  └─────────┘      └─────────┘      └─────────┘                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

**Architecture Document Version:** 1.0  
**Last Updated:** September 2026  
**Maintained by:** NexoraOS™ Digital Architecture Team  
**Contact:** architecture@rbdcye.org
