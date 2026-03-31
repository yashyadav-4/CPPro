import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Shield, Link as LinkIcon } from 'lucide-react';

import SkeletonLoader from './SkeletonLoader';
import ProfileCard from './ProfileCard';
import StatCard from './StatCard';
import Heatmap from './Heatmap';
import RatingChart from './RatingChart';
import RadarChart from './RadarChart';
import DifficultyChart from './DifficultyChart';

export default function Dashboard() {
  const getRankFromRating = (rating) => {
    if (!rating) return 'Unrated';
    if (rating < 1200) return 'Newbie';
    if (rating < 1400) return 'Pupil';
    if (rating < 1600) return 'Specialist';
    if (rating < 1900) return 'Expert';
    if (rating < 2100) return 'Candidate Master';
    if (rating < 2300) return 'Master';
    if (rating < 2400) return 'International Master';
    if (rating < 2600) return 'Grandmaster';
    if (rating < 3000) return 'International Grandmaster';
    return 'Legendary Grandmaster';
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notLinked, setNotLinked] = useState(false);
  const [data, setData] = useState({
    profile: null,
    heatmap: [],
    rating: { history: [], prediction: [] },
    topics: [],
    difficulty: [],
  });
  const [refreshing, setRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds remaining
  const navigate = useNavigate();

  // Countdown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const formatCooldown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const config = { withCredentials: true };

      const authRes = await axios.get('/api/auth/verify', config);
      const user = authRes.data?.user;
      if (!user?._id) {
        throw new Error('User not authenticated');
      }
      const userId = user._id;

      // Check if Codeforces account is linked
      if (!user.linkedAccounts?.codeforces) {
        setNotLinked(true);
        if (!silent) setLoading(false);
        return;
      }
      setNotLinked(false);

      const results = await Promise.allSettled([
        axios.get(`/api/dashboard/profile/${userId}`, config),
        axios.get(`/api/dashboard/heatmap/${userId}`, config),
        axios.get(`/api/dashboard/rating/${userId}`, config),
        axios.get(`/api/dashboard/topics/${userId}`, config),
        axios.get(`/api/dashboard/difficulty/${userId}`, config),
      ]);

      const allFailed = results.every((r) => r.status === 'rejected');
      if (allFailed) {
        const firstErr = results[0].reason;
        if (!silent) setError(firstErr.response?.data?.message || 'Failed to load dashboard data');
        if (!silent) setLoading(false);
        return;
      }

      const getValue = (result, extractor, fallback) => {
        if (result.status === 'fulfilled') {
          try {
            return extractor(result.value.data.data) ?? fallback;
          } catch {
            return fallback;
          }
        }
        return fallback;
      };

      const profileData = getValue(results[0], (d) => d, {});
      const heatmapData = getValue(results[1], (d) => d, []);
      const ratingData = getValue(results[2], (d) => d, { history: [], currentRating: 0, maxRating: 0 });
      const topicsData = getValue(results[3], (d) => d, []);
      const difficultyData = getValue(results[4], (d) => d, []);

      const predictionArray = ratingData.prediction6Months 
        ? [{
            date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            predictedRating: ratingData.prediction6Months
          }] 
        : [];

      setData({
        profile: {
          user: user,
          upvotes: profileData.totalUpvotes || 0,
          platforms: [{
            totalSolved: profileData.totalQuestionsSolved || 0,
            currentRating: ratingData.currentRating || 0,
            maxRating: ratingData.maxRating || 0,
            currentRank: profileData.platforms?.[0]?.currentRank || ratingData.currentRank || getRankFromRating(ratingData.currentRating),
          }]
        },
        heatmap: heatmapData,
        rating: { 
          history: ratingData.history || [], 
          prediction: predictionArray 
        },
        topics: topicsData,
        difficulty: difficultyData,
      });
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleManualRefresh = async () => {
    if (cooldown > 0) return; // already on cooldown
    setRefreshing(true);
    try {
      const res = await axios.post('/api/sync/refresh', {}, { withCredentials: true });
      const { freshness, remainingSeconds } = res.data;

      if (freshness === 'fresh') {
        // Data is still fresh — start cooldown timer
        setCooldown(remainingSeconds);
      } else {
        // Stale — background update kicked off, refetch after delay to pick up new data
        await fetchDashboardData(true);
        setTimeout(() => fetchDashboardData(true), 6000);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const platform = data.profile?.platforms?.[0];
  const totalSolved = platform?.totalSolved || 0;

  const activeDays = data.heatmap.filter((d) => d.count > 0).length;

  const weeklySolved = (() => {
    if (!data.heatmap.length) return 0;
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().slice(0, 10);
    return data.heatmap
      .filter((d) => d.date >= weekAgoStr)
      .reduce((sum, d) => sum + d.count, 0);
  })();

  const currentStreak = (() => {
    if (!data.heatmap.length) return 0;
    let streak = 0;
    const sorted = [...data.heatmap].sort((a, b) => new Date(b.date) - new Date(a.date));
    const today = new Date().toISOString().slice(0, 10);
    let startIndex = 0;
    if (sorted[0]?.date === today && sorted[0]?.count === 0) {
      startIndex = 1;
    }
    for (let i = startIndex; i < sorted.length; i++) {
      if (sorted[i].count > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  })();

  const personalBestStreak = (() => {
    if (!data.heatmap.length) return 0;
    let max = 0;
    let current = 0;
    const sorted = [...data.heatmap].sort((a, b) => new Date(a.date) - new Date(b.date));
    for (const day of sorted) {
      if (day.count > 0) {
        current++;
        max = Math.max(max, current);
      } else {
        current = 0;
      }
    }
    return max;
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <SkeletonLoader />
      </div>
    );
  }

  if (notLinked) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
        <div className="bg-white border text-center border-gray-200 rounded-xl p-8 max-w-md w-full shadow-sm">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-5">
            <LinkIcon size={28} className="text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Link Your Codeforces Account</h2>
          <p className="text-gray-500 mb-6">To view your dashboard with stats, ratings, and progress tracking, you need to verify and link your Codeforces account first.</p>
          <button
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            onClick={() => navigate('/verify-codeforces')}
          >
            <Shield size={16} /> Verify Codeforces Account
          </button>
        </div>
      </div>
    );
  }

  if (error && !data.profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
        <div className="bg-white border text-center border-gray-200 rounded-xl p-8 max-w-md w-full shadow-sm">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            onClick={fetchDashboardData}
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex justify-end">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing || cooldown > 0}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors duration-200 ${
              cooldown > 0
                ? 'bg-amber-500 cursor-not-allowed'
                : refreshing
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {cooldown > 0
              ? `Refresh in ${formatCooldown(cooldown)}`
              : refreshing
                ? 'Refreshing...'
                : 'Manual Refresh'}
          </button>
        </div>

        {/* Row 1: Profile + 3 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProfileCard profile={data.profile} />
          
          <StatCard
            type="total"
            label="Total Solved"
            value={totalSolved}
            badgeText={weeklySolved > 0 ? `+${weeklySolved} this week` : null}
            sublabel={null}
          />
          
          <StatCard
            type="active"
            label="Active Days"
            value={activeDays}
            badgeText={null}
            sublabel="Keep it up!"
            highlightSub
          />
          
          <StatCard
            type="streak"
            label="Current Streak"
            value={currentStreak}
            unit="Days"
            personalBest={personalBestStreak}
            sublabel="Don't break the chain!"
          />
        </div>

        {/* Row 2: Activity Pulse Heatmap */}
        <div className="w-full relative">
            <Heatmap data={data.heatmap} />
        </div>

        {/* Row 3: Rating + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RatingChart history={data.rating.history} prediction={data.rating.prediction} />
          <RadarChart topics={data.topics} />
        </div>

        {/* Row 4: Difficulty Distribution */}
        <div className="w-full">
            <DifficultyChart difficulty={data.difficulty} />
        </div>
        
      </div>
    </div>
  );
}