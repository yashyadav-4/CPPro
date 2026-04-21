import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE } from '../api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/notifications`, { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch {
            // silently ignore — network errors shouldn't break the UI
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        intervalRef.current = setInterval(fetchNotifications, 60_000);
        return () => clearInterval(intervalRef.current);
    }, [fetchNotifications]);

    const markRead = useCallback(async (id) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', credentials: 'include' });
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* ignore */ }
    }, []);

    const markAllRead = useCallback(async () => {
        try {
            await fetch(`${API_BASE}/api/notifications/read-all`, { method: 'PATCH', credentials: 'include' });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch { /* ignore */ }
    }, []);

    const clearRead = useCallback(async () => {
        try {
            await fetch(`${API_BASE}/api/notifications/clear-read`, { method: 'DELETE', credentials: 'include' });
            setNotifications(prev => prev.filter(n => !n.read));
        } catch { /* ignore */ }
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            fetchNotifications,
            markRead,
            markAllRead,
            clearRead,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
    return ctx;
}
