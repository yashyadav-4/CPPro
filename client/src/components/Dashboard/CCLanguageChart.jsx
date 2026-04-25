const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

// Distinct colors for up to 8 languages
const PALETTE = [
  '#3b82f6', '#10b981', '#f97316', '#8b5cf6',
  '#ef4444', '#06b6d4', '#f59e0b', '#6b7280',
];

export default function CCLanguageChart({ loading, languages }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 h-full">
        <Skeleton className="h-3 w-28 mb-4" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-6 w-full mb-3" />)}
      </div>
    );
  }

  const langs = Array.isArray(languages) ? languages : [];
  const total = langs.reduce((s, l) => s + l.count, 0);
  const max = langs[0]?.count || 1;

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-baseline justify-between mb-4 shrink-0">
        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Languages Used
        </p>
        {total > 0 && (
          <span className="text-xs text-gray-400 tabular-nums">{total} total</span>
        )}
      </div>

      {langs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-gray-400 font-normal">No submission data yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-1">
          {langs.map((l, i) => {
            const pct = Math.round((l.count / max) * 100);
            const share = total > 0 ? Math.round((l.count / total) * 100) : 0;
            const color = PALETTE[i] || '#6b7280';
            return (
              <div key={l.lang} className="flex items-center gap-3">
                <span
                  className="text-xs font-medium w-20 shrink-0 truncate text-gray-700 dark:text-gray-300"
                  title={l.lang}
                >
                  {l.lang}
                </span>
                <div className="flex-1 bg-gray-100 dark:bg-white/[0.06] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400 w-14 text-right shrink-0">
                  {l.count} <span className="text-gray-400 dark:text-gray-600">·{share}%</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
