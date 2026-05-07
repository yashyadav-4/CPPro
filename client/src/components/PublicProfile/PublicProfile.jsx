import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Lock, UserX, MapPin, GraduationCap, ExternalLink, ArrowLeft,
  Trophy, Code2, ChefHat,
} from 'lucide-react';

import { mergeLast7Days, mergeHeatmaps, mergeTopics, mergeContests } from '../../utils/dashboardHelpers';
import ErrorBoundary from '../common/ErrorBoundary';

import StatCards from '../Dashboard/StatCards';
import PlatformProfiles from '../Dashboard/PlatformProfiles';
import DifficultyBreakdown from '../Dashboard/DifficultyBreakdown';
import WeekStreak from '../Dashboard/WeekStreak';
import ActivityHeatmap from '../Dashboard/ActivityHeatmap';
import RatingProgression from '../Dashboard/RatingProgression';
import TopTopics from '../Dashboard/TopTopics';
import RecentContests from '../Dashboard/RecentContests';
import TotalContests from '../Dashboard/TotalContests';
import SkillGaps from '../Dashboard/SkillGaps';
import Achievements from '../Dashboard/Achievements';
import RecentSubmissions from '../Dashboard/RecentSubmissions';
import LCSkillBreakdown from '../Dashboard/LCSkillBreakdown';
import CFRatingDistribution from '../Dashboard/CFRatingDistribution';
import CCQuickStats from '../Dashboard/CCQuickStats';
import CCLanguageChart from '../Dashboard/CCLanguageChart';
import CCVerdictBreakdown from '../Dashboard/CCVerdictBreakdown';

const config = { withCredentials: true };

// ── Profile Header ───────────────────────────────────────────────────────────
function ProfileHeader({ profile, cfData, lcData, ccData }) {
  const cf = cfData || {};
  const lc = lcData || {};
  const cc = ccData || {};

  const locationParts = [
    profile.location?.city,
    profile.location?.state,
    profile.location?.country,
  ].filter(Boolean);
  const locationStr = locationParts.join(', ');

  return (
    <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 mb-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {profile.profilePic ? (
            <img
              className="w-20 h-20 rounded-full object-cover ring-2 ring-emerald-500/30"
              src={profile.profilePic}
              alt={profile.name}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-3xl font-bold ring-2 ring-emerald-500/30">
              {(profile.name || profile.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">{profile.name}</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">@{profile.username}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            {profile.college && (
              <span className="flex items-center gap-1">
                <GraduationCap size={12} className="text-gray-400" />
                {profile.college}
              </span>
            )}
            {locationStr && (
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-gray-400" />
                {locationStr}
              </span>
            )}
          </div>
        </div>

        {/* Platform handles */}
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {profile.linkedAccounts?.codeforces && (
            <a
              href={`https://codeforces.com/profile/${profile.linkedAccounts.codeforces}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
            >
              <Code2 size={12} />
              {profile.linkedAccounts.codeforces}
              {cf.cfRating ? <span className="text-[10px] opacity-70">({cf.cfRating})</span> : null}
              <ExternalLink size={10} className="opacity-50" />
            </a>
          )}
          {profile.linkedAccounts?.leetcode && (
            <a
              href={`https://leetcode.com/u/${profile.linkedAccounts.leetcode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
            >
              <Trophy size={12} />
              {profile.linkedAccounts.leetcode}
              {lc.lcRating ? <span className="text-[10px] opacity-70">({lc.lcRating})</span> : null}
              <ExternalLink size={10} className="opacity-50" />
            </a>
          )}
          {profile.linkedAccounts?.codechef && (
            <a
              href={`https://www.codechef.com/users/${profile.linkedAccounts.codechef}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
            >
              <ChefHat size={12} />
              {profile.linkedAccounts.codechef}
              {cc.currentRating ? <span className="text-[10px] opacity-70">({cc.currentRating})</span> : null}
              <ExternalLink size={10} className="opacity-50" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="bg-[#ffffff] dark:bg-[#0a0a0a] px-6 py-6 min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-3">
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 bg-gray-100 dark:bg-white/5 rounded" />
              <div className="h-3 w-24 bg-gray-100 dark:bg-white/5 rounded" />
              <div className="h-3 w-56 bg-gray-100 dark:bg-white/5 rounded" />
            </div>
          </div>
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-40 bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/[0.06] rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// ── Error States ──────────────────────────────────────────────────────────────
function PrivateProfileScreen({ username }) {
  return (
    <div className="min-h-screen bg-[#ffffff] dark:bg-[#0a0a0a] flex flex-col justify-center items-center p-6">
      <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/[0.06] text-center rounded-2xl p-10 max-w-md w-full">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center mx-auto mb-5">
          <Lock size={28} className="text-gray-400 dark:text-gray-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Private Profile</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          <span className="font-medium text-gray-700 dark:text-gray-300">@{username}</span>'s profile is set to private.
        </p>
        <Link
          to="/leaderboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <ArrowLeft size={14} /> Back to Leaderboard
        </Link>
      </div>
    </div>
  );
}

function NotFoundScreen({ username }) {
  return (
    <div className="min-h-screen bg-[#ffffff] dark:bg-[#0a0a0a] flex flex-col justify-center items-center p-6">
      <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/[0.06] text-center rounded-2xl p-10 max-w-md w-full">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-5">
          <UserX size={28} className="text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">User Not Found</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          No user with username <span className="font-medium text-gray-700 dark:text-gray-300">@{username}</span> exists.
        </p>
        <Link
          to="/leaderboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <ArrowLeft size={14} /> Back to Leaderboard
        </Link>
      </div>
    </div>
  );
}

// ── No Linked Accounts ───────────────────────────────────────────────────────
function NoLinkedAccounts({ profile }) {
  return (
    <div className="bg-[#ffffff] dark:bg-[#0a0a0a] px-6 py-6 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <ProfileHeader profile={profile} />
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-10 text-center mt-3">
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            This user hasn't linked any competitive programming accounts yet.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [cfData, setCfData] = useState(null);
  const [lcData, setLcData] = useState(null);
  const [ccData, setCcData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | private | not_found | error
  const [dataLoading, setDataLoading] = useState(true);

  // Step 1: Fetch public profile
  useEffect(() => {
    setStatus('loading');
    setProfile(null);
    setCfData(null);
    setLcData(null);
    setCcData(null);

    axios.get(`/api/users/${encodeURIComponent(username)}/profile`, config)
      .then(res => {
        if (res.data?.success) {
          setProfile(res.data.data);
          setStatus('ready');
        } else {
          setStatus('error');
        }
      })
      .catch(err => {
        const errorCode = err.response?.data?.error;
        if (errorCode === 'PROFILE_PRIVATE') setStatus('private');
        else if (err.response?.status === 404 || errorCode === 'USER_NOT_FOUND') setStatus('not_found');
        else setStatus('error');
      });
  }, [username]);

  // Step 2: Fetch dashboard data once profile is resolved
  useEffect(() => {
    if (status !== 'ready' || !profile) return;

    const linked = {
      codeforces: !!profile.linkedAccounts?.codeforces,
      leetcode: !!profile.linkedAccounts?.leetcode,
      codechef: !!profile.linkedAccounts?.codechef,
    };

    if (!linked.codeforces && !linked.leetcode && !linked.codechef) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);

    const uid = profile.userId;
    const cfPromise = linked.codeforces
      ? axios.get(`/api/dashboard/aggregate/${uid}`, config)
      : Promise.resolve(null);
    const lcPromise = linked.leetcode
      ? axios.get(`/api/lc-dashboard/aggregate/${uid}`, config)
      : Promise.resolve(null);
    const ccPromise = linked.codechef
      ? axios.get(`/api/cc-dashboard/aggregate/${uid}`, config)
      : Promise.resolve(null);

    Promise.allSettled([cfPromise, lcPromise, ccPromise]).then(([cfRes, lcRes, ccRes]) => {
      setCfData(cfRes.status === 'fulfilled' && cfRes.value?.data?.data ? cfRes.value.data.data : null);
      setLcData(lcRes.status === 'fulfilled' && lcRes.value?.data?.data ? lcRes.value.data.data : null);
      setCcData(ccRes.status === 'fulfilled' && ccRes.value?.data?.data ? ccRes.value.data.data : null);
      setDataLoading(false);
    });
  }, [status, profile]);

  // ── Render gates ──
  if (status === 'loading') return <ProfileSkeleton />;
  if (status === 'private') return <PrivateProfileScreen username={username} />;
  if (status === 'not_found') return <NotFoundScreen username={username} />;
  if (status === 'error') return <NotFoundScreen username={username} />;

  const linked = {
    codeforces: !!profile.linkedAccounts?.codeforces,
    leetcode: !!profile.linkedAccounts?.leetcode,
    codechef: !!profile.linkedAccounts?.codechef,
  };

  if (!linked.codeforces && !linked.leetcode && !linked.codechef) {
    return <NoLinkedAccounts profile={profile} />;
  }

  // ── Derive combined props (same logic as Dashboard.jsx) ─────────────────
  const cf = cfData || {};
  const lc = lcData || {};
  const cc = ccData || {};
  const loading = dataLoading;

  const totalSolved = (cf.cfSolved ?? 0) + (lc.lcSolved ?? 0) + (cc.totalSolved ?? 0);
  const totalSubmissions = (cf.cfTotalSubmissions ?? 0) + (lc.lcTotalSubmissions ?? 0) + (cc.totalSubmissions ?? 0);
  const solvedThisMonth = (cf.cfSolvedThisMonth ?? 0) + (lc.lcSolvedThisMonth ?? 0) + (cc.ccSolvedThisMonth ?? 0);

  const heatmapData = mergeHeatmaps(cf.cfHeatmap, lc.lcCalendarParsed, cc.ccHeatmap);
  const activeDays = heatmapData.length;
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const activeDaysThisMonth = heatmapData.filter(d => d.date.startsWith(monthStr)).length;
  const activeDaysLastMonth = heatmapData.filter(d => d.date.startsWith(lastMonthStr)).length;

  const ccBS = cc.bestStreak ?? 0;
  const cfBS = cf.cfBestStreak ?? 0;
  const lcBS = lc.bestStreak ?? 0;
  const currentStreak = Math.max(lc.currentStreak ?? 0, cf.cfCurrentStreak ?? 0, cc.currentStreak ?? 0);
  const bestStreak = Math.max(lcBS, cfBS, ccBS);
  const bestStreakPlatform = ccBS > lcBS && ccBS > cfBS ? 'codechef' : (lc.bestStreakPlatform ?? 'codeforces');

  const cfAR = cf.cfAcceptanceRate ?? null;
  const lcAR = lc.lcAcceptanceRate ?? null;
  const ccAR = cc.ccAcceptanceRate ?? null;
  const acceptanceRate = (() => {
    const rates = [cfAR, lcAR, ccAR].filter(r => r !== null);
    if (rates.length === 0) return null;
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
  })();

  const profileProps = {
    cfHandle: cf.cfHandle || null, cfRating: cf.cfRating || null, cfMaxRating: cf.cfMaxRating || null, cfRank: cf.cfRank || null,
    lcHandle: lc.lcHandle || null, lcRating: lc.lcRating || null, lcMaxRating: lc.lcMaxRating || null, lcRank: lc.lcRank || null,
    ccHandle: cc.ccHandle || null, ccRating: cc.currentRating || null, ccMaxRating: cc.maxRating || null, ccRank: cc.currentRank || null,
  };

  const cfBands = cf.cfDiffBands || [];
  const lcBands = [
    { label: 'Easy', count: lc.lcEasy ?? 0 },
    { label: 'Medium', count: lc.lcMedium ?? 0 },
    { label: 'Hard', count: lc.lcHard ?? 0 },
  ];

  const last7Days = mergeLast7Days(cf.cfLast7Days, lc.lcLast7Days, cc.ccLast7Days);

  const cfRatingHistory = cf.cfRatingHistory || [];
  const lcRatingHistory = lc.lcRatingHistory || [];
  const ccRatingHistory = cc.ratingHistory || [];

  const topics = mergeTopics(cf.cfTopics, lc.lcTopics);
  const contests = mergeContests(cf.recentCfContests, lc.recentLcContests, cc.recentCcContests);

  const cfContestCount = cfRatingHistory.length || 0;
  const lcContestCount = lc.lcContests || lcRatingHistory.length || 0;
  const ccContestCount = cc.contestsParticipated || ccRatingHistory.length || 0;

  const cfBestRank = cfRatingHistory.reduce((min, c) => { const r = parseInt(c.rank, 10); return (!isNaN(r) && r > 0 && r < min) ? r : min; }, Infinity);
  const finalCfBestRank = cfBestRank === Infinity ? null : cfBestRank;
  const lcBestRank = lcRatingHistory.reduce((min, c) => { const r = parseInt(c.rank, 10); return (!isNaN(r) && r > 0 && r < min) ? r : min; }, Infinity);
  const finalLcBestRank = lcBestRank === Infinity ? null : lcBestRank;
  const ccBestRankVal = ccRatingHistory.reduce((min, c) => { const r = parseInt(c.rank, 10); return (!isNaN(r) && r > 0 && r < min) ? r : min; }, Infinity);
  const finalCcBestRank = ccBestRankVal === Infinity ? null : ccBestRankVal;

  const skills = cf.skillGaps || [];
  const achievements = lc.achievements || [];

  // Determine which single view to show when only 1 platform is linked
  const linkedCount = [linked.codeforces, linked.leetcode, linked.codechef].filter(Boolean).length;
  const singleView = linkedCount === 1
    ? (linked.codeforces ? 'cf' : linked.leetcode ? 'lc' : 'cc')
    : 'all';

  return (
    <div className="bg-[#ffffff] dark:bg-[#0a0a0a] px-6 py-6 min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-3">
        {/* Profile Header */}
        <ProfileHeader profile={profile} cfData={cfData} lcData={lcData} ccData={ccData} />

        {/* Row 1: Stat Cards */}
        <ErrorBoundary>
          <StatCards
            loading={loading}
            totalSolved={totalSolved}
            cfSolved={cf.cfSolved ?? 0}
            lcSolved={lc.lcSolved ?? 0}
            ccSolved={cc.totalSolved ?? 0}
            activeDays={activeDays}
            totalSubmissions={totalSubmissions}
            cfTotalSubmissions={cf.cfTotalSubmissions ?? 0}
            lcTotalSubmissions={lc.lcTotalSubmissions ?? 0}
            ccTotalSubmissions={cc.totalSubmissions ?? 0}
            currentStreak={currentStreak}
            bestStreak={bestStreak}
            acceptanceRate={acceptanceRate}
            cfAcceptanceRate={cfAR}
            lcAcceptanceRate={lcAR}
            ccAcceptanceRate={ccAR}
            solvedThisMonth={solvedThisMonth}
            activeDaysThisMonth={activeDaysThisMonth}
          />
        </ErrorBoundary>

        {/* Row 2: Platform info trio */}
        <div className="grid grid-cols-3 gap-3">
          <ErrorBoundary>
            <PlatformProfiles loading={loading} {...profileProps} />
          </ErrorBoundary>
          <ErrorBoundary>
            {singleView === 'cc' ? (
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
            ) : (
              <DifficultyBreakdown loading={loading} cfBands={cfBands} lcBands={lcBands} />
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

        {/* Row 3: Activity heatmap (full width — no DailyWidget for public view) */}
        <ErrorBoundary>
          <ActivityHeatmap loading={loading} heatmapData={heatmapData} />
        </ErrorBoundary>

        {/* Row 4: Rating + Total Contests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ErrorBoundary>
            <RatingProgression
              loading={loading}
              cfRatingHistory={cfRatingHistory}
              lcRatingHistory={lcRatingHistory}
              ccRatingHistory={ccRatingHistory}
            />
          </ErrorBoundary>
          <ErrorBoundary>
            <TotalContests
              loading={loading}
              cfContests={cfContestCount}
              lcContests={lcContestCount}
              ccContests={ccContestCount}
              cfBestRank={finalCfBestRank}
              lcBestRank={finalLcBestRank}
              ccBestRank={finalCcBestRank}
            />
          </ErrorBoundary>
        </div>

        {/* Row 5: Recent Contests + Topics / CC Language Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ErrorBoundary>
            <RecentContests loading={loading} contests={contests} />
          </ErrorBoundary>
          <ErrorBoundary>
            {singleView === 'cc' ? (
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
              cfSubmissions={cf.recentCfSubmissions}
              lcSubmissions={lc.recentSubmissions}
              ccSubmissions={cc.recentCcAcSubmissions}
              view="all"
            />
          </ErrorBoundary>
          <ErrorBoundary>
            {singleView === 'lc' ? (
              <LCSkillBreakdown
                loading={loading}
                fundamental={lc.lcSkillFundamental}
                intermediate={lc.lcSkillIntermediate}
                advanced={lc.lcSkillAdvanced}
              />
            ) : singleView === 'cf' ? (
              <CFRatingDistribution loading={loading} cfDiffBands={cf.cfDiffBands} />
            ) : singleView === 'cc' ? (
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
          <Achievements loading={loading} achievements={achievements} lcLinked={linked.leetcode} lcSessionStatus="active" />
        </ErrorBoundary>
      </div>
    </div>
  );
}
