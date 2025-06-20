# 📄 Product Requirements Document (PRD)

### Product Name: **Grammarly Clone (Codename: Writewise)**  
**Author:** Trevor Alpert  
**Date:** June 16, 2025  
**Version:** 1.0

---

## 🧭 1. Overview

**Objective:**  
Develop a modern, real-time writing assistant that replicates and improves upon the core functionality of Grammarly. The product will support grammar/spell checking, style suggestions, readability analysis, and document management, all within a responsive and intuitive text editor interface.

---

## 🎯 2. Goals and Success Metrics

### 🧪 Functional Goals
- ✅ Real-time grammar and spelling correction
- ✅ Style and clarity suggestions (tone, passive voice, conciseness)
- ✅ Readability scoring
- ✅ User authentication and profile preferences
- ✅ Document creation, saving, and management
- ✅ Suggestions displayed non-intrusively in a rich text editor

### 📊 Success Metrics
- **Accuracy:** ≥ 85% grammar correction precision (LLM + rule-based hybrid)
- **Performance:** ≤ 2 second response time for LLM suggestions
- **Reliability:** ≥ 99% uptime
- **UX Goal:** Typing experience free from noticeable lag or interruption
- **Feature Coverage:** 100% of six core user stories functional

---

## 🧑‍💻 3. User Stories

### User Story 1: Demonetization Word Filter ✅ COMPLETED
**As a content creator, I want flagged alerts for words that could demonetize my videos so I can use safer alternatives.**

**Acceptance Criteria:**
- [x] System detects 100+ demonetization-sensitive words across categories
- [x] Orange wavy underlines highlight flagged words
- [x] AI generates 3 types of alternatives: Industry Standard, Conservative, Creative
- [x] Context-aware suggestions based on surrounding text
- [x] Caching system for performance optimization

**Implementation Status:** ✅ COMPLETE
- Enhanced word detection with pattern matching
- OpenAI GPT-4 integration for intelligent alternatives
- Visual styling with gradient backgrounds and animations
- Comprehensive error handling and fallback systems

### User Story 2: Context-Aware Grammar Checking ✅ COMPLETED
**As a creator, I want slang like 'that fit is fire' to be recognized as intentional so I'm not corrected for stylistic choices.**

**Acceptance Criteria:**
- [x] AI-first slang detection using GPT-4's contextual understanding
- [x] Green protective highlighting for recognized intentional slang
- [x] Formality level settings (Casual, Balanced, Formal) adjust correction sensitivity
- [x] Context analysis considers audience, intent, and appropriateness
- [x] Smart protection system prevents unwanted grammar corrections

**Implementation Status:** ✅ COMPLETE
- Comprehensive slang database with 70+ expressions
- AI-powered context analysis for intent detection
- Formality spectrum controls correction aggressiveness
- Visual protection indicators with detailed explanations

### User Story 3: Tone-Preserving Rewrites ✅ COMPLETED
**As a creator, I want AI to fix grammar issues without changing the vibe of my sentence.**

**Acceptance Criteria:**
- [x] AI analyzes original tone and style before suggesting changes
- [x] Purple styling for tone-preserving suggestions
- [x] Priority scoring system (1-10) with intelligent conflict resolution
- [x] Tone detection sensitivity controls (Low, Medium, High)
- [x] Comprehensive conflict detection and resolution system

**Implementation Status:** ✅ COMPLETE
- TONE_STYLE_TEMPLATES with 4 categories (casual, professional, creative, academic)
- GPT-4o integration for style-matching rewrites
- Advanced conflict resolution with multiple strategies
- Confidence scoring and reasoning explanations

### User Story 4: SEO Content Optimization 🚧 PLANNED
**As a content creator, I want SEO-friendly suggestions for better discoverability so my content ranks higher in search results.**

**Acceptance Criteria:**
- [ ] Keyword density analysis and optimization suggestions
- [ ] Meta description and title optimization
- [ ] Readability score improvements for SEO
- [ ] Content structure suggestions (headings, lists, etc.)
- [ ] Internal/external linking opportunities

**Implementation Status:** 🚧 PLANNED
- Backend API for SEO analysis
- Frontend integration with blue-green underlines
- SEO score dashboard integration
- Keyword research integration

### User Story 5: Audience Adaptation 🚧 PLANNED
**As a creator, I want platform-specific recommendations so my content performs well across different channels.**

**Acceptance Criteria:**
- [ ] Platform-specific tone adjustments (LinkedIn vs. TikTok)
- [ ] Length optimization for different platforms
- [ ] Hashtag and keyword suggestions
- [ ] Audience demographic considerations
- [ ] Platform best practices integration

**Implementation Status:** 🚧 PLANNED
- Multi-platform analysis engine
- Platform-specific suggestion types
- Audience targeting integration
- Performance optimization recommendations

### User Story 6: Engagement Enhancement ✅ COMPLETED
**As a content creator, I want to get suggestions to increase reader engagement so that my content performs better and keeps audiences interested.**

**Acceptance Criteria:**
- [x] Opening hook analysis and improvement suggestions
- [x] Call-to-action detection and enhancement
- [x] Emotional language analysis and recommendations
- [x] Reader interaction optimization (questions, direct address)
- [x] Transition word suggestions for better flow
- [x] Urgency and scarcity language opportunities

**Implementation Status:** ✅ COMPLETE
- **6 Engagement Categories Analyzed:**
  1. **Opening Hook**: Detects weak openings like "This is..." and suggests compelling alternatives
  2. **Call-to-Action**: Identifies missing CTAs and provides engagement prompts
  3. **Emotional Language**: Measures emotional word density and suggests enhancements
  4. **Reader Interaction**: Analyzes direct address patterns and question usage
  5. **Transitions**: Detects choppy flow and recommends transition words
  6. **Urgency/Scarcity**: Identifies opportunities for motivational language

- **Technical Implementation:**
  - **Backend**: Comprehensive engagement analysis engine with 6 specialized functions
  - **Frontend**: Pink double underlines with category-specific popups
  - **AI Integration**: Context-aware alternative generation
  - **Performance**: Caching system for repeated analysis
  - **User Experience**: Settings toggle, detailed explanations, actionable alternatives

- **Visual Design:**
  - Pink (#ec4899) double underlines for engagement suggestions
  - Category badges showing engagement type (Opening Hook, CTA, etc.)
  - Sparkle icons (✨) for engagement alternatives
  - Gradient backgrounds with pink-to-purple transitions
  - Interactive popups with hover effects and smooth animations

- **Smart Analysis Features:**
  - **Intelligent Scoring**: 1-10 engagement score per category
  - **Context Awareness**: Adapts suggestions based on existing content quality
  - **Priority System**: Higher priority for low-engagement content
  - **Conflict Avoidance**: Integrates with existing suggestion pipeline
  - **Cache Optimization**: Stores analysis results for performance

---

## 🏗️ 4. Technical Architecture

### Frontend Stack
| Layer        | Technology               |
|--------------|---------------------------|
| Framework    | React 18 + TypeScript     |
| Build Tool   | Vite                      |
| Styling      | Tailwind CSS              |
| Editor       | TipTap or Slate.js        |
| State Mgmt   | Zustand                   |
| Realtime     | Supabase Realtime (Option A: Firebase) |

### Backend Stack

| Area           | Option A (Firebase)                        | Option B (Supabase)                        |
|----------------|--------------------------------------------|--------------------------------------------|
| Auth           | Firebase Auth                              | Supabase Auth                              |
| DB             | Firestore                                  | PostgreSQL with real-time subscriptions    |
| Functions      | Firebase Cloud Functions                   | Supabase Edge Functions                    |
| Hosting        | Firebase Hosting                           | Vercel or Netlify                          |

### AI/ML Layer
- **Primary LLM:** OpenAI GPT-4o
- **Readability/Style:** textstat, spaCy, regex-based rules, GPT prompt chaining
- **Suggestion Caching:** Firestore or Supabase (suggestions per document/section)

---

## 🗃️ 5. Data Models

### User
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "preferences": {
    "tone": "formal",
    "writing_goals": ["clarity", "conciseness"]
  }
}
```

### Document
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "My Essay",
  "content": "Raw text content",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Suggestion
```json
{
  "id": "uuid",
  "doc_id": "uuid",
  "type": "grammar" | "spelling" | "style",
  "start": 10,
  "end": 14,
  "message": "Did you mean 'receive'?",
  "alternatives": ["receive"],
  "confidence": 0.93,
  "status": "pending" | "accepted" | "ignored"
}
```

---

## ⚙️ 6. Core Features and Requirements

### A. Real-Time Suggestion Engine
- Debounced LLM calls on typing pause (800ms)
- Backend returns suggestions with positional data
- Inline editor feedback (e.g., underlines, tooltips)

### B. Readability and Style Engine
- Flesch-Kincaid score and grade level
- Passive voice detection
- Wordiness / clarity issues
- Tone matching (via prompt templates)

### C. Text Editor UI
- Rich text editing with markdown-style formatting
- Grammar/style suggestions embedded
- Tooltips for suggested corrections
- Accept/reject suggestion with click

### D. Auth and Documents
- Google/email login
- Auto-save documents to cloud
- Dashboard to view/edit all user documents
- Real-time sync across sessions

---

## 🧪 7. Non-Functional Requirements

- **Performance:** Sub-2s backend latency (with async queueing if needed)
- **Scalability:** Handle 10,000+ users (scalable through Supabase/Firebase infra)
- **Accessibility:** Keyboard accessible, screen reader compatible
- **Security:** Encrypted auth, role-based document access

---

## 📅 8. Roadmap (Suggested Timeline)

| Week | Milestone                                |
|------|-------------------------------------------|
| 1    | Project setup (Supabase, React, Vite, Auth) |
| 2    | Text editor UI + debounce LLM connection  |
| 3    | Grammar/spell check working MVP          |
| 4    | Style suggestions + readability scoring  |
| 5    | Auth + document management UI            |
| 6    | Final polish, bug fixes, performance     |
| 7    | User testing, feedback, iteration         |

---

## 🧩 9. Stretch Goals (Post-MVP)

- Custom writing styles (train with user samples)
- Sentence rewriter / tone converter
- Team collaboration / shared editing
- AI learning path ("Your writing improved by 17%")
