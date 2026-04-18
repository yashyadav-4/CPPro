// useContestData.js
// Fetches pre-normalised contest data from our Express proxy at /api/contests.
// The proxy calls the official Codeforces REST API + LeetCode GraphQL API
// server-side and returns { platform, name, startTime, endTime, duration, url }.
import { useState, useEffect, useCallback } from 'react';

const PROXY_URL = '/api/contests';

/**
 * Hydrate ISO date strings → Date objects and add a stable id.
 */
function hydrate(raw) {
  return {
    id:        raw.contestId ?? (raw._id?.toString() ?? (raw.name + raw.startTime)),
    platform:  raw.platform,
    name:      raw.name,
    startTime: raw.startTime ? new Date(raw.startTime) : null,
    endTime:   raw.endTime   ? new Date(raw.endTime)   : null,
    duration:  raw.duration  ?? null,
    url:       raw.url       ?? null,
    status:    raw.status    ?? null,
  };
}

/**
 * Custom hook.
 * Returns { contests, loading, error, refetch }
 * contests → sorted ascending by startTime, CF + LC only.
 */
export function useContestData() {
  const [contests, setContests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(PROXY_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const hydrated = (Array.isArray(json) ? json : [])
        .map(hydrate)
        .filter(c => c.startTime !== null)
        .sort((a, b) => a.startTime - b.startTime);

      setContests(hydrated);
    } catch (err) {
      console.error('[useContestData]', err);
      setError(err.message || 'Failed to fetch contests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { contests, loading, error, refetch: fetchData };
}
