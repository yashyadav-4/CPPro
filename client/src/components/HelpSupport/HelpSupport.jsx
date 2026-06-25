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
        q: 'What do the main statistics cards track?',
        a: 'Your Dashboard provides a unified view of your competitive programming journey. The top cards display your Total Solved problems (unique across all platforms), Total Submissions (including all WA/TLE attempts, with platform-specific breakdowns), Active Days, overall Acceptance Rate, Total Contests attended, and your CPScore. All data is pulled live from your linked Codeforces, LeetCode, and CodeChef accounts.',
      },
      {
        q: 'How does the Activity Heatmap work?',
        a: 'The heatmap seamlessly merges your Codeforces and LeetCode submission history into a single, beautiful calendar grid. Each cell represents a day, with the color intensity matching your submission volume. CodeChef activity is tracked separately in its dedicated analytics panel. Once your accounts are linked, this populates automatically!',
      },
      {
        q: 'What is the Rating Progression chart?',
        a: 'It plots your Codeforces and LeetCode rating histories on a shared, interactive timeline. This allows you to directly visualize how your performance on both platforms has evolved relative to one another over time.',
      },
      {
        q: 'What other analytics are available on the Dashboard?',
        a: 'The Dashboard is packed with insights! You\'ll find your Difficulty Breakdown (Easy/Medium/Hard/CF Ratings), Skill Gaps & Top Topics radar charts, Weekly Streak tracker, Recent Contests log, and Earned Achievements. If you link a CodeChef account, you\'ll also unlock the CCQuickStats, CCLanguageChart, and CCVerdictBreakdown modules.',
      },
      {
        q: 'How do I share my progress with others?',
        a: 'Click the "Share" (camera) icon in the Dashboard header. CPPro will instantly generate a sleek, downloadable image card summarizing your key stats, current ratings, and CPScore — perfect for sharing on social media or your portfolio.',
      },
      {
        q: 'Is my Dashboard data real-time?',
        a: 'Codeforces syncs every 10 minutes, and LeetCode syncs every 15 minutes. To ensure the Dashboard loads instantly, we serve your cached data immediately while firing a background sync. You can force an early update anytime by clicking the "Refresh" button in the header.',
      },
    ],
  },

  // ─── 2. Daily Problems ───────────────────────────────────────────────────
  {
    category: 'Daily Problems',
    items: [
      {
        q: 'What are the Daily Problems?',
        a: 'Every day (in IST), CPPro\'s recommendation engine curates two hyper-personalized problems for you: a Daily Workout (a comfortable, popular problem at or slightly below your current rating) and a Daily Challenger (a significantly harder problem specifically targeting your statistically weakest topic).',
      },
      {
        q: 'How do I access and solve my daily problems?',
        a: 'Navigate to /daily (or click the widget on your Dashboard). Problems are generated lazily on your first visit each day. Steps: 1. Link your Codeforces, LeetCode, or CodeChef account. 2. Visit /daily. 3. Solve the problem on the respective platform. 4. Click Refresh in CPPro—our auto-detect engine will securely verify your submission and update your streak!',
      },
      {
        q: 'How are difficulty bands calculated?',
        a: 'For Codeforces: Workout = [rating−300, rating]; Challenger = [rating+100, rating+350]. For LeetCode: Scales dynamically from Easy to Hard based on your estimated LC rating. For CodeChef: Custom rating-based bands. The Challenger is always designed to push you one step beyond your comfort zone.',
      },
      {
        q: 'Which platforms do the daily problems pull from?',
        a: 'Our recommendation engine evaluates platforms in a strict priority order: LeetCode → Codeforces → CodeChef. If no high-quality, unsolved problem matching your exact skill parameters is found on the first platform, it gracefully falls back to the next.',
      },
      {
        q: 'How does the auto-solve detection engine work?',
        a: 'After every successful background sync, CPPro scans your last 50 accepted submissions. If an exact match with your daily problem is detected, it automatically marks the problem as solved, extends your streak, and dispatches an in-app notification.',
      },
      {
        q: 'How does the daily streak system work?',
        a: 'Your dedicated Daily Streak (visible in Settings) tracks consecutive days where you\'ve conquered at least one daily problem. Hitting major milestones (7, 14, 30, 60, and 100 days) unlocks special notifications and achievements.',
      },
      {
        q: 'Where can I monitor my daily progress quickly?',
        a: 'The DailyWidget is beautifully integrated directly into Row 3 of your main Dashboard. It provides a compact, at-a-glance view of today\'s Workout and Challenger, seamlessly linking you directly to the full /daily interface.',
      },
    ],
  },

  // ─── 3. Sync & Data ──────────────────────────────────────────────────────
  {
    category: 'Sync & Data',
    items: [
      {
        q: 'How do I refresh my data?',
        a: 'Simply click the "Refresh" button in the Dashboard header. This triggers an asynchronous background sync for Codeforces, LeetCode, and CodeChef. You never have to wait—your current data is shown instantly while the platform securely updates your records in the background.',
      },
      {
        q: 'How often can I sync my accounts?',
        a: 'To respect platform APIs, Codeforces has a 10-minute cooldown, and LeetCode has a 15-minute cooldown (Admins have a 10-second bypass). Thanks to our "Lean Nexus" architecture, syncing never blocks your workflow.',
      },
      {
        q: 'How does LeetCode sync work without a Session Token?',
        a: 'Our public sync engine effortlessly fetches your 100 most-recent accepted submissions using LeetCode\'s public API. However, if you want deeper analytics, adding your LEETCODE_SESSION cookie in Settings allows CPPro to fetch up to 200 submissions including failed attempts, detailed statuses, and language information.',
      },
      {
        q: 'How does the Codeforces backend sync work?',
        a: 'CPPro utilizes a dedicated, high-performance API microserver (port 3001). It dispatches BullMQ background workers through rotating Webshare proxies to rapidly aggregate your entire rating history, submission logs, contest participation, and deep topic/difficulty analytics.',
      },
    ],
  },

  // ─── 4. Leaderboard ──────────────────────────────────────────────────────
  {
    category: 'Leaderboard',
    items: [
      {
        q: 'How does the Global Leaderboard work?',
        a: 'The Leaderboard ranks the top 100 users across the entire CPPro platform. You can toggle between different scopes: Global, Country, and College. (Note: Country and College scopes exclusively feature users who have completed those fields in their Profile Settings).',
      },
      {
        q: 'What metrics can I compete on?',
        a: 'You can compete across four major categories: CPScore (our proprietary holistic rating), Total Questions Solved, LeetCode Rating, and Codeforces Rating.',
      },
      {
        q: 'How is my CPScore calculated?',
        a: 'CPScore is the ultimate measure of your competitive programming prowess. The formula is: (CF_Rating × 1.5) + (LC_Rating × 1.2) + (CF_Hard × 15) + (CF_Medium × 8) + (CF_Easy × 2) + (LC_Hard × 20) + (LC_Medium × 8) + (LC_Easy × 2) + (Contests × 10) + streak bonus (capped at 200).',
      },
      {
        q: 'Why am I missing from the Country or College leaderboard?',
        a: 'Simply head over to Settings → Profile, ensure your Country and College fields are accurately filled out, and save your changes. You will instantly be indexed in those scoped leaderboards!',
      },
    ],
  },

  // ─── 5. Learning Tree ────────────────────────────────────────────────────
  {
    category: 'Learning Tree',
    items: [
      {
        q: 'What is the Learning Tree?',
        a: 'The Learning Tree is a stunning, interactive 3D visualization (powered by Three.js) that maps out the vast landscape of competitive programming topics. Each node represents a distinct algorithmic concept with four interactive progression states: Not Started → Theory → Implemented → Mastered.',
      },
      {
        q: 'How do I track my progression?',
        a: 'Simply click on any topic node within the 3D space to cycle it through its mastery states. The visual feedback makes it incredibly satisfying to watch your algorithmic knowledge tree bloom as you conquer new concepts.',
      },
      {
        q: 'Where is my Learning Tree data saved?',
        a: 'Currently, your Learning Tree progress is securely stored locally in your browser\'s localStorage under the key `cppro_tree_v2`. This ensures instant, offline-capable load times.',
      },
      {
        q: 'WARNING: Will I lose my progress if I clear my browser data?',
        a: 'Yes. Because data is stored locally, clearing your browser\'s cache/localStorage (or using incognito mode) will reset your Learning Tree. We highly recommend noting your progress before performing deep browser clears. Cloud-based MongoDB synchronization is actively in development and will arrive in a future update!',
      },
    ],
  },

  // ─── 6. Code Templates ───────────────────────────────────────────────────
  {
    category: 'Code Templates',
    items: [
      {
        q: 'What is the Code Templates feature?',
        a: 'It serves as your personal snippet vault. You can create, store, securely manage, and quickly retrieve your most-used algorithmic templates and boilerplates. Accessible anytime via /codesnippet.',
      },
      {
        q: 'What languages are supported for snippets?',
        a: 'We currently offer first-class syntax highlighting and formatting support for C++, Python, Java, and JavaScript.',
      },
      {
        q: 'How do I keep my templates organized?',
        a: 'You can tag each snippet, assign it to a specific language, and seamlessly toggle its visibility (Public vs. Private). The interface features rapid language filter tabs (All / C++ / Python / Java / JavaScript) and smooth pagination to handle hundreds of templates effortlessly.',
      },
      {
        q: 'How do I view or edit a saved snippet?',
        a: 'Clicking any snippet card launches the SnippetDetailModal—an expansive, distraction-free view that displays the full code with rich syntax highlighting, alongside intuitive controls for editing or deleting.',
      },
      {
        q: 'Can other competitive programmers see my snippets?',
        a: 'Only if you want them to! Snippets marked "Public" contribute to the communal knowledge pool. Snippets marked "Private" remain strictly visible to you.',
      },
    ],
  },

  // ─── 7. Community ────────────────────────────────────────────────────────
  {
    category: 'Community',
    items: [
      {
        q: 'What is the Community forum?',
        a: 'It is the beating heart of CPPro—a vibrant discussion board located at /community. Users can publish rich-text posts, engage in deeply threaded comments, and utilize an upvote/downvote system to surface the highest quality algorithmic discussions.',
      },
      {
        q: 'What kind of content can I post?',
        a: 'We support three tailored post formats: Blogs (for long-form editorials or tutorials), Discussions (for open-ended algorithmic debates), and Help (dedicated Q&A formatting for when you\'re stuck on a tricky test case).',
      },
      {
        q: 'Can important posts be pinned?',
        a: 'Yes. Community moderators and admins possess the ability to pin highly valuable posts, cementing them at the top of the global feed for maximum visibility.',
      },
      {
        q: 'Do I need to log in to browse the community?',
        a: 'Not at all! The wealth of knowledge in the community is fully accessible to public readers. You only need to log in when you\'re ready to contribute—by posting, commenting, or casting votes.',
      },
    ],
  },

  // ─── 8. Contest Tracker ──────────────────────────────────────────────────
  {
    category: 'Contest Tracker',
    items: [
      {
        q: 'What does the Contest Tracker do?',
        a: 'It acts as your central hub for competitive programming schedules, fetching and displaying upcoming and past contests from Codeforces and LeetCode. Our backend syncs contest data every 6 hours automatically, ensuring you never miss a match.',
      },
      {
        q: 'Do I need an account to view the schedule?',
        a: 'Absolutely not! The Contest Tracker at /contest-tracker is a completely public utility available to everyone.',
      },
    ],
  },

  // ─── 9. Settings ─────────────────────────────────────────────────────────
  {
    category: 'Settings',
    items: [
      {
        q: 'What options can I customize in Settings?',
        a: 'Settings is your command center. You can tailor your personal profile (avatar, demographics, college), manage your platform links (Codeforces, LeetCode, CodeChef), securely store your LC Session Token, toggle your Public/Private visibility status, and switch between Light/Dark themes.',
      },
      {
        q: 'What is the LC Session Token and why is it important?',
        a: 'By default, public APIs only allow CPPro to fetch your 100 most recent accepted submissions. Adding your LEETCODE_SESSION cookie dramatically upgrades this capability—allowing CPPro to securely fetch up to 200 submissions, encompassing full execution status (WA, TLE) and language specifics. To add it: Login to leetcode.com → DevTools (F12) → Application → Cookies → Copy the LEETCODE_SESSION value → Paste into Settings. Your token is protected with military-grade AES-256-GCM encryption.',
      },
      {
        q: 'What should I do if my LeetCode session expires?',
        a: 'LeetCode periodically rotates session cookies (usually every 30 days). When this happens, CPPro will smartly alert you via a notification. Simply grab your new cookie from LeetCode and update it in your Settings to resume deep syncs.',
      },
      {
        q: 'How does the Public Profile toggle work?',
        a: 'When activated, your competitive stats are aggregated into a stunning public portfolio viewable at /api/stats/public/:userId, perfect for sharing with recruiters. Disabling it instantly makes your data private.',
      },
    ],
  },

  // ─── 10. Notifications ───────────────────────────────────────────────────
  {
    category: 'Notifications',
    items: [
      {
        q: 'How is the notification system structured?',
        a: 'The notification bell in the master navigation bar keeps you connected in real-time. It silently polls for updates every 60 seconds, utilizing a dynamic badge to display unread alerts. Clicking it unveils a sleek, actionable dropdown feed.',
      },
      {
        q: 'What exact events trigger notifications?',
        a: 'You are kept in the loop for critical events: Background Sync Completions, the arrival of your personalized Daily Problems, milestone achievements on your Daily Streak (7, 14, 30, 60, 100 days), LeetCode session expirations, global Admin broadcasts, and all social engagements (replies/comments) on your community posts.',
      },
    ],
  },

  // ─── 11. Upsolve & Growth ────────────────────────────────────────────────
  {
    category: 'Upsolve & Growth',
    items: [
      {
        q: 'What is the Upsolve Queue?',
        a: 'A dynamic list of problems specifically curated for your growth. It includes problems you attempted but didn\'t solve (Wrong Answer, TLE, etc.) across Codeforces, LeetCode, and CodeChef. It also tracks your recently attended contests and adds any unattempted problems from those contests to help you complete the set! Accessible from Dashboard and /level-up.',
      },
      {
        q: 'How does upsolve detection work?',
        a: 'For attempted problems, it cross-checks your failed submissions against your accepted ones. For LeetCode specifically, it uses your last 200 submissions (with LC Session Token) or your recent public history. For unattempted contest problems, CPPro tracks the contests you participated in and pulls the problems you missed.',
      },
      {
        q: 'Why are there unattempted contest problems in my Upsolve Queue?',
        a: 'CPPro automatically tracks your attended Codeforces and LeetCode contests. If you didn\'t finish all the problems in a contest you attended, the remaining unattempted problems are added to your Upsolve Queue to encourage you to finish the set.',
      },
      {
        q: 'What is the Growth Planner (NextTarget)?',
        a: 'A 50-point rating sprint planner. It shows your next target rating and the types of problems you should solve to reach it. Accessible from the Dashboard and /level-up.',
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

              <a
                href="mailto:support@cppro.dev?subject=Bug%20Report%20—%20CPPro"
                className="flex items-center gap-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-4 hover:bg-orange-50 dark:hover:bg-orange-500/[0.07] hover:border-orange-300 dark:hover:border-orange-500/40 hover:shadow-[0_0_18px_4px_rgba(249,115,22,0.25)] focus:outline-none focus:shadow-[0_0_18px_4px_rgba(249,115,22,0.35)] transition-all duration-300 group"
              >
                <div className="p-3 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl flex-shrink-0 group-hover:bg-orange-200 dark:group-hover:bg-orange-500/30 transition-colors duration-300">
                  <Bug size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">Report a Bug</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block group-hover:hidden">Help me enrich the community!</p>
                  <p className="text-xs text-orange-500 dark:text-orange-400 mt-0.5 hidden group-hover:block">support@cppro.dev</p>
                </div>
              </a>
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
