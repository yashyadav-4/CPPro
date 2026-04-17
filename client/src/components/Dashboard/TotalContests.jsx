import React from 'react';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

function CodeforcesMark({ className = '' }) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className}>
            <rect x="3" y="12" width="5" height="9" fill="#1F8ACB" />
            <rect x="9.5" y="6" width="5" height="15" fill="#1F8ACB" />
            <rect x="16" y="2" width="5" height="19" fill="#E84142" />
        </svg>
    );
}

function LeetCodeMark({ className = '' }) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFA116" className={className}>
            <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125 1.513 5.527 5.527 0 0 0 .524 1.83 5.4 5.4 0 0 0 1.258 1.547l3.851 3.535A1.374 1.374 0 0 0 8.647 24h.016a1.37 1.37 0 0 0 1.055-.546l.01-.013c.277-.386.23-.923-.105-1.255l-3.858-3.54a3.178 3.178 0 0 1-.77-1.026 3.084 3.084 0 0 1-.295-1.07 3.014 3.014 0 0 1 .063-.889 3.045 3.045 0 0 1 .715-1.265l3.86-4.133 5.41-5.792a1.37 1.37 0 0 0 .15-1.42 1.374 1.374 0 0 0-1.405-.913z" />
            <path d="M22.062 14.161H10.158a1.37 1.37 0 0 0-1.37 1.37 1.37 1.37 0 0 0 1.37 1.37h11.904a1.37 1.37 0 0 0 1.37-1.37 1.37 1.37 0 0 0-1.37-1.37z" />
        </svg>
    );
}

export default function TotalContests({ loading, cfContests = 0, lcContests = 0, cfBestRank, lcBestRank }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-6 flex flex-col justify-center min-h-[140px]">
        <div className="flex items-center gap-6">
          <div className="w-1/3 flex flex-col items-center">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-12 w-20" />
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const total = cfContests + lcContests;
  
  const validRanks = [cfBestRank, lcBestRank].filter(r => r != null && r > 0);
  const globalBest = validRanks.length > 0 ? Math.min(...validRanks) : null;

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-6 flex items-center min-h-[140px]">
      {/* Left side: Total */}
      <div className="w-1/3 flex flex-col items-center justify-center border-r border-gray-100 dark:border-white/[0.05] pr-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Contests</span>
        <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">{total}</span>
        {globalBest && (
          <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-wide mt-2">
            Peak Rank: #{globalBest}
          </span>
        )}
      </div>

      {/* Right side: Platforms */}
      <div className="flex-1 flex flex-col gap-2.5 pl-6">
        {lcContests > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] rounded-lg">
            <div className="flex items-center gap-2.5">
              <LeetCodeMark />
              <div className="flex flex-col">
                 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">LeetCode</span>
                 {lcBestRank && <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Best Rank: {lcBestRank}</span>}
              </div>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{lcContests}</span>
          </div>
        )}
        {cfContests > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] rounded-lg">
            <div className="flex items-center gap-2.5">
              <CodeforcesMark />
              <div className="flex flex-col">
                 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Codeforces</span>
                 {cfBestRank && <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Best Rank: {cfBestRank}</span>}
              </div>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{cfContests}</span>
          </div>
        )}
        {total === 0 && (
          <div className="flex items-center justify-center p-4 text-sm text-gray-400">
             No rated contests found.
          </div>
        )}
      </div>
    </div>
  );
}
