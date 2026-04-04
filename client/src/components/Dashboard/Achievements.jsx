// Achievements.jsx — combined CF+LC achievement grid
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

const PLATFORM_CONFIG = {
  codeforces: { label: 'CF', badge: 'bg-blue-50 dark:bg-[#1e293b] text-blue-500' },
  leetcode: { label: 'LC', badge: 'bg-amber-50 dark:bg-[#2d2416] text-amber-500' },
  combined: { label: '⚡', badge: 'bg-indigo-50 dark:bg-[#1e1b4b] text-indigo-500' },
};

function AchievementCard({ icon, label, platform, earned, progress }) {
  const pcfg = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.combined;
  const pct = Math.round((progress || 0) * 100);

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-lg border transition-all ${
      earned
        ? 'bg-white dark:bg-[#2a2a2a] border-black/[0.07] dark:border-[#404040]'
        : 'bg-gray-50 dark:bg-[#202020] border-dashed border-black/[0.05] dark:border-[#333333] opacity-60'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${pcfg.badge}`}>{pcfg.label}</span>
      </div>
      <p className={`text-xs font-normal leading-tight ${earned ? 'text-gray-700 dark:text-[#d1d5db]' : 'text-gray-400 dark:text-[#6b7280]'}`}>
        {label}
      </p>
      {!earned && (
        <div className="w-full bg-gray-200 dark:bg-[#333333] rounded-full h-1 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-400 dark:bg-indigo-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {!earned && (
        <span className="text-[10px] text-gray-400 dark:text-[#6b7280] font-normal">{pct}% progress</span>
      )}
    </div>
  );
}

export default function Achievements({ loading, achievements }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-[#404040] rounded-xl p-4">
        <Skeleton className="h-3 w-28 mb-4" />
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const list = achievements || [];
  const earned = list.filter(a => a.earned);
  const inProgress = list.filter(a => !a.earned);
  const earnedCount = earned.length;

  return (
    <div className="bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-medium text-gray-400 dark:text-[#9CA3AF] uppercase tracking-widest">Achievements</p>
        <span className="text-xs text-gray-400 dark:text-[#9CA3AF] font-normal">{earnedCount} / {list.length} earned</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {/* Earned first */}
        {earned.map((a, i) => <AchievementCard key={`e-${i}`} {...a} />)}
        {/* Then in-progress */}
        {inProgress.map((a, i) => <AchievementCard key={`p-${i}`} {...a} />)}
      </div>
    </div>
  );
}
