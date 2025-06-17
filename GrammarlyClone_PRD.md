
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

1. **Grammar and Spelling**  
   > As a user, I want my text to be checked for grammar and spelling errors in real time so I can improve my writing as I go.

2. **Style Suggestions**  
   > As a user, I want recommendations for improving style, clarity, tone, and passive voice to sound more professional or aligned with my goals.

3. **Readability Feedback**  
   > As a user, I want my writing to be scored for readability so I can write more clearly and accessibly.

4. **Clean Editor Interface**  
   > As a user, I want to write in a clean, distraction-free editor with clear visual cues for suggestions and corrections.

5. **User Authentication**  
   > As a user, I want to log in and save my documents securely so I can continue writing across sessions.

6. **Document Management**  
   > As a user, I want to save, load, delete, and rename documents so I can keep my work organized.

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
