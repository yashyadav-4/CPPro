import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { RefreshCw, Link as LinkIcon, AlertTriangle, Shield, Share2, ExternalLink, Zap, Check } from 'lucide-react';

import { useDashboardData } from '../../hooks/useDashboardData';
import { mergeLast7Days, mergeHeatmaps, mergeTopics, mergeContests } from '../../utils/dashboardHelpers';
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
import GFGQuickStats from './GFGQuickStats';
import GFGStatCards from './GFGStatCards';
import GFGInstitutionalCard from './GFGInstitutionalCard';
import GFGProblemsOverview from './GFGProblemsOverview';
import GFGProblemsBreakdown from './GFGProblemsBreakdown';
import ShareModal from '../Shareable/ShareModal';
import DailyWidget from './DailyWidget';

const REFRESH_STATE_KEY_PREFIX = 'dashboard_refresh_state_';
const ADMIN_COOLDOWN_SECONDS = 10;
const USER_COOLDOWN_SECONDS = 15 * 60;



export default function Dashboard() {
  const navigate = useNavigate();
  const { cfData, lcData, ccData, gfgData, userId, userRole, userName, userUsername, linkedAccounts, lcSessionStatus, hardSyncTimestamps, loading, error, refetch } = useDashboardData();

  const [refreshing, setRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [view, setView] = useState('all'); // 'all' | 'cf' | 'lc'
  const [ccSyncError, setCcSyncError] = useState(null);

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

  // ── Sync popover state ──────────────────────────────────────────────────────
  const [showSyncPopover, setShowSyncPopover] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState(new Set());
  const popoverRef = useRef(null);

  // Close popover on outside click
  useEffect(() => {
    if (!showSyncPopover) return;
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowSyncPopover(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSyncPopover]);

  const openSyncPopover = useCallback(() => {
    if (cooldown > 0 || refreshing) return;
    // Open with nothing selected — user explicitly picks what they practiced
    setSelectedPlatforms(new Set());
    setShowSyncPopover(true);
  }, [cooldown, refreshing]);

  const togglePlatform = useCallback((key) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const handleRefresh = useCallback(async (platformsToSync) => {
    if (cooldown > 0 || !userId || !platformsToSync || platformsToSync.size === 0) return;
    setShowSyncPopover(false);
    setRefreshing(true);
    setCcSyncError(null);

    try {
      const config = { withCredentials: true };
      const tagged = [];
      if (platformsToSync.has('cf')  && linkedAccounts.codeforces)    tagged.push({ platform: 'cf',  promise: axios.post('/api/sync/refresh',     {}, config) });
      if (platformsToSync.has('lc')  && linkedAccounts.leetcode)      tagged.push({ platform: 'lc',  promise: axios.post('/api/sync/refresh-lc',  {}, config) });
      if (platformsToSync.has('cc')  && linkedAccounts.codechef)      tagged.push({ platform: 'cc',  promise: axios.post('/api/sync/refresh-cc',  {}, config) });
      if (platformsToSync.has('gfg') && linkedAccounts.geeksforgeeks) tagged.push({ platform: 'gfg', promise: axios.post('/api/sync/refresh-gfg', {}, config) });

      if (tagged.length === 0) { setRefreshing(false); return; }

      const results = await Promise.allSettled(tagged.map(t => t.promise));

      // Surface CC-specific failures so the user knows their data may be stale.
      const ccIdx = tagged.findIndex(t => t.platform === 'cc');
      if (ccIdx !== -1 && results[ccIdx].status === 'rejected') {
        const errMsg = results[ccIdx].reason?.response?.data?.message || results[ccIdx].reason?.message || 'sync failed';
        setCcSyncError(errMsg);
      }

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
  if (!loading && !linkedAccounts.codeforces && !linkedAccounts.leetcode && !linkedAccounts.codechef && !linkedAccounts.geeksforgeeks && !error) {
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
            onClick={() => navigate('/verification')}
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
  const cf  = cfData  || {};
  const lc  = lcData  || {};
  const cc  = ccData  || {};
  const gfg = gfgData || {};

  // Reset view if the selected platform gets unlinked
  const effectiveView = (view === 'cf'  && !linkedAccounts.codeforces)
    ? 'all'
    : (view === 'lc' && !linkedAccounts.leetcode)
      ? 'all'
      : (view === 'cc' && !linkedAccounts.codechef)
        ? 'all'
        : (view === 'gfg' && !linkedAccounts.geeksforgeeks)
          ? 'all'
          : view;

  // StatCards - computed early where possible
  const totalSolved = (cf.cfSolved ?? 0) + (lc.lcSolved ?? 0) + (cc.totalSolved ?? 0) + (gfg.totalSolved ?? 0);
  const totalSubmissions = (cf.cfTotalSubmissions ?? 0) + (lc.lcTotalSubmissions ?? 0) + (cc.totalSubmissions ?? 0) + (gfg.totalSolved ?? 0);
  const solvedThisMonth = (cf.cfSolvedThisMonth ?? 0) + (lc.lcSolvedThisMonth ?? 0) + (cc.ccSolvedThisMonth ?? 0) + (gfg.solvedThisMonth ?? 0);
  const solvedLastMonth = (cf.cfSolvedLastMonth ?? 0) + (lc.lcSolvedLastMonth ?? 0) + (cc.ccSolvedLastMonth ?? 0);

  // Heatmap (merge CF + LC + CC + GFG, or platform-specific)
  const heatmapData = effectiveView === 'cf'
    ? mergeHeatmaps(cf.cfHeatmap, [], [], [])
    : effectiveView === 'lc'
      ? mergeHeatmaps([], lc.lcCalendarParsed, [], [])
      : effectiveView === 'cc'
        ? mergeHeatmaps([], [], cc.ccHeatmap, [])
        : effectiveView === 'gfg'
          ? mergeHeatmaps([], [], [], gfg.heatmap)
          : mergeHeatmaps(cf.cfHeatmap, lc.lcCalendarParsed, cc.ccHeatmap, gfg.heatmap);

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
  const gfgBS = gfg.bestStreak ?? 0;

  const currentStreak = effectiveView === 'cf'
    ? (cf.cfCurrentStreak ?? 0)
    : effectiveView === 'lc'
      ? (lc.currentStreak ?? 0)
      : effectiveView === 'cc'
        ? (cc.currentStreak ?? 0)
        : effectiveView === 'gfg'
          ? (gfg.currentStreak ?? 0)
          : Math.max(lc.currentStreak ?? 0, cf.cfCurrentStreak ?? 0, cc.currentStreak ?? 0, gfg.currentStreak ?? 0);

  const bestStreak = effectiveView === 'cf'
    ? cfBS
    : effectiveView === 'lc'
      ? lcBS
      : effectiveView === 'cc'
        ? ccBS
        : effectiveView === 'gfg'
          ? gfgBS
          : Math.max(lcBS, cfBS, ccBS, gfgBS);

  const maxBS = Math.max(ccBS, lcBS, cfBS, gfgBS);
  const bestStreakPlatform = effectiveView === 'cf' ? 'codeforces'
    : effectiveView === 'lc' ? 'leetcode'
    : effectiveView === 'cc' ? 'codechef'
    : effectiveView === 'gfg' ? 'geeksforgeeks'
    : (maxBS === gfgBS && gfgBS > 0) ? 'geeksforgeeks'
    : (maxBS === ccBS) ? 'codechef'
    : (lc.bestStreakPlatform ?? 'codeforces');

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
    cfHandle:  cf.cfHandle  || null,
    cfRating:  cf.cfRating  || null,
    cfMaxRating: cf.cfMaxRating || null,
    cfRank:    cf.cfRank    || null,
    lcHandle:  lc.lcHandle  || null,
    lcRating:  lc.lcRating  || null,
    lcMaxRating: lc.lcMaxRating || null,
    lcRank:    lc.lcRank    || null,
    ccHandle:  cc.ccHandle  || null,
    ccRating:  cc.currentRating || null,
    ccMaxRating: cc.maxRating || null,
    ccRank:    cc.currentRank || null,
    gfgHandle:       gfg.gfgHandle       || null,
    gfgCodingScore:  gfg.codingScore     ?? null,
    gfgMonthlyScore: gfg.monthlyScore    ?? null,
    gfgInstituteRank: gfg.instituteRank  ?? null,
    gfgInstitution:  gfg.institution     || null,
  };

  // Difficulty breakdown
  const cfBands  = cf.cfDiffBands || [];
  const lcBands  = [
    { label: 'Easy',   count: lc.lcEasy   ?? 0 },
    { label: 'Medium', count: lc.lcMedium ?? 0 },
    { label: 'Hard',   count: lc.lcHard   ?? 0 },
  ];
  const gfgBands = [
    { label: 'School', count: gfg.solvedByDifficulty?.school ?? 0 },
    { label: 'Basic',  count: gfg.solvedByDifficulty?.basic  ?? 0 },
    { label: 'Easy',   count: gfg.solvedByDifficulty?.easy   ?? 0 },
    { label: 'Medium', count: gfg.solvedByDifficulty?.medium ?? 0 },
    { label: 'Hard',   count: gfg.solvedByDifficulty?.hard   ?? 0 },
  ];

  // Last 7 days (merge CF + LC + CC + GFG)
  const last7DaysDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const gfgHeatmapSet = new Set((gfg.heatmap || []).map(h => h.date));
  const gfgLast7Days = last7DaysDates.map(date => ({
    date,
    solved: gfgHeatmapSet.has(date),
  }));

  const last7Days = effectiveView === 'cc'
    ? (cc.ccLast7Days || [])
    : effectiveView === 'gfg'
      ? gfgLast7Days
      : mergeLast7Days(
          effectiveView === 'lc' ? [] : cf.cfLast7Days,
          effectiveView === 'cf' ? [] : lc.lcLast7Days,
          effectiveView === 'cf' || effectiveView === 'lc' ? [] : cc.ccLast7Days,
          effectiveView === 'cf' || effectiveView === 'lc' || effectiveView === 'cc' ? [] : gfgLast7Days
        );

  const gfgLanguages = Object.entries(gfg.languageDistribution || {})
    .map(([lang, count]) => ({ lang, count }))
    .sort((a, b) => b.count - a.count);

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
    <div className="bg-[#ffffff] dark:bg-[#0a0a0a] px-4 sm:px-6 py-6 min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-3">
        {/* CC sync error banner */}
        {ccSyncError && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle size={13} />
              <span><span className="font-medium">CodeChef sync failed</span> — data may be stale. ({ccSyncError})</span>
            </div>
            <button onClick={() => setCcSyncError(null)} className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 text-lg leading-none">×</button>
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
          {/* Title + subtitle */}
          <div>
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">Dashboard</h1>
            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-normal">
                {effectiveView === 'cf' ? 'Codeforces'
                  : effectiveView === 'lc' ? 'LeetCode'
                  : effectiveView === 'cc' ? 'CodeChef'
                  : effectiveView === 'gfg' ? 'GeeksforGeeks'
                  : [
                      linkedAccounts.codeforces    && 'Codeforces',
                      linkedAccounts.leetcode      && 'LeetCode',
                      linkedAccounts.codechef      && 'CodeChef',
                      linkedAccounts.geeksforgeeks && 'GFG',
                    ].filter(Boolean).join(' + ') || 'Dashboard'}
              </p>
              {userUsername && (
                <Link
                  to={`/user/${userUsername}`}
                  className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors font-medium"
                >
                  View Public Profile <ExternalLink size={10} />
                </Link>
              )}
            </div>
          </div>

          {/* Right side: filter tabs + action buttons — wrap on mobile */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Platform Filter Tabs — show when 2+ platforms are linked */}
            {[linkedAccounts.codeforces, linkedAccounts.leetcode, linkedAccounts.codechef, linkedAccounts.geeksforgeeks].filter(Boolean).length >= 2 && (
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/[0.04] rounded-lg p-1 border border-black/[0.05] dark:border-white/[0.06]">
                {[
                  { key: 'all', label: 'All' },
                  linkedAccounts.codeforces && { key: 'cf', label: 'CF' },
                  linkedAccounts.leetcode && { key: 'lc', label: 'LC' },
                  linkedAccounts.codechef && { key: 'cc', label: 'CC' },
                  linkedAccounts.geeksforgeeks && { key: 'gfg', label: 'GFG' },
                ].filter(Boolean).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setView(tab.key)}
                    className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
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

            <button
              onClick={() => setShareOpen(true)}
              disabled={loading || (!linkedAccounts.codeforces && !linkedAccounts.leetcode && !linkedAccounts.codechef)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] border border-black/[0.05] dark:border-white/[0.08] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2 size={12} />
              Share
            </button>
            {/* Refresh — opens inline platform-picker popover */}
            <div className="relative" ref={popoverRef}>
              <button
                onClick={refreshing || cooldown > 0 ? undefined : openSyncPopover}
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

              {/* Inline sync popover — horizontal */}
              {showSyncPopover && (
                <div className="absolute right-0 top-full mt-1.5 z-50 rounded-xl border border-black/[0.08] dark:border-white/[0.09] bg-white dark:bg-[#111111] shadow-lg dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.04] p-2.5 min-w-max">
                  <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 px-0.5">Select platforms to sync</p>

                  {/* Platform toggle pills — horizontal row */}
                  <div className="flex items-center gap-1.5 mb-2.5">
                    {[
                      linkedAccounts.codeforces && {
                        key: 'cf', label: 'Codeforces',
                        selectedLight: 'border-[#1F8ACB] bg-blue-50/80 text-blue-700 font-semibold shadow-sm',
                        selectedDark:  'dark:border-[#1F8ACB]/60 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-1 dark:ring-[#1F8ACB]/30',
                        icon: (
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="currentColor">
                            <path d="M4.5 7.5A1.5 1.5 0 0 1 6 6h3a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 9 18H6a1.5 1.5 0 0 1-1.5-1.5v-9zM13.5 3A1.5 1.5 0 0 1 15 1.5h3A1.5 1.5 0 0 1 19.5 3v13.5A1.5 1.5 0 0 1 18 18h-3a1.5 1.5 0 0 1-1.5-1.5V3z"/>
                          </svg>
                        ),
                      },
                      linkedAccounts.leetcode && {
                        key: 'lc', label: 'LeetCode',
                        selectedLight: 'border-[#FFA116] bg-amber-50/80 text-amber-700 font-semibold shadow-sm',
                        selectedDark:  'dark:border-[#FFA116]/60 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-1 dark:ring-[#FFA116]/30',
                        icon: (
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="currentColor">
                            <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
                          </svg>
                        ),
                      },
                      linkedAccounts.codechef && {
                        key: 'cc', label: 'CodeChef',
                        selectedLight: 'border-[#8B5A2B] bg-orange-50/80 text-orange-800 font-semibold shadow-sm',
                        selectedDark:  'dark:border-[#D97706]/60 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-1 dark:ring-[#D97706]/30',
                        icon: (
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="currentColor">
                            <path d="M11.007 0C4.926.01-.01 4.957 0 11.038c.01 6.121 4.977 11.058 11.097 11.04 6.082-.017 11.005-4.993 10.985-11.073C22.062 4.923 17.088-.008 11.007 0zm1.933 17.246c-.372.152-.757.267-1.148.345-.396.078-.795.116-1.194.114a5.73 5.73 0 0 1-1.845-.293 4.38 4.38 0 0 1-1.527-.894 4.2 4.2 0 0 1-1.032-1.458c-.253-.577-.38-1.226-.38-1.946 0-.806.148-1.51.444-2.11a4.17 4.17 0 0 1 1.197-1.49 5.146 5.146 0 0 1 1.73-.882 7.088 7.088 0 0 1 2.008-.288c.336 0 .679.022 1.024.067.35.044.686.115 1.007.213.317.096.617.22.898.37.28.15.529.327.743.528l-.979 1.34a3.68 3.68 0 0 0-.979-.6 3.057 3.057 0 0 0-1.204-.229c-.358 0-.709.052-1.047.156a2.595 2.595 0 0 0-.898.47c-.26.21-.47.479-.627.802-.158.323-.237.706-.237 1.148 0 .43.074.807.221 1.133.148.326.35.599.604.817.255.218.552.383.891.496.34.113.703.17 1.09.17.454 0 .873-.08 1.255-.24.383-.16.73-.39 1.04-.69l.917 1.28a5.25 5.25 0 0 1-1.072.67z"/>
                          </svg>
                        ),
                      },
                      linkedAccounts.geeksforgeeks && {
                        key: 'gfg', label: 'GFG',
                        selectedLight: 'border-[#2F8D46] bg-green-50/80 text-green-800 font-semibold shadow-sm',
                        selectedDark:  'dark:border-[#4ade80]/60 dark:bg-green-500/15 dark:text-green-300 dark:ring-1 dark:ring-[#4ade80]/30',
                        icon: (
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="currentColor">
                            <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm5.8 12.3c-.2.4-.6.8-1 1.1a4 4 0 0 1-2.8.9 4 4 0 0 1-2-.5 3.7 3.7 0 0 1-2 .5 4 4 0 0 1-2.8-.9c-.4-.3-.8-.7-1-1.1H4.5a5.5 5.5 0 0 0 1.6 2.5 6.1 6.1 0 0 0 3.9 1.3 6 6 0 0 0 2.8-.7 6 6 0 0 0 2.8.7 6.1 6.1 0 0 0 3.9-1.3 5.5 5.5 0 0 0 1.6-2.5H17.8z"/>
                          </svg>
                        ),
                      },
                    ].filter(Boolean).map(({ key, label, selectedLight, selectedDark, icon }) => {
                      const isSelected = selectedPlatforms.has(key);
                      return (
                        <button
                          key={key}
                          onClick={() => togglePlatform(key)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all duration-100 ${
                            isSelected
                              ? `${selectedLight} ${selectedDark}`
                              : 'border-black/[0.08] dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.02] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.04]'
                          }`}
                        >
                          {icon}
                          <span>{label}</span>
                          {isSelected && <Check size={10} className="shrink-0 opacity-80" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Sync action */}
                  <button
                    onClick={() => handleRefresh(selectedPlatforms)}
                    disabled={selectedPlatforms.size === 0}
                    className="w-full py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {selectedPlatforms.size === 0 ? 'Select a platform' : ` Sync (${selectedPlatforms.size})`}
                  </button>
                </div>
              )}
            </div>
            {/* Hard Refresh hint */}
            {(() => {
              if (cooldown > 0 || refreshing) return null;
              const THIRTY_DAYS = userRole === 'admin' ? 30 * 1000 : 30 * 24 * 60 * 60 * 1000;
              const checks = [
                linkedAccounts.codeforces && (!hardSyncTimestamps?.cf || (Date.now() - new Date(hardSyncTimestamps.cf).getTime() >= THIRTY_DAYS)),
                linkedAccounts.leetcode && (!hardSyncTimestamps?.lc || (Date.now() - new Date(hardSyncTimestamps.lc).getTime() >= THIRTY_DAYS)),
                linkedAccounts.codechef && (!hardSyncTimestamps?.cc || (Date.now() - new Date(hardSyncTimestamps.cc).getTime() >= THIRTY_DAYS)),
              ];
              const hasHardRefresh = checks.some(Boolean);
              if (!hasHardRefresh) return null;
              return (
                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                >
                  <Zap size={10} /> Deep Sync Available
                </button>
              );
            })()}
          </div>
        </div>

        {/* Row 1: Stat Cards */}
        {effectiveView === 'gfg' ? (
          <ErrorBoundary>
            <GFGStatCards
              loading={loading}
              totalSolved={gfg.totalSolved}
              codingScore={gfg.codingScore}
              monthlyScore={gfg.monthlyScore}
              instituteRank={gfg.instituteRank}
              institution={gfg.institution}
            />
          </ErrorBoundary>
        ) : (
          <ErrorBoundary>
            <StatCards
              loading={loading}
              totalSolved={
                effectiveView === 'cf' ? (cf.cfSolved ?? 0)
                : effectiveView === 'lc' ? (lc.lcSolved ?? 0)
                : effectiveView === 'cc' ? (cc.totalSolved ?? 0)
                : totalSolved
              }
              cfSolved={effectiveView === 'all' || effectiveView === 'cf' ? (cf.cfSolved ?? 0) : 0}
              lcSolved={effectiveView === 'all' || effectiveView === 'lc' ? (lc.lcSolved ?? 0) : 0}
              ccSolved={effectiveView === 'all' || effectiveView === 'cc' ? (cc.totalSolved ?? 0) : 0}
              gfgSolved={effectiveView === 'all' || effectiveView === 'gfg' ? (gfg.totalSolved ?? 0) : 0}
              activeDays={activeDays}
              totalSubmissions={
                effectiveView === 'cf' ? (cf.cfTotalSubmissions ?? 0)
                : effectiveView === 'lc' ? (lc.lcTotalSubmissions ?? 0)
                : effectiveView === 'cc' ? (cc.totalSubmissions ?? 0)
                : totalSubmissions
              }
              cfTotalSubmissions={effectiveView === 'all' || effectiveView === 'cf' ? (cf.cfTotalSubmissions ?? 0) : 0}
              lcTotalSubmissions={effectiveView === 'all' || effectiveView === 'lc' ? (lc.lcTotalSubmissions ?? 0) : 0}
              ccTotalSubmissions={effectiveView === 'all' || effectiveView === 'cc' ? (cc.totalSubmissions ?? 0) : 0}
              gfgTotalSubmissions={effectiveView === 'all' || effectiveView === 'gfg' ? (gfg.totalSolved ?? 0) : 0}
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
              cfSolvedThisMonth={effectiveView === 'all' || effectiveView === 'cf' ? (cf.cfSolvedThisMonth ?? 0) : 0}
              lcSolvedThisMonth={effectiveView === 'all' || effectiveView === 'lc' ? (lc.lcSolvedThisMonth ?? 0) : 0}
              ccSolvedThisMonth={effectiveView === 'all' || effectiveView === 'cc' ? (cc.ccSolvedThisMonth ?? 0) : 0}
              gfgSolvedThisMonth={effectiveView === 'all' || effectiveView === 'gfg' ? (gfg.solvedThisMonth ?? 0) : 0}
              activeDaysThisMonth={activeDaysThisMonth}
            />
          </ErrorBoundary>
        )}

        {/* Row 2: Platform info trio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ErrorBoundary>
            <PlatformProfiles
              loading={loading}
              cfHandle={effectiveView === 'lc' || effectiveView === 'cc' || effectiveView === 'gfg' ? null : profileProps.cfHandle}
              cfRating={effectiveView === 'lc' || effectiveView === 'cc' || effectiveView === 'gfg' ? null : profileProps.cfRating}
              cfMaxRating={effectiveView === 'lc' || effectiveView === 'cc' || effectiveView === 'gfg' ? null : profileProps.cfMaxRating}
              cfRank={effectiveView === 'lc' || effectiveView === 'cc' || effectiveView === 'gfg' ? null : profileProps.cfRank}
              lcHandle={effectiveView === 'cf' || effectiveView === 'cc' || effectiveView === 'gfg' ? null : profileProps.lcHandle}
              lcRating={effectiveView === 'cf' || effectiveView === 'cc' || effectiveView === 'gfg' ? null : profileProps.lcRating}
              lcMaxRating={effectiveView === 'cf' || effectiveView === 'cc' || effectiveView === 'gfg' ? null : profileProps.lcMaxRating}
              lcRank={effectiveView === 'cf' || effectiveView === 'cc' || effectiveView === 'gfg' ? null : profileProps.lcRank}
              ccHandle={effectiveView === 'cf' || effectiveView === 'lc' || effectiveView === 'gfg' ? null : profileProps.ccHandle}
              ccRating={effectiveView === 'cf' || effectiveView === 'lc' || effectiveView === 'gfg' ? null : profileProps.ccRating}
              ccMaxRating={effectiveView === 'cf' || effectiveView === 'lc' || effectiveView === 'gfg' ? null : profileProps.ccMaxRating}
              ccRank={effectiveView === 'cf' || effectiveView === 'lc' || effectiveView === 'gfg' ? null : profileProps.ccRank}
              gfgHandle={effectiveView === 'cf' || effectiveView === 'lc' || effectiveView === 'cc' ? null : profileProps.gfgHandle}
              gfgCodingScore={effectiveView === 'cf' || effectiveView === 'lc' || effectiveView === 'cc' ? null : profileProps.gfgCodingScore}
              gfgMonthlyScore={effectiveView === 'cf' || effectiveView === 'lc' || effectiveView === 'cc' ? null : profileProps.gfgMonthlyScore}
              gfgInstituteRank={effectiveView === 'cf' || effectiveView === 'lc' || effectiveView === 'cc' ? null : profileProps.gfgInstituteRank}
              gfgInstitution={effectiveView === 'cf' || effectiveView === 'lc' || effectiveView === 'cc' ? null : profileProps.gfgInstitution}
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
                lastSyncedAt={cc.lastSyncedAt}
              />
            ) : effectiveView === 'gfg' ? (
              <GFGProblemsOverview
                loading={loading}
                solvedByDifficulty={gfg.solvedByDifficulty}
                totalSolved={gfg.totalSolved}
              />
            ) : (
              <DifficultyBreakdown
                loading={loading}
                cfBands={effectiveView === 'lc' ? [] : cfBands}
                lcBands={effectiveView === 'cf' ? [] : lcBands}
                gfgBands={gfgBands}
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

        {/* Row 3: Daily widget + Activity heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-3">
          <ErrorBoundary>
            <DailyWidget loading={loading} />
          </ErrorBoundary>
          <ErrorBoundary>
            <ActivityHeatmap loading={loading} heatmapData={heatmapData} />
          </ErrorBoundary>
        </div>

        {/* Row 4: Rating + Total Contests (only for views with contest history) */}
        {effectiveView !== 'gfg' && (
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
        )}

        {/* Row 5: Recent Contests + (CC: language chart | others: top topics) */}
        {effectiveView !== 'gfg' && (
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
        )}

        {/* Row 6: Recent Submissions / Problems Breakdown + contextual right panel */}
        {effectiveView === 'gfg' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <ErrorBoundary>
              <GFGProblemsBreakdown
                loading={loading}
                problems={gfg.problems || gfg.recentSubmissions || []}
                totalSolved={gfg.totalSolved}
              />
            </ErrorBoundary>
            <div className="space-y-3 flex flex-col">
              <ErrorBoundary>
                <GFGInstitutionalCard
                  loading={loading}
                  institution={gfg.institution}
                  instituteRank={gfg.instituteRank}
                  codingScore={gfg.codingScore}
                  monthlyScore={gfg.monthlyScore}
                  handle={gfg.gfgHandle}
                />
              </ErrorBoundary>
              <ErrorBoundary>
                <CCLanguageChart loading={loading} languages={gfgLanguages} />
              </ErrorBoundary>
              <ErrorBoundary>
                <GFGQuickStats
                  loading={loading}
                  codingScore={gfg.codingScore}
                  monthlyScore={gfg.monthlyScore}
                  totalSolved={gfg.totalSolved}
                  instituteRank={gfg.instituteRank}
                  institution={gfg.institution}
                  lastSyncedAt={gfg.lastSyncedAt}
                />
              </ErrorBoundary>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <ErrorBoundary>
              <RecentSubmissions
                loading={loading}
                cfSubmissions={effectiveView === 'lc' || effectiveView === 'cc' ? [] : cf.recentCfSubmissions}
                lcSubmissions={effectiveView === 'cf' || effectiveView === 'cc' ? [] : lc.recentSubmissions}
                ccSubmissions={effectiveView === 'cf' || effectiveView === 'lc' ? [] : cc.recentCcAcSubmissions}
                gfgSubmissions={effectiveView === 'cf' || effectiveView === 'lc' || effectiveView === 'cc' ? [] : gfg.recentSubmissions}
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
        )}

        {/* Row 7: Achievements */}
        {(effectiveView === 'all' || effectiveView === 'lc') && (
          <ErrorBoundary>
            <Achievements loading={loading} achievements={achievements} lcLinked={!!linkedAccounts.leetcode} lcSessionStatus={lcSessionStatus} />
          </ErrorBoundary>
        )}
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