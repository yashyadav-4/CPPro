// LCSkillBreakdown — LC skill tier breakdown (Fundamental / Intermediate / Advanced)
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

const TIERS = [
  {
    key: 'fundamental',
    label: 'Fundamental',
    desc: 'Core concepts',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    key: 'intermediate',
    label: 'Intermediate',
    desc: 'Applied patterns',
    dot: 'bg-amber-400',
    bar: 'bg-amber-400',
    badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    key: 'advanced',
    label: 'Advanced',
    desc: 'Hard problems',
    dot: 'bg-purple-400',
    bar: 'bg-purple-400',
    badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
];

function TierSection({ tier, topics, maxCount }) {
  const top = (topics || []).slice(0, 6);
  if (top.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tier.dot}`} />
        <span className={`text-[10px] font-bold uppercase tracking-widest border px-1.5 py-0.5 rounded ${tier.badge}`}>
          {tier.label}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">{tier.desc}</span>
      </div>
      {top.map((t, i) => (
        <div key={i} className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] text-gray-700 dark:text-gray-300 font-medium capitalize truncate">{t.name}</span>
            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 tabular-nums flex-shrink-0 ml-1">{t.count}</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-white/[0.05] rounded-full h-[4px] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${tier.bar}`}
              style={{ width: `${Math.max(Math.round((t.count / maxCount) * 100), 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LCSkillBreakdown({ loading, fundamental, intermediate, advanced }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
        <Skeleton className="h-3 w-36 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-3 w-full" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const allTopics = [...(fundamental || []), ...(intermediate || []), ...(advanced || [])];
  const maxCount = Math.max(...allTopics.map(t => t.count), 1);
  const totalSolved = allTopics.reduce((s, t) => s + t.count, 0);

  if (allTopics.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 flex items-center justify-center min-h-[120px]">
        <span className="text-sm text-gray-400 font-normal">Solve more LC problems to see skill breakdown</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          LC Skill Breakdown
        </p>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {totalSolved} problems across {allTopics.length} topics
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {TIERS.map(tier => (
          <TierSection
            key={tier.key}
            tier={tier}
            topics={tier.key === 'fundamental' ? fundamental : tier.key === 'intermediate' ? intermediate : advanced}
            maxCount={maxCount}
          />
        ))}
      </div>
    </div>
  );
}
