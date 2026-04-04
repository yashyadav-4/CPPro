// WeekStreak.jsx — improved number visibility, better dot size
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeekStreak({
  loading, currentStreak, bestStreak, bestStreakPlatform,
  last7Days, solvedThisMonth, solvedLastMonth,
}) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
        <Skeleton className="h-3 w-24 mb-4" />
        <div className="flex justify-between mb-5">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-9 w-9 rounded-full" />)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    );
  }

  const days = last7Days || [];
  const platformLabel = bestStreakPlatform === 'codeforces' ? 'CF' : bestStreakPlatform === 'leetcode' ? 'LC' : '';

  return (
    <div className="bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
      <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">This Week</p>

      {/* 7-day dot row */}
      <div className="flex justify-between mb-4">
        {DAY_LABELS.map((label, i) => {
          const day = days[i] || { solved: false };
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                day.solved ? 'bg-green-500' : 'bg-gray-100 dark:bg-white/[0.06]'
              }`}>
                {day.solved && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">{label[0]}</span>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-3 border-t border-gray-100 dark:border-white/[0.05]">
        <div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-normal mb-0.5">Current Streak</p>
          <p className={`text-2xl font-medium tabular-nums ${currentStreak > 0 ? 'text-orange-500' : 'text-gray-900 dark:text-[#F9FAFB]'}`}>
            {currentStreak ?? 0}<span className="text-base ml-0.5">d</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-normal mb-0.5">
            Best {platformLabel && <span className="text-gray-300 dark:text-gray-600">({platformLabel})</span>}
          </p>
          <p className="text-2xl font-medium text-gray-900 dark:text-[#F9FAFB] tabular-nums">
            {bestStreak ?? 0}<span className="text-base ml-0.5">d</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-normal mb-0.5">This Month</p>
          <p className="text-2xl font-medium text-gray-900 dark:text-[#F9FAFB] tabular-nums">{solvedThisMonth ?? 0}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-normal mb-0.5">Last Month</p>
          <p className="text-2xl font-medium text-gray-900 dark:text-[#F9FAFB] tabular-nums">{solvedLastMonth ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
