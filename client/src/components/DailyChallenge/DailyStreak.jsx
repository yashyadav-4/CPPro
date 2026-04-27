import { Flame } from 'lucide-react';

const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

export default function DailyStreak({ loading, current = 0, longest = 0, todaySolved = 0 }) {
    if (loading) {
        return (
            <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
                <Skeleton className="h-3 w-28 mb-4" />
                <div className="grid grid-cols-3 gap-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
            <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                Daily Streak
            </p>
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-normal mb-0.5">Current</p>
                    <p className={`text-2xl font-medium tabular-nums flex items-center gap-1 ${current > 0 ? 'text-orange-500' : 'text-gray-900 dark:text-[#F9FAFB]'}`}>
                        {current > 0 && <Flame size={16} className="text-orange-400" />}
                        {current}<span className="text-base ml-0.5">d</span>
                    </p>
                </div>
                <div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-normal mb-0.5">Best</p>
                    <p className="text-2xl font-medium text-gray-900 dark:text-[#F9FAFB] tabular-nums">
                        {longest}<span className="text-base ml-0.5">d</span>
                    </p>
                </div>
                <div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-normal mb-0.5">Today</p>
                    <p className="text-2xl font-medium text-gray-900 dark:text-[#F9FAFB] tabular-nums">
                        {todaySolved}<span className="text-sm text-gray-400 dark:text-gray-600">/2</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
