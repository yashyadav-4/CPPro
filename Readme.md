# CPPro: Unified Competitive Programming Analytics Platform

CPPro is a self-hosted, SaaS-style analytics dashboard for competitive programmers. It unifies data from Codeforces, LeetCode, and CodeChef into a single product: ratings, heatmaps, contest history, skill gaps, upsolve queues, leaderboards, learning curriculum, code templates, daily challenges, and community forums.

This workspace contains the main CPPro app plus three dedicated data-sync services. The architecture is designed to keep the user experience fast and resilient even when upstream platforms are rate-limited or blocked.

---

## Architecture overview

| Service | Folder | Port | Purpose |
| --- | --- | --- | --- |
| CPPro Main App | CPPro/ | 5000 (API) + 5173 (Vite) | React frontend + Express backend |
| Codeforces API Server | Codeforces-Api Server/ | 3001 | BullMQ worker: syncs CF data via Webshare proxies |
| LeetCode API Server (NexusLC) | Leetcode-Api Server/ | 4001 | BullMQ worker: syncs LC data via GraphQL + proxies |
| CodeChef API Server | CodeChef-Api Server/ | 5001 | BullMQ worker: syncs CC data via HTML scraping + proxies |

All four services share one MongoDB Atlas cluster. The CF and LC servers share a Redis instance (namespaced keys). The CC server uses its own Redis instance.

---

## End-to-end data flow (Lean Nexus)

CPPro never blocks the user on third-party calls.

1. User requests dashboard data.
2. CPPro checks freshness (per-platform cooldown).
3. If fresh, return data immediately.
4. If stale:
     - Stamp the last update timestamp to prevent races.
     - Return current DB data immediately.
     - Trigger background sync via the relevant API server.
     - The user sees updated data on the next refresh.

Cooldown defaults: Codeforces 10 minutes (admins 10 seconds), LeetCode 15 minutes (admins 10 seconds).

---

## Proxy, rate limiting, and resiliency

- Webshare proxies are rotated and re-probed on a schedule (full refresh every 10 minutes; pool sync every 30 seconds).
- Codeforces server uses a 26-User-Agent pool and endpoint-specific proxy selection.
- NexusLC uses a slot system: each slot is a proxy + deterministic User-Agent derived from sha256(proxy).
- Slot locks use Redis SET NX PX (1s residential, 2s datacenter). Two hard failures mark IP_DEAD and trigger alerts.
- CPPro has a Bottleneck singleton (maxConcurrent=1, minTime=250ms) that serializes all CF proxy calls.
- All API servers expose /health; all non-health routes require Authorization: Bearer <API_SECRET>.

---

## Daily Problem system

Two problems are generated per user per IST day:
- Daily Workout: at or slightly below current level; high solvedCount; consistency-focused.
- Daily Challenger: slightly above level; targets the weakest topic tag.

Key design details:
- Lazy generation on the first GET /api/daily (no cron).
- Platform priority for both slots: LC -> CF -> CC (fallback if a source fails or is blocked).
- Attempted-set protection uses both submissions and the last 14 days of assigned daily problems.
- In-memory catalog cache with Promise coalescing (1 API call per cold cache even with 1000 parallel requests).
- Auto-solve detection runs after each sync job and updates streaks plus notifications.
- CC Cloudflare challenge is detected; CC is skipped silently if blocked.

---

## Verification and account linking

- Codeforces: generate 8-char hex code -> user sets it as Real Name -> CPPro verifies via proxy scrape.
- LeetCode: CPPro calls NexusLC /verify/:username to confirm realName.
- CodeChef: CPPro calls CC server /verify/:handle to link the handle.

---

## LeetCode session sync (optional)

- Settings can store an encrypted LEETCODE_SESSION cookie (AES-256-GCM).
- Encrypted format: iv:authTag:ciphertext (hex-joined).
- If session expires, NexusLC returns SESSION_EXPIRED and CPPro marks the token expired and notifies the user.
- Public sync still works without a session; authenticated sync adds statusDisplay and language for recent submissions.

---

## CodeChef specifics

- Ratings API is blocked by Cloudflare; contest history is parsed from embedded profile script data.
- Rank labels use the star system (1-7 stars) based on rating.
- Submission timestamps are normalized to IST to keep streaks and heatmaps consistent.
- Duplicate submissions are deduped using a two-layer approach (write-time pruning of the last 14 days + read-time day bucket dedup).

---

## Feature set (current)

### Built and working
- JWT auth (signup/login/logout/change-password)
- CF + LC + CC account linking (verification code flow)
- CF data sync (BullMQ + Webshare proxies)
- LC data sync (GraphQL + NexusLC slot proxy system)
- CC dashboard aggregate (heatmap, streaks, verdicts, languages, contest history, AC list)
- Daily Problems (Workout + Challenger), daily streak, dashboard widget, /daily page
- Dashboard analytics: heatmap, rating progression, difficulty breakdown, skill gaps, topics, contests, achievements, streaks
- Total submissions stat with per-platform chips (CF/LC/CC)
- Leaderboard: global/country/college across CPScore and rating-based categories
- NextTarget growth planner and upsolve queue
- Code template manager (CRUD, tags, pagination, modal details)
- Community forum with threaded comments, votes, and pinned posts
- Learning Tree (3D) with client-side progress
- Contest tracker (6h sync worker + TTL cleanup)
- Notification system (bell dropdown, unread count, daily/problem/streak alerts)
- Admin dashboard with analytics and broadcast notifications (double-gated admin checks)
- Shareable dashboard export as image

### Partial or in progress
- Learning Tree MongoDB sync (model ready; frontend still uses localStorage)

### Planned or not built
- Advanced roadmap feature (Level-Up placeholder)
- React Query migration
- Per-section dashboard error boundaries
- Leaderboard search by username
- Code splitting for heavy routes
- Admin user management (ban/unban/role changes)

---

## CPScore formula

```
CPScore = floor(
    (CF_Rating * 1.5) + (LC_Rating * 1.2) +
    (CF_Hard * 15) + (CF_Medium * 8) + (CF_Easy * 2) +
    (LC_Hard * 20) + (LC_Medium * 8) + (LC_Easy * 2) +
    (Total_Contests * 10) +
    max(0, (CF_MaxRating - CF_CurrentRating) * 0.5) +
    min(max(CF_Streak, LC_Streak) * 2, 200)
)
```

---

## Data model highlights

- User: auth, roles, preferences, linked accounts, verificationCode, streaks, freshness timestamps
- LeetCodeData: profile, skill stats, calendar, contest history, session token (encrypted)
- Platform: Codeforces/CodeChef rating history, ranks, contest stats, solved distributions
- DailyProblem: per-user daily workout/challenger with solve tracking
- Submissions: unified CF/LC/CC submissions, used for heatmaps and upsolve
- Contest: scheduled contests with TTL cleanup
- Community: Post + Comment with votes and moderation metadata

---

## API surface summary (CPPro main)

- Auth: login, signup, logout, verify, change password
- Sync: refresh CF/LC, health checks
- Dashboards: CF/LC/CC profile analytics
- Leaderboard: global/country/college scopes
- Settings: verification flows, profile CRUD, LC session management
- Daily Problems: fetch, streak, history, mark solved
- Community: posts, comments, votes
- Templates: CRUD for code templates

The CF/LC/CC API servers expose /health, /sync, /sync/status, /verify (LC/CC), /problems (CF/LC/CC), and diagnostics endpoints; all non-health routes require an API secret.

---

## Inter-service communication

CPPro triggers sync jobs and polls status; the API servers write directly to MongoDB.

- POST {CF_SYNC_API}/sync {userId, cfHandle}
- GET  {CF_SYNC_API}/sync/status/:jobId
- POST {LC_SYNC_API}/sync {userId, lcUsername, force?, sessionToken?}
- GET  {LC_SYNC_API}/sync/status/:jobId
- GET  {LC_SYNC_API}/verify/:username
- GET  {CC_SYNC_API}/verify/:handle

---

## Current repository structure

```text
Workspace root
├── CPPro/                     Main app (this folder)
│   ├── client/
│   │   └── src/
│   │       ├── App.jsx / AppRouter.jsx / Layout.jsx / main.jsx
│   │       ├── context/
│   │       │   ├── ThemeContext.jsx
│   │       │   └── NotificationContext.jsx
│   │       ├── hooks/
│   │       │   └── useDashboardData.js
│   │       ├── components/
│   │       │   ├── Admin/                 AdminDashboard.jsx
│   │       │   ├── AuthPage/
│   │       │   ├── Community Page/
│   │       │   ├── CodeTemplate/          CodeTemplate.jsx, List, Card, SnippetDetailModal
│   │       │   ├── ContestTracker/
│   │       │   ├── DailyChallenge/        DailyChallenge.jsx, ProblemCard.jsx, DailyStreak.jsx
│   │       │   ├── Dashboard/             CCQuickStats, CCLanguageChart, CCVerdictBreakdown, DailyWidget
│   │       │   ├── Header/ Footer/ Home/
│   │       │   ├── HelpSupport/
│   │       │   ├── LearningTree/
│   │       │   ├── Leaderboard/
│   │       │   ├── LevelUp/
│   │       │   ├── Notifications/         NotificationBell.jsx
│   │       │   ├── Settings/
│   │       │   ├── Shareable/
│   │       │   ├── VerifyCodeforces/
│   │       │   ├── common/                SkeletonCard, RankBadge, ErrorBoundary
│   │       │   ├── MeteorShower.jsx
│   │       │   ├── ProtectedRoute.jsx
│   │       │   └── AdminRoute.jsx
│   │       └── assets/
│   ├── server/
│   │   ├── index.js
│   │   ├── Controllers/          auth, sync, dashboard, lcDashboard, ccDashboard, admin, leaderboard,
│   │   │                         settings, codeTemplate, post, comment, learning, contest, daily
│   │   ├── Middlewares/          auth.js, adminAuth.js
│   │   ├── Model/                User, LeetCodeData, Platform, Submissions, DailyProblem, Notification, Contest
│   │   ├── Routes/               adminRoutes, ccDashboardRoutes, dailyRoutes, others
│   │   ├── Services/             cfSyncService, lcSyncService, ccSyncService, dailyProblemService,
│   │   │                         cfProblemsService, lcProblemsService, ccProblemsService, weaknessService
│   │   ├── Repositories/         lcSyncRepository, cfAggregateRepository
│   │   ├── Utils/                bouncer, nexusProxy, dateUtils, setUser/getUser
│   │   └── Workers/              contestSyncWorker
│   └── docs/
├── Codeforces-Api Server/
├── Leetcode-Api Server/
└── CodeChef-Api Server/
```

---

## Environment variables (CPPro server)

```env
PORT=5000
MongoUrl=YOUR_MONGODB_URI
JWT_SECRET=YOUR_JWT_SECRET
Secret=YOUR_JWT_SECRET

CF_SYNC_API=http://localhost:3001
CF_SYNC_SECRET=YOUR_SYNC_SECRET

LC_SYNC_API=http://localhost:4001
LC_SYNC_SECRET=YOUR_SYNC_SECRET

CC_SYNC_API=http://localhost:5001
CC_SYNC_SECRET=YOUR_SYNC_SECRET

ENCRYPTION_KEY=YOUR_64_HEX_CHARS
ALLOWED_ORIGIN=http://localhost:5173
```

See each server's README/info.md for its own env list.

---

## Getting started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)

### Rapid installation
```bash
git clone https://github.com/your-repo/cppro.git && cd CPPro
npm install
cd client && npm install && cd ../server && npm install && cd ..
npm start
```

---

## Deployment summary

| Service | Platform | Port | Health Path |
| --- | --- | --- | --- |
| CPPro Main | Render or self-hosted | 5000 | /health |
| Codeforces API Server | Render | 3001 | /health |
| NexusLC | Render | 4001 | /health |
| CodeChef API Server | Render | 5001 | /health |
| MongoDB | Atlas | - | - |
| Redis | Upstash or RedisLabs | - | - |

Frontend can run via Vite dev server (5173) or be built for static hosting.

---

## Known issues and notes

- Learning Tree still stores progress in localStorage (cppro_tree_v2).
- Dashboard lacks per-section error boundaries.
- Level-Up advanced roadmap is a placeholder (spinner).
- LeetCode public data lacks statusDisplay and language in recent submissions (requires session).

---

Built for the competitive programming community.