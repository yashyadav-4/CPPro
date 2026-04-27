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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

            setCfData(newCfData);
            setLcData(newLcData);
            setCcData(newCcData);

            try {
                localStorage.setItem(cacheKey(uid), JSON.stringify({ cfData: newCfData, lcData: newLcData, ccData: newCcData }));
            } catch {}
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

    return { cfData, lcData, ccData, userId, userRole, userName, userUsername, linkedAccounts, loading, error, refetch };
}
