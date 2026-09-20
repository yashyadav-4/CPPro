// PlatformProfiles.jsx — CF, LC, CC, and GFG profile cards
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
  // CodeChef star ratings
  '1 star': 'text-gray-400', '2 star': 'text-green-500', '3 star': 'text-teal-500',
  '4 star': 'text-blue-500', '5 star': 'text-amber-500', '6 star': 'text-orange-500',
  '7 star': 'text-red-500',
  unrated: 'text-gray-400',
};

const getRankColor = (rank) => RANK_COLORS[(rank || '').toLowerCase()] || 'text-gray-400';

const CodeforcesIcon = ({ className }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="12" width="5" height="9" fill="#1F8ACB"/>
    <rect x="9.5" y="6" width="5" height="15" fill="#1F8ACB"/>
    <rect x="16" y="2" width="5" height="19" fill="#E84142"/>
  </svg>
);

const LeetCodeIcon = ({ className }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125 1.513 5.527 5.527 0 0 0 .524 1.83 5.4 5.4 0 0 0 1.258 1.547l3.851 3.535A1.374 1.374 0 0 0 8.647 24h.016a1.37 1.37 0 0 0 1.055-.546l.01-.013c.277-.386.23-.923-.105-1.255l-3.858-3.54a3.178 3.178 0 0 1-.77-1.026 3.084 3.084 0 0 1-.295-1.07 3.014 3.014 0 0 1 .063-.889 3.045 3.045 0 0 1 .715-1.265l3.86-4.133 5.41-5.792a1.37 1.37 0 0 0 .15-1.42 1.374 1.374 0 0 0-1.405-.913z"/>
    <path d="M22.062 14.161H10.158a1.37 1.37 0 0 0-1.37 1.37 1.37 1.37 0 0 0 1.37 1.37h11.904a1.37 1.37 0 0 0 1.37-1.37 1.37 1.37 0 0 0-1.37-1.37z" />
  </svg>
);

const CodeChefIcon = ({ className }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C9.24 2 7 4.24 7 7c0 1.67.82 3.14 2.07 4.05C8.4 11.66 8 12.29 8 13v1h8v-1c0-.71-.4-1.34-1.07-1.95C16.18 10.14 17 8.67 17 7c0-2.76-2.24-5-5-5zm0 2c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3zM8 15v1c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-1H8zm-1 3v1c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1H7z"/>
  </svg>
);

const GeeksforGeeksIcon = ({ className }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.45 14.315c-.143.28-.334.532-.565.745a3.691 3.691 0 0 1-1.104.695 4.51 4.51 0 0 1-1.67.282 4.74 4.74 0 0 1-1.184-.13 3.856 3.856 0 0 1-.996-.437 3.417 3.417 0 0 1-.814-.772h-.033a3.72 3.72 0 0 1-.82.78 3.624 3.624 0 0 1-.99.43 4.685 4.685 0 0 1-1.18.128 4.56 4.56 0 0 1-1.67-.28 3.757 3.757 0 0 1-1.108-.696 2.966 2.966 0 0 1-.562-.745A2.213 2.213 0 0 1 8.56 13.5H6.814a4.673 4.673 0 0 0 .42 1.97 4.335 4.335 0 0 0 1.177 1.5 5.31 5.31 0 0 0 1.778.954 7.2 7.2 0 0 0 2.218.327 6.98 6.98 0 0 0 1.664-.194 5.23 5.23 0 0 0 1.374-.56 4.168 4.168 0 0 0 1.017-.898 4.152 4.152 0 0 0 1.017.898 5.13 5.13 0 0 0 1.374.56 6.98 6.98 0 0 0 1.664.194 7.175 7.175 0 0 0 2.218-.327 5.31 5.31 0 0 0 1.778-.953 4.31 4.31 0 0 0 1.177-1.5 4.673 4.673 0 0 0 .42-1.97H21.64a2.178 2.178 0 0 1-.19.815zM12 2.252a9.748 9.748 0 1 0 0 19.496 9.748 9.748 0 0 0 0-19.496zm0 17.748a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-2.44-8.418H7.91v-1.5h1.65zm4.88 0h-1.65v-1.5h1.65z"/>
  </svg>
);

function PlatformCard({ platform, handle, rating, maxRating, rank, colorClass, icon: Icon, iconColorClass, isCompact = false }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col justify-between">
      <div className="flex flex-col mb-2">
        <div className="flex items-center gap-1.5 mb-0.5">
          {Icon && <Icon className={`shrink-0 ${iconColorClass || ''}`} />}
          <span className="text-[13px] sm:text-[14px] font-semibold text-gray-900 dark:text-[#E5E7EB] tracking-tight truncate">
            {platform}
          </span>
        </div>
        <span className="text-[11px] sm:text-[12px] text-gray-500 dark:text-[#9CA3AF] font-medium truncate" title={handle}>
          {handle || '—'}
        </span>
      </div>

      <div className="mb-1">
        <div className={`text-xl sm:text-2xl font-bold tracking-tight ${colorClass}`}>
          {rating || '—'}
        </div>
        <div className="text-[10px] sm:text-[11px] text-gray-400 dark:text-[#9CA3AF] font-normal truncate mt-0.5">
          / {maxRating || '—'} peak
        </div>
      </div>

      <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider block truncate" title={rank || 'Unrated'}>
        <span className={getRankColor(rank)}>{rank || 'Unrated'}</span>
      </span>
    </div>
  );
}

function GfgCard({ handle, codingScore, monthlyScore, instituteRank, institution, isCompact = false }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col justify-between">
      <div className="flex flex-col mb-2">
        <div className="flex items-center gap-1.5 mb-0.5">
          <GeeksforGeeksIcon className="shrink-0 text-[#2F8D46] dark:text-[#4ade80]" />
          <span className="text-[13px] sm:text-[14px] font-semibold text-gray-900 dark:text-[#E5E7EB] tracking-tight truncate">
            GeeksforGeeks
          </span>
        </div>
        <span className="text-[11px] sm:text-[12px] text-gray-500 dark:text-[#9CA3AF] font-medium truncate" title={handle}>
          {handle || '—'}
        </span>
      </div>

      <div className="mb-1">
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#2F8D46] dark:text-[#4ade80]">
          {codingScore ?? '—'}
        </div>
        <div className="text-[10px] sm:text-[11px] text-gray-400 dark:text-[#9CA3AF] font-normal truncate mt-0.5">
          coding score
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        {instituteRank > 0 ? (
          <span className="text-[10px] sm:text-[11px] font-semibold text-[#2F8D46] dark:text-[#4ade80] truncate" title={`Rank #${instituteRank}${institution ? ` · ${institution}` : ''}`}>
            Rank #{instituteRank}
          </span>
        ) : monthlyScore > 0 ? (
          <span className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 truncate">
            {monthlyScore} mo
          </span>
        ) : (
          <span className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 truncate">
            Active
          </span>
        )}
      </div>
    </div>
  );
}

export default function PlatformProfiles({
  loading,
  cfHandle, cfRating, cfMaxRating, cfRank,
  lcHandle, lcRating, lcMaxRating, lcRank,
  ccHandle, ccRating, ccMaxRating, ccRank,
  gfgHandle, gfgCodingScore, gfgMonthlyScore, gfgInstituteRank, gfgInstitution,
}) {
  const hasCf  = !!cfHandle;
  const hasLc  = !!lcHandle;
  const hasCc  = !!ccHandle;
  const hasGfg = !!gfgHandle;
  const count  = [hasCf, hasLc, hasCc, hasGfg].filter(Boolean).length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 h-full">
        <Skeleton className="h-3 w-28 mb-4" />
        <div className="flex gap-4">
          {Array.from({ length: count || 2 }).map((_, i) => (
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

  if (!hasCf && !hasLc && !hasCc && !hasGfg) return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 flex items-center justify-center h-full">
      <span className="text-sm text-gray-400 font-normal">No platforms linked</span>
    </div>
  );

  // When all 4 are linked, use a clean 2x2 grid ("2 above, 2 below")
  if (count >= 4) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 h-full flex flex-col justify-between overflow-hidden">
        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 shrink-0">
          Platform Profiles
        </p>

        {/* 2x2 Matrix with clean quadrant dividers */}
        <div className="grid grid-cols-2 flex-1">
          {/* Top-Left: Codeforces */}
          <div className="pr-3 pb-3 border-r border-b border-gray-100 dark:border-white/[0.06] flex flex-col justify-between">
            <PlatformCard
              platform="Codeforces"
              handle={cfHandle}
              rating={cfRating}
              maxRating={cfMaxRating}
              rank={cfRank}
              colorClass="text-blue-500"
              icon={CodeforcesIcon}
              isCompact
            />
          </div>

          {/* Top-Right: LeetCode */}
          <div className="pl-3 pb-3 border-b border-gray-100 dark:border-white/[0.06] flex flex-col justify-between">
            <PlatformCard
              platform="LeetCode"
              handle={lcHandle}
              rating={lcRating}
              maxRating={lcMaxRating}
              rank={lcRank}
              colorClass="text-amber-500"
              icon={LeetCodeIcon}
              iconColorClass="text-[#FFA116]"
              isCompact
            />
          </div>

          {/* Bottom-Left: CodeChef */}
          <div className="pr-3 pt-3 border-r border-gray-100 dark:border-white/[0.06] flex flex-col justify-between">
            <PlatformCard
              platform="CodeChef"
              handle={ccHandle}
              rating={ccRating}
              maxRating={ccMaxRating}
              rank={ccRank}
              colorClass="text-emerald-500"
              icon={CodeChefIcon}
              iconColorClass="text-emerald-500"
              isCompact
            />
          </div>

          {/* Bottom-Right: GeeksforGeeks */}
          <div className="pl-3 pt-3 flex flex-col justify-between">
            <GfgCard
              handle={gfgHandle}
              codingScore={gfgCodingScore}
              monthlyScore={gfgMonthlyScore}
              instituteRank={gfgInstituteRank}
              institution={gfgInstitution}
              isCompact
            />
          </div>
        </div>
      </div>
    );
  }

  // 1 to 3 platforms linked: classic horizontal row with vertical dividers
  const divider = <div className="w-px bg-gray-100 dark:bg-white/[0.06] self-stretch shrink-0" />;
  const cards = [];
  if (hasCf)  cards.push({ key: 'cf',  node: <PlatformCard platform="Codeforces" handle={cfHandle} rating={cfRating} maxRating={cfMaxRating} rank={cfRank} colorClass="text-blue-500" icon={CodeforcesIcon} /> });
  if (hasLc)  cards.push({ key: 'lc',  node: <PlatformCard platform="LeetCode"   handle={lcHandle} rating={lcRating} maxRating={lcMaxRating} rank={lcRank} colorClass="text-amber-500" icon={LeetCodeIcon} iconColorClass="text-[#FFA116]" /> });
  if (hasCc)  cards.push({ key: 'cc',  node: <PlatformCard platform="CodeChef"   handle={ccHandle} rating={ccRating} maxRating={ccMaxRating} rank={ccRank} colorClass="text-emerald-500" icon={CodeChefIcon} iconColorClass="text-emerald-500" /> });
  if (hasGfg) cards.push({ key: 'gfg', node: <GfgCard handle={gfgHandle} codingScore={gfgCodingScore} monthlyScore={gfgMonthlyScore} instituteRank={gfgInstituteRank} institution={gfgInstitution} /> });

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 h-full flex flex-col justify-between overflow-hidden">
      <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 shrink-0">
        Platform Profiles
      </p>
      <div className="flex gap-2.5 sm:gap-3.5 items-start flex-1">
        {cards.map((c, i) => (
          <div key={c.key} className="contents">
            {i > 0 && divider}
            {c.node}
          </div>
        ))}
      </div>
    </div>
  );
}
