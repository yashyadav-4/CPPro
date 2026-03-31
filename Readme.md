# 🚀 CPPro: Competitive Programming Analytics Dashboard

**CPPro** is a centralized, high-performance dashboard built for competitive programmers who want to stop grinding blindly and start growing strategically. By aggregating data from platforms like Codeforces, CPPro provides deep insights into your solving patterns, topic mastery, and contest performance, while also providing a community space and snippet manager for your CP journey.

---

## ✨ Key Features

### 🛠 Core Analytics & Dashboard
- **The "Upsolve" Bucket**: Automatically tracks problems you failed during contests and puts them in a "To-Do" list. Growth happens in the problems you couldn't solve.
- **Topic Mastery Progress**: Visual levels for tags like DP, Graphs, Greedy, and Math. Level up your skills from "Newbie" to "Master."
- **Consistency Heatmap**: A GitHub-style activity tracker that weights squares by the difficulty (rating) of the problems solved, not just the quantity.
- **Codeforces Sync**: Connect your Codeforces handle to fetch real-time data, submissions, and ratings.

### 📈 Growth & Prediction
- **Leaderboard**: Compare your progress with peers and the community based on your rating and problem-solving stats.
- **Smart Analytics**: Analyze how long you take to solve problems versus your penalty attempts.

### 👥 Community & Tools
- **Code Snippet Manager**: Save, organize, and reuse your competitive programming templates (`C++`, `Java`, `Python`, etc.) directly from CPPro.
- **Community Forum**: Participate in discussions, post questions, and share solutions. Features rich post interactions including comments and upvotes.
- **Secure Authentication**: Robust local authentication using JWT and bcrypt, with features to securely link external accounts.

---

## 💻 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React.js (Vite), Tailwind CSS, Framer Motion, Recharts (for data visualization), React Router |
| **Backend** | Node.js, Express.js, JWT, HTTP Proxy Agent |
| **Database** | MongoDB & Mongoose |
| **External API** | Codeforces API |

---

## 📁 Project Structure

```text
CPPro/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── AuthPage/   # Login & Signup flows
│   │   │   ├── Dashboard/  # Analytics & Heatmap
│   │   │   ├── Leaderboard/# User rankings
│   │   │   ├── Community Page/ # Posts, Comments & Discussions
│   │   │   ├── CodeTemplate/# Code snippet management
│   │   │   └── VerifyCodeforces/ # Handle syncing
│   │   ├── AppRouter.jsx   # Frontend routing definition
│   │   └── index.css       # Tailwind entry and global styles
│   └── package.json
│
├── server/                 # Express Backend
│   ├── Controllers/        # Request handlers
│   ├── Middlewares/        # Custom middlewares (e.g., auth verification)
│   ├── Model/              # Mongoose schema definitions
│   ├── Routes/             # Express routes (User, Dashboard, Sync, CodeTemplate, etc.)
│   ├── index.js            # Entry point for the server
│   └── package.json
│
└── package.json            # Root configuration (concurrently scripts)
```

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### 🔑 Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- NPM or Yarn

### 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd CPPro
   ```

2. **Install root dependencies:**
   ```bash
   npm install
   ```

3. **Install client and server dependencies:**
   ```bash
   cd client && npm install
   cd ../server && npm install
   cd ..
   ```

### ⚙️ Environment Variables

Create a `.env` file in the `server` directory and configure the following variables:

```env
PORT=5000
MongoUrl=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
```

*(Add any other API keys or proxy configurations if required by `nexusProxy.js` or your rate limiters).*

### 🏃‍♂️ Running the App

You can run both the frontend and backend concurrently from the root directory:

```bash
# Starts the Express backend on port 5000 and Vite frontend on port 5173
npm start
```

Alternatively, to run them individually:
- **Backend (port 5000)**: `cd server && npm run dev`
- **Frontend (port 5173)**: `cd client && npm run dev`

---

## 🛣️ API Documentation (Overview)

- **Auth** (`/api/auth/*`): Login, Registration, JWT issuing.
- **Sync** (`/api/sync/*`): Proxies Codeforces API and syncs user submissions.
- **Dashboard** (`/api/dashboard/*`): Retrieves user analytics, heatmaps, and problem states.
- **Code Templates** (`/api/codeTemplate/*`): CRUD operations for user code snippets.
- **Community** (`/api/posts/*`, `/api/comments/*`): Manage forum posts, upvotes, and comments.
- **Leaderboard** (`/api/leaderboard/*`): Returns ranked user standings.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check out the issues page to see what needs to be worked on.

---

*Built with ❤️ for Competitive Programmers.*