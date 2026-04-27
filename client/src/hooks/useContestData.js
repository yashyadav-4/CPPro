import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../api';

const PROXY_URL  = `${API_BASE}/api/contests`;
const CACHE_KEY  = 'contest_data';
const CACHE_TTL  = 60 * 60 * 1000; // 1 hour

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
    attempted: raw.attempted ?? null,
  };
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, cachedAt } = JSON.parse(raw);
    if (Date.now() - cachedAt > CACHE_TTL) return null; // expired
    return data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, cachedAt: Date.now() }));
  } catch {}
}

export function useContestData() {
  const [contests, setContests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const applyRaw = useCallback((rawList) => {
    const hydrated = (Array.isArray(rawList) ? rawList : [])
      .map(hydrate)
      .filter(c => c.startTime !== null)
      .sort((a, b) => a.startTime - b.startTime);
    setContests(hydrated);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(PROXY_URL, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rawList = Array.isArray(json) ? json : [];
      writeCache(rawList);
      applyRaw(rawList);
    } catch (err) {
      console.error('[useContestData]', err);
      setError(err.message || 'Failed to fetch contests');
    } finally {
      setLoading(false);
    }
  }, [applyRaw]);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      applyRaw(cached);
      setLoading(false);
    } else {
      fetchData();
    }
  }, [applyRaw, fetchData]);

  return { contests, loading, error, refetch: fetchData };
}
