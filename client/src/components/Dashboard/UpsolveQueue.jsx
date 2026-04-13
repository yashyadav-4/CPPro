// UpsolveQueue.jsx — problems attempted but not solved
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

const VERDICT_LABEL = {
  WA: 'Wrong Answer',
  TLE: 'Time Limit',
  MLE: 'Memory Limit',
  RE: 'Runtime Error',
  CE: 'Compile Error',
  OTHER: 'Other',
};

const VERDICT_COLOR = {
  WA: 'bg-red-400',
  TLE: 'bg-amber-400',
  MLE: 'bg-purple-400',
  RE: 'bg-orange-400',
  CE: 'bg-pink-400',
  OTHER: 'bg-gray-400',
};

export default function UpsolveQueue({ loading, problems }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
        <Skeleton className="h-3 w-28 mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 mb-3">
            <Skeleton className="h-2 w-2 rounded-full mt-1 shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-3 w-36 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-10" />
          </div>
        ))}
      </div>
    );
  }

  const list = (problems || []).slice(0, 10);

  if (list.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 flex flex-col items-center justify-center gap-2 min-h-[120px]">
        <span className="text-lg">✅</span>
        <span className="text-sm text-gray-400 font-normal">All caught up!</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 flex flex-col h-full max-h-[400px]">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <p className="text-xs text-gray-400 dark:text-gray-500 font-normal uppercase tracking-wide">Upsolve Queue</p>
        <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">{list.length} problems</span>
      </div>
      <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.04] overflow-y-auto custom-scrollbar pr-1">
        {list.map((p, i) => {
          const dotColor = VERDICT_COLOR[p.failReason] || 'bg-gray-400';
          const verdictLabel = VERDICT_LABEL[p.failReason] || p.failReason;
          const href = p.platform === 'leetcode'
            ? `https://leetcode.com/problems/${p.problemId}/`
            : p.problemId ? `https://codeforces.com/problemset/problem/${p.problemId.replace(/([A-Z].*)/, '/$1')}` : '#';
            
          return (
            <a 
              key={i} 
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] px-1 -mx-1 rounded transition-colors group cursor-pointer"
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-xs text-gray-700 dark:text-[#E5E7EB] font-medium truncate mb-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{p.title}</p>
                <p className="text-[10px] text-gray-400 dark:text-[#9CA3AF] font-normal truncate">
                  {p.contestName} • {p.attempts} attempt{p.attempts !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Right side stats */}
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-[#F9FAFB] tabular-nums leading-tight">
                  {p.rating > 0 ? p.rating : '—'}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-[#6B7280] font-normal capitalize mt-0.5">
                  {verdictLabel}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
