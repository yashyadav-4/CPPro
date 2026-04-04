// SkillGaps.jsx — Topic Mastery by Volume and Accuracy
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

const STATUS_CONFIG = {
  strong: { bar: 'bg-green-500' },
  fair: { bar: 'bg-amber-400' },
  weak: { bar: 'bg-red-500' },
};

export default function SkillGaps({ loading, skills }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
        <Skeleton className="h-3 w-24 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const list = skills || [];

  if (list.length === 0) {
    return (
      <div className="bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 flex items-center justify-center min-h-[120px]">
        <span className="text-sm text-gray-400 font-normal">Solve more problems to see topic mastery</span>
      </div>
    );
  }

  const maxSolved = Math.max(...list.map(s => s.solved || 0), 1);

  return (
    <div className="bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">Topic Mastery</p>
        <div className="flex items-center gap-4">
          <div className="flex gap-3">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {'≥65% acc'}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> {'40-64%'}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {'<40%'}
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-normal border-l border-gray-100 dark:border-white/[0.06] pl-4">
            {list.length} topics
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-3">
        {list.map((s, i) => {
          const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.fair;
          const volumePct = Math.round((s.solved / maxSolved) * 100);
          
          return (
            <div key={i} className="flex items-center justify-between group">
              <span className="text-sm text-gray-700 dark:text-[#E5E7EB] font-normal truncate pr-2 group-hover:text-indigo-500 transition-colors" title={s.topic}>
                {s.topic}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-20 bg-gray-100 dark:bg-white/[0.06] rounded-full h-[6px] overflow-hidden" title={`${s.solved} solved out of max ${maxSolved}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
                    style={{ width: `${Math.max(volumePct, 2)}%` }}
                  />
                </div>
                <div className="flex flex-col items-end w-12 shrink-0">
                  <span className="text-xs font-semibold text-gray-700 dark:text-[#E5E7EB] tabular-nums leading-none mb-0.5">
                    {s.solved}
                  </span>
                  <span className="text-[9px] text-gray-400 dark:text-[#9CA3AF] tabular-nums leading-none">
                    {s.accuracy}% acc
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
