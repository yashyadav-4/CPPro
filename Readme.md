<p align="center">
  <img src="https://img.shields.io/badge/CPPro-Competitive%20Programming%20Analytics-6C63FF?style=for-the-badge" alt="CPPro">
</p>

<h1 align="center">CPPro — Unified Competitive Programming Analytics</h1>

<p align="center">
  One dashboard. Multiple platforms. Zero context switching.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=nodedotjs" alt="Node.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/Redis-BullMQ-DC382D?style=flat-square&logo=redis" alt="Redis">
  <img src="https://img.shields.io/badge/Vercel-Serverless-000000?style=flat-square&logo=vercel" alt="Vercel">
  <img src="https://img.shields.io/badge/License-ISC-blue?style=flat-square" alt="License">
</p>

<!-- If cppro.dev is live, re-add this badge:
<a href="https://cppro.dev" target="_blank"><img src="https://img.shields.io/badge/Live%20Demo-cppro.dev-6C63FF?style=flat-square" alt="Live Demo"></a>
-->

---

## What is CPPro?

CPPro is a self-hosted, SaaS-style analytics and growth platform for competitive programmers. It unifies **Codeforces**, **LeetCode**, **CodeChef**, and **GeeksforGeeks** data into a single, cohesive dashboard — featuring rating progression, unified submission heatmaps, contest histories, skill-gap analysis, upsolve queues, a global leaderboard with composite scoring, AI-generated daily problems & learning topics, personal code templates, and a community discussion forum.

Built as an **asynchronous microservice & serverless architecture**: the main application orchestrates dedicated sync engines and relays for each platform. Dedicated queue workers, intelligent proxy pooling, and serverless relay handlers ensure that the user experience remains lightning-fast and resilient, even during upstream platform rate-limiting or anti-bot challenges.

> Solo-designed and built end to end, including multi-service synchronization pipelines, resilient proxy slot dispatching, and the non-blocking "Lean Nexus" data-freshness pattern.

---

## ✨ Key Features

### 📊 Unified Multi-Platform Dashboard
- **Codeforces** — Rating progression, contest history, topic-level skill breakdowns, difficulty distribution, activity heatmaps, and upsolve queue.
- **LeetCode** — Contest rating, tiered skill stats (fundamental / intermediate / advanced), badge accomplishments, calendar heatmap, and submission logs.
- **CodeChef** — Star ratings, global & country ranks, contest history, language breakdown, and verdict distributions.
- **GeeksforGeeks** — Coding score, monthly score, institute/campus ranking, difficulty breakdown (School to Hard), language distribution, and practice activity.
- **Platform Views** — Toggle between a combined multi-platform view or focused single-platform dashboards (`All`, `Codeforces`, `LeetCode`, `CodeChef`, `GeeksforGeeks`).
- **Composite CPScore** — An all-in-one skill score combining platform ratings, difficulty-weighted solves, contest participation, and consistency streaks.
- **Shareable Card** — Beautiful, exportable summary card showcasing cross-platform achievements.

### ⚡ Selective & Bandwidth-Smart Refresh
- **Platform-Selective Sync** — Selectively refresh only the platforms where you practiced, saving proxy resources and eliminating unnecessary requests.
- **Intelligent Probe Checking** — Background sync routines check for data deltas before initiating full scrapes, ensuring sub-second response times on unchanged profiles.
- **Independent Cooldowns** — Per-platform refresh gates ensure you can sync active accounts without waiting on unrelated cooldowns.

### 🔥 Daily Problems + AI Learning Topics
- **Daily Workout** — Solvable, confidence-building problems calibrated at or slightly below your current level.
- **Daily Challenger** — Growth-focused problems calibrated slightly above your current level, specifically targeting your weakest tags.
- **Dual Problem Modes**:
  - **Rating Mode** — Targets problems based on your platform contest ratings.
  - **Training Mode** — Targets problems based on recency-weighted percentiles of your actual accepted submissions.
- **Platform Targeting** — Filter daily problem recommendations to your preferred platforms, including single-platform practice mode.
- **Gemini AI Daily Topic** — In-depth tutorial article, concrete worked dry-run, contest-ready code template, and Mermaid architecture diagram targeted at your weakest topic.
- **Auto-Solve Detection** — Automatically detects and confirms problem solves on the subsequent platform sync, updating daily streaks.

### 🏆 Leaderboards
- Multi-dimensional boards (Global, Country, College) sorted by composite **CPScore**, total questions solved, or individual platform ratings.
- Privacy-aware display with full anonymity support for users who opt for private profiles.

### 🧠 3D Interactive Learning Tree
- A Three.js interactive 3D knowledge graph covering core competitive programming and algorithmic topics.
- Multi-level topic mastery (Not Started, Theory, Implemented, Mastered) persisted directly to MongoDB and synchronized across all sessions.

### 📅 Smart Contest Tracker
- Aggregates upcoming and active contests across Codeforces, LeetCode, CodeChef, and AtCoder.
- Intelligent deduplication merges divisional duplicates, standardizes URLs, and filters language-specific contest listings.
- Personal contest history integration displaying your ranks and solve counts on past contests.

### 📝 Code Snippets & Templates
- Personal template repository: organize snippets by language (C++, Java, Python, JavaScript), add custom tags, and search quickly during practice.

### 💬 Community Forum
- Discussion threads, questions, and tutorials with threaded replies, upvoting/downvoting, post tagging, and pinned announcements.

### 🔔 In-App Notifications
- Notification center tracking daily challenge readiness, streak milestones, rating achievements, and administrative updates.

### 🛡️ Admin Dashboard & Centralized Observability
- Comprehensive telemetry: user growth, daily active users, submission volumes, rating distributions, and server health.
- Centralized real-time error logging streaming from all microservices directly to the admin console.
- In-app notification broadcasting with options to target all users or specific handles.

### 🔗 Seamless Account Linking
- Verification mechanisms for Codeforces, LeetCode, CodeChef, and GeeksforGeeks ensuring tamper-proof account ownership.

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Browser (React Client)                        │
│          Vite · React 19 · Tailwind v4 · Three.js · Recharts           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS
┌───────────────────────────────────▼────────────────────────────────────┐
│                    CPPro Main Backend (Express v5) :5000               │
│   Auth · Orchestrator · Leaderboard · Community · Daily Recommendations│
└───────┬───────────────────┬───────────────────┬───────────────────┬────┘
        │ HTTP              │ HTTP              │ HTTP              │ HTTPS
        ▼                   ▼                   ▼                   ▼
┌──────────────┐    ┌───────────────┐   ┌───────────────┐   ┌─────────────────┐
│  Codeforces  │    │  LeetCode     │   │   CodeChef    │   │  GeeksforGeeks  │
│  API Server  │    │  API Server   │   │  API Server   │   │ Serverless Relay│
│    :3001     │    │    :4001      │   │    :5001      │   │   (Vercel/6001) │
│   BullMQ     │    │   BullMQ      │   │   BullMQ      │   │  REST Scraper   │
│ Proxy Engine │    │  GraphQL + LC │   │ Cheerio Probe │   │  Clean JSON API │
└───────┬──────┘    └───────┬───────┘   └───────┬───────┘   └────────┬────────┘
        │                   │                   │                    │
        └─────────┬─────────┴─────────┬─────────┘                    │
                  ▼                   ▼                              │
        ┌──────────────────┐  ┌──────────────┐                       │
        │  MongoDB Atlas   │  │    Redis     │                       │
        │ (Shared Database)│  │ (BullMQ/Lock)│                       │
        └──────────────────┘  └──────────────┘                       │
                  ▲                                                  │
                  └──────────────────────────────────────────────────┘
```

| Service | Directory | Nature | Primary Role |
|---|---|---|---|
| **CPPro Main** | `CPPro/` | Express v5 + React 19 | Frontend SPA + Core backend API and business logic |
| **Codeforces Sync Worker** | `Codeforces-Api Server/` | Express v4 + BullMQ | Proxy-rotated Codeforces worker & handle verification |
| **LeetCode Sync Worker** | `Leetcode-Api Server/` | Express v5 + BullMQ | GraphQL-powered LeetCode engine with proxy slot locking |
| **CodeChef Sync Worker** | `CodeChef-Api Server/` | Express v4 + BullMQ | Lightweight probe checking & HTML scraping worker |
| **GFG Serverless Relay** | `GFG-Api ServerLess/` | Serverless Function | Serverless relay for GeeksforGeeks profile & problem data |

---

## ⚡ The "Lean Nexus" Data Flow

CPPro ensures users never wait on slow third-party platform scrapes:

```
User visits dashboard / requests data
                  │
                  ▼
Check per-platform data freshness in MongoDB
                  │
        ┌─────────┴─────────┐
        │ Data within TTL?  │
        └─────────┬─────────┘
                  │
      YES ────────┴──────── NO
       │                    │
       ▼                    ▼
Return MongoDB        1. Stamp updated timestamp immediately
data instantly        2. Return existing MongoDB data instantly
                      3. Dispatch asynchronous background sync job
                      4. Next visit displays fresh, synchronized data
```

---

## 📐 CPScore — Unified Competency Metric

CPScore evaluates overall competitive programming prowess through a balanced combination of:
- **Contest Ratings**: Normalized across Codeforces, LeetCode, and CodeChef.
- **Problem Solve Volume & Difficulty**: Tiered bonus points for Hard, Medium, and Easy solves across all linked platforms.
- **Contest Activity**: Scaled bonus for competitive contest participation.
- **Consistency**: Streaks and peak-performance bounce-back incentives.
- **GeeksforGeeks Scoring**: Incorporating coding scores and problem-solving benchmarks.

---

## 🛠️ Tech Stack

### Frontend
| Component | Technology |
|---|---|
| Framework & Bundler | React 19, Vite, React Router v7 |
| Styling & Theme | Tailwind CSS v4, Lucide Icons, Custom Dark/Light theme |
| Visualization & Graphics | Three.js, React Three Fiber, Recharts, Mermaid.js |
| Animation & Transitions | Framer Motion |

### Backend & Microservices
| Component | Technology |
|---|---|
| Main Backend | Node.js, Express v5, Mongoose v9, JWT, bcryptjs |
| AI Generation | Google Generative AI (Gemini / Gemma models) |
| Task Queues & Caching | BullMQ, ioredis, Redis |
| Scraping & Parsing | Cheerio, Axios, https-proxy-agent |
| Serverless Relay | Node.js Serverless Function (Vercel deployment) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB** (Atlas cloud cluster or local instance)
- **Redis** (Local instance or cloud provider like Upstash/RedisLabs)

### 1. Installation

```bash
git clone https://github.com/yashyadav-4/cppro.git
cd CPPro

# Install root dependencies
npm install

# Install client and server dependencies
cd client && npm install && cd ../server && npm install && cd ..
```

### 2. Environment Configuration

Set up environment files for the client, main server, and sync engines:

```bash
cp client/.env.example client/.env
```

**Main Server Configuration (`CPPro/server/.env`)**:
```env
PORT=5000
NODE_ENV=development

MongoUrl=mongodb+srv://<user>:<password>@cluster.mongodb.net/cppro
JWT_SECRET=your-jwt-secret-key

# Microservice Endpoints
CF_SYNC_API=http://localhost:3001
CF_SYNC_SECRET=your-cf-secret

LC_SYNC_API=http://localhost:4001
LC_SYNC_SECRET=your-lc-secret

CC_SYNC_API=http://localhost:5001
CC_SYNC_SECRET=your-cc-secret

GFG_RELAY_URL=http://localhost:6001
GFG_RELAY_SECRET=your-gfg-secret

# AES-256-GCM encryption key for user tokens (64 hex characters)
ENCRYPTION_KEY=your-64-character-hex-key

ALLOWED_ORIGIN=http://localhost:5173
GEMINI_API_KEYS=your-gemini-api-keys
```

**Client Configuration (`CPPro/client/.env`)**:
```env
VITE_API_BASE=http://localhost:5000
```

### 3. Running Locally

Start the client and server concurrently:
```bash
# In CPPro/
npm start
```

Run the supporting sync services in separate terminals:
```bash
# Terminal 2: Codeforces sync worker
cd "Codeforces-Api Server" && npm start

# Terminal 3: LeetCode sync worker
cd "Leetcode-Api Server" && npm start

# Terminal 4: CodeChef sync worker
cd "CodeChef-Api Server" && npm start

# Terminal 5: GeeksforGeeks serverless relay
cd "GFG-Api ServerLess" && npm run dev
```

---

## 🔐 Security & Data Integrity

- **Secure Session Encryption**: Sensitive user tokens are encrypted using AES-256-GCM before database storage.
- **Role-Based Route Protection**: Admin routes are protected by client-side guards and server-side role verifications.
- **Inter-Service Authentication**: Microservice communication routes require pre-shared bearer credentials.
- **Proxy Anonymity & Resilience**: User requests are decoupled from platform scraping, preserving upstream compliance.

---

## 📄 License

ISC

---

<p align="center">Built for the competitive programming community.</p>