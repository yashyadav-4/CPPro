import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

const TYPE_STYLES = {
    lc_session_expired: 'bg-red-500/10 border-red-500/20 text-red-400',
    lc_session_saved:   'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    sync_failed:        'bg-orange-500/10 border-orange-500/20 text-orange-400',
    default:            'bg-blue-500/10 border-blue-500/20 text-blue-400',
};

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const { notifications, unreadCount, markRead, markAllRead, clearRead } = useNotifications();
    const ref = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleNotificationClick = (n) => {
        if (!n.read) markRead(n._id);
        if (n.actionUrl) {
            navigate(n.actionUrl);
            setOpen(false);
        }
    };

    return (
        <div className="relative flex-shrink-0" ref={ref}>
            <button
                onClick={() => setOpen(prev => !prev)}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#111111] rounded-xl shadow-xl border border-gray-200 dark:border-white/[0.08] z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors"
                                    title="Mark all read"
                                >
                                    <CheckCheck size={13} /> All read
                                </button>
                            )}
                            <button
                                onClick={clearRead}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 rounded transition-colors"
                                title="Clear read"
                            >
                                <Trash2 size={13} />
                            </button>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-white/[0.04]">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                                No notifications
                            </div>
                        ) : (
                            notifications.map(n => {
                                const style = TYPE_STYLES[n.type] || TYPE_STYLES.default;
                                return (
                                    <button
                                        key={n._id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors ${!n.read ? 'bg-emerald-50/50 dark:bg-emerald-500/[0.04]' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${!n.read ? 'bg-emerald-500' : 'bg-transparent'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">{n.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{n.message}</p>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
