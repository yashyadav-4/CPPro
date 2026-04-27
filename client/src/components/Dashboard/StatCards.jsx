import { Trophy, CalendarDays, Flame, BarChart2, TrendingUp } from 'lucide-react';

const Skeleton = () => (
  <div className="bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-2xl h-36 animate-pulse" />
);

const CARDS_META = [
  { label: 'Total Solved',      icon: Trophy,       color: '#3b82f6', glow: 'rgba(59,130,246,0.15)' },
  { label: 'Active Days',       icon: CalendarDays, color: '#10b981', glow: 'rgba(16,185,129,0.15)' },
  { label: 'Total Submissions', icon: BarChart2,    color: '#8b5cf6', glow: 'rgba(139,92,246,0.15)' },
  { label: 'Current Streak',    icon: Flame,        color: '#f97316', glow: 'rgba(249,115,22,0.15)'  },
  { label: 'Acceptance Rate',   icon: BarChart2,    color: '#06b6d4', glow: 'rgba(6,182,212,0.15)'   },
  { label: 'Solved This Month', icon: TrendingUp,   color: '#ec4899', glow: 'rgba(236,72,153,0.15)'  },
];

function StatCard({ meta, value, sub, extra }) {
  const Icon = meta.icon;
  return (
    <div className="relative rounded-2xl overflow-hidden group bg-white dark:bg-white/[0.025] border border-gray-100 dark:border-white/[0.06] shadow-sm dark:shadow-none">
      {/* Colored top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${meta.color}, transparent)` }} />

      {/* Background glow from bottom-right (dark mode only) */}
      <div
        className="absolute bottom-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: meta.glow }}
      />

      <div className="relative z-10 p-5 flex flex-col h-full">
        {/* Top row: label + icon */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: meta.color }}>
            {meta.label}
          </span>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${meta.color}18` }}
          >
            <Icon size={14} style={{ color: meta.color }} />
          </div>
        </div>

        {/* Value */}
        <span
          className="text-[2rem] font-bold leading-none text-gray-900 dark:text-white tracking-tight tabular-nums"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {value}
        </span>

        {/* Sub */}
        <span className="mt-2 text-[10px] text-gray-500 uppercase tracking-wide font-medium leading-tight">
          {sub}
        </span>

        {/* Optional extra (platform breakdown) */}
        {extra && (
          <div className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5">
            {extra.map((e, i) => (
              <span key={i} className="text-[10px] text-gray-500 dark:text-gray-400 font-normal tabular-nums">{e}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StatCards({
  loading,
  totalSolved, cfSolved, lcSolved, ccSolved, activeDays,
  totalSubmissions, cfTotalSubmissions, lcTotalSubmissions, ccTotalSubmissions,
  currentStreak, bestStreak,
  acceptanceRate, cfAcceptanceRate, lcAcceptanceRate, ccAcceptanceRate,
  solvedThisMonth, activeDaysThisMonth,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  const platformBreakdown = (cf, lc, cc, suffix = '') => {
    const parts = [
      cf > 0 && `CF ${cf}${suffix}`,
      lc > 0 && `LC ${lc}${suffix}`,
      cc > 0 && `CC ${cc}${suffix}`,
    ].filter(Boolean);
    return parts.length ? parts : null;
  };

  const cards = [
    {
      meta: CARDS_META[0],
      value: totalSolved ?? '—',
      sub: 'problems solved',
      extra: platformBreakdown(cfSolved, lcSolved, ccSolved),
    },
    {
      meta: CARDS_META[1],
      value: activeDays ?? '—',
      sub: activeDaysThisMonth ? `${activeDaysThisMonth} active this month` : '0 this month',
      extra: null,
    },
    {
      meta: CARDS_META[2],
      value: totalSubmissions ?? '—',
      sub: 'total attempts across platforms',
      extra: platformBreakdown(cfTotalSubmissions, lcTotalSubmissions, ccTotalSubmissions),
    },
    {
      meta: CARDS_META[3],
      value: currentStreak ? `${currentStreak}d` : '0d',
      sub: `best ${bestStreak ?? 0} days`,
      extra: null,
    },
    {
      meta: CARDS_META[4],
      value: acceptanceRate != null ? `${acceptanceRate}%` : '—',
      sub: 'success rate',
      extra: [
        cfAcceptanceRate != null && `CF ${cfAcceptanceRate}%`,
        lcAcceptanceRate != null && `LC ${lcAcceptanceRate}%`,
        ccAcceptanceRate != null && `CC ${ccAcceptanceRate}%`,
      ].filter(Boolean) || null,
    },
    {
      meta: CARDS_META[5],
      value: solvedThisMonth ?? 0,
      sub: 'this month',
      extra: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {cards.map((c, i) => <StatCard key={i} {...c} />)}
    </div>
  );
}
