import { useState, useMemo } from 'react';
import {
  Search, ChevronDown, LayoutDashboard, CalendarDays, RefreshCw,
  Trophy, Trees, Code2, Users, Swords, Settings, Bell, TrendingUp,
  HelpCircle, BookOpen, X, Mail, Bug
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

// ─── Category icon map ────────────────────────────────────────────────────────
const CATEGORY_ICONS = {
  'Dashboard': LayoutDashboard,
  'Daily Problems': CalendarDays,
  'Sync & Data': RefreshCw,
  'Leaderboard': Trophy,
  'Learning Tree': Trees,
  'Code Templates': Code2,
  'Community': Users,
  'Contest Tracker': Swords,
  'Settings': Settings,
  'Notifications': Bell,
  'Upsolve & Growth': TrendingUp,
  'Platform FAQ': BookOpen,
  'General FAQ': HelpCircle,
};

// ─── HELP_DATA placeholder (filled in next step) ─────────────────────────────
// Shape: [{ category: string, icon?: LucideIcon, items: [{ q: string, a: string|ReactNode }] }]
const HELP_DATA = [
  // ─── 1. Dashboard ────────────────────────────────────────────────────────
  {
    category: 'Dashboard',
    items: [
      {
        q: 'What are the 6 stat cards on the Dashboard?',
        a: 'The Dashboard shows: Total Solved (unique problems across all platforms), Total Submissions (all attempts including WA/TLE/etc., with CF/LC/CC breakdown chips), Active Days, Acceptance Rate, Total Contests, and CPScore. Each card pulls live data from your linked platforms.',
      },
      {
        q: 'How do I use the Activity Heatmap?',
        a: 'The heatmap merges your Codeforces and LeetCode submission dates into a single calendar grid. Each cell shows the number of submissions on that day. CodeChef submissions are shown separately in the CC panel. No setup needed — data appears automatically once your platforms are linked.',
      },
      {
        q: 'What does the Rating Progression chart show?',
        a: 'It plots your Codeforces and LeetCode rating history on a shared timeline, so you can see how both ratings moved over time relative to each other.',
      },
      {
        q: 'What other sections are on the Dashboard?',
        a: 'Difficulty Breakdown, Skill Gaps, Top Topics, Weekly Streak, Recent Contests, Achievements, and (when CodeChef is linked) CCQuickStats, CCLanguageChart, and CCVerdictBreakdown. Row 3 also embeds the DailyWidget — a compact daily problem card that links to /daily.',
      },
      {
        q: 'When does the CodeChef panel appear?',
        a: 'The CCQuickStats, CCLanguageChart, and CCVerdictBreakdown panels are only visible when you have a CodeChef account linked in Settings.',
      },
      {
        q: 'How do I export my Dashboard as an image?',
        a: 'Click the "Share" or camera icon in the Dashboard header. CPPro renders your stats into a downloadable shareable card image.',
      },
      {
        q: 'How fresh is the data on the Dashboard?',
        a: 'Codeforces data refreshes every 10 minutes; LeetCode every 15 minutes. The first request always returns currently cached data instantly — the sync runs in the background. Click "Refresh" in the Dashboard header to trigger an early update.',
      },
    ],
  },

  // ─── 2. Daily Problems ───────────────────────────────────────────────────
  {
    category: 'Daily Problems',
    items: [
      {
        q: 'What are the Daily Problems?',
        a: 'Every day (in IST) CPPro generates two problems for you: a Daily Workout (at or below your current level — comfortable and popular) and a Daily Challenger (above your current level, targeting your statistically weakest topic). Both are personalized to your current ratings and skill gaps.',
      },
      {
        q: 'How do I get my daily problems?',
        a: 'Visit /daily (linked from the nav and the DailyWidget on your Dashboard). Problems are generated lazily on your first visit each day — there is no cron job. Steps:\n1. Link at least one platform (Codeforces, LeetCode, or CodeChef) in Settings.\n2. Visit /daily each day.\n3. Solve the problem on the platform.\n4. Sync your account — CPPro auto-detects if the problem is solved.\n5. If auto-detect misses it, click "Mark Solved" manually.',
      },
      {
        q: 'How are difficulty levels chosen?',
        a: 'For Codeforces: Workout band = [rating−300, rating] with solvedCount ≥ 500; Challenger band = [rating+100, rating+350] with solvedCount ≥ 200. For LeetCode: rating ≥ 1900 → Hard, ≥ 1600 → Medium, else Easy. Challenger is one difficulty step harder. For CodeChef: similar rating-based bands.',
      },
      {
        q: 'Which platform do problems come from?',
        a: 'Platform priority (tried in order): LeetCode → Codeforces → CodeChef. If no suitable problem is found on one platform it falls back to the next.',
      },
      {
        q: 'How does auto-solve detection work?',
        a: 'After every sync, CPPro checks your last 50 accepted submissions against today\'s daily problems. If a match is found, the problem is automatically marked solved and your streak is updated. You will also receive a notification.',
      },
      {
        q: 'How does the daily streak work?',
        a: 'Your daily streak (separate from your activity streak) is tracked in Settings → Profile. It counts consecutive days where you solved at least one daily problem. Milestones at 7, 14, 30, 60, and 100 days trigger in-app notifications.',
      },
      {
        q: 'Where can I see the DailyWidget?',
        a: 'The DailyWidget is embedded in Row 3 of the Dashboard (280px fixed column alongside the Activity Heatmap). It shows today\'s two problems and links to /daily for the full view.',
      },
    ],
  },

  // ─── 3. Sync & Data ──────────────────────────────────────────────────────
  {
    category: 'Sync & Data',
    items: [
      {
        q: 'How do I refresh my data?',
        a: 'Click the "Refresh" button in the Dashboard header. This triggers a background sync for both Codeforces and LeetCode. Your current data is returned immediately; the update completes asynchronously.',
      },
      {
        q: 'How often can I sync?',
        a: 'Codeforces: 10-minute cooldown (10 seconds for admins). LeetCode: 15-minute cooldown (10 seconds for admins). Sync never blocks — you always get the current cached data while the update runs in the background.',
      },
      {
        q: 'Does sync work without an LC Session Token?',
        a: 'Yes. Public sync always succeeds. Without an LC Session Token you get up to 100 most-recent accepted submissions (public API limit). With the LEETCODE_SESSION cookie saved in Settings, CPPro fetches up to 200 submissions with full status and language info.',
      },
      {
        q: 'How does Codeforces sync work?',
        a: 'CPPro sends a sync job to the Codeforces API Server (port 3001), which fetches your rating history, all submissions, contest participation, and topic/difficulty breakdowns via Webshare proxies using BullMQ workers.',
      },
    ],
  },

  // ─── 4. Leaderboard ──────────────────────────────────────────────────────
  {
    category: 'Leaderboard',
    items: [
      {
        q: 'What scopes does the Leaderboard support?',
        a: 'Global, Country, and College. Country and College scopes only include users who have filled in those fields in Settings → Profile.',
      },
      {
        q: 'What categories can I compare?',
        a: 'CPScore, Total Questions, LeetCode Rating, and Codeforces Rating. The top 100 users are shown in each category.',
      },
      {
        q: 'How is CPScore calculated?',
        a: 'CPScore = (CF_Rating × 1.5) + (LC_Rating × 1.2) + (CF_Hard × 15) + (CF_Medium × 8) + (CF_Easy × 2) + (LC_Hard × 20) + (LC_Medium × 8) + (LC_Easy × 2) + (Contests × 10) + streak bonus (capped at 200).',
      },
      {
        q: 'Why don\'t I appear on the Country or College leaderboard?',
        a: 'Fill in your country and college in Settings → Profile and save. The scoped leaderboards only include users with those fields set.',
      },
    ],
  },

  // ─── 5. Learning Tree ────────────────────────────────────────────────────
  {
    category: 'Learning Tree',
    items: [
      {
        q: 'What is the Learning Tree?',
        a: 'An interactive 3D visualization (powered by Three.js) of competitive programming topics. Each node represents a topic with 4 progression states: Not Started → Theory → Implemented → Mastered.',
      },
      {
        q: 'How do I update my progress?',
        a: 'Click a topic node to cycle it through the four states. Your progress is saved automatically.',
      },
      {
        q: 'Where is my Learning Tree progress stored?',
        a: 'Progress is stored in your browser\'s localStorage under the key cppro_tree_v2. Clearing browser data or switching browsers will erase your progress. MongoDB sync is planned for a future update.',
      },
      {
        q: 'WARNING: Will I lose my progress?',
        a: 'Yes — if you clear browser localStorage (e.g. via DevTools, private browsing, or browser reset), all Learning Tree progress is lost. MongoDB sync is planned but not yet live. Export or note your progress before clearing browser data.',
      },
    ],
  },

  // ─── 6. Code Templates ───────────────────────────────────────────────────
  {
    category: 'Code Templates',
    items: [
      {
        q: 'What is the Code Templates feature?',
        a: 'A personal snippet manager where you can create, read, update, and delete code templates. Accessible at /codesnippet (requires login).',
      },
      {
        q: 'What languages are supported?',
        a: 'C++, Python, Java, and JavaScript.',
      },
      {
        q: 'How do I organize my snippets?',
        a: 'Each snippet supports tags and a public/private toggle. Use the language filter tabs (All / C++ / Python / Java / JavaScript) to filter the list. Snippets are paginated — 6 per page.',
      },
      {
        q: 'How do I view or edit a snippet?',
        a: 'Click any snippet card to open the SnippetDetailModal, which shows the full code with syntax context and edit/delete options.',
      },
      {
        q: 'Can other users see my snippets?',
        a: 'Only snippets marked "Public" are visible to others. Private snippets are only visible to you.',
      },
    ],
  },

  // ─── 7. Community ────────────────────────────────────────────────────────
  {
    category: 'Community',
    items: [
      {
        q: 'What is the Community forum?',
        a: 'A discussion board at /community where users can create posts (Blog, Discussion, Help), leave threaded comments, and upvote or downvote posts. Reading is public; posting requires a login.',
      },
      {
        q: 'What post types are available?',
        a: 'Blog (long-form articles), Discussion (open topics), and Help (question & answer). Choose the type when creating a new post.',
      },
      {
        q: 'Can posts be pinned?',
        a: 'Yes. Admins and moderators can pin posts so they appear at the top of the feed.',
      },
      {
        q: 'Do I need an account to read posts?',
        a: 'No. The community is publicly readable. You only need to be logged in to post, comment, or vote.',
      },
    ],
  },

  // ─── 8. Contest Tracker ──────────────────────────────────────────────────
  {
    category: 'Contest Tracker',
    items: [
      {
        q: 'What does the Contest Tracker show?',
        a: 'Upcoming and past contests from Codeforces and LeetCode. Contest data is synced every 6 hours automatically.',
      },
      {
        q: 'Do I need to be logged in?',
        a: 'No. The Contest Tracker at /contest-tracker is fully public.',
      },
    ],
  },

  // ─── 9. Settings ─────────────────────────────────────────────────────────
  {
    category: 'Settings',
    items: [
      {
        q: 'What can I configure in Settings?',
        a: 'Profile info (name, age, gender, city/state/country, college, profile picture, public/private toggle), platform linking (Codeforces, LeetCode, CodeChef), LC Session Token, password change, and theme toggle (dark/light).',
      },
      {
        q: 'What is the LC Session Token and how do I add it?',
        a: 'Without it CPPro can only see your 100 most recent accepted submissions. With your LEETCODE_SESSION cookie it fetches up to 200 submissions with full status and language. To add it: go to leetcode.com → DevTools (F12) → Application → Cookies → copy the value of LEETCODE_SESSION → paste it in Settings → LeetCode Session. The token is stored encrypted (AES-256-GCM) and never exposed.',
      },
      {
        q: 'My LC session expired — what should I do?',
        a: 'You will receive a notification when this happens. Go to Settings → LeetCode Session and re-paste your current LEETCODE_SESSION cookie. The old token is invalidated when LeetCode logs you out or after roughly one month.',
      },
      {
        q: 'What does the Public Profile toggle do?',
        a: 'When enabled, your stats are viewable at /api/stats/public/:userId by anyone. When disabled, your profile is private.',
      },
    ],
  },

  // ─── 10. Notifications ───────────────────────────────────────────────────
  {
    category: 'Notifications',
    items: [
      {
        q: 'How do notifications work?',
        a: 'The bell icon in the header polls for new notifications every 60 seconds. The badge shows your unread count. Click the bell to open the notification dropdown.',
      },
      {
        q: 'What types of notifications will I receive?',
        a: 'Sync complete, daily problem ready, streak milestone (7/14/30/60/100 days), LC session expired, admin broadcast, and post activity (replies/comments on your posts).',
      },
    ],
  },

  // ─── 11. Upsolve & Growth ────────────────────────────────────────────────
  {
    category: 'Upsolve & Growth',
    items: [
      {
        q: 'What is the Upsolve Queue?',
        a: 'A list of problems from past contests that you attempted but did not solve (WA, TLE, RE, etc.). It helps you go back and solve problems you missed. Accessible from Dashboard → UpsolveQueue section and /level-up.',
      },
      {
        q: 'How does upsolve detection work for LeetCode?',
        a: 'CPPro cross-checks problems against your last 200 submissions (with LC Session Token) or 100 accepted slugs (without). Problems solved outside this window may still appear as unsolved.',
      },
      {
        q: 'What is the Growth Planner (NextTarget)?',
        a: 'A 50-point CF rating sprint planner. It shows your next target rating and the types of problems you should solve to reach it. Accessible from the Dashboard and /level-up.',
      },
      {
        q: 'Is the "Advanced Roadmaps" tab on /level-up available?',
        a: 'Not yet. It currently shows a loading spinner. Full roadmap functionality is planned for a future update.',
      },
    ],
  },

  // ─── 12. Platform FAQ — Codeforces ───────────────────────────────────────
  {
    category: 'Platform FAQ',
    items: [
      {
        q: 'Codeforces: How do I link my account?',
        a: 'Go to Settings → Codeforces → click "Generate Code". You will get an 8-character code. Then go to codeforces.com → Settings → Edit profile → set your "First name" to that code → save. Return to CPPro, enter your CF handle, and click Verify. CPPro scrapes your CF profile to confirm the code matches.',
      },
      {
        q: 'Codeforces: Why does verification fail?',
        a: 'Your CF profile must be public. The code must be saved as your CF "First name" (not Last name). Changes can take 1–2 minutes to propagate on Codeforces\'s end — wait a moment and try again.',
      },
      {
        q: 'Codeforces: How often does CF data refresh?',
        a: 'Every 10 minutes. Click Refresh in the Dashboard to trigger early. Current data always shows instantly; the update runs in the background.',
      },
      {
        q: 'Codeforces: What data is synced?',
        a: 'Rating history, all submissions (verdict, tags, difficulty), contest participation, solved count by topic and rating band, and streaks.',
      },
      {
        q: 'LeetCode: How do I link my account?',
        a: 'Settings → LeetCode → enter your LC username → click Verify. CPPro confirms your account exists via LeetCode\'s GraphQL API. No password needed.',
      },
      {
        q: 'LeetCode: Does sync need the session token?',
        a: 'No. Sync works without it — you just get a smaller submission history (100 AC-only vs. 200 full). Public sync always succeeds.',
      },
      {
        q: 'CodeChef: How do I link my account?',
        a: 'Settings → CodeChef → enter your CC handle → click Verify. No verification code is needed for CodeChef — just your handle.',
      },
      {
        q: 'CodeChef: What data is synced?',
        a: 'Rating history, contest history, recent submissions (HTML-scraped), verdict breakdown, language distribution, global rank, country rank, and star rank (1–7 star based on rating).',
      },
      {
        q: 'CodeChef: Why does CC data sometimes not update?',
        a: 'CodeChef\'s website uses HTML scraping (no official API). Occasional Cloudflare blocks can delay sync. Try again after a few minutes.',
      },
      {
        q: 'CodeChef: What do the CC star ranks mean?',
        a: 'Unrated = 0 stars, <1400 = 1★, 1400–1599 = 2★, 1600–1799 = 3★, 1800–1999 = 4★, 2000–2199 = 5★, 2200–2499 = 6★, ≥2500 = 7★.',
      },
    ],
  },

  // ─── 13. General FAQ ─────────────────────────────────────────────────────
  {
    category: 'General FAQ',
    items: [
      {
        q: 'What is CPScore?',
        a: 'A composite score combining your CF rating, LC rating, problems solved by difficulty across platforms, contest count, and a streak bonus (max 200). Full formula: CPScore = (CF_Rating × 1.5) + (LC_Rating × 1.2) + (CF_Hard × 15) + (CF_Medium × 8) + (CF_Easy × 2) + (LC_Hard × 20) + (LC_Medium × 8) + (LC_Easy × 2) + (Contests × 10) + streak bonus.',
      },
      {
        q: 'Why don\'t I appear on the country or college leaderboard?',
        a: 'Fill in your country and college in Settings → Profile and save. The leaderboard only includes users with those fields set.',
      },
      {
        q: 'My solved count looks wrong — why?',
        a: '"Total Solved" counts unique problems solved across all linked platforms. "Total Submissions" counts all attempts including WA/TLE/etc. Sync your accounts to get fresh data.',
      },
      {
        q: 'How is the activity heatmap built?',
        a: 'It merges Codeforces and LeetCode submission dates. Each cell equals the number of submissions on that day. CodeChef submissions appear separately in the CC panel.',
      },
      {
        q: 'What happens if I unlink a platform?',
        a: 'Your synced data stays in CPPro but stops updating. Leaderboard scores recalculate without that platform\'s contribution.',
      },
      {
        q: 'Why did my Learning Tree progress reset?',
        a: 'Progress is stored in your browser\'s localStorage. Clearing browser data or switching browsers loses it. MongoDB sync is planned for a future update.',
      },
      {
        q: 'What is the upsolve window limitation for LeetCode?',
        a: 'CPPro checks your last 200 submissions (with session token) or 100 AC slugs (without) to determine if a problem is solved. Problems solved outside this window may still show as unsolved in the upsolve queue.',
      },
      {
        q: 'Can other users see my profile?',
        a: 'Only if you enable "Public Profile" in Settings → Profile. Public profiles show your stats at /api/stats/public/:userId.',
      },
    ],
  },
];

// ─── Accordion Item ───────────────────────────────────────────────────────────
function AccordionItem({ q, a, isOpen, onToggle }) {
  return (
    <div className="border-b border-gray-100 dark:border-white/[0.06] last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-3 py-4 text-left group focus:outline-none"
      >
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
          {q}
        </span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 mt-0.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="pb-4 pr-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed space-y-2">
          {typeof a === 'string'
            ? a.split('\n').map((line, i) => <p key={i}>{line}</p>)
            : a}
        </div>
      )}
    </div>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────
function CategorySection({ category, items }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex(prev => (prev === i ? null : i));

  if (!items || items.length === 0) return null;

  return (
    <section id={`section-${category.toLowerCase().replace(/\s+/g, '-')}`} className="mb-8">
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        {(() => {
          const Icon = CATEGORY_ICONS[category] || HelpCircle;
          return <Icon size={16} className="text-emerald-500 flex-shrink-0" />;
        })()}
        {category}
      </h2>
      <div className="bg-white dark:bg-white/[0.025] border border-gray-100 dark:border-white/[0.06] rounded-2xl px-5 shadow-sm dark:shadow-none">
        {items.map((item, i) => (
          <AccordionItem
            key={i}
            q={item.q}
            a={item.a}
            isOpen={openIndex === i}
            onToggle={() => toggle(i)}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HelpSupport() {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const categories = HELP_DATA.map(d => d.category);

  // Filter by search query across category name + question text
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q && !activeCategory) return HELP_DATA;
    return HELP_DATA
      .filter(section => !activeCategory || section.category === activeCategory)
      .map(section => ({
        ...section,
        items: q
          ? section.items.filter(item =>
              item.q.toLowerCase().includes(q) ||
              (typeof item.a === 'string' && item.a.toLowerCase().includes(q)) ||
              section.category.toLowerCase().includes(q)
            )
          : section.items,
      }))
      .filter(section => section.items.length > 0);
  }, [search, activeCategory]);

  const clearSearch = () => setSearch('');

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-main)]">
      {/* ── Page Header ── */}
      <div className="border-b border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">

            {/* Left: title + subtitle + search */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/15 rounded-xl">
                  <HelpCircle size={22} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 ml-[44px]">
                Everything you need to know about CPPro — features, FAQ, and platform guides.
              </p>

              {/* Search */}
              <div className="mt-6 relative max-w-xl">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search features, questions…"
                  className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.1] bg-gray-50 dark:bg-white/[0.04] text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
                />
            {search && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={14} />
              </button>
            )}
              </div>
            </div>{/* end left column */}

            {/* Right: contact cards */}
            <div className="flex-shrink-0 flex flex-col gap-3 w-full lg:w-72">
              <a
                href="mailto:support@cppro.dev"
                className="flex items-center gap-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-4 hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-all group"
              >
                <div className="p-3 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Email Support</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">support@cppro.dev</p>
                </div>
              </a>

              <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-4 hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-all group cursor-default">
                <div className="p-3 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl flex-shrink-0">
                  <Bug size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Report a Bug</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Help me enrich the community!</p>
                </div>
              </div>
            </div>{/* end right column */}

          </div>{/* end flex row */}
        </div>
      </div>

      {/* ── Body: Sidebar + Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex gap-8 items-start">

        {/* Sidebar — desktop */}
        <aside className="hidden lg:block w-52 flex-shrink-0 sticky top-24">
          <nav className="space-y-0.5">
            <button
              onClick={() => setActiveCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                !activeCategory
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
              }`}
            >
              All Topics
            </button>
            {categories.map(cat => {
              const Icon = CATEGORY_ICONS[cat] || HelpCircle;
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setSearch(''); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    activeCategory === cat
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon size={14} className="flex-shrink-0" />
                  <span className="truncate">{cat}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile: horizontal tab strip */}
        <div className="lg:hidden w-full mb-4 -mx-1 overflow-x-auto pb-2 flex gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              !activeCategory
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-emerald-400 dark:hover:border-emerald-500'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setSearch(''); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                activeCategory === cat
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-emerald-400 dark:hover:border-emerald-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* Mobile strip is sibling above — content starts here for desktop */}
          <div className="lg:hidden" /> {/* spacer consumed above */}

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400 dark:text-gray-500">
              <Search size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No results for <span className="font-medium text-gray-600 dark:text-gray-300">"{search}"</span></p>
            </div>
          ) : (
            filtered.map(section => (
              <CategorySection
                key={section.category}
                category={section.category}
                items={section.items}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
