import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';
import './Dashboard.css';

import SkeletonLoader from './SkeletonLoader';
import ProfileCard from './ProfileCard';
import StatCard from './StatCard';
import SyncButton from './SyncButton';
import Heatmap from './Heatmap';
import RatingChart from './RatingChart';
import RadarChart from './RadarChart';
import DifficultyChart from './DifficultyChart';

/**
 * Dashboard Container — fetches all 5 endpoints and composes the Bento Grid.
 * Uses Promise.allSettled for graceful degradation — partial data still renders.
 */
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    profile: null,
    heatmap: [],
    rating: { history: [], prediction: [] },
    topics: [],
    difficulty: [],
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Auth is handled via HTTP-only cookie — just include credentials
      const config = { withCredentials: true };

      // First fetch the authenticated user
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

      // Check if ALL requests failed
      const allFailed = results.every((r) => r.status === 'rejected');
      if (allFailed) {
        const firstErr = results[0].reason;
        setError(firstErr.response?.data?.message || 'Failed to load dashboard data');
        setLoading(false);
        return;
      }

      // Extract data from settled results — use defaults for failed endpoints
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

      // Format prediction for Recharts (array of {date, prediction})
      const predictionArray = ratingData.prediction6Months 
        ? [{
            date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            predictedRating: ratingData.prediction6Months
          }] 
        : [];

      setData({
        profile: {
          user: user,
          platforms: [{
            totalSolved: profileData.totalQuestionsSolved || 0,
            currentRating: ratingData.currentRating || 0,
            maxRating: ratingData.maxRating || 0,
            currentRank: 'unrated',
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
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSyncComplete = useCallback(() => {
    // Re-fetch all data after a successful sync
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived statistics
  const platform = data.profile?.platforms?.[0];
  const totalSolved = platform?.totalSolved || 0;
  const lastSyncedAt = platform?.lastSyncedAt;

  // Active days: count days with at least 1 submission from heatmap
  const activeDays = data.heatmap.filter((d) => d.count > 0).length;

  // Weekly solved: sum submissions from the last 7 days of heatmap data
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

  // Current streak: count consecutive days from today backwards
  const currentStreak = (() => {
    if (!data.heatmap.length) return 0;
    let streak = 0;
    const sorted = [...data.heatmap].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    // Allow today to be 0 (hasn't solved yet today), start from yesterday
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

  // Personal best streak
  const personalBestStreak = (() => {
    if (!data.heatmap.length) return 0;
    let max = 0;
    let current = 0;
    const sorted = [...data.heatmap].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
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

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-page">
        <SkeletonLoader />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <AlertTriangle size={48} />
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button
            className="sync-btn"
            onClick={fetchDashboardData}
            style={{ marginTop: 8 }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Sync Button + Last Synced */}
      <SyncButton
        lastSyncedAt={lastSyncedAt}
        onSyncComplete={handleSyncComplete}
      />

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* Row 1: Profile + 3 Stat Cards */}
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
          sublabel="Top 2% globally"
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

        {/* Row 2: Activity Pulse Heatmap */}
        <Heatmap data={data.heatmap} />

        {/* Row 3: Rating + Radar */}
        <RatingChart
          history={data.rating.history}
          prediction={data.rating.prediction}
        />

        <RadarChart topics={data.topics} />

        {/* Row 4: Difficulty Distribution */}
        <DifficultyChart difficulty={data.difficulty} />
      </div>
    </div>
  );
}