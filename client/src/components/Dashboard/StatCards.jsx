import { Trophy, Calendar, Zap, Flame, Target, TrendingUp } from 'lucide-react';

const Skeleton = () => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-6 h-32 animate-pulse" />
);

export default function StatCards({
  loading, totalSolved, cfSolved, lcSolved, activeDays,
  totalSubmissions, currentStreak, bestStreak,
  acceptanceRate, cfAcceptanceRate, lcAcceptanceRate,
  solvedThisMonth, activeDaysThisMonth,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  const cards = [
    {
      label: 'TOTAL SOLVED',
      value: totalSolved ?? '—',
      sub: `CF: ${cfSolved ?? 0} | LC: ${lcSolved ?? 0}`,
      color: '#3b82f6', // blue
    },
    {
      label: 'ACTIVE DAYS',
      value: activeDays ?? '—',
      sub: activeDaysThisMonth ? `${activeDaysThisMonth} active this month` : '0 this month',
      color: '#10b981', // emerald
    },
    {
      label: 'TOTAL SUBMISSIONS',
      value: totalSubmissions ?? '—',
      sub: solvedThisMonth ? `${solvedThisMonth} solved this month` : 'None',
      color: '#8b5cf6', // purple
    },
    {
      label: 'CURRENT STREAK',
      value: currentStreak ? `${currentStreak}` : '0',
      sub: `Best: ${bestStreak ?? 0} days`,
      color: '#f97316', // orange
    },
    {
      label: 'ACCEPTANCE RATE',
      value: acceptanceRate != null ? `${acceptanceRate}%` : '—',
      sub: `Avg. CF: ${cfAcceptanceRate ?? '—'}%`,
      color: '#06b6d4', // cyan
    },
    {
      label: 'SOLVED THIS MONTH',
      value: solvedThisMonth ?? 0,
      sub: `Average monthly focus`,
      color: '#ec4899', // pink
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {cards.map((c, i) => (
        <div 
          key={i} 
          className="relative bg-white/[0.03] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] rounded-xl p-5 hover:bg-white/[0.05] dark:hover:bg-white/[0.04] transition-all duration-300 group overflow-hidden"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {/* Extremely Subtle Edge Glow */}
          <div 
            className="absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"
            style={{ background: c.color }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-1 h-3 rounded-full opacity-60"
                style={{ background: c.color }}
              />
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {c.label}
              </p>
            </div>
            
            <div className="flex flex-col">
              <span 
                className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {c.value}
              </span>
              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-tight mt-0.5">
                {c.sub}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
