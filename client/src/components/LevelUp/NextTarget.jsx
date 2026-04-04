import React, { useState, useEffect } from 'react';

const RANK_COLORS = {
  'Newbie': 'text-gray-400',
  'Pupil': 'text-green-500',
  'Specialist': 'text-cyan-400',
  'Expert': 'text-blue-500',
  'Candidate Master': 'text-purple-500',
  'Master': 'text-orange-400',
  'International Master': 'text-orange-300',
  'Grandmaster': 'text-red-500',
  'unrated': 'text-gray-400'
};

const STATUS_COLORS = {
  weak: 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400',
  fair: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  strong: 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400'
};

const STATUS_DOTS = {
  weak: 'bg-red-500',
  fair: 'bg-amber-500',
  strong: 'bg-green-500'
};

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

export default function NextTarget({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    // Corrected fetch URL: /api/dashboard/target/
    fetch(`/api/dashboard/target/${userId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(true);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-5">
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  if (data.isPeak) {
    return (
      <div className="bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-5 flex flex-col items-center justify-center min-h-[200px]">
        <span className="text-4xl mb-2">🏆</span>
        <h3 className={`text-lg font-bold ${RANK_COLORS[data.currentRank]}`}>Peak Bracket: {data.currentRank}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Rating: {data.currentRating}</p>
        <p className="text-xs text-gray-400 mt-2">You've reached the highest tracked bracket. Maintain your dominance!</p>
      </div>
    );
  }

  const rankColor = RANK_COLORS[data.currentRank] || 'text-gray-400';
  const nextRankColor = RANK_COLORS[data.nextRank] || 'text-gray-400';

  // Compute segmented blocks. Find major rank boundaries.
  // Standard CF boundaries. For visual, we show 50-point blocks up to the next major rank if possible,
  // or just show a fixed 4 blocks around the current rating for simplicity.
  const blocks = [
    data.bracketStart,
    data.bracketStart + 50,
    data.bracketStart + 100,
    data.bracketStart + 150
  ];

  const masterWeak = (data.topicTiers?.master || []).filter(t => t.status !== 'strong');
  const currentWeakTopics = (data.topicTiers?.current || []).filter(t => t.status === 'weak').map(t => t.topic);

  // Reusable component for a grid of topics
  const TopicGrid = ({ topics, isStretch }) => {
    if (!topics || topics.length === 0) return null;
    return (
      <div className="grid grid-cols-2 gap-2 mb-4">
        {topics.map((topicStat, i) => (
          <div key={i} className={`flex items-center justify-between p-2 rounded-md ${isStretch ? 'bg-gray-50/50 dark:bg-white/[0.02] border-amber-500/30' : STATUS_COLORS[topicStat.status]} border dark:border-white/5 opacity-${isStretch ? '70' : '100'}`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOTS[topicStat.status]} ${isStretch && 'opacity-50'}`} />
              <span className="text-[11px] font-medium truncate capitalize">{topicStat.topic}</span>
            </div>
            <span className="text-[10px] font-bold opacity-80 shrink-0 ml-1">{topicStat.solvedCount}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column: Progress & Momentum */}
        <div className="flex flex-col">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase px-1.5 py-0.5 bg-gray-100 dark:bg-white/5 rounded">
                Micro-Bracket: {data.bracketStart} — {data.bracketEnd}
              </span>
              {data.rankBoundaryChange && (
                <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 rounded border border-purple-200 dark:border-purple-500/30">
                  New Rank Next!
                </span>
              )}
            </div>
            <h2 className={`text-2xl font-bold tracking-tight ${rankColor}`}>
              {data.currentRank}
            </h2>
          </div>

          <div className="mb-6 relative">
             <div className="flex w-full gap-1 h-3 mb-2">
                {[0, 1, 2, 3].map((step) => {
                  const segStart = data.bracketStart + (step * 50);
                  const isPast = segStart < data.bracketStart;
                  const isCurrent = segStart === data.bracketStart;
                  
                  let bgClass = "bg-gray-100 dark:bg-white/5";
                  if (isPast) bgClass = "bg-green-500 dark:bg-green-600";
                  if (isCurrent) bgClass = "bg-blue-500 dark:bg-blue-600 relative";
                  
                  return (
                    <div key={step} className={`flex-1 rounded-sm ${bgClass}`}>
                       {isCurrent && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                             <span className="text-xs font-bold text-gray-900 tabular-nums">{data.currentRating}</span>
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                          </div>
                       )}
                    </div>
                  );
                })}
             </div>
             <div className="flex justify-between text-[10px] font-medium text-gray-400 dark:text-gray-500 px-1">
               <span>{data.bracketStart}</span>
               <span>{data.bracketStart + 200}</span>
             </div>
             <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
               <span className="text-green-500 font-bold tabular-nums">+{data.pointsNeeded} pts</span> to {data.nextMilestone}
             </p>
          </div>

          <div className="mt-auto bg-gray-50 dark:bg-white/[0.02] rounded-lg p-3 border border-black/[0.05] dark:border-white/[0.05]">
             <div className="flex justify-between items-center mb-2">
               <div className="flex items-center gap-2">
                 <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Momentum</span>
                 <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                    {data.momentum === 'rising' ? '🟢 Rising' : data.momentum === 'falling' ? '🔴 Falling' : '⚪ Stable'}
                 </span>
               </div>
               <div className="flex gap-1">
                  {data.recentContestDeltas && data.recentContestDeltas.map((d, i) => (
                    <span key={i} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${d > 0 ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : d < 0 ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-gray-300'}`}>
                      {d > 0 ? `+${d}` : d}
                    </span>
                  ))}
               </div>
             </div>
             <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Avg Δ (last 10): <strong className="text-gray-900">{data.avgDeltaLast10 > 0 ? `+${data.avgDeltaLast10}` : data.avgDeltaLast10}</strong></span>
                <span>Est. contests: <strong className="text-gray-900">{data.estimatedContests}</strong></span>
             </div>
          </div>
        </div>

        {/* Right Column: Focus Topics in 3 Tiers */}
        <div className="flex flex-col">
          
          {data.topicTiers?.master?.length > 0 && (
            <div className="mb-4">
               <h4 className="text-xs font-bold text-green-600 dark:text-green-500 tracking-wider uppercase mb-1">Master First ({data.bracketStart - 50})</h4>
               <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">Fully solve these — you should be comfortable here</p>
               <TopicGrid topics={data.topicTiers.master} isStretch={false} />
            </div>
          )}

          <div className="mb-4">
             <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider uppercase mb-1">Current Bracket ({data.bracketStart}–{data.bracketEnd})</h4>
             <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">Your active grind zone</p>
             <TopicGrid topics={data.topicTiers?.current || []} isStretch={false} />
          </div>

          {data.topicTiers?.stretch?.length > 0 && (
            <div className="mb-4">
               <h4 className="text-xs font-bold text-amber-600 dark:text-amber-500 tracking-wider uppercase mb-1">Stretch Goals ({data.bracketStart + 50})</h4>
               <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">Exposure only — don't go deep yet, just get familiar</p>
               <TopicGrid topics={data.topicTiers.stretch} isStretch={true} />
            </div>
          )}

          <div className="mt-auto bg-indigo-50/50 dark:bg-indigo-500/[0.03] border border-indigo-100 dark:border-indigo-500/10 rounded-lg p-3">
             <p className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
               {masterWeak.length > 0 ? (
                 <>Don't skip ahead — you still have gaps in <strong className="font-semibold text-indigo-700 dark:text-indigo-300">{data.bracketStart - 50}</strong> topics. Fix foundations first.</>
               ) : currentWeakTopics.length > 0 ? (
                 <>Good foundation. Now grind <strong className="font-semibold text-indigo-700 dark:text-indigo-300">{currentWeakTopics[0]}</strong>{currentWeakTopics[1] ? <> and <strong className="font-semibold text-indigo-700 dark:text-indigo-300">{currentWeakTopics[1]}</strong></> : ''} in your active zone.</>
               ) : (
                 <>You're ready to peek at <strong className="font-semibold text-indigo-700 dark:text-indigo-300">{data.bracketStart + 50}</strong> topics. Try 1–2 stretch problems per session.</>
               )}
             </p>
          </div>

          {data.rankBoundaryChange && (
            <div className="mt-3 flex items-center justify-center p-2 rounded bg-gray-50 dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05]">
               <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                 ⭐ Reaching {data.nextMilestone} promotes you to <strong className={`font-bold ${nextRankColor}`}>{data.nextRank}</strong>
               </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
