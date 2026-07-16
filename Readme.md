<p align="center">
  <img src="https://img.shields.io/badge/CPPro-Competitive%20Programming%20Analytics-6C63FF?style=for-the-badge" alt="CPPro">
</p>

<h1 align="center">CPPro — Unified Competitive Programming Analytics</h1>

<p align="center">
  One dashboard. Three platforms. Zero context switching.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=nodedotjs" alt="Node.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/Redis-BullMQ-DC382D?style=flat-square&logo=redis" alt="Redis">
  <img src="https://img.shields.io/badge/License-ISC-blue?style=flat-square" alt="License">
</p>

<!-- If cppro.dev is live, re-add this badge:
<a href="https://cppro.dev" target="_blank"><img src="https://img.shields.io/badge/Live%20Demo-cppro.dev-6C63FF?style=flat-square" alt="Live Demo"></a>
-->

---

## What is CPPro?

CPPro is a self-hosted, SaaS-style analytics platform for competitive programmers. It unifies **Codeforces**, **LeetCode**, and **CodeChef** data into a single dashboard — ratings, submission heatmaps, contest history, skill-gap analysis, upsolve queues, a global leaderboard, AI-generated daily problems and learning topics, code templates, and a community forum.

Built as a **four-service microarchitecture**: the main app plus one dedicated sync engine per platform, each with its own BullMQ worker, proxy rotation, and Redis-backed rate limiting — so the dashboard stays fast even when an upstream platform is rate-limiting or Cloudflare-blocking requests.

> Solo-designed and built end to end, including the multi-service sync architecture, the proxy/slot resiliency layer for LeetCode, and the non-blocking "Lean Nexus" data-freshness pattern used across all three platforms.

---

## ✨ Features

### 📊 Unified Dashboard
- **Codeforces** — rating progression, contest history, topic-level skill breakdown, difficulty distribution, activity heatmap, upsolve queue
- **LeetCode** — rating, skill tags (fundamental / intermediate / advanced), badge stats, calendar heatmap, contest history
- **CodeChef** — star rating, contest history parsed from embedded profile data (works around the Cloudflare-blocked ratings API), heatmap, language breakdown, verdict distribution
- Combined **CPScore** across all three platforms
- Shareable dashboard card — exportable as an image

### 🔥 Daily Problems + AI Daily Topic
- **Daily Workout** — a problem at or slightly below current level, high solve-count, consistency-focused
- **Daily Challenger** — a problem slightly above current level, targeting the user's weakest topic tag
- Optional **bonus** slot when a third platform is linked
- **AI-generated daily learning topic** (Gemini) — a written article, worked dry-run, code template, and Mermaid diagram, targeted at the user's weakest area
- Daily streak tracking, dashboard widget, and auto-solve detection that confirms a solve after the next sync

### 🏆 Leaderboard
Global, country-level, and college-level boards across CPScore and individual platform ratings, served from a periodically refreshed cache.

### 🧠 Learning Tree
A 3D interactive knowledge graph (Three.js) covering CP topics from fundamentals to advanced. Per-node progress is persisted to MongoDB (with full history tracking) and synced across devices.

### 📅 Contest Tracker
Upcoming contests across CF/LC/CC, synced periodically with automatic cleanup of stale entries.

### 📝 Code Templates
Personal snippet manager — create, tag, filter by language, and search.

### 💬 Community Forum
Threaded posts and comments with upvoting, pinning, and full-text search.

### 🔔 Notifications
In-app bell with unread count — alerts for daily-problem readiness, solves, streak milestones, sync issues, and admin broadcasts.

### 🛡️ Admin Dashboard
Platform-wide analytics, broadcast notifications, and an error-log viewer — double-gated behind a client-side route guard *and* a server-side role check on every request.

### 🔗 Account Linking & Verification
- **Codeforces** — generate a one-time verification code → set it as your CF "First Name" → CPPro confirms via the CF public API
- **LeetCode** — verified through the LeetCode sync server's `/verify/:username`, checking the account's real-name field
- **CodeChef** — verified through the CodeChef sync server's `/verify/:handle`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (React)                   │
│     Vite · React 19 · Tailwind v4 · Three.js         │
└────────────────────┬────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────┐
│           CPPro Main (Express v5)   :5000            │
│  Auth · Dashboard · Leaderboard · Community · Daily  │
└──────┬──────────────────┬──────────────────┬────────┘
       │ HTTP             │ HTTP              │ HTTP
       ▼                  ▼                   ▼
┌─────────────┐   ┌───────────────┐   ┌───────────────┐
│ Codeforces  │   │ NexusLC (LC)  │   │  CodeChef     │
│ API Server  │   │  API Server   │   │  API Server   │
│   :3001     │   │    :4001      │   │    :5001      │
│  BullMQ     │   │  BullMQ       │   │  BullMQ       │
│  Proxies    │   │  GraphQL      │   │  Cheerio      │
└──────┬──────┘   └───────┬───────┘   └───────┬───────┘
       │                  │                    │
       └─────────┬────────┘                    │
                  ▼                             ▼
          ┌──────────────┐             ┌──────────────┐
          │ MongoDB Atlas│             │  Redis       │
          │  (shared)    │             │ (BullMQ +    │
          └──────────────┘             │ slot locks)  │
                                        └──────────────┘
```

| Service | Folder | Port | Purpose |
|---|---|---|---|
| CPPro Main App | `CPPro/` | 5000 + 5173 | React frontend + Express backend |
| Codeforces API Server | `Codeforces-Api Server/` | 3001 | BullMQ worker — CF data via proxy rotation |
| LeetCode API Server (NexusLC) | `Leetcode-Api Server/` | 4001 | BullMQ worker — LC data via GraphQL + proxies |
| CodeChef API Server | `CodeChef-Api Server/` | 5001 | BullMQ worker — CC data via HTML scraping + proxies |

All four services share one MongoDB Atlas cluster. The CF and LC servers share a Redis instance (key-namespaced); the CC server uses its own.

---

## ⚡ Data Flow — "Lean Nexus" Pattern

CPPro never blocks the user on a third-party API call.

```
User requests dashboard data
        │
        ▼
Check per-platform freshness (CF / LC / CC)
        │
   ┌────┴────┐
   │ Fresh?  │
   └────┬────┘
        │ YES → return DB data immediately
        │
        │ NO  → stamp the timestamp now (prevents duplicate syncs)
              → return current DB data immediately
              → trigger a background sync job
              → user sees the update on their next request
```

**Freshness window:** 15 minutes for regular users across CF/LC/CC (10 seconds for admins, to speed up testing/demo).

---

## 🔒 Proxy & Resiliency

- Proxies rotated across all three sync servers, with periodic full re-probes and more frequent in-memory pool refreshes.
- **CF server** — rotating User-Agent pool, endpoint-specific proxy selection, and a single rate-limiter instance serializing all outbound Codeforces calls.
- **NexusLC** — a slot system where each slot pairs one proxy with a deterministic User-Agent (hashed from the proxy string). Atomic Redis locks per slot; two consecutive hard failures mark a slot dead and trigger an email alert.
- **CC server** — detects Cloudflare's challenge page and falls back gracefully (the daily-problem generator silently skips CC and uses CF/LC instead).
- Every sync server exposes a public `/health` endpoint; every other route requires a bearer-token secret shared only between CPPro and that service.

---

## 📐 CPScore Formula

```
CPScore = floor(
    (CF_Rating × 1.5) + (LC_Rating × 1.2) + (CC_Rating × 1.1) +
    (CF_Hard × 15) + (CF_Medium × 8) + (CF_Easy × 2) +
    (LC_Hard × 20) + (LC_Medium × 8) + (LC_Easy × 2) +
    (Total_Contests × 10) +
    max(0, (CF_MaxRating − CF_CurrentRating) × 0.5) +
    min(max(CF_Streak, LC_Streak) × 2, 200)
)
```

---

## 🛠️ Tech Stack

### Frontend
| Library | Use |
|---|---|
| React 19 + Vite | UI framework & build tool |
| React Router v7 | Client-side routing |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations |
| Three.js + React Three Fiber | 3D Learning Tree |
| Recharts | Charts & graphs |
| Axios | API calls |

### Backend (CPPro Main)
| Library | Use |
|---|---|
| Express v5 | HTTP server |
| Mongoose | MongoDB ORM |
| jsonwebtoken + bcryptjs | Auth |
| Bottleneck | CF API rate limiting |
| @google/generative-ai | Gemini-powered daily topic generation |

### Sync Servers
| Tech | Use |
|---|---|
| BullMQ + ioredis | Job queues for all three sync servers |
| Cheerio | CodeChef HTML scraping |
| Raw GraphQL over axios | LeetCode data (no Apollo overhead) |
| Nodemailer | Email alerts on dead proxies |
| https-proxy-agent | Proxy routing |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Redis (local, Upstash, or RedisLabs)

### 1. Clone & install

```bash
git clone https://github.com/yashyadav-4/cppro.git
cd CPPro
npm install
cd client && npm install && cd ../server && npm install && cd ..
```

### 2. Configure environment variables

Copy the client example and create the server file manually (no example is committed, to avoid leaking secret shapes):

```bash
cp client/.env.example client/.env
```

**`server/.env`** (values below are placeholders — generate/rotate your own):
```env
PORT=5000
NODE_ENV=development

MongoUrl=mongodb+srv://<user>:<pass>@cluster.mongodb.net/cppro

JWT_SECRET=your-long-random-jwt-secret

CF_SYNC_API=http://localhost:3001
CF_SYNC_SECRET=your-cf-sync-secret

LC_SYNC_API=http://localhost:4001
LC_SYNC_SECRET=your-lc-sync-secret

CC_SYNC_API=http://localhost:5001
CC_SYNC_SECRET=your-cc-sync-secret

# AES-256-GCM key for encrypting LeetCode session tokens
# generate with: openssl rand -hex 32
ENCRYPTION_KEY=64-hex-chars

ALLOWED_ORIGIN=http://localhost:5173

GEMINI_API_KEYS=key1,key2,key3
```

**`client/.env`**
```env
VITE_API_BASE=http://localhost:5000
```

> Each sync server has its own `.env.example` covering Redis host/credentials, MongoDB URL, proxy provider keys, and email-alert config.

### 3. Run in development

```bash
# From CPPro/ — starts client (:5173) and server (:5000) concurrently
npm start
```

Run the sync servers in separate terminals for full platform data:

```bash
cd "Codeforces-Api Server" && npm start
cd "Leetcode-Api Server"   && npm start
cd "CodeChef-Api Server"   && npm start
```

---

## 📦 Repository Structure

```
Workspace root
├── CPPro/                          Main app
│   ├── client/                     React frontend (Vite)
│   │   └── src/
│   │       ├── components/
│   │       │   ├── Dashboard/      CF/LC/CC stats, heatmap, charts
│   │       │   ├── DailyChallenge/ Daily problems + AI topic
│   │       │   ├── Leaderboard/
│   │       │   ├── LearningTree/   3D Three.js topic tree
│   │       │   ├── ContestTracker/
│   │       │   ├── CodeTemplate/
│   │       │   ├── Community Page/
│   │       │   ├── LevelUp/        Growth planner + upsolve
│   │       │   ├── Notifications/
│   │       │   ├── Settings/
│   │       │   └── Admin/
│   │       ├── context/            ThemeContext, NotificationContext
│   │       └── hooks/
│   ├── server/                     Express v5 backend
│   │   ├── Controllers/
│   │   ├── Services/                sync logic, problem catalogs, weakness detection, AI topic gen
│   │   ├── Repositories/
│   │   ├── Model/                   Mongoose schemas
│   │   ├── Routes/
│   │   ├── Middlewares/
│   │   ├── Utils/
│   │   └── Workers/
│   └── package.json
│
├── Codeforces-Api Server/          CF BullMQ sync worker
├── Leetcode-Api Server/            NexusLC BullMQ sync worker
└── CodeChef-Api Server/            CC BullMQ sync worker
```

---

## ☁️ Deployment

| Service | Port | Health Endpoint |
|---|---|---|
| CPPro Main (API) | 5000 | `GET /api/health` |
| Codeforces API Server | 3001 | `GET /health` |
| NexusLC (LeetCode) | 4001 | `GET /health` |
| CodeChef API Server | 5001 | `GET /health` |

MongoDB (Atlas) and Redis (Upstash/RedisLabs) are external managed services. Set all env values through your host's dashboard/secrets manager — never commit them.

---

## 🔐 Security

- All `.env` files are gitignored and were never committed to this repo
- JWT stored in an `httpOnly` cookie
- LeetCode session tokens encrypted with AES-256-GCM before being stored
- Every inter-service route (except `/health`) requires a bearer-token secret shared only between CPPro and that specific sync server
- Admin routes are double-gated: a client-side route guard plus a server-side role check on every request

---

## ⚠️ Known Limitations

| Area | Status |
|---|---|
| LeetCode public sync | No `statusDisplay`/language in recent submissions without a session token |
| Dashboard error boundaries | Per-section error boundaries not yet implemented |
| Level-Up advanced roadmap | Placeholder — full feature planned |
| Leaderboard search | No search-by-username yet |

---

## 📄 License

ISC

---

<p align="center">Built solo for the competitive programming community.</p>