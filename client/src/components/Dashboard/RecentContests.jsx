// RecentContests.jsx — last 6 contests across CF and LC
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

export default function RecentContests({ loading, contests }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
        <Skeleton className="h-3 w-32 mb-4" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <Skeleton className="h-5 w-5 rounded-full shrink-0" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    );
  }

  const list = (contests || []).slice(0, 15);

  if (list.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 flex items-center justify-center">
        <span className="text-sm text-gray-400 font-normal">No contest history</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 flex flex-col h-full max-h-[400px]">
      <p className="text-xs text-gray-400 dark:text-gray-500 font-normal uppercase tracking-wide mb-3 shrink-0">Recent Contests</p>
      <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.04] overflow-y-auto custom-scrollbar pr-1">
        {list.map((c, i) => {
          const isCf = c.platform === 'codeforces';
          const delta = c.ratingChange;
          const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
          const deltaColor = delta > 0
            ? 'text-green-500'
            : delta < 0
              ? 'text-red-500'
              : 'text-gray-400';

          return (
            <a key={i} href={c.url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 py-2.5 hover:bg-amber-50 dark:hover:bg-amber-400/10 px-2 -mx-2 rounded-lg transition-colors">
              {/* Platform badge */}
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                isCf ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-500' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-500'
              }`}>
                {isCf ? 'CF' : 'LC'}
              </span>

              {/* Name */}
              <div className="min-w-0 flex-1 pl-1">
                <p className="text-xs text-gray-700 dark:text-[#E5E7EB] font-normal truncate">{c.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] text-gray-500 dark:text-[#9CA3AF] font-normal">{c.date}</p>
                  {c.solved !== undefined && (
                    <span className="text-[10px] text-gray-400 dark:text-[#6B7280] bg-gray-50 dark:bg-white/5 px-1.5 rounded">
                      {c.solved}{c.total ? `/${c.total}` : ''} solved
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 pl-3">
                <span className={`text-sm font-medium tabular-nums ${delta > 0 ? 'text-green-500' : delta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {delta > 0 ? `+${delta}` : delta}
                </span>
                {c.rank != null && <span className="text-[10px] text-gray-400 dark:text-[#6B7280]">#{c.rank}</span>}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
