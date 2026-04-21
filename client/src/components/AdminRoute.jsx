import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { API_BASE } from '../api';

/**
 * Guards a route — user must be authenticated AND have role === 'admin'.
 * On failure redirects to /login (unauthenticated) or / (authenticated, not admin).
 */
export default function AdminRoute({ children }) {
    const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'unauth' | 'forbidden'

    useEffect(() => {
        fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (!data.authenticated) return setStatus('unauth');
                if (data.user?.role !== 'admin') return setStatus('forbidden');
                setStatus('ok');
            })
            .catch(() => setStatus('unauth'));
    }, []);

    if (status === 'loading') return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
    if (status === 'unauth') return <Navigate to="/login" replace />;
    if (status === 'forbidden') return <Navigate to="/" replace />;
    return children;
}
