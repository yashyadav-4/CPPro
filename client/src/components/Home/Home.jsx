import { Link } from "react-router-dom"
import { ArrowRight, BarChart3, Code2, Trophy, Check } from "lucide-react"
import FeatureCard from "./FeatureCard"
import "./Home.css"

// ── Add new features here ──
const FEATURES = [
    {
        icon: BarChart3,
        title: "Intelligent Progress Tracking",
        description: "Visualize your growth across platforms like Codeforces, LeetCode, and AtCoder. Get detailed analytics on your weak areas.",
        color: "blue",
    },
    {
        icon: Code2,
        title: "Snippet Management",
        description: "Save your frequently used algorithms and data structures. Access them instantly with our powerful search and tagging system.",
        color: "green",
    },
    {
        icon: Trophy,
        title: "Global Leaderboards",
        description: "Compete with friends and the global community. See where you stand and get motivated to solve just one more problem.",
        color: "yellow",
    },
]

const SAMPLE_CODE = `void dijkstra(int start, vector<pair<int,int>> adj[]) {
    priority_queue<pii, vector<pii>, greater<pii>> pq;
    dist.assign(n, 1e9);
    dist[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
}`

export default function Home() {
    return (
        <div className="home-page">

            <section className="hero">
                <div className="hero-badge">
                    <span className="hero-badge-dot" />
                    Competitive Programming Toolkit
                </div>

                <h1>
                    Master Your<br />
                    <span className="gradient-text">Competitive Coding</span> Journey
                </h1>

                <p className="hero-subtitle">
                    Track your progress, manage code snippets, and climb the global
                    leaderboards with the ultimate toolkit for competitive programmers and many more features.
                </p>

                <div className="hero-buttons">
                    <Link to="/dashboard" className="hero-btn-primary">
                        Start Coding Now <ArrowRight size={16} />
                    </Link>
                    <Link to="/leaderboard" className="hero-btn-secondary">
                        View Leaderboard
                    </Link>
                </div>

                <div className="hero-preview">
                    <div className="preview-topbar">
                        <span className="preview-dot red" />
                        <span className="preview-dot yellow" />
                        <span className="preview-dot green" />
                        <span className="preview-url">cppro.app/dashboard</span>
                    </div>

                    <div className="preview-body">
                        {/* left graph */}
                        <div className="preview-chart">
                            <div className="preview-chart-title">Activity Graph</div>
                            <div className="preview-bars">
                                {[40, 65, 30, 80, 55, 90, 45, 70, 35, 60, 85, 50].map((h, i) => (
                                    <div
                                        key={i}
                                        className="preview-bar"
                                        style={{ height: `${h}%` }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* right snippets */}
                        <div className="preview-snippets">
                            <div className="preview-snippets-title">Recent Snippets</div>
                            {[
                                { name: "Segment Tree", meta: "C++ • Updated 2d ago", color: "blue" },
                                { name: "Graph BFS", meta: "Python • Updated 5d ago", color: "green" },
                                { name: "DP Template", meta: "C++ • Updated 1w ago", color: "purple" },
                            ].map((s, i) => (
                                <div key={i} className="preview-snippet-item">
                                    <div className={`preview-snippet-icon ${s.color}`}>
                                        <Code2 size={14} />
                                    </div>
                                    <div className="preview-snippet-info">
                                        <div className="preview-snippet-name">{s.name}</div>
                                        <div className="preview-snippet-meta">{s.meta}</div>
                                    </div>
                                </div>
                            ))}
                            <div className="preview-view-all">
                                <a href="#">View All →</a>
                            </div>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="preview-stats">
                        <div className="preview-stat">
                            <div className="preview-stat-icon blue">
                                <BarChart3 size={16} />
                            </div>
                            <div>
                                <div className="preview-stat-value">
                                    1,248 <span className="preview-stat-change">+12%</span>
                                </div>
                                <div className="preview-stat-label">Problems Solved</div>
                            </div>
                        </div>
                        <div className="preview-stat">
                            <div className="preview-stat-icon green">
                                <Trophy size={16} />
                            </div>
                            <div>
                                <div className="preview-stat-value">#42</div>
                                <div className="preview-stat-label">Global Rank</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ FEATURES ══ */}
            <section className="features">
                <span className="features-badge">Features</span>
                <h2>Everything you need to improve</h2>
                <p className="features-subtitle">
                    Built by competitive programmers, for competitive programmers.
                    We understand the grind.
                </p>

                <div className="features-grid">
                    {FEATURES.map((f, i) => (
                        <FeatureCard
                            key={i}
                            icon={f.icon}
                            title={f.title}
                            description={f.description}
                            color={f.color}
                        />
                    ))}
                </div>
            </section>

            <section className="algo-section">
                <div className="algo-inner">
                    <div className="algo-text">
                        <h2>
                            Your personal algorithm library.<br />
                            <span className="gradient-text">Organized &amp; Ready.</span>
                        </h2>
                        <p>
                            Never rewrite Dijkstra again. Store your templates in the cloud,
                            categorize them with tags, and copy them with a single click
                            during contests.
                        </p>
                        <ul className="algo-features">
                            <li>
                                <span className="algo-check"><Check size={12} /></span>
                                Syntax highlighting for C++, Python, Java
                            </li>
                            <li>
                                <span className="algo-check"><Check size={12} /></span>
                                Fast search by title, language, or tag
                            </li>
                            <li>
                                <span className="algo-check"><Check size={12} /></span>
                                One-click copy to clipboard
                            </li>
                        </ul>
                        <Link to="/CodeTemplate" className="algo-cta">
                            Explore Snippets <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="algo-preview">
                        <div className="algo-preview-topbar">
                            <div className="algo-preview-dots">
                                <span /><span /><span />
                            </div>
                            <span className="algo-preview-file">dijkstra.cpp</span>
                        </div>
                        <div className="algo-preview-code">
                            <pre>{SAMPLE_CODE}</pre>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}