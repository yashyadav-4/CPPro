# 🚀 CPPro: The Unified Platform for Competitive Excellence

**CPPro** is a high-performance, SaaS-inspired analytics engine designed for competitive programmers. It unifies data from **Codeforces** and **LeetCode** into a single, high-fidelity dashboard—empowering users to stop grinding blindly and start growing strategically through data-driven insights.

---

## ✨ Premium Platform Features

CPPro isn't just a profile aggregator; it's a full-stack growth ecosystem.

### 🌌 Lean Nexus Background Engine
*   **Zero-Block UI**: Experience instant dashboard loads with intelligent caching.
*   **The Bouncer**: Sophisticated rate-limiting (250ms serialization) ensuring resilient API communication without risk of platform bans.
*   **Nexus Proxy**: Advanced IP-rotation and custom User-Agent orchestration for 100% sync reliability.

### 📈 NextTarget™ Rating Engine
*   **50-Point Sprints**: Breaks down grand rating goals into manageable milestones.
*   **Curated Recommendations**: 
    *   **Master First**: Solidify foundation with problems just below your rating.
    *   **Stretch Goals**: Level-up with problems just above your comfort zone.
*   **Milestone Estimation**: Data-driven prediction of how many contests you need to reach your next tier.

### 🎭 Unified Analytics & Visualizations
*   **Unified Activity Heatmap**: A GitHub-style contribution grid merging submissions from all linked handles.
*   **3D Learning Tree**: A futuristic, interactive Three.js visualization of your algorithmic mastery across Graphs, DP, and more.
*   **Skill Radar**: Multi-dimensional mapping of your consistency, speed, and accuracy.

### 🛠️ Developer Productivity Suite
*   **Upsolve "The Bucket"**: Automatically identifies contest problems you attempted but didn't solve—targeting your exact growth gaps.
*   **Snippet Manager**: A centralized repository for your optimized C++, Java, and Python templates.
*   **Global CPScore Leaderboard**: A unique ranking system based on a weighted composite of ratings, solves, and streaks.

---

## 💻 Tech Architecture

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18 (Vite), Tailwind CSS v4, Framer Motion, Three.js, Recharts |
| **Styling** | Modern Brutalist Design, Dark/Light Mode with Global Theme Context |
| **Backend** | Node.js (Express), MongoDB (Mongoose), JWT, Bottleneck.js |
| **Infrastructure** | Nexus Proxy Engine, Bouncer Rate-Limiter, Circuit-Breaker Fail-safes |

---

## 📁 System Blueprint

```text
CPPro/
├── client/                 # React Unified Interface
│   ├── src/
│   │   ├── components/     # Atomic & Layered UI Components
│   │   │   ├── Dashboard/  # High-Fidelity Analytics Engine
│   │   │   ├── Leaderboard/# Multi-Scope Ranking System
│   │   │   ├── Community/  # Full-Stack Threaded Forums
│   │   │   └── LevelUp/    # NextTarget™ Progress Tracker
│   │   ├── hooks/          # Global Context Providers (Theme, Auth)
│   │   └── index.css       # Design System Tokens
│
├── server/                 # Express API & Sync Worker
│   ├── Controllers/        # Business Logic & Data Orchestration
│   ├── Utils/              # Nexus Proxy & Bouncer Infrastructure
│   ├── Model/              # Unified Core Data Models
│   └── Routes/             # Secure RESTful Endpoints
│
└── docs/                   # Exhaustive Technical Documentation
```

---

## 🚦 Getting Started

### 🔑 Prerequisites
*   **Node.js** (v18+)
*   **MongoDB** (Local or Atlas)

### 🛠️ Rapid Installation
```bash
# Clone the repository
git clone https://github.com/your-repo/cppro.git && cd CPPro

# Install dependencies for both client and server
npm install && cd client && npm install && cd ../server && npm install && cd ..

# Launch the unified development environment
npm start
```

### ⚙️ Configuration (`/server/.env`)
```env
PORT=5000
MongoUrl=YOUR_MONGODB_URI
JWT_SECRET=YOUR_SECURE_SECRET
```

---

## 🚀 The Verification Loop
CPPro uses a zero-password verification protocol. To link your handles:
1.  Generate a **Nexus Token** via the CPPro Dashboard.
2.  Set the token as your **"Real Name"** on Codeforces/LeetCode.
3.  Click **"Verify"** to securely bridge your data.

---

*Built with ❤️ for the Competitive Programming Community.*