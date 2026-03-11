import { useState } from "react";
import {
  Search,
  Plus,
  ArrowUp,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./Community.css";

const FILTERS = [
  "All",
  "Codeforces Discussion",
  "LeetCode Help",
  "General CP",
  "Algorithms",
  "Contest Recap",
];

const POSTS = [
  {
    user: "dev_alchemist",
    platform: "Codeforces",
    platformClass: "platform-codeforces",
    avatar: "av-1",
    time: "2 hours ago",
    title:
      "Need help optimizing Dijkstra for huge graphs (10^6 nodes, 10^7 edges)",
    snippet:
      "I'm hitting TLE on problem E of the last contest. My priority queue implementation seems standard but the constants might be too high.",
    code: `priority_queue<pair<long, int>> pq;
pq.push({0, start_node});
while(!pq.empty()) { ... }`,
    tags: ["#graphs", "#optimization", "#dijkstra"],
    upvotes: 124,
    comments: 42,
  },
  {
    user: "algo_wiz_99",
    platform: "LeetCode",
    platformClass: "platform-leetcode",
    avatar: "av-2",
    time: "5 hours ago",
    title:
      "Common DP patterns every beginner should master for Weekly Contests",
    snippet:
      "I've compiled a list of the most frequent Dynamic Programming patterns seen in the last 50 LeetCode contests. Great for beginners!",
    code: `dp[i][j] = max(dp[i-1][j], dp[i-1][j-w] + v);
// Knapsack variation: common in Q3/Q4`,
    tags: ["#dp", "#tutorial"],
    upvotes: 856,
    comments: 102,
  },
  {
    user: "contest_master",
    platform: "General",
    platformClass: "platform-general",
    avatar: "av-3",
    time: "Yesterday",
    title: "Why Segment Trees are often overkill for simple range sum queries?",
    snippet:
      "Let's talk about Fenwick trees and why they are easier to implement and often faster in practice for 1D range sums.",
    code: `void update(int i, int v) {
  for (; i <= n; i += i & -i) tree[i] += v;
}`,
    tags: ["#data-structures", "#binary-indexed-tree"],
    upvotes: 312,
    comments: 18,
  },
  {
    user: "math_enthusiast",
    platform: "Codeforces",
    platformClass: "platform-codeforces",
    avatar: "av-4",
    time: "2 days ago",
    title:
      "Understanding the Pigeonhole Principle in CP - with examples",
    snippet:
      "A lot of Div 2C/D problems can be solved using the Pigeonhole principle. Here is how to spot them during a live contest.",
    code: `// If n+1 items are put into n containers,
// at least one container has > 1 item.`,
    tags: ["#math", "#combinatorics"],
    upvotes: 198,
    comments: 27,
  },
];

export default function Community() {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div className="community-page">
      {/* ── Section 1: Header ── */}
      <div className="community-header">
        <div className="community-header-text">
          <h1>Global CPTracker Community</h1>
          <p>
            Discuss, share insights, and find help on competitive programming
            problems, contests, and algorithms.
          </p>
        </div>
        <button className="btn-new-discussion">
          <Plus size={16} /> New Discussion
        </button>
      </div>

      {/* ── Section 2: Controls ── */}
      <div className="community-controls">
        <div className="community-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search discussions, questions, or tags..."
          />
        </div>
        <div className="filter-pills">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-pill${activeFilter === f ? " active" : ""}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 3: Post Cards ── */}
      <div className="posts-grid">
        {POSTS.map((post, i) => (
          <div className="post-card" key={i}>
            {/* Card header */}
            <div className="post-user-info">
              <div className={`post-avatar ${post.avatar}`} />
              <span className="post-username">{post.user}</span>
              <span className={`post-platform ${post.platformClass}`}>
                {post.platform}
              </span>
              <span className="post-time">{post.time}</span>
            </div>

            {/* Card body */}
            <h3 className="post-title">{post.title}</h3>
            <p className="post-snippet">{post.snippet}</p>
            <div className="post-code">
              <pre>{post.code}</pre>
            </div>
            <div className="post-tags">
              {post.tags.map((t) => (
                <span className="post-tag" key={t}>{t}</span>
              ))}
            </div>

            {/* Card footer */}
            <div className="post-footer">
              <span className="post-metric">
                <ArrowUp size={14} /> {post.upvotes}
              </span>
              <span className="post-metric">
                <MessageCircle size={14} /> {post.comments}
              </span>
              <button className="post-join">Join Discussion →</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 4: Pagination ── */}
      <div className="community-pagination">
        <button className="page-btn page-arrow">
          <ChevronLeft size={16} />
        </button>
        <button className="page-btn active">1</button>
        <button className="page-btn">2</button>
        <button className="page-btn">3</button>
        <button className="page-btn page-arrow">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
