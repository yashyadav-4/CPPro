// GFGStatCards.jsx — Dedicated stat cards for GeeksforGeeks view
import { Trophy, Zap, TrendingUp, Award } from 'lucide-react';

const Skeleton = () => (
  <div className="bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-2xl h-36 animate-pulse" />
);

const GFG_CARDS_META = [
  { label: 'Total Solved',   icon: Trophy,     color: '#10b981', glow: 'rgba(16,185,129,0.15)' },
  { label: 'Coding Score',   icon: Zap,        color: '#2F8D46', glow: 'rgba(47,141,70,0.15)'  },
  { label: 'Monthly Score',  icon: TrendingUp, color: '#8b5cf6', glow: 'rgba(139,92,246,0.15)' },
  { label: 'Campus Rank',    icon: Award,      color: '#3b82f6', glow: 'rgba(59,130,246,0.15)' },
];

function GfgCardItem({ meta, value, sub }) {
  const Icon = meta.icon;
  return (
    <div className="relative rounded-2xl overflow-hidden group bg-white dark:bg-white/[0.025] border border-gray-100 dark:border-white/[0.06] shadow-sm dark:shadow-none">
      {/* Colored top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${meta.color}, transparent)` }} />

      {/* Background glow on hover */}
      <div
        className="absolute bottom-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: meta.glow }}
      />

      <div className="relative z-10 p-5 flex flex-col h-full justify-between">
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
        <div>
          <span
            className="text-[2rem] font-bold leading-none text-gray-900 dark:text-white tracking-tight tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {value}
          </span>

          {/* Sub */}
          <span className="mt-2 text-[10px] text-gray-500 uppercase tracking-wide font-medium leading-tight block">
            {sub}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function GFGStatCards({ loading, totalSolved, codingScore, monthlyScore, instituteRank, institution }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  const cards = [
    {
      meta: GFG_CARDS_META[0],
      value: totalSolved != null ? totalSolved.toLocaleString() : '0',
      sub: 'problems solved',
    },
    {
      meta: GFG_CARDS_META[1],
      value: codingScore != null ? codingScore.toLocaleString() : '0',
      sub: 'total coding score',
    },
    {
      meta: GFG_CARDS_META[2],
      value: monthlyScore != null ? monthlyScore.toLocaleString() : '0',
      sub: 'points this month',
    },
    {
      meta: GFG_CARDS_META[3],
      value: instituteRank > 0 ? `#${instituteRank.toLocaleString()}` : '—',
      sub: institution ? institution : 'campus standing',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c, i) => <GfgCardItem key={i} {...c} />)}
    </div>
  );
}
