import { Link } from "react-router-dom"
import { ArrowRight, BarChart3, Code2, Trophy, Check } from "lucide-react"
import FeatureCard from "./FeatureCard"

const FEATURES = [
    {
        icon: BarChart3,
        title: "Intelligent Progress Tracking",
        description: "Visualize your growth across Codeforces, LeetCode, AtCoder. Detailed analytics on weak areas.",
        color: "indigo",
    },
    {
        icon: Code2,
        title: "Snippet Management",
        description: "Save frequently used algorithms. Access instantly with powerful search and tagging.",
        color: "teal",
    },
    {
        icon: Trophy,
        title: "Global Leaderboards",
        description: "Compete with friends. See where you stand globally.",
        color: "amber",
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
        <div className="bg-gray-50 dark:bg-[#1A1A1A] min-h-screen">
            {/* HERO SECTION */}
            <section className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-50 dark:from-indigo-900/20 to-transparent pointer-events-none" />
                
                <div className="relative max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                        ✦ Competitive Programming Toolkit
                    </div>

                    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-6">
                        Master Your <br className="hidden sm:block" />
                        <span className="text-indigo-600">Competitive Coding</span> Journey
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
                        Track your progress, manage code snippets, and climb the global leaderboards with the ultimate toolkit for competitive programmers.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                        <Link to="/dashboard" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg">
                            Start Coding Now <ArrowRight size={18} />
                        </Link>
                        <Link to="/leaderboard" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white dark:bg-[#242424] text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/[0.12] rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm">
                            View Leaderboard
                        </Link>
                    </div>

                    {/* Browser Mockup Card */}
                    <div className="relative mx-auto max-w-4xl bg-white dark:bg-[#242424] rounded-xl border border-gray-200 dark:border-white/[0.08] shadow-2xl overflow-hidden">
                        <div className="bg-gray-100 dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-white/[0.08] px-4 py-3 flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <div className="mx-auto bg-white dark:bg-[#242424] rounded-md border border-gray-200 dark:border-white/[0.08] px-32 py-1 flex items-center justify-center">
                                <span className="text-xs text-gray-400">cppro.app/dashboard</span>
                            </div>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-left bg-gray-50 dark:bg-[#1A1A1A]">
                            {/* Left: Activity Graph */}
                            <div className="bg-white dark:bg-[#242424] border border-gray-200 dark:border-white/[0.08] rounded-lg p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Activity Pulse</h3>
                                <div className="flex items-end gap-2 h-32">
                                    {[30, 50, 20, 70, 40, 90, 60, 80, 45, 65, 85, 55].map((h, i) => (
                                        <div 
                                            key={i} 
                                            className="flex-1 bg-indigo-500 rounded-t-sm transition-all hover:bg-indigo-600 relative group"
                                            style={{ height: `${h}%` }}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity">
                                                {h} solves
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Recent Snippets */}
                            <div className="flex flex-col gap-3">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Recent Snippets</h3>
                                {[
                                    { name: "Segment Tree", lang: "C++", color: "text-indigo-600", bg: "bg-indigo-50" },
                                    { name: "Graph BFS", lang: "Python", color: "text-green-600", bg: "bg-green-50" },
                                    { name: "DP Template", lang: "C++", color: "text-teal-600", bg: "bg-teal-50" },
                                ].map((s, i) => (
                                    <div key={i} className="flex items-center gap-4 bg-white dark:bg-[#242424] border border-gray-200 dark:border-white/[0.08] rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.bg} ${s.color}`}>
                                            <Code2 size={20} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{s.lang} • Updated recently</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section className="py-24 bg-white dark:bg-[#242424] border-y border-gray-200 dark:border-white/[0.08] text-center px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <span className="inline-block py-1 px-3 rounded-full bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-300 text-xs font-bold tracking-wider uppercase mb-4">
                        Features
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Everything you need to improve
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-16">
                        Built by competitive programmers, for competitive programmers.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
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
                </div>
            </section>

            {/* ALGORITHM LIBRARY SECTION */}
            <section className="py-24 bg-gray-50 dark:bg-[#1A1A1A] px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                            Your personal algorithm library.<br/>
                            <span className="text-indigo-600">Organized &amp; Ready.</span>
                        </h2>
                        <ul className="space-y-4 mb-10">
                            {[
                                "Syntax highlighting for C++, Python, Java",
                                "Fast search by title, language, or tag",
                                "One-click copy to clipboard",
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    <span className="text-lg">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <Link to="/codesnippet" className="text-indigo-600 dark:text-indigo-400 font-semibold inline-flex items-center gap-2 hover:gap-3 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all">
                            Explore Snippets <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <span className="ml-4 text-xs font-medium text-gray-400 font-mono">dijkstra.cpp</span>
                        </div>
                        <div className="p-6 overflow-x-auto">
                            <pre className="text-sm font-mono leading-relaxed">
                                <code className="text-gray-300">
                                    <span className="text-purple-400">void</span> <span className="text-blue-400">dijkstra</span>(int start, vector&lt;pair&lt;int,int&gt;&gt; adj[]) {'{\n'}
                                    {'    '}priority_queue&lt;pii, vector&lt;pii&gt;, greater&lt;pii&gt;&gt; pq;{'\n'}
                                    {'    '}dist.assign(n, <span className="text-orange-400">1e9</span>);{'\n'}
                                    {'    '}dist[start] = <span className="text-orange-400">0</span>;{'\n'}
                                    {'    '}pq.push({'{'}<span className="text-orange-400">0</span>, start{'}'});{'\n\n'}
                                    {'    '}<span className="text-purple-400">while</span> (!pq.empty()) {'{\n'}
                                    {'        '}<span className="text-purple-400">auto</span> [d, u] = pq.top();{'\n'}
                                    {'        '}pq.pop();{'\n'}
                                    {'        '}<span className="text-purple-400">if</span> (d &gt; dist[u]) <span className="text-purple-400">continue</span>;{'\n'}
                                    {'        '}<span className="text-purple-400">for</span> (<span className="text-purple-400">auto</span> [v, w] : adj[u]) {'{\n'}
                                    {'            '}<span className="text-purple-400">if</span> (dist[u] + w &lt; dist[v]) {'{\n'}
                                    {'                '}dist[v] = dist[u] + w;{'\n'}
                                    {'                '}pq.push({'{'}dist[v], v{'}'});{'\n'}
                                    {'            }\n'}
                                    {'        }\n'}
                                    {'    }\n'}
                                    {'}'}
                                </code>
                            </pre>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}