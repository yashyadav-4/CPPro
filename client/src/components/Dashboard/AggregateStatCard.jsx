import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, CalendarDays } from 'lucide-react';

function useCountUp(target, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

export default function AggregateStatCard({ type, stats, platformCounts }) {
  const isSolved = type === 'solved';
  const raw = isSolved ? stats.totalCombinedSolved : stats.totalCombinedActiveDays;
  const animated = useCountUp(raw);

  const Icon = isSolved ? Target : CalendarDays;
  const glow = isSolved ? 'card-glow-indigo' : 'card-glow-emerald';
  const numGlow = isSolved ? 'num-glow-indigo' : 'num-glow-emerald';
  const iconCls = isSolved
    ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400'
    : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400';

  return (
    <motion.div
      className={`card-glow ${glow} bg-white dark:bg-[#13131d] border border-gray-200 dark:border-[#1e1e2e] rounded-2xl p-6 flex flex-col justify-between`}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: isSolved ? 0.1 : 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconCls}`}>
          <Icon size={20} />
        </div>
        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {isSolved ? 'Problems Solved' : 'Active Days'}
        </span>
      </div>

      <div className="mb-3">
        <h2 className={`text-4xl font-black text-gray-900 dark:text-white ${numGlow}`}>
          {animated.toLocaleString()}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isSolved
            ? `Total Questions: ${stats.totalCombinedSolved.toLocaleString()}`
            : <>Total Submissions: <span className="text-emerald-500 font-semibold">{stats.totalCombinedSubmissions.toLocaleString()}</span></>}
        </p>
      </div>

      {isSolved && platformCounts && (
        <div className="flex gap-2 mt-auto pt-2">
          <span className="platform-pill bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">CF: {platformCounts.codeforces}</span>
          <span className="platform-pill bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">LC: {platformCounts.leetcode}</span>
          <span className="platform-pill bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400">CC: {platformCounts.codechef}</span>
        </div>
      )}
    </motion.div>
  );
}
