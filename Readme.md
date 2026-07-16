<p align="center">
  <img src="https://img.shields.io/badge/CPPro-Competitive%20Programming%20Analytics-6C63FF?style=for-the-badge" alt="CPPro">
</p>

<h1 align="center">CPPro — Unified Competitive Programming Analytics</h1>

<p align="center">
  One dashboard. Three platforms. Zero context switching.
</p>

<p align="center">
  <a href="https://cppro.dev" target="_blank"><img src="https://img.shields.io/badge/Live%20Demo-cppro.dev-6C63FF?style=flat-square" alt="Live Demo"></a>
  <img src="https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=nodedotjs" alt="Node.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/Redis-BullMQ-DC382D?style=flat-square&logo=redis" alt="Redis">
  <img src="https://img.shields.io/badge/License-ISC-blue?style=flat-square" alt="License">
</p>

---

## What is CPPro?

CPPro is a self-hosted, SaaS-style analytics platform for competitive programmers. It unifies your **Codeforces**, **LeetCode**, and **CodeChef** data into a single, beautiful dashboard — ratings, submission heatmaps, contest history, skill-gap analysis, upsolve queues, a global leaderboard, daily personalized problems, code templates, and a community forum.

Built as a **four-service microarchitecture** — each platform gets its own dedicated sync engine with a BullMQ worker, Webshare proxy rotation, and Redis-backed slot management — so the main app stays fast even when upstream platforms are rate-limited or blocked by Cloudflare.

---

## ✨ Features

### 📊 Unified Dashboard
- **Codeforces** — Rating progression, contest history, topic-level skill breakdown, difficulty distribution, recent submissions, activity heatmap, upsolve queue
- **LeetCode** — Rating, skill tags (fundamental / intermediate / advanced), badge stats, calendar heatmap, contest history
- **CodeChef** — Star rating, contest history parsed from embedded profile data (bypasses Cloudflare-blocked API), heatmap, language breakdown, verdict distribution
- Combined **CPScore** across all three platforms
- Shareable dashboard card — export as an image

### 🔥 Daily Problems
Two personalized problems generated every IST day per user:
- **Daily Workout** — At or slightly below your current level; high solve-count; consistency-focused
- **Daily Challenger** — Slightly above your level; targets your weakest topic tag

Includes daily streak tracking, dashboard widget, and auto-solve detection that notifies you when a submitted problem counts.

### 🏆 Leaderboard
Global, country-level, and college-level leaderboards across CPScore and individual platform rating categories. Recomputed every 15 minutes by a background worker.

### 🧠 Learning Tree
A 3D interactive knowledge graph (Three.js) covering competitive programming topics from basics to advanced. Track your progress per node.

### 📅 Contest Tracker
Upcoming contests from CF, LC, and CC synced every 6 hours. View in a calendar or upcoming sidebar. Supports custom contest entries.

### 📝 Code Templates
Personal code snippet manager — create, tag, search, and view templates with full syntax highlighting.

### 💬 Community Forum
Threaded posts and comments with upvoting, pinning, and full-text search.

### 🔔 Notifications
In-app notification bell with unread count. Alerts for daily problem solves, streak milestones, sync completions, and admin broadcasts.

### 🛡️ Admin Dashboard
User analytics, broadcast notifications, error log viewer — all double-gated behind admin role checks.

### 🔗 Account Linking & Verification
- **Codeforces** — Generate a verification code → set it as your CF Real Name → CPPro confirms via proxy scrape
- **LeetCode** — Verified via NexusLC `/verify/:username` (checks realName field)
- **CodeChef** — Verified via CC server `/verify/:handle`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (React)                   │
│     Vite · React 19 · Tailwind v4 · Three.js        │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────┐
│           CPPro Main (Express v5)   :5000           │
│  Auth · Dashboard · Leaderboard · Community · Daily │
└──────┬──────────────────┬──────────────────┬────────┘
       │ HTTP             │ HTTP             │ HTTP
       ▼                  ▼                  ▼
┌─────────────┐  ┌───────────────┐  ┌───────────────┐
│ Codeforces  │  │ NexusLC (LC)  │  │  CodeChef     │
│ API Server  │  │   API Server  │  │  API Server   │
│  :3001      │  │    :4001      │  │   :5001       │
│  BullMQ     │  │  BullMQ       │  │  BullMQ       │
│  Proxies    │  │  GraphQL      │  │  Cheerio      │
└──────┬──────┘  └───────┬───────┘  └───────┬───────┘
       │                 │                   │
       └────────┬────────┘                   │
                ▼                            ▼
        ┌──────────────┐             ┌──────────────┐
        │ MongoDB Atlas│             │  Redis       │
        │  (shared)    │             │  (BullMQ +   │
        └──────────────┘             │  slot locks) │
                                     └──────────────┘
```

| Service | Folder | Port | Purpose |
|---|---|---|---|
| CPPro Main App | `CPPro/` | 5000 + 5173 | React frontend + Express backend |
| Codeforces API Server | `Codeforces-Api Server/` | 3001 | BullMQ worker — CF data via Webshare proxies |
| LeetCode API Server (NexusLC) | `Leetcode-Api Server/` | 4001 | BullMQ worker — LC data via GraphQL + proxies |
| CodeChef API Server | `CodeChef-Api Server/` | 5001 | BullMQ worker — CC HTML scraping + proxies |

All four services share one MongoDB Atlas cluster. CF and LC servers share a Redis instance (key-namespaced). CC server uses its own Redis instance.

---

## ⚡ Data Flow — Lean Nexus Pattern

CPPro **never blocks the user** on third-party API calls.

```
User visits dashboard
        │
        ▼
Check freshness (per-platform TTL)
        │
   ┌────┴────┐
   │  Fresh? │
   └────┬────┘
        │ YES → Return DB data immediately ✅
        │
        │ NO  → Stamp timestamp (prevents race conditions)
              → Return current DB data immediately ✅
              → Trigger background sync job
              → User sees updated data on next visit
```

**Freshness TTLs:** CF — 10 min (admins: 10 s) · LC — 15 min (admins: 10 s)

---

## 🔒 Proxy & Resiliency

- **Webshare proxies** rotated across all three sync servers; full pool re-probe every 10 min, in-memory slot refresh every 30 s
- **CF server** — 26-User-Agent fingerprint pool; endpoint-specific proxy selection; Bottleneck singleton (`maxConcurrent=1`, `minTime=250ms`)
- **NexusLC** — Slot system: each slot = one proxy + deterministic UA derived from `sha256(proxy)`. Redis `SET NX PX` slot locks (1 s residential, 2 s datacenter). Two hard failures → `IP_DEAD` + email alert
- **CC server** — Cloudflare challenge detected and handled; CC silently skipped if blocked
- All API servers expose `/health`; all non-health routes require `Authorization: Bearer <API_SECRET>`

---

## 📐 CPScore Formula

```
CPScore = floor(
    (CF_Rating × 1.5)  + (LC_Rating × 1.2)  +
    (CF_Hard × 15)     + (CF_Medium × 8)     + (CF_Easy × 2)  +
    (LC_Hard × 20)     + (LC_Medium × 8)     + (LC_Easy × 2)  +
    (Total_Contests × 10) +
    max(0, (CF_MaxRating − CF_CurrentRating) × 0.5) +
    min(max(CF_Streak, LC_Streak) × 2, 200)
)
```

---

## 🛠️ Tech Stack

### Frontend
| Library | Version | Use |
|---|---|---|
| React | 19 | UI framework |
| Vite | 7 | Build tool & dev server |
| React Router | v7 | Client-side routing |
| Tailwind CSS | v4 | Styling |
| Framer Motion | 12 | Animations |
| Three.js + R3F | latest | 3D Learning Tree |
| Recharts | 3 | Charts & graphs |
| Lucide React | latest | Icons |
| Axios | 1.x | API calls |

### Backend (CPPro Main)
| Library | Version | Use |
|---|---|---|
| Express | v5.2.1 | HTTP server |
| Mongoose | v9.1.5 | MongoDB ORM |
| jsonwebtoken + bcryptjs | latest | Auth |
| Bottleneck | 2.x | CF API rate limiting |
| Helmet | 8.x | Security headers |
| @google/generative-ai | 0.24 | Gemini AI integration |
| @upstash/redis | 1.x | Redis client |

### Sync Servers
| Tech | Use |
|---|---|
| BullMQ + ioredis | Job queues for all 3 sync servers |
| Cheerio | CodeChef HTML scraping |
| Raw GraphQL (axios) | LeetCode API — no Apollo overhead |
| Nodemailer | Email alerts for dead proxies |
| https-proxy-agent | Webshare proxy routing |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or Atlas)
- **Redis** (local, Upstash, or RedisLabs)

### 1. Clone & Install

```bash
git clone https://github.com/yashyadav-4/cppro.git
cd CPPro

# Install root + client + server dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### 2. Configure Environment Variables

```bash
cp client/.env.example client/.env
# Then create server/.env manually (no example committed for security)
```

**`server/.env`**
```env
PORT=5000
NODE_ENV=development

# MongoDB
MongoUrl=mongodb+srv://<user>:<pass>@cluster.mongodb.net/cppro

# JWT
Secret=your-long-random-jwt-secret

# Inter-service auth (must match each API server's API_SECRET)
CF_SYNC_API=http://localhost:3001
CF_SYNC_SECRET=your-cf-sync-secret

LC_SYNC_API=http://localhost:4001
LC_SYNC_SECRET=your-lc-sync-secret

CC_SYNC_API=http://localhost:5001
CC_SYNC_SECRET=your-cc-sync-secret

# AES-256-GCM key for encrypting LC session tokens — generate with: openssl rand -hex 32
ENCRYPTION_KEY=64-hex-chars

# CORS — set to your frontend URL
ALLOWED_ORIGIN=http://localhost:5173

# Google OAuth (from Google Cloud Console)
CLIENT_ID=your-google-oauth-client-id
CLIENT_SECRET=your-google-oauth-client-secret

# CLIST API key (for AtCoder contest data)
CLIST_API_KEY=username:your-clist-api-key

# Gemini API keys (comma-separated for round-robin rotation)
GEMINI_API_KEYS=key1,key2,key3

# Upstash Redis (for leaderboard caching)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

**`client/.env`**
```env
VITE_API_BASE=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

> See each API server's `.env.example` for its specific variables (Redis host/password, MongoDB URL, Webshare proxy keys, email alert config).

### 3. Run in Development

```bash
# From CPPro/ — starts client (Vite :5173) and server (:5000) concurrently
npm start
```

To run sync servers as well (required for full platform data):

```bash
# Terminal 2
cd "Codeforces-Api Server" && npm start

# Terminal 3
cd "Leetcode-Api Server" && npm start

# Terminal 4
cd "CodeChef-Api Server" && npm start
```

---

## 📦 Repository Structure

```
Workspace root
├── CPPro/                          ← Main app
│   ├── client/                     ← React frontend (Vite)
│   │   ├── src/
│   │   │   ├── main.jsx
│   │   │   ├── AppRouter.jsx
│   │   │   ├── components/
│   │   │   │   ├── Dashboard/      ← CF/LC/CC stats, heatmap, charts
│   │   │   │   ├── DailyChallenge/ ← Daily Workout + Challenger
│   │   │   │   ├── Leaderboard/    ← Global/country/college boards
│   │   │   │   ├── LearningTree/   ← 3D Three.js topic tree
│   │   │   │   ├── ContestTracker/ ← Calendar + upcoming list
│   │   │   │   ├── CodeTemplate/   ← Snippet CRUD
│   │   │   │   ├── Community Page/ ← Forum, posts, comments
│   │   │   │   ├── LevelUp/        ← Growth planner + upsolve
│   │   │   │   ├── Notifications/  ← Bell + dropdown
│   │   │   │   ├── Settings/       ← Profile, account linking, LC session
│   │   │   │   └── Admin/          ← Admin dashboard
│   │   │   ├── context/            ← ThemeContext, NotificationContext
│   │   │   └── hooks/              ← useDashboardData, useContestData
│   │   └── .env.example
│   │
│   ├── server/                     ← Express v5 backend
│   │   ├── index.js
│   │   ├── Controllers/            ← Auth, dashboards, leaderboard, daily, admin
│   │   ├── Services/               ← Sync logic, problem catalog, weakness detection
│   │   ├── Repositories/           ← MongoDB aggregation pipelines
│   │   ├── Model/                  ← Mongoose schemas
│   │   ├── Routes/
│   │   ├── Middlewares/            ← JWT auth, admin gate, daily warmup
│   │   ├── Utils/                  ← Proxy client, encryption, date helpers
│   │   └── Workers/                ← Contest sync, leaderboard recompute
│   │
│   ├── render.yaml
│   └── package.json
│
├── Codeforces-Api Server/          ← CF BullMQ sync worker
├── Leetcode-Api Server/            ← NexusLC BullMQ sync worker
└── CodeChef-Api Server/            ← CC BullMQ sync worker
```

---

## ☁️ Deployment

| Service | Platform | Port | Health Endpoint |
|---|---|---|---|
| CPPro Main (API) | Render / Azure / Railway | 5000 | `GET /api/health` |
| CPPro Frontend | Render Static / Netlify | — | — |
| Codeforces API Server | Render | 3001 | `GET /health` |
| NexusLC (LeetCode) | Render | 4001 | `GET /health` |
| CodeChef API Server | Render | 5001 | `GET /health` |
| MongoDB | Atlas (M0 free tier works) | — | — |
| Redis | Upstash / RedisLabs | — | — |

```bash
# Build the React frontend
cd client && npm run build
```

The `render.yaml` in the root handles static frontend deployment on Render automatically. Set all `.env` values as environment variables in your host's dashboard — never commit them.

---

## 🔐 Security

- All `.env` files are gitignored — never committed to this repo
- JWT tokens stored in `httpOnly` cookies
- LeetCode session tokens encrypted with **AES-256-GCM** before storing in MongoDB
- Helmet.js security headers on all Express backends
- All inter-service API routes require `Authorization: Bearer <API_SECRET>`

---

## ⚠️ Known Limitations

| Area | Status |
|---|---|
| Learning Tree sync | Progress currently in `localStorage` — MongoDB sync model is ready, not wired yet |
| LeetCode public sync | No `statusDisplay`/language in recent submissions without a session token |
| Dashboard error boundaries | Per-section error boundaries not yet implemented |
| Level-Up advanced roadmap | Placeholder — full feature planned |
| Leaderboard search | No search-by-username yet |

---

## 📄 License

ISC

---

<p align="center">Built for the competitive programming community · <a href="https://cppro.dev">cppro.dev</a></p>

