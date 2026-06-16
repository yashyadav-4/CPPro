import { useState, useEffect, useCallback } from 'react';

/**
 * A custom React hook implementing the Stale-While-Revalidate (SWR) caching pattern using localStorage.
 * 
 * @param {string} cacheKey - The unique key for localStorage.
 * @param {Function} fetcher - A function that returns a Promise resolving to the fresh data.
 * @param {Object} options - Configuration options.
 * @param {number} [options.ttlMs] - Optional time-to-live in milliseconds. If data is older, it's considered completely invalid (won't be shown instantly). Default is infinite.
 * @param {boolean} [options.enabled=true] - If false, the hook won't automatically fetch/load on mount.
 */
export function useSwrCache(cacheKey, fetcher, { ttlMs = null, enabled = true } = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const revalidate = useCallback(async (silent = true) => {
        if (!silent) setLoading(true);
        setError(null);
        try {
            const freshData = await fetcher();
            setData(freshData);
            
            try {
                localStorage.setItem(cacheKey, JSON.stringify({
                    data: freshData,
                    timestamp: Date.now()
                }));
            } catch (storageErr) {
                console.warn('[useSwrCache] Failed to write to localStorage', storageErr);
            }
            
            return freshData;
        } catch (err) {
            console.error(`[useSwrCache] Error fetching ${cacheKey}:`, err);
            setError(err);
            throw err;
        } finally {
            if (!silent) setLoading(false);
        }
    }, [cacheKey, fetcher]);

    useEffect(() => {
        if (!enabled || !cacheKey) return;

        let hasValidCache = false;
        try {
            const cachedItem = localStorage.getItem(cacheKey);
            if (cachedItem) {
                const parsed = JSON.parse(cachedItem);
                
                // Check TTL
                if (!ttlMs || (Date.now() - parsed.timestamp < ttlMs)) {
                    setData(parsed.data);
                    hasValidCache = true;
                    setLoading(false); // Show UI immediately
                }
            }
        } catch (err) {
            console.warn('[useSwrCache] Failed to read from localStorage', err);
        }

        // Always revalidate in the background (stale-while-revalidate), 
        // or fetch visibly if no cache
        revalidate(hasValidCache).catch(() => {});

    }, [cacheKey, enabled, revalidate, ttlMs]);

    // Expose a mutate function for manual updates (e.g. optimistic UI updates)
    const mutate = useCallback((newData) => {
        setData(newData);
        try {
            localStorage.setItem(cacheKey, JSON.stringify({
                data: newData,
                timestamp: Date.now()
            }));
        } catch (e) {}
    }, [cacheKey]);

    return { data, loading, error, revalidate, mutate };
}
