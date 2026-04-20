// SkillGaps.jsx — Topic Mastery by Volume and Accuracy
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

const STATUS_CONFIG = {
  strong: { bar: 'bg-green-500' },
  fair:   { bar: 'bg-amber-400' },
  weak:   { bar: 'bg-red-500' },
};

export default function SkillGaps({ loading, skills }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
        <Skeleton className="h-3 w-24 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-1.5 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const list = skills || [];

  if (list.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 flex items-center justify-center min-h-[120px]">
        <span className="text-sm text-gray-400 font-normal">Solve more problems to see topic mastery</span>
      </div>
    );
  }

  const maxSolved = Math.max(...list.map(s => s.solved || 0), 1);

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">Topic Mastery</p>
        <div className="flex items-center gap-4">
          <div className="flex gap-3">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" /> ≥65%
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" /> 40–64%
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" /> &lt;40%
            </span>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 border-l border-gray-100 dark:border-white/[0.06] pl-4">
            {list.length} topics
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-3">
        {list.map((s, i) => {
          const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.fair;
          const volumePct = Math.round((s.solved / maxSolved) * 100);

          return (
            <div key={i} className="flex flex-col gap-1 min-w-0">
              {/* Name + count row */}
              <div className="flex items-center justify-between gap-1 min-w-0">
                <span
                  className="text-[11px] font-medium text-gray-700 dark:text-[#D1D5DB] capitalize truncate leading-tight"
                  title={s.topic}
                >
                  {s.topic}
                </span>
                <span className="text-[11px] font-bold text-gray-700 dark:text-[#E5E7EB] tabular-nums flex-shrink-0 ml-1">
                  {s.solved}
                </span>
              </div>

              {/* Bar */}
              <div className="w-full bg-gray-100 dark:bg-white/[0.06] rounded-full h-[5px] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
                  style={{ width: `${Math.max(volumePct, 2)}%` }}
                />
              </div>

              {/* Accuracy */}
              <span className="text-[9px] text-gray-400 dark:text-[#6B7280] tabular-nums">
                {s.accuracy}% acc
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
