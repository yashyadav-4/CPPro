import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Clock, RefreshCw, LinkIcon, Brain, Swords, ChevronDown, ChevronUp, AlertTriangle, X } from 'lucide-react';
import { API_BASE } from '../../api';
import { useSwrCache } from '../../hooks/useSwrCache';
import ProblemCard from './ProblemCard';
import DailyStreak from './DailyStreak';
import DailyTopicSection from './DailyTopicSection';

// ── Countdown to midnight IST ─────────────────────────────────────────────────
function useCountdownIST() {
    const [label, setLabel] = useState('');
    useEffect(() => {
        function tick() {
            const now    = new Date();
            const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
            const midnight = new Date(istNow);
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight - istNow;
            const h = Math.floor(diff / 3_600_000);
            const m = Math.floor((diff % 3_600_000) / 60_000);
            const s = Math.floor((diff % 60_000) / 1_000);
            const pad = n => String(n).padStart(2, '0');
            setLabel(`${pad(h)}:${pad(m)}:${pad(s)}`);
        }
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);
    return label;
}

// ── Solved progress dots ──────────────────────────────────────────────────────
function ProgressDots({ solved, total, colors }) {
    return (
        <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
                <span key={i}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                        background: i < solved ? (colors[i] || '#22c55e') : 'rgba(255,255,255,0.1)',
                        boxShadow:  i < solved ? `0 0 6px ${colors[i]}80` : 'none',
                    }}
                />
            ))}
        </div>
    );
}

export default function DailyChallenge() {
    const [tab, setTab]               = useState('problems');
    const [data, setData]             = useState(null);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [history, setHistory]       = useState([]);
    const [histPage, setHistPage]     = useState(1);
    const [histTotal, setHistTotal]   = useState(0);
    const [histLoading, setHistLoading] = useState(false);
    const [sessionWarning, setSessionWarning] = useState(false);
    const [warnDismissed, setWarnDismissed]   = useState(
        () => sessionStorage.getItem('daily_session_warn_dismissed') === '1'
    );
    const countdown = useCountdownIST();

    const dateStr = new Date().toISOString().substring(0, 10);
    const cacheKey = `daily_problems_${dateStr}`;

    useEffect(() => {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('daily_problems_') && key !== cacheKey) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (e) {}
    }, [cacheKey]);

    const fetcher = useCallback(async () => {
        const res = await axios.get(`${API_BASE}/api/daily`, { withCredentials: true });
        return res.data;
    }, []);

    const { data: rawData, loading: swrLoading, error: swrError, revalidate } = useSwrCache(cacheKey, fetcher);

    useEffect(() => {
        if (rawData) {
            if (rawData.status === 'no_account_linked') {
                setData({ noAccount: true });
            } else {
                setData(rawData.data);
                const warn = !!rawData.sessionWarning;
                setSessionWarning(warn);
                if (!warn) {
                    setWarnDismissed(false);
                    sessionStorage.removeItem('daily_session_warn_dismissed');
                }
            }
        }
    }, [rawData]);

    useEffect(() => {
        setLoading(swrLoading);
    }, [swrLoading]);

    useEffect(() => {
        if (swrError) {
            setError(swrError.response?.data?.message || swrError.message || 'Failed to load daily problems');
        } else {
            setError(null);
        }
    }, [swrError]);

    const fetchToday = useCallback(() => {
        revalidate(false);
    }, [revalidate]);

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

    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long',
    });

    const todaySolved = (data?.workout?.isSolved    ? 1 : 0)
                      + (data?.challenger?.isSolved  ? 1 : 0)
                      + (data?.bonus?.isSolved       ? 1 : 0);
    const todayTotal  = data?.bonus ? 3 : 2;
    const showContent = !loading && data && !data.noAccount;

    // ── No account linked ─────────────────────────────────────────────────────
    if (!loading && data?.noAccount) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
                <LinkIcon size={36} className="text-gray-700" />
                <p className="text-gray-500 text-sm max-w-sm">
                    Link at least one platform (Codeforces, LeetCode, or CodeChef) to get your daily problems.
                </p>
                <Link to="/settings"
                    className="text-sm font-semibold text-emerald-500 border border-emerald-500/30
                        px-4 py-2 rounded-lg hover:bg-emerald-500/10 transition-colors">
                    Go to Settings
                </Link>
            </div>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <p className="text-red-400 text-sm">{error}</p>
                <button onClick={fetchToday}
                    className="text-sm text-emerald-500 hover:underline flex items-center gap-1">
                    <RefreshCw size={13} /> Retry
                </button>
            </div>
        );
    }

    // ── Main ─────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-7xl mx-auto px-6 py-8">

            {/* ── Mission header ── */}
            <div className="flex items-start justify-between mb-2">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Today's Missions</h1>
                    <p className="text-[12px] text-gray-600 mt-0.5">{today}</p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-600 mt-1">
                    <Clock size={11} />
                    <span className="tabular-nums font-medium">{countdown}</span>
                    <span className="text-gray-700">until reset</span>
                </div>
            </div>

            {/* ── Tab bar ── */}
            <div className="flex items-center justify-between mb-6 mt-5">
                <div className="inline-flex bg-white/[0.04] rounded-xl p-1 gap-1">
                    {[
                        { key: 'problems', label: 'Problems', icon: Swords },
                        { key: 'topic',    label: 'Topic',    icon: Brain  },
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[12px]
                                font-semibold transition-all duration-200 ${
                                tab === key
                                    ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                                    : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            <Icon size={13} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Progress dots — only in problems tab */}
                {tab === 'problems' && (
                    <div className="flex items-center gap-2">
                        {!loading && showContent && (
                            <>
                                <ProgressDots
                                    solved={todaySolved}
                                    total={todayTotal}
                                    colors={['#22c55e', '#f59e0b', '#8b5cf6']}
                                />
                                <span className="text-[11px] text-gray-600 tabular-nums">
                                    {todaySolved}/{todayTotal} solved
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ── Problems tab ── */}
            <div className={tab === 'problems' ? '' : 'hidden'}>

                {/* Session warning banner — shown when LC is linked but no session set */}
                {sessionWarning && !warnDismissed && (
                    <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl
                        bg-amber-500/[0.08] border border-amber-500/25 relative">
                        <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-amber-400 mb-0.5">
                                Why am I seeing problems I've already solved?
                            </p>
                            <p className="text-[11px] text-amber-300/80 leading-relaxed">
                                Without a LeetCode Session Key, CPPro can only see your last 20 accepted
                                submissions — not your full history. Your older solved problems aren't
                                visible to us yet, so they may appear here.
                            </p>
                            <Link
                                to="/settings"
                                className="inline-block mt-2 text-[11px] font-semibold text-amber-400
                                    hover:text-amber-300 underline underline-offset-2 transition-colors"
                            >
                                Fix in Settings → Add Session Key
                            </Link>
                        </div>
                        <button
                            onClick={() => {
                                setWarnDismissed(true);
                                sessionStorage.setItem('daily_session_warn_dismissed', '1');
                            }}
                            className="shrink-0 p-1 rounded-md hover:bg-amber-500/20 text-amber-500/60
                                hover:text-amber-400 transition-colors"
                            title="Dismiss"
                        >
                            <X size={13} />
                        </button>
                    </div>
                )}

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

                {/* Workout + Challenger — side by side */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <ProblemCard type="workout"    problem={data?.workout}    loading={loading} />
                    <ProblemCard type="challenger" problem={data?.challenger} loading={loading} />
                </div>

                {/* Bonus — full width */}
                {(loading || (showContent && data?.bonus !== undefined)) && (
                    <div className="mb-6">
                        <ProblemCard type="bonus" problem={data?.bonus} loading={loading} />
                    </div>
                )}

                {/* History toggle */}
                <button
                    onClick={toggleHistory}
                    className="flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-gray-400
                        transition-colors mx-auto mb-2"
                >
                    {historyOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {historyOpen ? 'Hide' : 'Show'} past problems
                </button>

                {/* History panel */}
                {historyOpen && (
                    <div className="mt-2 bg-[#111111] border border-white/[0.07] rounded-xl p-5">
                        <h2 className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
                            Past Daily Problems
                        </h2>
                        {histLoading ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-10 bg-white/[0.04] rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : history.length === 0 ? (
                            <p className="text-[12px] text-gray-600">No history yet.</p>
                        ) : (
                            <>
                                <div className="space-y-0">
                                    {history.map(d => (
                                        <div key={d._id}
                                            className="flex items-center justify-between py-2.5
                                                border-b border-white/[0.04] last:border-0">
                                            <div>
                                                <p className="text-[12px] font-medium text-gray-400">{d.date}</p>
                                                <p className="text-[11px] text-gray-600 mt-0.5">
                                                    {d.workout?.title    ? `W: ${d.workout.title}`    : '—'} ·{' '}
                                                    {d.challenger?.title ? `C: ${d.challenger.title}` : '—'}
                                                    {d.bonus?.title      ? ` · B: ${d.bonus.title}`  : ''}
                                                </p>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <span className={`w-2 h-2 rounded-full ${d.workout?.isSolved    ? 'bg-emerald-500' : 'bg-white/10'}`} title="Workout" />
                                                <span className={`w-2 h-2 rounded-full ${d.challenger?.isSolved ? 'bg-amber-500'   : 'bg-white/10'}`} title="Challenger" />
                                                {d.bonus && <span className={`w-2 h-2 rounded-full ${d.bonus.isSolved ? 'bg-violet-500' : 'bg-white/10'}`} title="Bonus" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {histTotal > 10 && (
                                    <div className="flex justify-center gap-6 mt-4">
                                        <button
                                            onClick={() => loadHistory(histPage - 1)}
                                            disabled={histPage === 1}
                                            className="text-[12px] text-gray-600 hover:text-gray-300 disabled:opacity-30">
                                            ← Prev
                                        </button>
                                        <span className="text-[12px] text-gray-600">
                                            {histPage} / {Math.ceil(histTotal / 10)}
                                        </span>
                                        <button
                                            onClick={() => loadHistory(histPage + 1)}
                                            disabled={histPage >= Math.ceil(histTotal / 10)}
                                            className="text-[12px] text-gray-600 hover:text-gray-300 disabled:opacity-30">
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ── Topic tab ── */}
            <div className={tab === 'topic' ? '' : 'hidden'}>
                {showContent && <DailyTopicSection />}
            </div>
        </div>
    );
}
