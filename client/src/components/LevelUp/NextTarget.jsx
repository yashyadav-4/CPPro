import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../api';

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
  weak: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200/50 dark:border-rose-500/30',
  fair: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/30',
  strong: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/30'
};

const STATUS_DOTS = {
  weak: 'bg-rose-500',
  fair: 'bg-amber-500',
  strong: 'bg-emerald-500'
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
    fetch(`${API_BASE}/api/dashboard/target/${userId}`, { credentials: 'include' })
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
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-6 shadow-sm">
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
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-8 flex flex-col items-center justify-center min-h-[240px] shadow-sm">
        <span className="text-5xl mb-4">🏆</span>
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
      <div className="grid grid-cols-2 gap-3 mb-5">
        {topics.map((topicStat, i) => (
          <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg ${isStretch ? 'bg-gray-50/50 dark:bg-white/[0.02] border-gray-200 dark:border-white/5' : STATUS_COLORS[topicStat.status]} border transition-all duration-200 hover:scale-[1.02] opacity-${isStretch ? '70' : '100'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOTS[topicStat.status]} ${isStretch && 'opacity-50'}`} />
              <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 truncate capitalize">{topicStat.topic}</span>
            </div>
            <span className="text-[10px] font-black opacity-60 shrink-0 ml-1 tabular-nums">{topicStat.solvedCount}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-2xl p-6 lg:p-8 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column: Progress & Momentum */}
        <div className="flex flex-col">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold tracking-wider uppercase px-2 py-1 bg-gray-100 dark:bg-white/5 rounded-md border border-gray-200/50 dark:border-white/5">
                Micro-Bracket: {data.bracketStart} — {data.bracketEnd}
              </span>
              {data.rankBoundaryChange && (
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-1 bg-emerald-500 text-white rounded-md shadow-sm shadow-emerald-500/20">
                  New Rank Next!
                </span>
              )}
            </div>
            <h2 className={`text-4xl font-black tracking-tighter ${rankColor} uppercase italic`}>
              {data.currentRank}
            </h2>
          </div>

          <div className="mb-6 relative">
             <div className="flex w-full gap-1 h-3 mb-2">
                {[0, 1, 2, 3].map((step) => {
                  const segStart = data.bracketStart + (step * 50);
                  const isPast = data.currentRating >= segStart + 50;
                  const isCurrent = data.currentRating >= segStart && data.currentRating < segStart + 50;
                  
                  let bgClass = "bg-gray-100 dark:bg-white/5";
                  if (isPast) bgClass = "bg-emerald-500 dark:bg-emerald-600";
                  if (isCurrent) bgClass = "bg-emerald-600 dark:bg-emerald-500 relative";
                  
                  return (
                    <div key={step} className={`flex-1 rounded-full ${bgClass}`}>
                       {isCurrent && (
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center">
                             <span className="text-xs font-black text-gray-900 dark:text-white tabular-nums bg-white dark:bg-[#111111] px-1 rounded shadow-sm">{data.currentRating}</span>
                             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shadow-[0_0_12px_rgba(16,185,129,0.8)] border-2 border-white dark:border-[#111111]"></div>
                          </div>
                       )}
                    </div>
                  );
                })}
             </div>
             <div className="flex justify-between text-[10px] font-black text-gray-400 dark:text-gray-500 px-1 uppercase tracking-widest leading-none">
               <span>{data.bracketStart}</span>
               <span>{data.bracketStart + 200}</span>
             </div>
             <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-4">
               <span className="text-emerald-500 font-black tabular-nums">+{data.pointsNeeded} pts</span> to {data.nextMilestone}
             </p>
          </div>

          <div className="mt-auto bg-gray-50 dark:bg-white/[0.03] rounded-xl p-4 border border-black/[0.05] dark:border-white/[0.05]">
             <div className="flex justify-between items-center mb-3">
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Momentum</span>
                 <span className={`text-xs font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${data.momentum === 'rising' ? 'bg-emerald-500/10 text-emerald-600' : data.momentum === 'falling' ? 'bg-rose-500/10 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>
                    {data.momentum === 'rising' ? '↗ Rising' : data.momentum === 'falling' ? '↘ Falling' : '→ Stable'}
                 </span>
               </div>
               <div className="flex gap-1.5">
                  {data.recentContestDeltas && data.recentContestDeltas.map((d, i) => (
                    <span key={i} className={`text-[10px] font-black px-2 py-0.5 rounded-md ${d > 0 ? 'bg-emerald-500 text-white' : d < 0 ? 'bg-rose-500 text-white' : 'bg-gray-400 text-white'}`}>
                      {d > 0 ? `+${d}` : d}
                    </span>
                  ))}
               </div>
             </div>
             <div className="flex justify-between text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight">
                <span>Avg Δ (last 10): <strong className="text-gray-900 dark:text-white ml-1">{data.avgDeltaLast10 > 0 ? `+${data.avgDeltaLast10}` : data.avgDeltaLast10}</strong></span>
                <span>Est. contests: <strong className="text-gray-900 dark:text-white ml-1">{data.estimatedContests}</strong></span>
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

          <div className="mt-auto bg-emerald-500/5 dark:bg-emerald-500/[0.03] border border-emerald-500/20 dark:border-emerald-500/10 rounded-xl p-4 shadow-sm backdrop-blur-[2px]">
             <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider mb-1.5">Coach Intelligence</p>
             <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
               {masterWeak.length > 0 ? (
                 <>Don't skip ahead — you still have gaps in <strong className="font-black text-emerald-600 dark:text-emerald-400">{data.bracketStart - 50}</strong> topics. Fix foundations first.</>
               ) : currentWeakTopics.length > 0 ? (
                 <>Good foundation. Now grind <strong className="font-black text-emerald-600 dark:text-emerald-400">{currentWeakTopics[0]}</strong>{currentWeakTopics[1] ? <> and <strong className="font-black text-emerald-600 dark:text-emerald-400">{currentWeakTopics[1]}</strong></> : ''} in your active zone.</>
               ) : (
                 <>You're ready to peek at <strong className="font-black text-emerald-600 dark:text-emerald-400">{data.bracketStart + 50}</strong> topics. Try 1–2 stretch problems per session.</>
               )}
             </p>
          </div>

          {data.rankBoundaryChange && (
            <div className="mt-4 flex items-center justify-center p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05]">
               <span className="text-[11px] text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wide">
                 ⭐ Reaching {data.nextMilestone} promotes you to <strong className={`font-black uppercase italic ${nextRankColor} ml-1`}>{data.nextRank}</strong>
               </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
