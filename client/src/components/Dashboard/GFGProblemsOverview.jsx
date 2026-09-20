import React from 'react';

const Skeleton = () => (
  <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-5 h-full animate-pulse">
    <div className="h-4 w-36 bg-gray-200 dark:bg-white/10 rounded mb-6" />
    <div className="flex items-center justify-around h-48">
      <div className="w-36 h-36 rounded-full border-8 border-gray-200 dark:border-white/10" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 w-28 bg-gray-200 dark:bg-white/10 rounded" />
        ))}
      </div>
    </div>
  </div>
);

const DIFFICULTY_CONFIG = [
  { key: 'school', label: 'School', color: '#67e8f9', darkColor: '#22d3ee' },
  { key: 'basic',  label: 'Basic',  color: '#bef264', darkColor: '#a3e635' },
  { key: 'easy',   label: 'Easy',   color: '#4ade80', darkColor: '#22c55e' },
  { key: 'medium', label: 'Medium', color: '#fbbf24', darkColor: '#f59e0b' },
  { key: 'hard',   label: 'Hard',   color: '#fb923c', darkColor: '#ea580c' },
];

export default function GFGProblemsOverview({ loading, solvedByDifficulty, totalSolved }) {
  if (loading) return <Skeleton />;

  const diff = solvedByDifficulty || {};
  const total = totalSolved ?? (
    (diff.school || 0) + (diff.basic || 0) + (diff.easy || 0) + (diff.medium || 0) + (diff.hard || 0)
  );

  // Calculate SVG donut stroke dasharray
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  const segments = DIFFICULTY_CONFIG.map(cfg => {
    const count = diff[cfg.key] || 0;
    const fraction = total > 0 ? count / total : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedAngle * circumference;
    accumulatedAngle += fraction;
    return {
      ...cfg,
      count,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-5 h-full flex flex-col justify-between">
      {/* Title */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
          Problems Overview
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto">
        {/* Donut Chart */}
        <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
            {/* Background track circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              className="text-gray-100 dark:text-white/[0.05]"
              strokeWidth="15"
            />
            {/* Donut segments */}
            {total > 0 && segments.map(seg => (
              seg.count > 0 && (
                <circle
                  key={seg.key}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth="15"
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              )
            ))}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
            <span
              className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight tabular-nums"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {total}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-tight mt-0.5">
              Problems<br />Solved
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 w-full sm:w-auto">
          {segments.map(seg => (
            <div key={seg.key} className="flex items-center gap-2.5">
              <span
                className="w-3 h-3 rounded-[3px] shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {seg.label}
              </span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tabular-nums ml-auto sm:ml-0">
                ({seg.count})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
