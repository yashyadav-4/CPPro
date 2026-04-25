const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

const VERDICTS = [
  { key: 'AC',    label: 'Accepted',            color: '#10b981', bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'WA',    label: 'Wrong Answer',         color: '#ef4444', bg: 'bg-red-500/10 dark:bg-red-500/15',         text: 'text-red-600 dark:text-red-400' },
  { key: 'TLE',   label: 'Time Limit Exceeded',  color: '#f97316', bg: 'bg-orange-500/10 dark:bg-orange-500/15',   text: 'text-orange-600 dark:text-orange-400' },
  { key: 'MLE',   label: 'Memory Limit Exceeded',color: '#8b5cf6', bg: 'bg-violet-500/10 dark:bg-violet-500/15',   text: 'text-violet-600 dark:text-violet-400' },
  { key: 'RE',    label: 'Runtime Error',        color: '#f59e0b', bg: 'bg-amber-500/10 dark:bg-amber-500/15',     text: 'text-amber-600 dark:text-amber-400' },
  { key: 'CE',    label: 'Compile Error',        color: '#06b6d4', bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',       text: 'text-cyan-600 dark:text-cyan-400' },
  { key: 'PA',    label: 'Partial',              color: '#eab308', bg: 'bg-yellow-500/10 dark:bg-yellow-500/15',   text: 'text-yellow-600 dark:text-yellow-400' },
  { key: 'OTHER', label: 'Other',                color: '#6b7280', bg: 'bg-gray-500/10 dark:bg-gray-500/15',       text: 'text-gray-500 dark:text-gray-400' },
];

export default function CCVerdictBreakdown({ loading, verdictBreakdown, totalSubmissions }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 h-full">
        <Skeleton className="h-3 w-32 mb-4" />
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-5 w-full mb-2" />)}
      </div>
    );
  }

  const vd = verdictBreakdown || {};
  const total = totalSubmissions || 0;

  const rows = VERDICTS.map(v => ({ ...v, count: vd[v.key] || 0 })).filter(v => v.count > 0);
  if (rows.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 h-full flex flex-col">
        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
          Verdict Breakdown
        </p>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-gray-400 font-normal">No submission data yet</p>
        </div>
      </div>
    );
  }

  // Top 4 as badge tiles, rest as bar rows
  const top = rows.slice(0, 4);
  const rest = rows.slice(4);
  const maxCount = Math.max(...rows.map(r => r.count), 1);

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-baseline justify-between mb-4 shrink-0">
        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Verdict Breakdown
        </p>
        {total > 0 && (
          <span className="text-xs text-gray-400 tabular-nums">{total} submissions</span>
        )}
      </div>

      {/* Top verdict tiles */}
      <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
        {top.map(v => {
          const pct = total > 0 ? Math.round((v.count / total) * 100) : 0;
          return (
            <div key={v.key} className={`rounded-lg p-3 ${v.bg}`}>
              <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${v.text}`}>{v.key}</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{v.count}</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{pct}% of total</div>
            </div>
          );
        })}
      </div>

      {/* Remaining as bar rows */}
      {rest.length > 0 && (
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
          {rest.map(v => {
            const pct = Math.round((v.count / maxCount) * 100);
            return (
              <div key={v.key} className="flex items-center gap-3">
                <span className={`text-[10px] font-bold w-10 shrink-0 ${v.text}`}>{v.key}</span>
                <div className="flex-1 bg-gray-100 dark:bg-white/[0.06] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: v.color }}
                  />
                </div>
                <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400 w-8 text-right shrink-0">{v.count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
