import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const config = { withCredentials: true };
const cacheKey = uid => `dashboard_data_${uid}`;

export function useDashboardData() {
    const [cfData, setCfData] = useState(null);
    const [lcData, setLcData] = useState(null);
    const [ccData, setCcData] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState('user');
    const [userName, setUserName] = useState('');
    const [userUsername, setUserUsername] = useState('');
    const [linkedAccounts, setLinkedAccounts] = useState({ codeforces: false, leetcode: false, codechef: false });
    const [lcSessionStatus, setLcSessionStatus] = useState('not_set');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hardSyncTimestamps, setHardSyncTimestamps] = useState({ cf: null, lc: null, cc: null });

    // Refs so refetch() always has current values without stale closures
    const uidRef = useRef(null);
    const linkedRef = useRef({ codeforces: false, leetcode: false, codechef: false });

    const fetchPlatformData = useCallback(async (uid, linked, silent = false) => {
        if (!silent) setLoading(true);
        setError(null);
        try {
            const cfPromise = linked.codeforces
                ? axios.get(`/api/dashboard/aggregate/${uid}`, config)
                : Promise.resolve(null);
            const lcPromise = linked.leetcode
                ? axios.get(`/api/lc-dashboard/aggregate/${uid}`, config)
                : Promise.resolve(null);
            const ccPromise = linked.codechef
                ? axios.get(`/api/cc-dashboard/aggregate/${uid}`, config)
                : Promise.resolve(null);

            const [cfRes, lcRes, ccRes] = await Promise.allSettled([cfPromise, lcPromise, ccPromise]);

            const newCfData = cfRes.status === 'fulfilled' && cfRes.value?.data?.data ? cfRes.value.data.data : null;
            const newLcData = lcRes.status === 'fulfilled' && lcRes.value?.data?.data ? lcRes.value.data.data : null;
            const newCcData = ccRes.status === 'fulfilled' && ccRes.value?.data?.data ? ccRes.value.data.data : null;

            // During a silent background revalidation, never wipe good data with null.
            // A null result means the platform fetch failed transiently — keep the
            // previously-displayed value so stats don't disappear mid-session.
            if (silent) {
                if (newCfData !== null) setCfData(newCfData);
                if (newLcData !== null) setLcData(newLcData);
                // CC: always upsert-merge — spread new fields on top of prev so no
                // existing field is lost even on a successful partial response.
                if (newCcData !== null) setCcData(prev => ({ ...(prev || {}), ...newCcData }));
            } else {
                setCfData(newCfData);
                setLcData(newLcData);
                // Non-silent (hard load): still merge CC so a re-fetch that omits a
                // field doesn't blank out something the user was already seeing.
                setCcData(prev => newCcData !== null ? { ...(prev || {}), ...newCcData } : prev);
            }

            // Only update the localStorage cache if we have at least one real data
            // payload — avoids caching a partial-null snapshot that would then be
            // displayed as blank stats on the next page load.
            const hasAnyData = newCfData || newLcData || newCcData;
            if (hasAnyData) {
                try {
                    // Merge with any existing cached values so we never write nulls
                    // over good data for platforms that returned nothing this cycle.
                    // CC uses a deep merge — new fields spread on top of existing CC
                    // object so previously-fetched fields aren't wiped by partial updates.
                    let existing = null;
                    try { existing = JSON.parse(localStorage.getItem(cacheKey(uid)) || 'null'); } catch {}
                    const mergedCcData = newCcData !== null
                        ? { ...(existing?.ccData || {}), ...newCcData }
                        : (existing?.ccData ?? null);
                    localStorage.setItem(cacheKey(uid), JSON.stringify({
                        cfData: newCfData ?? existing?.cfData ?? null,
                        lcData: newLcData ?? existing?.lcData ?? null,
                        ccData: mergedCcData,
                    }));
                } catch {}
            }
        } catch (err) {
            console.error('[useDashboardData] fetch error:', err);
            if (!silent) setError(err.message || 'Failed to load dashboard data');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        async function init() {
            try {
                const authRes = await axios.get('/api/auth/verify', config);
                const user = authRes.data?.user;
                if (!user?._id) throw new Error('User not authenticated');

                const uid = user._id;
                const linked = {
                    codeforces: !!user.linkedAccounts?.codeforces,
                    leetcode:   !!user.linkedAccounts?.leetcode,
                    codechef:   !!user.linkedAccounts?.codechef,
                };

                uidRef.current = uid;
                linkedRef.current = linked;
                setUserId(uid);
                setUserRole(user.role || 'user');
                setUserName(user.name || '');
                setUserUsername(user.username || '');
                setLinkedAccounts(linked);
                setLcSessionStatus(user.lcSession?.status || 'not_set');
                setHardSyncTimestamps({
                    cf: user.lastCfHardSync || null,
                    lc: user.lastLcHardSync || null,
                    cc: user.lastCcHardSync || null,
                });

                // Try cache first — show instantly with no backend call
                let hasCached = false;
                try {
                    const cached = JSON.parse(localStorage.getItem(cacheKey(uid)) || 'null');
                    if (cached) {
                        setCfData(cached.cfData ?? null);
                        setLcData(cached.lcData ?? null);
                        setCcData(cached.ccData ?? null);
                        hasCached = true;
                    }
                } catch {}

                if (hasCached) {
                    setLoading(false);
                    // Background fetch to revalidate
                    fetchPlatformData(uid, linked, true).catch(() => {});
                } else {
                    // First visit ever — no cache, must fetch
                    await fetchPlatformData(uid, linked, false);
                }
            } catch (err) {
                console.error('[useDashboardData] init error:', err);
                setError(err.message || 'Failed to load dashboard data');
                setLoading(false);
            }
        }
        init();
    }, [fetchPlatformData]);

    // Called after explicit Refresh — always hits backend, updates cache
    const refetch = useCallback(async (silent = false) => {
        const uid = uidRef.current;
        const linked = linkedRef.current;
        if (!uid) return;
        await fetchPlatformData(uid, linked, silent);
    }, [fetchPlatformData]);

    return { cfData, lcData, ccData, userId, userRole, userName, userUsername, linkedAccounts, lcSessionStatus, hardSyncTimestamps, loading, error, refetch };
}
