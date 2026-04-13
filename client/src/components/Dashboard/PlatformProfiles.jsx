// PlatformProfiles.jsx — improved handle display, better contrast
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

const RANK_COLORS = {
  newbie: 'text-gray-500', pupil: 'text-green-500', specialist: 'text-cyan-500',
  expert: 'text-blue-500', 'candidate master': 'text-violet-500', master: 'text-orange-500',
  'international master': 'text-orange-400', grandmaster: 'text-red-500',
  'international grandmaster': 'text-red-600', 'legendary grandmaster': 'text-red-700',
  beginner: 'text-gray-500', intermediate: 'text-amber-500',
  knight: 'text-teal-500', guardian: 'text-emerald-500',
  unrated: 'text-gray-400',
};

const getRankColor = (rank = '') => RANK_COLORS[rank.toLowerCase()] || 'text-gray-400';

const CodeforcesIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="12" width="5" height="9" fill="#1F8ACB"/>
    <rect x="9.5" y="6" width="5" height="15" fill="#1F8ACB"/>
    <rect x="16" y="2" width="5" height="19" fill="#E84142"/>
  </svg>
);

const LeetCodeIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125 1.513 5.527 5.527 0 0 0 .524 1.83 5.4 5.4 0 0 0 1.258 1.547l3.851 3.535A1.374 1.374 0 0 0 8.647 24h.016a1.37 1.37 0 0 0 1.055-.546l.01-.013c.277-.386.23-.923-.105-1.255l-3.858-3.54a3.178 3.178 0 0 1-.77-1.026 3.084 3.084 0 0 1-.295-1.07 3.014 3.014 0 0 1 .063-.889 3.045 3.045 0 0 1 .715-1.265l3.86-4.133 5.41-5.792a1.37 1.37 0 0 0 .15-1.42 1.374 1.374 0 0 0-1.405-.913z"/>
    <path d="M22.062 14.161H10.158a1.37 1.37 0 0 0-1.37 1.37 1.37 1.37 0 0 0 1.37 1.37h11.904a1.37 1.37 0 0 0 1.37-1.37 1.37 1.37 0 0 0-1.37-1.37z" />
  </svg>
);

function PlatformCard({ platform, handle, rating, maxRating, rank, colorClass, icon: Icon }) {
  return (
    <div className="flex-1 min-w-0">
      {/* Platform badge + handle */}
      <div className="flex flex-col mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          {Icon && <Icon className={platform === 'LeetCode' ? 'text-[#FFA116]' : ''} />}
          <span className="text-[15px] font-semibold text-gray-900 dark:text-[#E5E7EB] tracking-tight">{platform}</span>
        </div>
        <span
          className="text-[13px] text-gray-500 dark:text-[#9CA3AF] font-medium"
          title={handle}
        >
          {handle || '—'}
        </span>
      </div>

      {/* Current rating */}
      <div className="mb-2">
        <span className={`text-4xl font-bold tracking-tight ${colorClass}`}>
          {rating || '—'}
        </span>
        <span className="text-sm text-gray-400 dark:text-[#9CA3AF] font-normal ml-2">
          / {maxRating || '—'} peak
        </span>
      </div>

      {/* Rank */}
      <span className={`text-[13px] font-semibold uppercase tracking-wider ${getRankColor(rank)}`}>
        {rank || 'Unrated'}
      </span>
    </div>
  );
}

export default function PlatformProfiles({ loading, cfHandle, cfRating, cfMaxRating, cfRank, lcHandle, lcRating, lcMaxRating, lcRank }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
        <Skeleton className="h-3 w-28 mb-4" />
        <div className="flex gap-6">
          {[0, 1].map(i => (
            <div key={i} className="flex-1 space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasCf = !!cfHandle;
  const hasLc = !!lcHandle;

  if (!hasCf && !hasLc) return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 flex items-center justify-center">
      <span className="text-sm text-gray-400 font-normal">No platforms linked</span>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
      <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Platform Profiles</p>
      <div className="flex gap-4">
        {hasCf && (
          <PlatformCard
            platform="Codeforces"
            handle={cfHandle}
            rating={cfRating}
            maxRating={cfMaxRating}
            rank={cfRank}
            colorClass="text-blue-500"
            badgeClass="bg-blue-50 dark:bg-blue-950/40 text-blue-500"
          />
        )}
        {hasCf && hasLc && (
          <div className="w-px bg-gray-100 dark:bg-white/[0.06] self-stretch" />
        )}
        {hasLc && (
          <PlatformCard
            platform="LeetCode"
            handle={lcHandle}
            rating={lcRating}
            maxRating={lcMaxRating}
            rank={lcRank}
            colorClass="text-amber-500"
            badgeClass="bg-amber-50 dark:bg-amber-950/40 text-amber-500"
          />
        )}
      </div>
    </div>
  );
}
