import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
  const [data, setData] = useState({
    profile: null,
    heatmap: [],
    rating: { history: [], prediction: [] },
    topics: [],
    difficulty: [],
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const config = { withCredentials: true };

      const authRes = await axios.get('/api/auth/verify', config);
      const user = authRes.data?.user;
      if (!user?._id) {
        throw new Error('User not authenticated');
      }
      const userId = user._id;

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
        setError(firstErr.response?.data?.message || 'Failed to load dashboard data');
        setLoading(false);
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
      // Fallback local mock data for CPTracker design testing when not authenticated
      setData({
        profile: {
          user: { name: 'Yash', profilePic: null },
          upvotes: 42,
          platforms: [{ totalSolved: 257, currentRating: 1287, maxRating: 1290, currentRank: getRankFromRating(1287) }]
        },
        heatmap: Array.from({length: 365}).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - 365 + i);
            return { date: d.toISOString().split('T')[0], count: Math.random() > 0.7 ? Math.floor(Math.random()*5) : 0 };
        }),
        rating: { 
          history: [{date: '2025-09-01', rating: 300}, {date: '2025-10-01', rating: 800}, {date: '2026-03-01', rating: 1287}], 
          prediction: [{date: '2026-09-01', predictedRating: 1500}] 
        },
        topics: [{tag: 'dp', count: 40}, {tag: 'graphs', count: 30}, {tag: 'math', count: 50}, {tag: 'strings', count: 20}, {tag: 'greedy', count: 45}],
        difficulty: [{rating: 800, count: 90}, {rating: 900, count: 45}, {rating: 1000, count: 45}, {rating: 1100, count: 50}, {rating: 1200, count: 27}],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await axios.post('/api/sync/refresh', {}, { withCredentials: true });
      await fetchDashboardData();
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
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors duration-200 ${refreshing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Manual Refresh'}
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