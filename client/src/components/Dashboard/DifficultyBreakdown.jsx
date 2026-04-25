// DifficultyBreakdown.jsx — per-rating bars for CF, collapsed + hover-expand if many
import { useState } from 'react';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

// Color ramp by CF rating bracket
function ratingColor(rating) {
  if (rating <= 1200) return 'bg-gray-400 dark:bg-gray-500';
  if (rating <= 1400) return 'bg-emerald-500';
  if (rating <= 1600) return 'bg-cyan-500';
  if (rating <= 1900) return 'bg-blue-500';
  if (rating <= 2100) return 'bg-violet-500';
  if (rating <= 2300) return 'bg-orange-500';
  if (rating <= 2400) return 'bg-orange-600';
  if (rating <= 2600) return 'bg-red-500';
  return 'bg-red-700';
}

const LC_COLORS = ['bg-emerald-400', 'bg-amber-400', 'bg-rose-500'];

function CfRow({ rating, count, maxCount }) {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 dark:text-[#D1D5DB] font-normal w-10 shrink-0 tabular-nums">{rating}</span>
      <div className="flex-1 bg-gray-100 dark:bg-white/[0.06] rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${ratingColor(rating)} transition-all duration-300`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-[#E5E7EB] w-8 text-right tabular-nums">{count}</span>
    </div>
  );
}

function LcRow({ label, count, maxCount, colorClass }) {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 dark:text-[#D1D5DB] font-normal w-14 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 dark:bg-white/[0.06] rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-300`}
          style={{ width: `${Math.max(pct, count > 0 ? 2 : 0)}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-[#E5E7EB] w-8 text-right tabular-nums">{count}</span>
    </div>
  );
}

export default function DifficultyBreakdown({ loading, cfBands, lcBands }) {
  const [tab, setTab] = useState('cf');

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
        <Skeleton className="h-3 w-32 mb-4" />
        <div className="flex gap-1 mb-5">
          <Skeleton className="h-6 w-12 rounded-md" /><Skeleton className="h-6 w-12 rounded-md" />
        </div>
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full mb-3" />)}
      </div>
    );
  }

  const cfRows = (cfBands || []).filter(b => b.count > 0);
  const hasCf = cfRows.length > 0;
  const hasLc = lcBands && lcBands.some(b => b.count > 0);
  const activeTab = !hasCf ? 'lc' : !hasLc ? 'cf' : tab;

  const isCfTab = activeTab === 'cf';
  const rows = isCfTab ? cfRows : (lcBands || []);
  const maxCount = Math.max(...rows.map(r => r.count), 1);
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 flex flex-col h-full max-h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Difficulty Breakdown
        </p>
        <div className="flex gap-1">
          {hasCf && (
            <button
               onClick={() => setTab('cf')}
               className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${activeTab === 'cf'
                 ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-500'
                 : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
             >Codeforces</button>
          )}
          {hasLc && (
            <button
               onClick={() => setTab('lc')}
               className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${activeTab === 'lc'
                 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500'
                 : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
             >LeetCode</button>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="flex items-baseline gap-2 mb-4 shrink-0">
        <span className="text-2xl font-medium text-gray-900 dark:text-[#F9FAFB] tabular-nums">{total}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">
          {isCfTab ? `across ${rows.length} rating${rows.length !== 1 ? 's' : ''}` : 'problems'}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-gray-400 font-normal text-center py-4">No data yet</p>
      ) : (
        <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 pb-1 flex-1 min-h-[100px] custom-scrollbar">
          {rows.map((r, i) =>
            isCfTab
              ? <CfRow key={r.rating} rating={r.rating} count={r.count} maxCount={maxCount} />
              : <LcRow key={i} label={r.label} count={r.count} maxCount={maxCount} colorClass={LC_COLORS[i] || 'bg-gray-400'} />
          )}
        </div>
      )}
    </div>
  );
}
