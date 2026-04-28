import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Dumbbell, Zap, CheckCircle2, ArrowRight, Flame, Star } from 'lucide-react';
import { API_BASE } from '../../api';

const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

function ProblemRow({ icon: Icon, label, problem, accentColor, loading }) {
    if (loading) {
        return (
            <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-white/5 animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <Skeleton className="h-3 w-16 mb-1.5" />
                    <Skeleton className="h-3.5 w-3/4" />
                </div>
                <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="flex items-center gap-3 opacity-40">
                <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: `${accentColor}15` }}>
                    <Icon size={12} style={{ color: accentColor }} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accentColor }}>{label}</p>
                    <p className="text-[12px] text-gray-400 dark:text-gray-600">Not assigned</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: `${accentColor}15` }}>
                {problem.isSolved
                    ? <CheckCircle2 size={12} style={{ color: accentColor }} />
                    : <Icon size={12} style={{ color: accentColor }} />
                }
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: accentColor }}>{label}</p>
                <p className="text-[12px] font-medium text-gray-800 dark:text-gray-200 truncate leading-none">{problem.title}</p>
            </div>
            <div className="flex-shrink-0">
                {problem.isSolved
                    ? <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: `${accentColor}15`, color: accentColor }}>Done</span>
                    : <span className="w-2 h-2 rounded-full block border-2 border-gray-200 dark:border-white/20" />
                }
            </div>
        </div>
    );
}

export default function DailyWidget({ loading: parentLoading }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API_BASE}/api/daily`, { withCredentials: true })
            .then(res => {
                if (res.data.status !== 'no_account_linked') setData(res.data.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const isLoading = loading || parentLoading;
    const streak = data?.streak?.current || 0;
    const todaySolved = (data?.workout?.isSolved ? 1 : 0) + (data?.challenger?.isSolved ? 1 : 0) + (data?.bonus?.isSolved ? 1 : 0);
    const todayTotal = data?.bonus ? 3 : 2;

    return (
        <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Daily</p>
                    {!isLoading && streak > 0 && (
                        <span className="flex items-center gap-0.5 text-[11px] font-semibold text-orange-500">
                            <Flame size={11} className="text-orange-400" />
                            {streak}d
                        </span>
                    )}
                    {isLoading && <Skeleton className="h-3 w-8" />}
                </div>
                <div className="flex items-center gap-2">
                    {!isLoading && (
                        <span className="text-[11px] text-gray-400 dark:text-gray-600">{todaySolved}/{todayTotal}</span>
                    )}
                    <Link to="/daily"
                        className="flex items-center gap-0.5 text-[11px] text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">
                        View <ArrowRight size={11} />
                    </Link>
                </div>
            </div>

            {/* Problem rows */}
            <div className="flex flex-col gap-3">
                <ProblemRow
                    icon={Dumbbell}
                    label="Workout"
                    problem={data?.workout}
                    accentColor="#22c55e"
                    loading={isLoading}
                />
                <ProblemRow
                    icon={Zap}
                    label="Challenger"
                    problem={data?.challenger}
                    accentColor="#f59e0b"
                    loading={isLoading}
                />
                {(isLoading || data?.bonus) && (
                    <ProblemRow
                        icon={Star}
                        label="Bonus"
                        problem={data?.bonus}
                        accentColor="#8b5cf6"
                        loading={isLoading}
                    />
                )}
            </div>
        </div>
    );
}
