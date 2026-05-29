import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { History, RefreshCw, LinkIcon, Brain, Swords } from 'lucide-react';
import { API_BASE } from '../../api';
import ProblemCard from './ProblemCard';
import DailyStreak from './DailyStreak';
import DailyTopicSection from './DailyTopicSection';

export default function DailyChallenge() {
    const [tab, setTab] = useState('problems');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const [histPage, setHistPage] = useState(1);
    const [histTotal, setHistTotal] = useState(0);
    const [histLoading, setHistLoading] = useState(false);
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

    const hasBonus = !loading && data && !data.noAccount;
    const todaySolved = (data?.workout?.isSolved ? 1 : 0) + (data?.challenger?.isSolved ? 1 : 0) + (data?.bonus?.isSolved ? 1 : 0);
    const todayTotal = data?.bonus ? 3 : 2;
    const showContent = !loading && data && !data.noAccount;

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-2xl font-extrabold text-[var(--color-text-main)] inline-block">
                    Daily Challenge
                </h1>
                <div className="flex items-center justify-center gap-3 mt-1.5">
                    <p className="text-[12px] text-[var(--color-text-muted)]">{today}</p>
                    {tab === 'problems' && (
                        <button onClick={toggleHistory}
                            className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]
                                hover:text-[var(--color-accent)] transition-colors">
                            <History size={12} />
                            History
                        </button>
                    )}
                </div>
            </div>

            {/* Tab bar — compact, centered */}
            <div className="flex justify-center mb-6">
                <div className="inline-flex bg-white/[0.03] dark:bg-white/[0.03]
                    rounded-2xl p-1 gap-1">
                    {[
                        { key: 'problems', label: 'Problems', icon: Swords },
                        { key: 'topic',    label: 'Topic',    icon: Brain },
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[12px]
                                font-semibold transition-all duration-200 ${
                                tab === key
                                    ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent)] shadow-sm'
                                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-bg)]'
                            }`}
                        >
                            <Icon size={14} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Problems tab */}
            <div className={tab === 'problems' ? '' : 'hidden'}>
                {/* Streak bar */}
                <div className="mb-5">
                    <DailyStreak
                        loading={loading}
                        current={data?.streak?.current || 0}
                        longest={data?.streak?.longest || 0}
                        todaySolved={todaySolved}
                        todayTotal={todayTotal}
                    />
                </div>

                {/* Problem cards — workout + challenger always side by side */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <ProblemCard type="workout" problem={data?.workout} loading={loading} />
                    <ProblemCard type="challenger" problem={data?.challenger} loading={loading} />
                </div>

                {/* Bonus card — full width below, only shown when assigned or loading */}
                {(loading || hasBonus) && (
                    <div className="mb-6">
                        <ProblemCard type="bonus" problem={data?.bonus} loading={loading} />
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
                                                    {d.bonus?.title ? ` · B: ${d.bonus.title}` : ''}
                                                </p>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <span className={`w-2 h-2 rounded-full ${d.workout?.isSolved ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-white/10'}`} title="Workout" />
                                                <span className={`w-2 h-2 rounded-full ${d.challenger?.isSolved ? 'bg-amber-400' : 'bg-gray-200 dark:bg-white/10'}`} title="Challenger" />
                                                {d.bonus && <span className={`w-2 h-2 rounded-full ${d.bonus.isSolved ? 'bg-violet-400' : 'bg-gray-200 dark:bg-white/10'}`} title="Bonus" />}
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

            {/* Topic tab — always mounted so it starts fetching immediately */}
            <div className={tab === 'topic' ? '' : 'hidden'}>
                {showContent && <DailyTopicSection />}
            </div>
        </div>
    );
}
