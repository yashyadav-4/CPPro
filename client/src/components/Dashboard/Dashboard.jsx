import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RefreshCw, Link as LinkIcon, AlertTriangle, Shield } from 'lucide-react';

import { useDashboardData } from '../../hooks/useDashboardData';

import StatCards from './StatCards';
import PlatformProfiles from './PlatformProfiles';
import DifficultyBreakdown from './DifficultyBreakdown';
import WeekStreak from './WeekStreak';
import ActivityHeatmap from './ActivityHeatmap';
import RatingProgression from './RatingProgression';
import TopTopics from './TopTopics';
import RecentContests from './RecentContests';
import UpsolveQueue from './UpsolveQueue';
import SkillGaps from './SkillGaps';
import Achievements from './Achievements';

const REFRESH_STATE_KEY_PREFIX = 'dashboard_refresh_state_';
const ADMIN_COOLDOWN_SECONDS = 10;
const USER_COOLDOWN_SECONDS = 15 * 60;
const REFRESH_WINDOW_SECONDS = 7;

// ── Merge two day arrays into combined last-7-days ───────────────────────────
function mergeLast7Days(cfDays, lcDays) {
  const result = [];
  const len = Math.max(cfDays?.length || 0, lcDays?.length || 0, 7);
  for (let i = 0; i < len; i++) {
    const cfDay = cfDays?.[i] || { date: '', solved: false };
    const lcDay = lcDays?.[i] || { date: '', solved: false };
    result.push({
      date: cfDay.date || lcDay.date,
      solved: cfDay.solved || lcDay.solved,
    });
  }
  return result;
}

// ── Merge heatmap arrays (CF + LC calendar) ──────────────────────────────────
function mergeHeatmaps(cfHeatmap, lcCalendar) {
  const map = {};
  (cfHeatmap || []).forEach(d => { map[d.date] = (map[d.date] || 0) + d.count; });
  (lcCalendar || []).forEach(d => { map[d.date] = (map[d.date] || 0) + d.count; });
  return Object.entries(map).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
}

// ── Merge topic arrays and take top 8 ────────────────────────────────────────
function mergeTopics(cfTopics, lcTopics) {
  const map = {};
  (cfTopics || []).forEach(t => { map[t.name] = (map[t.name] || 0) + t.count; });
  (lcTopics || []).forEach(t => { map[t.name] = (map[t.name] || 0) + t.count; });
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function mergeContests(cfContests, lcContests) {
  return [...(cfContests || []), ...(lcContests || [])]
    .filter(c => c.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { cfData, lcData, userId, userRole, linkedAccounts, loading, error, refetch } = useDashboardData();

  const [refreshing, setRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const defaultCooldownSeconds = userRole === 'admin' ? ADMIN_COOLDOWN_SECONDS : USER_COOLDOWN_SECONDS;
  const refreshStateKey = userId ? `${REFRESH_STATE_KEY_PREFIX}${userId}` : null;

  const persistRefreshState = useCallback((state) => {
    if (!refreshStateKey) return;
    localStorage.setItem(refreshStateKey, JSON.stringify(state));
  }, [refreshStateKey]);

  const clearRefreshState = useCallback(() => {
    if (!refreshStateKey) return;
    localStorage.removeItem(refreshStateKey);
  }, [refreshStateKey]);

  const applyCooldown = useCallback((seconds) => {
    const safeSeconds = Math.max(0, Math.ceil(seconds || 0));
    setCooldown(safeSeconds);
    if (safeSeconds > 0) {
      persistRefreshState({
        cooldownUntil: Date.now() + (safeSeconds * 1000),
        refreshingUntil: 0,
      });
    } else {
      clearRefreshState();
    }
  }, [persistRefreshState, clearRefreshState]);

  useEffect(() => {
    if (!refreshStateKey) return;

    let parsed;
    try {
      parsed = JSON.parse(localStorage.getItem(refreshStateKey) || '{}');
    } catch {
      parsed = {};
    }

    const nowTs = Date.now();
    const cooldownLeft = parsed.cooldownUntil ? Math.max(0, Math.ceil((parsed.cooldownUntil - nowTs) / 1000)) : 0;

    if (cooldownLeft > 0) {
      setCooldown(cooldownLeft);
    }

    if (parsed.refreshingUntil && parsed.refreshingUntil > nowTs) {
      setRefreshing(true);
      const waitMs = parsed.refreshingUntil - nowTs;
      const t = setTimeout(async () => {
        await refetch(true);
        setRefreshing(false);
        applyCooldown(defaultCooldownSeconds);
      }, waitMs);
      return () => clearTimeout(t);
    }
  }, [refreshStateKey, refetch, defaultCooldownSeconds, applyCooldown]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown(p => {
        if (p <= 1) {
          clearInterval(t);
          clearRefreshState();
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown, clearRefreshState]);

  const formatCooldown = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleRefresh = useCallback(async () => {
    if (cooldown > 0 || !userId) return;
    setRefreshing(true);
    persistRefreshState({
      cooldownUntil: 0,
      refreshingUntil: Date.now() + (REFRESH_WINDOW_SECONDS * 1000),
    });

    try {
      const config = { withCredentials: true };
      const promises = [];
      if (linkedAccounts.codeforces) promises.push(axios.post('/api/sync/refresh', {}, config));
      if (linkedAccounts.leetcode) promises.push(axios.post('/api/sync/refresh-lc', {}, config));
      const results = await Promise.allSettled(promises);
      const fresh = results.find(r => r.status === 'fulfilled' && r.value.data?.freshness === 'fresh');
      
      if (fresh) {
        applyCooldown(fresh.value.data.remainingSeconds || defaultCooldownSeconds);
        setRefreshing(false);
      } else {
        // Backend started a background sync. Fetch current, then wait 6s to fetch new.
        await refetch(true);
        setTimeout(async () => {
          await refetch(true);
          setRefreshing(false);
          applyCooldown(defaultCooldownSeconds);
        }, 6000);
      }
    } catch (err) {
      console.error(err);
      setRefreshing(false);
      clearRefreshState();
    }
  }, [cooldown, userId, linkedAccounts, refetch, persistRefreshState, applyCooldown, defaultCooldownSeconds, clearRefreshState]);

  // ── Not linked ──────────────────────────────────────────────────────────────
  if (!loading && !linkedAccounts.codeforces && !linkedAccounts.leetcode && !error) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] dark:bg-[#1A1A1A] flex flex-col justify-center items-center p-6">
        <div className="bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-white/[0.08] text-center rounded-xl p-8 max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center mx-auto mb-5">
            <LinkIcon size={28} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Link Your Account</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 font-normal">Link at least one platform to view your dashboard.</p>
          <button
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            onClick={() => navigate('/verify-codeforces')}
          >
            <Shield size={16} /> Go to Verification
          </button>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error && !cfData && !lcData) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] dark:bg-[#1A1A1A] flex flex-col justify-center items-center p-6">
        <div className="bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-white/[0.08] text-center rounded-xl p-8 max-w-md w-full">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 font-normal">{error}</p>
          <button
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            onClick={() => refetch()}
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Derive combined props ─────────────────────────────────────────────────
  const cf = cfData || {};
  const lc = lcData || {};

  // StatCards - computed early where possible
  const totalSolved = (cf.cfSolved ?? 0) + (lc.lcSolved ?? 0);
  const totalSubmissions = (cf.cfTotalSubmissions ?? 0);
  const solvedThisMonth = (cf.cfSolvedThisMonth ?? 0) + (lc.lcSolvedThisMonth ?? 0);
  const solvedLastMonth = (cf.cfSolvedLastMonth ?? 0) + (lc.lcSolvedLastMonth ?? 0);

  // Heatmap (merge CF + LC)
  const heatmapData = mergeHeatmaps(cf.cfHeatmap, lc.lcCalendarParsed);

  // Active Days (deduplicated across platforms from heatmap)
  const activeDays = heatmapData.length;
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const activeDaysThisMonth = heatmapData.filter(d => d.date.startsWith(monthStr)).length;
  const activeDaysLastMonth = heatmapData.filter(d => d.date.startsWith(lastMonthStr)).length;

  // Unified streak (from LC endpoint which merged both)
  const currentStreak = lc.currentStreak ?? cf.cfCurrentStreak ?? 0;
  const bestStreak = lc.bestStreak ?? cf.cfBestStreak ?? 0;
  const bestStreakPlatform = lc.bestStreakPlatform ?? 'codeforces';

  // Acceptance rate
  const cfAR = cf.cfAcceptanceRate ?? null;
  const lcAR = lc.lcAcceptanceRate ?? null;
  const acceptanceRate = (cfAR !== null && lcAR !== null)
    ? Math.round((cfAR + lcAR) / 2)
    : cfAR ?? lcAR ?? null;

  // Platform profiles
  const profileProps = {
    cfHandle: cf.cfHandle || null,
    cfRating: cf.cfRating || null,
    cfMaxRating: cf.cfMaxRating || null,
    cfRank: cf.cfRank || null,
    lcHandle: lc.lcHandle || null,
    lcRating: lc.lcRating || null,
    lcMaxRating: lc.lcMaxRating || null,
    lcRank: lc.lcRank || null,
  };

  // Difficulty breakdown
  const cfBands = cf.cfDiffBands || [];
  const lcBands = [
    { label: 'Easy', count: lc.lcEasy ?? 0 },
    { label: 'Medium', count: lc.lcMedium ?? 0 },
    { label: 'Hard', count: lc.lcHard ?? 0 },
  ];

  // Last 7 days (merge CF + LC)
  const last7Days = mergeLast7Days(cf.cfLast7Days, lc.lcLast7Days);

  // Rating histories
  const cfRatingHistory = cf.cfRatingHistory || [];
  const lcRatingHistory = lc.lcRatingHistory || [];

  // Topics (merge, top 8)
  const topics = mergeTopics(cf.cfTopics, lc.lcTopics);

  // Contests (merge, sort by date, top 6)
  const contests = mergeContests(cf.recentCfContests, lc.recentLcContests);

  // Upsolve queue
  // Upsolve queue: blend CF and LC
  const cfUpsolve = (cf.upsolveQueue || []).sort((a, b) => (a.rating || 0) - (b.rating || 0));
  const lcUpsolve = (lc.upsolveQueue || []).sort((a, b) => b.attempts - a.attempts);

  const half = 5;
  let cfTake = Math.min(cfUpsolve.length, half);
  let lcTake = Math.min(lcUpsolve.length, half);
  
  if (cfTake < half) lcTake = Math.min(lcUpsolve.length, 10 - cfTake);
  if (lcTake < half) cfTake = Math.min(cfUpsolve.length, 10 - lcTake);

  const upsolveProblems = [...cfUpsolve.slice(0, cfTake), ...lcUpsolve.slice(0, lcTake)];

  // Skill gaps
  const skills = cf.skillGaps || [];

  // Achievements (from LC endpoint which computed combined)
  const achievements = lc.achievements || [];

  return (
    <div className="bg-[#F5F5F3] dark:bg-[#1A1A1A] px-6 py-6 min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-normal">
              {linkedAccounts.codeforces && linkedAccounts.leetcode
                ? 'Codeforces + LeetCode'
                : linkedAccounts.codeforces ? 'Codeforces' : 'LeetCode'}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || cooldown > 0}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors ${
              refreshing
                  ? 'bg-indigo-400 cursor-not-allowed'
                : cooldown > 0
                  ? 'bg-amber-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : cooldown > 0 ? `${formatCooldown(cooldown)}` : 'Refresh'}
          </button>
        </div>

        {/* Row 1: Stat Cards */}
        <StatCards
          loading={loading}
          totalSolved={totalSolved}
          cfSolved={cf.cfSolved ?? 0}
          lcSolved={lc.lcSolved ?? 0}
          activeDays={activeDays}
          totalSubmissions={totalSubmissions}
          currentStreak={currentStreak}
          bestStreak={bestStreak}
          acceptanceRate={acceptanceRate}
          cfAcceptanceRate={cfAR}
          lcAcceptanceRate={lcAR}
          solvedThisMonth={solvedThisMonth}
          activeDaysThisMonth={activeDaysThisMonth}
        />

        {/* Row 2: Platform info trio */}
        <div className="grid grid-cols-3 gap-3">
          <PlatformProfiles loading={loading} {...profileProps} />
          <DifficultyBreakdown loading={loading} cfBands={cfBands} lcBands={lcBands} />
          <WeekStreak
            loading={loading}
            currentStreak={currentStreak}
            bestStreak={bestStreak}
            bestStreakPlatform={bestStreakPlatform}
            last7Days={last7Days}
            activeDaysThisMonth={activeDaysThisMonth}
            activeDaysLastMonth={activeDaysLastMonth}
          />
        </div>

        {/* Row 3: Activity heatmap */}
        <ActivityHeatmap loading={loading} heatmapData={heatmapData} />

        {/* Row 4: Rating + Topics */}
        <div className="grid grid-cols-2 gap-3">
          <RatingProgression loading={loading} cfRatingHistory={cfRatingHistory} lcRatingHistory={lcRatingHistory} />
          <TopTopics loading={loading} topics={topics} />
        </div>

        {/* Row 5: Contests + Upsolve */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <RecentContests loading={loading} contests={contests} />
          <UpsolveQueue loading={loading} problems={upsolveProblems} />
        </div>

        {/* Row 6: Skill Mastery (full width) */}
        <SkillGaps loading={loading} skills={skills} />

        {/* Row 7: Achievements */}
        <Achievements loading={loading} achievements={achievements} />
      </div>
    </div>
  );
}