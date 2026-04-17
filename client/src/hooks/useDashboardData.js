import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const config = { withCredentials: true };

export function useDashboardData() {
    const [cfData, setCfData] = useState(null);
    const [lcData, setLcData] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState('user');
    const [userName, setUserName] = useState('');
    const [userUsername, setUserUsername] = useState('');
    const [linkedAccounts, setLinkedAccounts] = useState({ codeforces: false, leetcode: false });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);

        try {
            // 1. Verify auth and get userId
            const authRes = await axios.get('/api/auth/verify', config);
            const user = authRes.data?.user;
            if (!user?._id) throw new Error('User not authenticated');

            const uid = user._id;
            const cfLinked = !!user.linkedAccounts?.codeforces;
            const lcLinked = !!user.linkedAccounts?.leetcode;
            const role = user.role || 'user';

            setUserId(uid);
            setUserRole(role);
            setUserName(user.name || '');
            setUserUsername(user.username || '');
            setLinkedAccounts({ codeforces: cfLinked, leetcode: lcLinked });

            // 2. Fire aggregate calls in parallel (only for linked platforms)
            const cfPromise = cfLinked
                ? axios.get(`/api/dashboard/aggregate/${uid}`, config)
                : Promise.resolve(null);

            const lcPromise = lcLinked
                ? axios.get(`/api/lc-dashboard/aggregate/${uid}`, config)
                : Promise.resolve(null);

            const [cfRes, lcRes] = await Promise.allSettled([cfPromise, lcPromise]);

            const newCfData = cfRes.status === 'fulfilled' && cfRes.value?.data?.data
                ? cfRes.value.data.data
                : null;

            const newLcData = lcRes.status === 'fulfilled' && lcRes.value?.data?.data
                ? lcRes.value.data.data
                : null;

            setCfData(newCfData);
            setLcData(newLcData);
        } catch (err) {
            console.error('[useDashboardData] fetch error:', err);
            if (!silent) setError(err.message || 'Failed to load dashboard data');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return { cfData, lcData, userId, userRole, userName, userUsername, linkedAccounts, loading, error, refetch: fetchData };
}
