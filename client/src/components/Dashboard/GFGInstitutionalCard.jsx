// GFGInstitutionalCard.jsx — Campus rank and academic affiliation card for GeeksforGeeks
import { School, Trophy, ExternalLink, Zap } from 'lucide-react';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

export default function GFGInstitutionalCard({ loading, institution, instituteRank, codingScore, monthlyScore, handle }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 h-full">
        <Skeleton className="h-3 w-32 mb-4" />
        <Skeleton className="h-8 w-40 mb-3" />
        <Skeleton className="h-4 w-28 mb-4" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  const cleanInstitute = institution ? institution.trim() : '';

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
            <School size={13} className="text-[#2F8D46] dark:text-[#4ade80]" />
            Campus & Affiliation
          </p>
          {instituteRank > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-green-50 dark:bg-green-500/10 text-[#2F8D46] dark:text-[#4ade80] border border-green-200 dark:border-green-500/20">
              <Trophy size={11} />
              Rank #{instituteRank}
            </span>
          )}
        </div>

        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
            {cleanInstitute || 'Independent / No College Set'}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {cleanInstitute ? 'Registered Institution' : 'Link college on GeeksforGeeks to track campus rank'}
          </p>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium block">
              Coding Score
            </span>
            <span className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
              {codingScore ?? '—'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium block flex items-center gap-1">
              <Zap size={10} className="text-amber-500" />
              Monthly Pts
            </span>
            <span className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
              {monthlyScore ?? '0'}
            </span>
          </div>
        </div>
      </div>

      {handle && (
        <a
          href={`https://www.geeksforgeeks.org/user/${encodeURIComponent(handle)}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-medium bg-green-50 dark:bg-green-500/10 text-[#2F8D46] dark:text-[#4ade80] border border-green-200 dark:border-green-500/20 hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors"
        >
          <span>View Profile on GeeksforGeeks</span>
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}
