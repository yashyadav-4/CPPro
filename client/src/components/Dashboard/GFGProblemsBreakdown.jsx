import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ClipboardList, ChevronRight, ChevronDown, Check, ExternalLink } from 'lucide-react';

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
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
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

const DIFFICULTY_OPTIONS = [
  { key: 'ALL',    label: 'All Submissions', color: '#10b981' },
  { key: 'SCHOOL', label: 'School',          color: '#06b6d4' },
  { key: 'BASIC',  label: 'Basic',           color: '#84cc16' },
  { key: 'EASY',   label: 'Easy',            color: '#10b981' },
  { key: 'MEDIUM', label: 'Medium',          color: '#f59e0b' },
  { key: 'HARD',   label: 'Hard',            color: '#f97316' },
];

export default function GFGProblemsBreakdown({ loading, problems = [], totalSolved }) {
  const [filterDifficulty, setFilterDifficulty] = useState('ALL');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const filteredProblems = useMemo(() => {
    if (!problems || !problems.length) return [];
    if (filterDifficulty === 'ALL') return problems;
    return problems.filter(p => (p.difficulty || '').toUpperCase() === filterDifficulty);
  }, [problems, filterDifficulty]);

  if (loading) return <Skeleton />;

  const total = totalSolved ?? problems.length;
  const currentOption = DIFFICULTY_OPTIONS.find(o => o.key === filterDifficulty) || DIFFICULTY_OPTIONS[0];

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

        {/* Right: Custom Difficulty Filter Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-gray-50 dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 text-xs font-medium hover:bg-gray-100 dark:hover:bg-[#222222] transition-colors focus:ring-1 focus:ring-emerald-500"
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentOption.color }} />
            <span>{currentOption.label}</span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#161616] shadow-xl dark:shadow-2xl z-50 py-1 overflow-hidden">
              {DIFFICULTY_OPTIONS.map((opt) => {
                const isSelected = filterDifficulty === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setFilterDifficulty(opt.key);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && <Check size={13} className="text-emerald-500" />}
                  </button>
                );
              })}
            </div>
          )}
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
