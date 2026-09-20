import React, { useState, useMemo } from 'react';
import { ClipboardList, ChevronRight, ExternalLink } from 'lucide-react';

const Skeleton = () => (
  <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-5 h-full animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-white/10" />
        <div className="space-y-1.5">
          <div className="h-4 w-36 bg-gray-200 dark:bg-white/10 rounded" />
          <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded" />
        </div>
      </div>
      <div className="h-8 w-32 bg-gray-200 dark:bg-white/10 rounded-lg" />
    </div>
    <div className="space-y-2 mt-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-12 w-full bg-gray-200 dark:bg-white/5 rounded-lg" />
      ))}
    </div>
  </div>
);

function timeAgo(value) {
  if (!value) return '';
  const ms = new Date(value).getTime();
  if (!ms || isNaN(ms) || ms <= 0) return '';
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 0) return 'recently';
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} hours ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDifficultyBadge(diff) {
  const d = String(diff || '').toLowerCase();
  if (d === 'school') {
    return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
  }
  if (d === 'basic') {
    return 'bg-lime-500/10 text-lime-500 border-lime-500/20';
  }
  if (d === 'easy') {
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  }
  if (d === 'medium') {
    return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  }
  if (d === 'hard') {
    return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
  }
  return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
}

export default function GFGProblemsBreakdown({ loading, problems = [], totalSolved }) {
  const [filterDifficulty, setFilterDifficulty] = useState('ALL');

  const filteredProblems = useMemo(() => {
    if (!problems || !problems.length) return [];
    if (filterDifficulty === 'ALL') return problems;
    return problems.filter(p => (p.difficulty || '').toUpperCase() === filterDifficulty);
  }, [problems, filterDifficulty]);

  if (loading) return <Skeleton />;

  const total = totalSolved ?? problems.length;

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
        {/* Left: icon + title + count */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20">
            <ClipboardList size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
              Problems Breakdown
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <span>{total} Total Problems</span>
            </p>
          </div>
        </div>

        {/* Right: Difficulty Filter Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Submissions</option>
            <option value="SCHOOL">School</option>
            <option value="BASIC">Basic</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>

      {/* Problem Items List */}
      {filteredProblems.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <p className="text-xs text-gray-400 dark:text-gray-500">No problems found</p>
        </div>
      ) : (
        <div className="space-y-1 overflow-y-auto max-h-[460px] pr-1 custom-scrollbar">
          {filteredProblems.map((prob, i) => {
            const problemUrl = prob.slug
              ? `https://www.geeksforgeeks.org/problems/${prob.slug}/1`
              : null;
            const diffClass = getDifficultyBadge(prob.difficulty);
            const timeStr = timeAgo(prob.submittedAt);

            return (
              <a
                key={prob.id || i}
                href={problemUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-transparent transition-all duration-150 group ${
                  problemUrl
                    ? 'hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:border-black/[0.04] dark:hover:border-white/[0.04] cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                {/* Title + Difficulty Pill */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {prob.title || prob.slug || 'Problem'}
                  </span>
                  {prob.difficulty && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${diffClass}`}
                    >
                      {prob.difficulty}
                    </span>
                  )}
                </div>

                {/* Timestamp + Chevron */}
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 shrink-0">
                  {timeStr && (
                    <span className="hidden sm:inline">
                      Solved {timeStr}
                    </span>
                  )}
                  <ChevronRight
                    size={14}
                    className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-gray-400 dark:text-gray-400"
                  />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
