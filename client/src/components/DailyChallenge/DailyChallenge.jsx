import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { History, RefreshCw, LinkIcon } from 'lucide-react';
import { API_BASE } from '../../api';
import ProblemCard from './ProblemCard';
import DailyStreak from './DailyStreak';

export default function DailyChallenge() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const [histPage, setHistPage] = useState(1);
    const [histTotal, setHistTotal] = useState(0);
    const [histLoading, setHistLoading] = useState(false);
    const [markingType, setMarkingType] = useState(null);

    useEffect(() => { fetchToday(); }, []);

    async function fetchToday() {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE}/api/daily`, { withCredentials: true });
            if (res.data.status === 'no_account_linked') {
                setData({ noAccount: true });
            } else {
                setData(res.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load daily problems');
        } finally {
            setLoading(false);
        }
    }

    async function markSolved(type) {
        setMarkingType(type);
        try {
            await axios.post(`${API_BASE}/api/daily/mark-solved`, { type }, { withCredentials: true });
            await fetchToday();
        } catch (_) {}
        setMarkingType(null);
    }

    async function loadHistory(page = 1) {
        setHistLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/daily/history`, {
                params: { page },
                withCredentials: true,
            });
            setHistory(res.data.data || []);
            setHistTotal(res.data.pagination?.total || 0);
            setHistPage(page);
        } catch (_) {}
        setHistLoading(false);
    }

    function toggleHistory() {
        const next = !historyOpen;
        setHistoryOpen(next);
        if (next && history.length === 0) loadHistory(1);
    }

    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    if (error) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <p className="text-red-400 text-sm">{error}</p>
                <button onClick={fetchToday} className="text-sm text-emerald-500 hover:underline flex items-center gap-1">
                    <RefreshCw size={13} /> Retry
                </button>
            </div>
        );
    }

    if (!loading && data?.noAccount) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
                <LinkIcon size={36} className="text-gray-300 dark:text-gray-700" />
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
                    Link at least one platform (Codeforces, LeetCode, or CodeChef) to get your daily problems.
                </p>
                <Link to="/settings"
                    className="text-sm font-semibold text-emerald-500 border border-emerald-500/30 px-4 py-2 rounded-lg hover:bg-emerald-500/10 transition-colors">
                    Go to Settings
                </Link>
            </div>
        );
    }

    const todaySolved = (data?.workout?.isSolved ? 1 : 0) + (data?.challenger?.isSolved ? 1 : 0);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Daily Problems</h1>
                    <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-0.5">{today}</p>
                </div>
                <button onClick={toggleHistory}
                    className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    <History size={14} />
                    History
                </button>
            </div>

            {/* Streak bar */}
            <div className="mb-5">
                <DailyStreak
                    loading={loading}
                    current={data?.streak?.current || 0}
                    longest={data?.streak?.longest || 0}
                    todaySolved={todaySolved}
                />
            </div>

            {/* Problem cards */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <ProblemCard type="workout" problem={data?.workout} loading={loading} />
                <ProblemCard type="challenger" problem={data?.challenger} loading={loading} />
            </div>

            {/* Manual solve buttons (edge case fallback) */}
            {!loading && data && (
                <div className="flex gap-3 justify-center">
                    {data.workout && !data.workout.isSolved && (
                        <button
                            onClick={() => markSolved('workout')}
                            disabled={markingType === 'workout'}
                            className="text-[12px] text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors disabled:opacity-50">
                            {markingType === 'workout' ? 'Marking...' : 'Manually mark workout solved'}
                        </button>
                    )}
                    {data.challenger && !data.challenger.isSolved && (
                        <button
                            onClick={() => markSolved('challenger')}
                            disabled={markingType === 'challenger'}
                            className="text-[12px] text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors disabled:opacity-50">
                            {markingType === 'challenger' ? 'Marking...' : 'Manually mark challenger solved'}
                        </button>
                    )}
                </div>
            )}

            {/* History panel */}
            {historyOpen && (
                <div className="mt-8 bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-5">
                    <h2 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-4">Past Daily Problems</h2>
                    {histLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <p className="text-[12px] text-gray-400 dark:text-gray-600">No history yet.</p>
                    ) : (
                        <>
                            <div className="space-y-2">
                                {history.map(d => (
                                    <div key={d._id} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-white/[0.04] last:border-0">
                                        <div>
                                            <p className="text-[12px] font-medium text-gray-700 dark:text-gray-300">{d.date}</p>
                                            <p className="text-[11px] text-gray-400 dark:text-gray-600">
                                                {d.workout?.title ? `W: ${d.workout.title}` : 'No workout'} ·{' '}
                                                {d.challenger?.title ? `C: ${d.challenger.title}` : 'No challenger'}
                                            </p>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${d.workout?.isSolved ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-white/10'}`} title="Workout" />
                                            <span className={`w-2 h-2 rounded-full ${d.challenger?.isSolved ? 'bg-amber-400' : 'bg-gray-200 dark:bg-white/10'}`} title="Challenger" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Pagination */}
                            {histTotal > 10 && (
                                <div className="flex justify-center gap-4 mt-4">
                                    <button onClick={() => loadHistory(histPage - 1)} disabled={histPage === 1}
                                        className="text-[12px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30">
                                        ← Prev
                                    </button>
                                    <span className="text-[12px] text-gray-400">Page {histPage} / {Math.ceil(histTotal / 10)}</span>
                                    <button onClick={() => loadHistory(histPage + 1)} disabled={histPage >= Math.ceil(histTotal / 10)}
                                        className="text-[12px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30">
                                        Next →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
