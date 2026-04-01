import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, AlertTriangle, RefreshCw, Shield, Link as LinkIcon,
} from 'lucide-react';

import './Dashboard.css';
import AggregateStatCard from './AggregateStatCard';
import UnifiedHeatmap from './UnifiedHeatmap';
import DifficultyDonut from './DifficultyDonut';
import DualRatingChart from './DualRatingChart';
import PlatformProfileCard from './PlatformProfileCard';
import AwardsCard from './AwardsCard';
import TopicAnalysisChart from './TopicAnalysisChart';

/* ── Theme hook ── */
function useIsDark() {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

/* ── Helpers ── */
const safe = (result, extractor, fallback) => {
  if (result.status === 'fulfilled') {
    try { return extractor(result.value.data) ?? fallback; } catch { return fallback; }
  }
  return fallback;
};

const getRankFromRating = (r) => {
  if (!r) return 'Unrated';
  if (r < 1200) return 'Newbie'; if (r < 1400) return 'Pupil';
  if (r < 1600) return 'Specialist'; if (r < 1900) return 'Expert';
  if (r < 2100) return 'Candidate Master'; if (r < 2300) return 'Master';
  if (r < 2400) return 'International Master'; if (r < 2600) return 'Grandmaster';
  if (r < 3000) return 'International Grandmaster'; return 'Legendary Grandmaster';
};

const getLcRankName = (r) => {
  if (!r) return 'Unrated';
  if (r < 1500) return 'Beginner'; if (r < 1700) return 'Intermediate';
  if (r < 1900) return 'Guardian'; if (r < 2100) return 'Knight';
  if (r < 2400) return 'Guardian'; return 'Guardian';
};

/* ── Merge LC calendar (unix-timestamp JSON string) into date/count array ── */
function parseLcCalendar(calendarData) {
  if (!calendarData?.submissionCalendar) return [];
  try {
    const obj = JSON.parse(calendarData.submissionCalendar);
    return Object.entries(obj).map(([ts, count]) => ({
      date: new Date(Number(ts) * 1000).toISOString().split('T')[0],
      count,
    }));
  } catch { return []; }
}

/* ── Merge CF + LC heatmaps ── */
function mergeHeatmaps(cfHeatmap, lcEntries) {
  const map = {};
  (cfHeatmap || []).forEach(d => { map[d.date] = (map[d.date] || 0) + d.count; });
  (lcEntries || []).forEach(d => { map[d.date] = (map[d.date] || 0) + d.count; });
  return Object.entries(map)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/* ── Build topic list from LC skills ── */
function buildTopicsFromLc(skillStats) {
  if (!skillStats) return [];
  const all = [
    ...(skillStats.fundamental || []),
    ...(skillStats.intermediate || []),
    ...(skillStats.advanced || []),
  ];
  return all.map(s => ({ topic: s.tagName, count: s.problemsSolved }));
}

/* ── Merge CF topics + LC topics ── */
function mergeTopics(cfTopics, lcTopics) {
  const map = {};
  (cfTopics || []).forEach(t => {
    const name = t.tag || t._id || t.topic || 'Other';
    map[name] = (map[name] || 0) + (t.count || 0);
  });
  (lcTopics || []).forEach(t => {
    const name = t.topic || t.tagName || 'Other';
    map[name] = (map[name] || 0) + (t.count || 0);
  });
  return Object.entries(map)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);
}

export default function Dashboard() {
  const isDark = useIsDark();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notLinked, setNotLinked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Which platforms are linked
  const [hasCf, setHasCf] = useState(false);
  const [hasLc, setHasLc] = useState(false);

  // Assembled dashboard data
  const [dash, setDash] = useState(null);

  /* Cooldown timer */
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(p => p <= 1 ? (clearInterval(t), 0) : p - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const formatCooldown = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  /* ══════ Fetch all data ══════ */
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const config = { withCredentials: true };
      const authRes = await axios.get('/api/auth/verify', config);
      const user = authRes.data?.user;
      if (!user?._id) throw new Error('User not authenticated');
      const uid = user._id;

      const cfLinked = !!user.linkedAccounts?.codeforces;
      const lcLinked = !!user.linkedAccounts?.leetcode;
      setHasCf(cfLinked);
      setHasLc(lcLinked);

      if (!cfLinked && !lcLinked) {
        setNotLinked(true);
        if (!silent) setLoading(false);
        return;
      }
      setNotLinked(false);

      // Build API calls based on what's linked
      const cfCalls = cfLinked ? [
        axios.get(`/api/dashboard/profile/${uid}`, config),
        axios.get(`/api/dashboard/heatmap/${uid}`, config),
        axios.get(`/api/dashboard/rating/${uid}`, config),
        axios.get(`/api/dashboard/topics/${uid}`, config),
        axios.get(`/api/dashboard/difficulty/${uid}`, config),
      ] : [null, null, null, null, null];

      const lcCalls = lcLinked ? [
        axios.get(`/api/lc-dashboard/profile/${uid}`, config),
        axios.get(`/api/lc-dashboard/skills/${uid}`, config),
        axios.get(`/api/lc-dashboard/calendar/${uid}`, config),
        axios.get(`/api/lc-dashboard/contests/${uid}`, config),
      ] : [null, null, null, null];

      const allPromises = [...cfCalls, ...lcCalls].map(p => p ? p : Promise.resolve({ data: { success: true, data: null } }));
      const results = await Promise.allSettled(allPromises);

      // Extract CF data
      const cfProfile    = safe(results[0], d => d.data, null);
      const cfHeatmap    = safe(results[1], d => d.data, []);
      const cfRating     = safe(results[2], d => d.data, null);
      const cfTopics     = safe(results[3], d => d.data, []);
      const cfDifficulty = safe(results[4], d => d.data, []);

      // Extract LC data
      const lcProfileRaw = safe(results[5], d => d.data, null);
      const lcSkills     = safe(results[6], d => d.data, null);
      const lcCalendar   = safe(results[7], d => d.data, null);
      const lcContests   = safe(results[8], d => d.data, null);

      const lcProfile = lcProfileRaw?.profile || null;

      // ── Compute combined stats ──
      const cfSolved = cfProfile?.totalQuestionsSolved || 0;
      const lcSolved = lcProfile?.totalSolved || 0;
      const totalSolved = cfSolved + lcSolved;

      const lcHeatmapEntries = parseLcCalendar(lcCalendar);
      const combinedHeatmap = mergeHeatmaps(cfHeatmap, lcHeatmapEntries);
      const activeDays = combinedHeatmap.filter(d => d.count > 0).length;
      const totalSubmissions = combinedHeatmap.reduce((s, d) => s + d.count, 0);

      // Difficulty breakdown
      const cfDiffMap = {};
      (cfDifficulty || []).forEach(d => { cfDiffMap[d.rating || d._id] = d.count; });
      const easyCount = (lcProfile?.easySolved || 0);
      const mediumCount = (lcProfile?.mediumSolved || 0);
      const hardCount = (lcProfile?.hardSolved || 0);
      const cfTotalDiff = Object.values(cfDiffMap).reduce((s, v) => s + v, 0);
      const diffBreakdown = {
        total: easyCount + mediumCount + hardCount + cfTotalDiff,
        easyCount,
        mediumCount,
        hardCount: hardCount + cfTotalDiff, // CF problems lumped into hard bucket
      };
      // If only CF is linked, set total to cfTotalDiff with no easy/med split
      if (!lcLinked && cfLinked) {
        // For CF-only, show the difficulty bar chart data directly
        diffBreakdown.total = cfTotalDiff;
        diffBreakdown.easyCount = 0;
        diffBreakdown.mediumCount = 0;
        diffBreakdown.hardCount = cfTotalDiff;
        // We'll render the DifficultyChart differently for CF-only below
      }

      // Dual rating history
      const cfRatingHistory = (cfRating?.history || []).map(h => ({
        date: h.date || h.ratingUpdateTimeSeconds
          ? new Date((h.ratingUpdateTimeSeconds || 0) * 1000).toISOString().split('T')[0]
          : '',
        cfRating: h.newRating || h.rating || 0,
      }));

      const lcRatingHistory = (lcContests?.contestHistory || [])
        .filter(c => c.attended)
        .map(c => ({
          date: c.contestStartTime
            ? new Date(c.contestStartTime * 1000).toISOString().split('T')[0]
            : '',
          lcRating: Math.round(c.rating || 0),
          contestTitle: c.contestTitle,
          rank: c.ranking,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Merge into unified timeline
      const allDates = new Set();
      cfRatingHistory.forEach(h => allDates.add(h.date));
      lcRatingHistory.forEach(h => allDates.add(h.date));
      const sortedDates = [...allDates].sort();

      let lastCf = cfRatingHistory.length ? cfRatingHistory[0].cfRating : null;
      let lastLc = lcRatingHistory.length ? lcRatingHistory[0].lcRating : null;
      const cfLookup = {}; cfRatingHistory.forEach(h => { cfLookup[h.date] = h.cfRating; });
      const lcLookup = {}; lcRatingHistory.forEach(h => { lcLookup[h.date] = h; });

      const dualRating = {
        dates: sortedDates,
        codeforcesRatings: sortedDates.map(d => { if (cfLookup[d] !== undefined) lastCf = cfLookup[d]; return lastCf; }),
        leetcodeRatings: sortedDates.map(d => { if (lcLookup[d] !== undefined) lastLc = lcLookup[d].lcRating; return lastLc; }),
        contestNames: lcRatingHistory.filter(h => h.contestTitle).map(h => ({
          date: h.date, name: h.contestTitle, rank: h.rank || 0,
        })),
      };

      // Platform profiles
      const platformProfiles = {};
      if (cfLinked) {
        const cfCur = cfRating?.currentRating || 0;
        const cfMax = cfRating?.maxRating || 0;
        platformProfiles.codeforces = {
          currentRating: cfCur, maxRating: cfMax,
          rankName: cfProfile?.platforms?.[0]?.currentRank || cfRating?.currentRank || getRankFromRating(cfCur),
        };
      }
      if (lcLinked) {
        const lastLcRating = lcRatingHistory.length ? lcRatingHistory[lcRatingHistory.length - 1].lcRating : 0;
        const maxLcRating = lcRatingHistory.reduce((m, h) => Math.max(m, h.lcRating || 0), 0);
        platformProfiles.leetcode = {
          currentRating: lastLcRating, maxRating: maxLcRating,
          rankName: getLcRankName(lastLcRating),
        };
      }

      // Topics
      const lcTopics = buildTopicsFromLc(lcSkills);
      const combinedTopics = mergeTopics(cfTopics, lcTopics);

      // Awards (derived from data)
      const awards = [];
      if (lcCalendar?.streak > 0) awards.push({ id: 'lc_streak', type: 'gold', platform: 'leetcode', title: `${lcCalendar.streak} Day Streak` });
      if (lcCalendar?.totalActiveDays > 100) awards.push({ id: 'lc_100', type: 'silver', platform: 'leetcode', title: '100+ Active Days' });
      if (lcSolved >= 50) awards.push({ id: 'lc_50', type: 'bronze', platform: 'leetcode', title: '50+ Problems' });
      if (cfSolved >= 50) awards.push({ id: 'cf_50', type: 'bronze', platform: 'codeforces', title: '50+ Problems' });
      if (cfSolved >= 200) awards.push({ id: 'cf_200', type: 'silver', platform: 'codeforces', title: '200+ Problems' });
      if (cfSolved >= 500) awards.push({ id: 'cf_500', type: 'gold', platform: 'codeforces', title: '500+ Problems' });
      if ((cfRating?.maxRating || 0) >= 1400) awards.push({ id: 'cf_pupil', type: 'gold', platform: 'codeforces', title: 'Pupil+' });

      // CF-only difficulty data (for the bar view) — store raw
      const cfDifficultyRaw = cfDifficulty;

      setDash({
        user,
        hasCf: cfLinked,
        hasLc: lcLinked,
        aggregateTopStats: { totalCombinedSolved: totalSolved, totalCombinedActiveDays: activeDays, totalCombinedSubmissions: totalSubmissions },
        platformsSolvedCounts: { codeforces: cfSolved, leetcode: lcSolved },
        combinedHeatmap,
        combinedProblemsBreakdown: diffBreakdown,
        cfDifficultyRaw,
        dualRatingHistory: dualRating,
        platformProfiles,
        combinedTopicAnalysis: combinedTopics,
        combinedAwards: awards,
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      if (!silent) setError(err.message || 'Failed to load dashboard data');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = async () => {
    if (cooldown > 0) return;
    setRefreshing(true);
    try {
      // Refresh both platforms
      const config = { withCredentials: true };
      const promises = [];
      if (hasCf) promises.push(axios.post('/api/sync/refresh', {}, config));
      if (hasLc) promises.push(axios.post('/api/sync/refresh-lc', {}, config));
      const results = await Promise.allSettled(promises);

      // Check for cooldown
      const firstFresh = results.find(r => r.status === 'fulfilled' && r.value.data?.freshness === 'fresh');
      if (firstFresh) {
        setCooldown(firstFresh.value.data.remainingSeconds || 60);
      } else {
        await fetchData(true);
        setTimeout(() => fetchData(true), 6000);
      }
    } catch (err) {
      console.error(err);
    } finally { setRefreshing(false); }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] flex justify-center items-center transition-colors">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={28} className="animate-spin text-indigo-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  /* ── Not linked ── */
  if (notLinked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] flex flex-col justify-center items-center p-6 transition-colors">
        <div className="bg-white dark:bg-[#13131d] border border-gray-200 dark:border-[#1e1e2e] text-center rounded-xl p-8 max-w-md w-full shadow-sm">
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center mx-auto mb-5">
            <LinkIcon size={28} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Link Your Account</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Link at least one platform (Codeforces or LeetCode) to view your dashboard.</p>
          <button className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            onClick={() => navigate('/verify-codeforces')}>
            <Shield size={16} /> Go to Verification
          </button>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error && !dash) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] flex flex-col justify-center items-center p-6 transition-colors">
        <div className="bg-white dark:bg-[#13131d] border border-gray-200 dark:border-[#1e1e2e] text-center rounded-xl p-8 max-w-md w-full shadow-sm">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            onClick={() => fetchData()}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dash) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.div className="flex items-center justify-between"
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center">
              <LayoutDashboard size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {dash.hasCf && dash.hasLc ? 'Codeforces + LeetCode' : dash.hasCf ? 'Codeforces' : 'LeetCode'}
              </p>
            </div>
          </div>

          <button onClick={handleRefresh} disabled={refreshing || cooldown > 0}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors ${
              cooldown > 0 ? 'bg-amber-500 cursor-not-allowed'
                : refreshing ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {cooldown > 0 ? `Refresh in ${formatCooldown(cooldown)}` : refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </motion.div>

        {/* Row 1: Stat Cards + Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <AggregateStatCard type="solved" stats={dash.aggregateTopStats}
            platformCounts={dash.platformsSolvedCounts} />
          <AggregateStatCard type="active" stats={dash.aggregateTopStats} />
          <div className="lg:col-span-2">
            <UnifiedHeatmap data={dash.combinedHeatmap} isDark={isDark} />
          </div>
        </div>

        {/* Row 2: Donut + Rating Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <DifficultyDonut breakdown={dash.combinedProblemsBreakdown} isDark={isDark} />
          </div>
          <div className="lg:col-span-3">
            <DualRatingChart ratingData={dash.dualRatingHistory} isDark={isDark}
              hasCf={dash.hasCf} hasLc={dash.hasLc} />
          </div>
        </div>

        {/* Row 3: Platform Profiles + Topic Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlatformProfileCard profiles={dash.platformProfiles} />
          <TopicAnalysisChart topics={dash.combinedTopicAnalysis} isDark={isDark} />
        </div>

        {/* Row 4: Awards */}
        <AwardsCard awards={dash.combinedAwards} />

      </div>
    </div>
  );
}