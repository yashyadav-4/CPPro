import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RefreshCw, Link as LinkIcon, AlertTriangle, Shield, Share2 } from 'lucide-react';

import { useDashboardData } from '../../hooks/useDashboardData';
import ErrorBoundary from '../common/ErrorBoundary';

import StatCards from './StatCards';
import PlatformProfiles from './PlatformProfiles';
import DifficultyBreakdown from './DifficultyBreakdown';
import WeekStreak from './WeekStreak';
import ActivityHeatmap from './ActivityHeatmap';
import RatingProgression from './RatingProgression';
import TopTopics from './TopTopics';
import RecentContests from './RecentContests';
import TotalContests from './TotalContests';
import SkillGaps from './SkillGaps';
import Achievements from './Achievements';
import RecentSubmissions from './RecentSubmissions';
import LCSkillBreakdown from './LCSkillBreakdown';
import CFRatingDistribution from './CFRatingDistribution';
import CCQuickStats from './CCQuickStats';
import CCLanguageChart from './CCLanguageChart';
import CCVerdictBreakdown from './CCVerdictBreakdown';
import ShareModal from '../Shareable/ShareModal';

const REFRESH_STATE_KEY_PREFIX = 'dashboard_refresh_state_';
const ADMIN_COOLDOWN_SECONDS = 10;
const USER_COOLDOWN_SECONDS = 15 * 60;

// ── Merge day arrays into combined last-7-days ────────────────────────────────
function mergeLast7Days(cfDays, lcDays, ccDays) {
  const result = [];
  const len = Math.max(cfDays?.length || 0, lcDays?.length || 0, ccDays?.length || 0, 7);
  for (let i = 0; i < len; i++) {
    const cfDay = cfDays?.[i] || { date: '', solved: false };
    const lcDay = lcDays?.[i] || { date: '', solved: false };
    const ccDay = ccDays?.[i] || { date: '', solved: false };
    result.push({
      date: cfDay.date || lcDay.date || ccDay.date,
      solved: cfDay.solved || lcDay.solved || ccDay.solved,
    });
  }
  return result;
}

// ── Merge heatmap arrays (CF + LC + CC calendar) ─────────────────────────────
function mergeHeatmaps(cfHeatmap, lcCalendar, ccHeatmap) {
  const map = {};
  (cfHeatmap || []).forEach(d => { map[d.date] = (map[d.date] || 0) + d.count; });
  (lcCalendar || []).forEach(d => { map[d.date] = (map[d.date] || 0) + d.count; });
  (ccHeatmap || []).forEach(d => { map[d.date] = (map[d.date] || 0) + d.count; });
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

function mergeContests(cfContests, lcContests, ccContests) {
  return [...(cfContests || []), ...(lcContests || []), ...(ccContests || [])]
    .filter(c => c.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { cfData, lcData, ccData, userId, userRole, userName, userUsername, linkedAccounts, loading, error, refetch } = useDashboardData();

  const [refreshing, setRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [view, setView] = useState('all'); // 'all' | 'cf' | 'lc'

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
    let cooldownLeft = parsed.cooldownUntil ? Math.max(0, Math.ceil((parsed.cooldownUntil - nowTs) / 1000)) : 0;

    if (cooldownLeft > 0) {
      // If user is admin, cap the cooldown (useful  if they were just promoted)
      if (userRole === 'admin' && cooldownLeft > ADMIN_COOLDOWN_SECONDS) {
          cooldownLeft = ADMIN_COOLDOWN_SECONDS;
      }
      setCooldown(cooldownLeft);
    }

    // If the page was reloaded mid-refresh, clear any stale refreshing state.
    if (parsed.refreshingUntil) {
      clearRefreshState();
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

    try {
      const config = { withCredentials: true };
      const promises = [];
      if (linkedAccounts.codeforces) promises.push(axios.post('/api/sync/refresh', {}, config));
      if (linkedAccounts.leetcode) promises.push(axios.post('/api/sync/refresh-lc', {}, config));
      if (linkedAccounts.codechef) promises.push(axios.post('/api/sync/refresh-cc', {}, config));
      const results = await Promise.allSettled(promises);

      // Always refetch — background syncs (e.g. from account relink) may have updated
      // MongoDB even if the cooldown gate returned 'fresh'. The aggregate read is cheap.
      await refetch(true);
      setRefreshing(false);

      const fresh = results.find(r => r.status === 'fulfilled' && r.value.data?.freshness === 'fresh');
      const remainingSeconds = fresh?.value?.data?.remainingSeconds;
      applyCooldown(remainingSeconds || defaultCooldownSeconds);
    } catch (err) {
      console.error(err);
      setRefreshing(false);
      clearRefreshState();
    }
  }, [cooldown, userId, linkedAccounts, refetch, applyCooldown, defaultCooldownSeconds, clearRefreshState]);

  // ── Not linked ──────────────────────────────────────────────────────────────
  if (!loading && !linkedAccounts.codeforces && !linkedAccounts.leetcode && !linkedAccounts.codechef && !error) {
    return (
      <div className="min-h-screen bg-[#ffffff] dark:bg-[#0a0a0a] flex flex-col justify-center items-center p-6">
        <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] text-center rounded-xl p-8 max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
            <LinkIcon size={28} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Link Your Account</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 font-normal">Link at least one platform to view your dashboard.</p>
          <button
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
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
      <div className="min-h-screen bg-[#ffffff] dark:bg-[#0a0a0a] flex flex-col justify-center items-center p-6">
        <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] text-center rounded-xl p-8 max-w-md w-full">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 font-normal">{error}</p>
          <button
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
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
  const cc = ccData || {};

  // Reset view if the selected platform gets unlinked
  const effectiveView = (view === 'cf' && !linkedAccounts.codeforces)
    ? 'all'
    : (view === 'lc' && !linkedAccounts.leetcode)
      ? 'all'
      : (view === 'cc' && !linkedAccounts.codechef)
        ? 'all'
        : view;

  // StatCards - computed early where possible
  const totalSolved = (cf.cfSolved ?? 0) + (lc.lcSolved ?? 0) + (cc.totalSolved ?? 0);
  // Total Submissions: AC submissions across all platforms
  const totalSubmissions = (cf.cfAcSubmissions ?? cf.cfTotalSubmissions ?? 0) + (lc.lcAcSubmissions ?? lc.lcTotalSubmissions ?? 0) + (cc.ccAcSubmissions ?? 0);
  const solvedThisMonth = (cf.cfSolvedThisMonth ?? 0) + (lc.lcSolvedThisMonth ?? 0) + (cc.ccSolvedThisMonth ?? 0);
  const solvedLastMonth = (cf.cfSolvedLastMonth ?? 0) + (lc.lcSolvedLastMonth ?? 0) + (cc.ccSolvedLastMonth ?? 0);

  // Heatmap (merge CF + LC + CC, or platform-specific)
  const heatmapData = effectiveView === 'cf'
    ? mergeHeatmaps(cf.cfHeatmap, [], [])
    : effectiveView === 'lc'
      ? mergeHeatmaps([], lc.lcCalendarParsed, [])
      : effectiveView === 'cc'
        ? mergeHeatmaps([], [], cc.ccHeatmap)
        : mergeHeatmaps(cf.cfHeatmap, lc.lcCalendarParsed, cc.ccHeatmap);

  // Active Days (deduplicated across platforms from heatmap)
  const activeDays = heatmapData.length;
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const activeDaysThisMonth = heatmapData.filter(d => d.date.startsWith(monthStr)).length;
  const activeDaysLastMonth = heatmapData.filter(d => d.date.startsWith(lastMonthStr)).length;

  // Unified streak — max across all linked platforms
  const ccBS = cc.bestStreak ?? 0;
  const cfBS = cf.cfBestStreak ?? 0;
  const lcBS = lc.bestStreak ?? 0;
  const currentStreak = Math.max(lc.currentStreak ?? 0, cf.cfCurrentStreak ?? 0, cc.currentStreak ?? 0);
  const bestStreak = Math.max(lcBS, cfBS, ccBS);
  const bestStreakPlatform = ccBS > lcBS && ccBS > cfBS ? 'codechef' : (lc.bestStreakPlatform ?? 'codeforces');

  // Acceptance rate
  const cfAR = cf.cfAcceptanceRate ?? null;
  const lcAR = lc.lcAcceptanceRate ?? null;
  const ccAR = cc.ccAcceptanceRate ?? null;
  const acceptanceRate = (() => {
    const rates = [cfAR, lcAR, ccAR].filter(r => r !== null);
    if (rates.length === 0) return null;
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
  })();

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
    ccHandle: cc.ccHandle || null,
    ccRating: cc.currentRating || null,
    ccMaxRating: cc.maxRating || null,
    ccRank: cc.currentRank || null,
  };

  // Difficulty breakdown
  const cfBands = cf.cfDiffBands || [];
  const lcBands = [
    { label: 'Easy', count: lc.lcEasy ?? 0 },
    { label: 'Medium', count: lc.lcMedium ?? 0 },
    { label: 'Hard', count: lc.lcHard ?? 0 },
  ];

  // Last 7 days (merge CF + LC + CC)
  const last7Days = effectiveView === 'cc'
    ? (cc.ccLast7Days || [])
    : mergeLast7Days(
        effectiveView === 'lc' ? [] : cf.cfLast7Days,
        effectiveView === 'cf' ? [] : lc.lcLast7Days,
        effectiveView === 'cf' || effectiveView === 'lc' ? [] : cc.ccLast7Days
      );

  // Rating histories
  const cfRatingHistory = cf.cfRatingHistory || [];
  const lcRatingHistory = lc.lcRatingHistory || [];
  const ccRatingHistory = cc.ratingHistory || [];

  // Topics (merge, top 8, or platform-specific)
  const topics = effectiveView === 'cf'
    ? mergeTopics(cf.cfTopics, [])
    : effectiveView === 'lc'
      ? mergeTopics([], lc.lcTopics)
      : effectiveView === 'cc'
        ? []
        : mergeTopics(cf.cfTopics, lc.lcTopics);

  // Contests (merge, sort by date, top 15, or platform-specific)
  const contests = effectiveView === 'cf'
    ? mergeContests(cf.recentCfContests, [])
    : effectiveView === 'lc'
      ? mergeContests([], lc.recentLcContests)
      : effectiveView === 'cc'
        ? (cc.recentCcContests || [])
        : mergeContests(cf.recentCfContests, lc.recentLcContests, cc.recentCcContests);

  const cfContestCount = cfRatingHistory.length || 0;
  const lcContestCount = lc.lcContests || lcRatingHistory.length || 0;
  const ccContestCount = cc.contestsParticipated || ccRatingHistory.length || 0;

  const cfBestRank = cfRatingHistory.reduce((min, c) => {
    const r = parseInt(c.rank, 10);
    return (!isNaN(r) && r > 0 && r < min) ? r : min;
  }, Infinity);
  const finalCfBestRank = cfBestRank === Infinity ? null : cfBestRank;

  const lcBestRank = lcRatingHistory.reduce((min, c) => {
    const r = parseInt(c.rank, 10);
    return (!isNaN(r) && r > 0 && r < min) ? r : min;
  }, Infinity);
  const finalLcBestRank = lcBestRank === Infinity ? null : lcBestRank;

  const ccBestRankVal = ccRatingHistory.reduce((min, c) => {
    const r = parseInt(c.rank, 10);
    return (!isNaN(r) && r > 0 && r < min) ? r : min;
  }, Infinity);
  const finalCcBestRank = ccBestRankVal === Infinity ? null : ccBestRankVal;

  // Skill gaps
  const skills = cf.skillGaps || [];

  // Achievements (from LC endpoint which computed combined)
  const achievements = lc.achievements || [];

  return (
    <div className="bg-[#ffffff] dark:bg-[#0a0a0a] px-6 py-6 min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-normal">
              {[
                linkedAccounts.codeforces && 'Codeforces',
                linkedAccounts.leetcode && 'LeetCode',
                linkedAccounts.codechef && 'CodeChef',
              ].filter(Boolean).join(' + ') || 'Dashboard'}
            </p>
          </div>

          {/* Platform Filter Tabs — show when 2+ platforms are linked */}
          {[linkedAccounts.codeforces, linkedAccounts.leetcode, linkedAccounts.codechef].filter(Boolean).length >= 2 && (
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/[0.04] rounded-lg p-1 border border-black/[0.05] dark:border-white/[0.06]">
              {[
                { key: 'all', label: 'All' },
                linkedAccounts.codeforces && { key: 'cf', label: 'Codeforces' },
                linkedAccounts.leetcode && { key: 'lc', label: 'LeetCode' },
                linkedAccounts.codechef && { key: 'cc', label: 'CodeChef' },
              ].filter(Boolean).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setView(tab.key)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                    view === tab.key
                      ? 'bg-white dark:bg-white/[0.1] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShareOpen(true)}
              disabled={loading || (!linkedAccounts.codeforces && !linkedAccounts.leetcode && !linkedAccounts.codechef)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] border border-black/[0.05] dark:border-white/[0.08] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2 size={12} />
              Share
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing || cooldown > 0}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors ${
                refreshing
                    ? 'bg-emerald-400 cursor-not-allowed'
                  : cooldown > 0
                    ? 'bg-amber-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : cooldown > 0 ? `${formatCooldown(cooldown)}` : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Row 1: Stat Cards */}
        <ErrorBoundary>
          <StatCards
            loading={loading}
            totalSolved={
              effectiveView === 'cf' ? (cf.cfSolved ?? 0)
              : effectiveView === 'lc' ? (lc.lcSolved ?? 0)
              : effectiveView === 'cc' ? (cc.totalSolved ?? 0)
              : totalSolved
            }
            cfSolved={cf.cfSolved ?? 0}
            lcSolved={lc.lcSolved ?? 0}
            ccSolved={cc.totalSolved ?? 0}
            activeDays={activeDays}
            totalSubmissions={
              effectiveView === 'cf' ? (cf.cfAcSubmissions ?? cf.cfTotalSubmissions ?? 0)
              : effectiveView === 'lc' ? (lc.lcAcSubmissions ?? lc.lcTotalSubmissions ?? 0)
              : effectiveView === 'cc' ? (cc.ccAcSubmissions ?? 0)
              : totalSubmissions
            }
            cfAcSubmissions={cf.cfAcSubmissions ?? cf.cfTotalSubmissions ?? 0}
            lcAcSubmissions={lc.lcAcSubmissions ?? lc.lcTotalSubmissions ?? 0}
            ccAcSubmissions={cc.ccAcSubmissions ?? 0}
            currentStreak={currentStreak}
            bestStreak={bestStreak}
            acceptanceRate={effectiveView === 'cf' ? cfAR : effectiveView === 'lc' ? lcAR : effectiveView === 'cc' ? ccAR : acceptanceRate}
            cfAcceptanceRate={cfAR}
            lcAcceptanceRate={lcAR}
            ccAcceptanceRate={ccAR}
            solvedThisMonth={
              effectiveView === 'cf' ? (cf.cfSolvedThisMonth ?? 0)
              : effectiveView === 'lc' ? (lc.lcSolvedThisMonth ?? 0)
              : effectiveView === 'cc' ? (cc.ccSolvedThisMonth ?? 0)
              : solvedThisMonth
            }
            activeDaysThisMonth={activeDaysThisMonth}
          />
        </ErrorBoundary>

        {/* Row 2: Platform info trio */}
        <div className="grid grid-cols-3 gap-3">
          <ErrorBoundary>
            <PlatformProfiles
              loading={loading}
              cfHandle={effectiveView === 'lc' || effectiveView === 'cc' ? null : profileProps.cfHandle}
              cfRating={effectiveView === 'lc' || effectiveView === 'cc' ? null : profileProps.cfRating}
              cfMaxRating={effectiveView === 'lc' || effectiveView === 'cc' ? null : profileProps.cfMaxRating}
              cfRank={effectiveView === 'lc' || effectiveView === 'cc' ? null : profileProps.cfRank}
              lcHandle={effectiveView === 'cf' || effectiveView === 'cc' ? null : profileProps.lcHandle}
              lcRating={effectiveView === 'cf' || effectiveView === 'cc' ? null : profileProps.lcRating}
              lcMaxRating={effectiveView === 'cf' || effectiveView === 'cc' ? null : profileProps.lcMaxRating}
              lcRank={effectiveView === 'cf' || effectiveView === 'cc' ? null : profileProps.lcRank}
              ccHandle={effectiveView === 'cf' || effectiveView === 'lc' ? null : profileProps.ccHandle}
              ccRating={effectiveView === 'cf' || effectiveView === 'lc' ? null : profileProps.ccRating}
              ccMaxRating={effectiveView === 'cf' || effectiveView === 'lc' ? null : profileProps.ccMaxRating}
              ccRank={effectiveView === 'cf' || effectiveView === 'lc' ? null : profileProps.ccRank}
            />
          </ErrorBoundary>
          <ErrorBoundary>
            {effectiveView === 'cc' ? (
              <CCQuickStats
                loading={loading}
                globalRank={cc.globalRank}
                countryRank={cc.countryRank}
                totalSolved={cc.totalSolved}
                totalSubmissions={cc.totalSubmissions}
                ccAcceptanceRate={cc.ccAcceptanceRate}
                ccSolvedThisMonth={cc.ccSolvedThisMonth}
              />
            ) : (
              <DifficultyBreakdown
                loading={loading}
                cfBands={effectiveView === 'lc' ? [] : cfBands}
                lcBands={effectiveView === 'cf' ? [] : lcBands}
              />
            )}
          </ErrorBoundary>
          <ErrorBoundary>
            <WeekStreak
              loading={loading}
              currentStreak={currentStreak}
              bestStreak={bestStreak}
              bestStreakPlatform={bestStreakPlatform}
              last7Days={last7Days}
              activeDaysThisMonth={activeDaysThisMonth}
              activeDaysLastMonth={activeDaysLastMonth}
            />
          </ErrorBoundary>
        </div>

        {/* Row 3: Activity heatmap */}
        <ErrorBoundary>
          <ActivityHeatmap loading={loading} heatmapData={heatmapData} />
        </ErrorBoundary>

        {/* Row 4: Rating + Total Contests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ErrorBoundary>
            <RatingProgression
              loading={loading}
              cfRatingHistory={effectiveView === 'lc' || effectiveView === 'cc' ? [] : cfRatingHistory}
              lcRatingHistory={effectiveView === 'cf' || effectiveView === 'cc' ? [] : lcRatingHistory}
              ccRatingHistory={effectiveView === 'cf' || effectiveView === 'lc' ? [] : ccRatingHistory}
            />
          </ErrorBoundary>
          <ErrorBoundary>
            <TotalContests
              loading={loading}
              cfContests={effectiveView === 'lc' || effectiveView === 'cc' ? 0 : cfContestCount}
              lcContests={effectiveView === 'cf' || effectiveView === 'cc' ? 0 : lcContestCount}
              ccContests={effectiveView === 'cf' || effectiveView === 'lc' ? 0 : ccContestCount}
              cfBestRank={effectiveView === 'lc' || effectiveView === 'cc' ? null : finalCfBestRank}
              lcBestRank={effectiveView === 'cf' || effectiveView === 'cc' ? null : finalLcBestRank}
              ccBestRank={effectiveView === 'cf' || effectiveView === 'lc' ? null : finalCcBestRank}
            />
          </ErrorBoundary>
        </div>

        {/* Row 5: Recent Contests + (CC: language chart | others: top topics) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ErrorBoundary>
            <RecentContests loading={loading} contests={contests} />
          </ErrorBoundary>
          <ErrorBoundary>
            {effectiveView === 'cc' ? (
              <CCLanguageChart loading={loading} languages={cc.languageDistribution} />
            ) : (
              <TopTopics loading={loading} topics={topics} />
            )}
          </ErrorBoundary>
        </div>

        {/* Row 6: Recent Submissions + contextual right panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ErrorBoundary>
            <RecentSubmissions
              loading={loading}
              cfSubmissions={effectiveView === 'lc' || effectiveView === 'cc' ? [] : cf.recentCfSubmissions}
              lcSubmissions={effectiveView === 'cf' || effectiveView === 'cc' ? [] : lc.recentSubmissions}
              ccSubmissions={effectiveView === 'cf' || effectiveView === 'lc' ? [] : cc.recentCcAcSubmissions}
              view={effectiveView}
            />
          </ErrorBoundary>
          <ErrorBoundary>
            {effectiveView === 'lc' ? (
              <LCSkillBreakdown
                loading={loading}
                fundamental={lc.lcSkillFundamental}
                intermediate={lc.lcSkillIntermediate}
                advanced={lc.lcSkillAdvanced}
              />
            ) : effectiveView === 'cf' ? (
              <CFRatingDistribution loading={loading} cfDiffBands={cf.cfDiffBands} />
            ) : effectiveView === 'cc' ? (
              <CCVerdictBreakdown
                loading={loading}
                verdictBreakdown={cc.verdictBreakdown}
                totalSubmissions={cc.totalSubmissions}
              />
            ) : (
              <SkillGaps loading={loading} skills={skills} />
            )}
          </ErrorBoundary>
        </div>

        {/* Row 7: Achievements */}
        <ErrorBoundary>
          <Achievements loading={loading} achievements={achievements} />
        </ErrorBoundary>
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        loading={loading}
        cardProps={{
          cfHandle: cf.cfHandle || null,
          cfRating: cf.cfRating || 0,
          cfMaxRating: cf.cfMaxRating || 0,
          cfRank: cf.cfRank || null,
          lcHandle: lc.lcHandle || null,
          lcRating: lc.lcRating || 0,
          lcMaxRating: lc.lcMaxRating || 0,
          lcRank: lc.lcRank || null,
          cfSolved: cf.cfSolved ?? 0,
          lcSolved: lc.lcSolved ?? 0,
          ccHandle: cc.ccHandle || null,
          ccRating: cc.currentRating || 0,
          ccMaxRating: cc.maxRating || 0,
          ccRank: cc.currentRank || null,
          ccSolved: cc.totalSolved || 0,
          ccRatingHistory: (cc.ratingHistory || []).map(h => ({ date: h.date || '', rating: h.rating || 0 })),
          currentStreak,
          bestStreak,
          cfCurrentStreak: cf.cfCurrentStreak ?? 0,
          lcStreak: lc.lcStreak ?? 0,
          acceptanceRate,
          cfAcceptanceRate: cfAR,
          topics,
          lcEasy: lc.lcEasy ?? 0,
          lcMedium: lc.lcMedium ?? 0,
          lcHard: lc.lcHard ?? 0,
          cfRatingHistory,
          lcRatingHistory,
          userName,
          userUsername,
          activeDays,
          solvedThisMonth,
          cfSolvedThisMonth: cf.cfSolvedThisMonth ?? 0,
          lcSolvedThisMonth: lc.lcSolvedThisMonth ?? 0,
          contestsThisMonth: (cf.recentCfContests || []).filter(c => {
            const now = new Date();
            const ms = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
            return c.date?.startsWith(ms);
          }).length + (lc.recentLcContests || []).filter(c => {
            const now = new Date();
            const ms = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
            return c.date?.startsWith(ms);
          }).length,
        }}
      />
    </div>
  );
}