// TopTopics.jsx — top 8 topics with proportional bars
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

export default function TopTopics({ loading, topics }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
        <Skeleton className="h-3 w-24 mb-4" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <Skeleton className="h-3 w-24 shrink-0" />
            <Skeleton className="h-1.5 flex-1" />
            <Skeleton className="h-3 w-6" />
          </div>
        ))}
      </div>
    );
  }

  const top8 = (topics || []).slice(0, 8);
  const maxCount = Math.max(...top8.map(t => t.count), 1);

  if (top8.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 flex items-center justify-center">
        <span className="text-sm text-gray-400 font-normal">No topic data</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
      <p className="text-xs text-gray-400 dark:text-[#9CA3AF] font-normal uppercase tracking-wide mb-4">Top Topics</p>
      <div className="flex flex-col gap-3">
        {top8.map((t, i) => {
          const pct = Math.round((t.count / maxCount) * 100);
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-[#E5E7EB] w-32 shrink-0 truncate pr-2 capitalize" title={t.name}>
                {t.name}
              </span>
              <div className="flex-1 bg-gray-100 dark:bg-white/[0.06] rounded-full h-2 overflow-hidden mx-2">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-[#F9FAFB] w-12 text-right tabular-nums">
                {t.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
