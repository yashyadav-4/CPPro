// RatingProgression.jsx — Recharts LineChart for CF and LC rating history
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  
  const uniquePayload = [];
  const seenNames = new Set();
  payload.forEach(p => {
    if (p.value != null && !seenNames.has(p.name)) {
      seenNames.add(p.name);
      uniquePayload.push(p);
    }
  });

  if (uniquePayload.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-black/[0.07] dark:border-white/[0.08] rounded-lg px-3 py-2 shadow-lg text-xs leading-relaxed z-50">
      <p className="text-gray-500 dark:text-gray-400 mb-1 font-normal">{label}</p>
      {uniquePayload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

function buildUnifiedTimeline(cfHistory, lcHistory) {
  const map = {};

  (cfHistory || []).forEach(h => {
    if (!map[h.date]) map[h.date] = { date: h.date };
    map[h.date].cf = h.rating;
  });
  (lcHistory || []).forEach(h => {
    if (!map[h.date]) map[h.date] = { date: h.date };
    map[h.date].lc = h.rating;
  });

  const sorted = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));

  // Forward-fill gaps
  let lastCf = null, lastLc = null;
  return sorted.map(d => {
    if (d.cf !== undefined) lastCf = d.cf;
    if (d.lc !== undefined) lastLc = d.lc;
    return {
      date: d.date.slice(0, 7),
      cf: lastCf,
      lc: lastLc,
    };
  });
}

function getCfPrediction(history) {
  if (!history || history.length < 3) return null;
  const recent = history.slice(-15);
  const n = recent.length;
  let sumLnX = 0, sumY = 0, sumY_LnX = 0, sumLnX2 = 0;

  recent.forEach((contest, index) => {
    const x = index + 1;
    const y = contest.rating;
    const lnX = Math.log(x);

    sumLnX += lnX;
    sumY += y;
    sumY_LnX += y * lnX;
    sumLnX2 += lnX * lnX;
  });

  const denominator = (n * sumLnX2) - (sumLnX * sumLnX);
  if (denominator === 0) return null;

  const a = ((n * sumY_LnX) - (sumY * sumLnX)) / denominator;
  const b = (sumY - a * sumLnX) / n;

  const futureX = n + 12;
  const predictedRating = Math.round(a * Math.log(futureX) + b);
  const lastRating = recent[n - 1].rating;
  
  return { val: Math.max(predictedRating, lastRating - 50), diff: predictedRating - lastRating };
}

function getLcPrediction(history) {
  if (!history || history.length < 4) return null;
  const recent = history.slice(-10);
  let weightedDeltaSum = 0;
  let weightSum = 0;
  
  for(let i = 1; i < recent.length; i++) {
    const delta = recent[i].rating - recent[i-1].rating;
    const weight = i;
    weightedDeltaSum += delta * weight;
    weightSum += weight;
  }
  
  const avgDelta = weightedDeltaSum / weightSum;
  const currentRating = recent[recent.length - 1].rating;
  
  const dampener = currentRating > 2000 ? 0.3 : currentRating > 1800 ? 0.6 : 1.0;
  const predictedRating = Math.round(currentRating + (avgDelta * 10 * dampener));
  return { val: predictedRating, diff: predictedRating - currentRating };
}

export default function RatingProgression({ loading, cfRatingHistory, lcRatingHistory }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
        <Skeleton className="h-3 w-36 mb-4" />
        <Skeleton className="h-44 w-full rounded" />
      </div>
    );
  }

  const hasCf = cfRatingHistory && cfRatingHistory.length > 0;
  const hasLc = lcRatingHistory && lcRatingHistory.length > 0;

  if (!hasCf && !hasLc) {
    return (
      <div className="bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 flex items-center justify-center h-40">
        <span className="text-sm text-gray-400 font-normal">No contest history yet</span>
      </div>
    );
  }

  const cfPrediction = getCfPrediction(cfRatingHistory);
  const lcPrediction = getLcPrediction(lcRatingHistory);

  let data = buildUnifiedTimeline(cfRatingHistory, lcRatingHistory);

  if (data.length > 0 && (cfPrediction || lcPrediction)) {
    const lastPoint = data[data.length - 1];
    const lastDate = new Date(lastPoint.date + "-01");
    
    lastPoint.cfPred = lastPoint.cf;
    lastPoint.lcPred = lastPoint.lc;

    // Generate 1 final point at 6 months out
    const d = new Date(lastDate);
    d.setMonth(d.getMonth() + 6);
    
    data.push({
        date: d.toISOString().slice(0, 7),
        cf: null,
        lc: null,
        cfPred: cfPrediction ? cfPrediction.val : null,
        lcPred: lcPrediction ? lcPrediction.val : null,
    });
  }

  const minRating = Math.min(
    ...[...data.map(d => d.cf).filter(Boolean), ...data.map(d => d.lc).filter(Boolean)],
    800
  );

  let cfMaxIndex = -1;
  let cfMax = -1;
  let lcMaxIndex = -1;
  let lcMax = -1;

  for (let i = 0; i < data.length; i++) {
    // If it's the last generated point for prediction, skip it for peak calculation
    if ((cfPrediction || lcPrediction) && i === data.length - 1) continue;
    
    if (data[i].cf != null && data[i].cf > cfMax) {
      cfMax = data[i].cf;
      cfMaxIndex = i;
    }
    if (data[i].lc != null && data[i].lc > lcMax) {
      lcMax = data[i].lc;
      lcMaxIndex = i;
    }
  }

  const renderPeakLabel = (props, maxIndex, bgColor) => {
    const { x, y, index, value } = props;
    if (index === maxIndex) {
      return (
        <g style={{ zIndex: 100 }}>
          <rect x={x - 20} y={y - 30} width="40" height="20" fill={bgColor} rx="4" opacity={0.9} />
          {/* Arrow pointing down to the dot */}
          <polygon points={`${x-4},${y-10} ${x+4},${y-10} ${x},${y-4}`} fill={bgColor} opacity={0.9} />
          <text x={x} y={y - 16} fill="#fff" fontSize={11} textAnchor="middle" fontWeight="bold">
            {value}
          </text>
          {/* White dot with colored border to highlight the peak */}
          <circle cx={x} cy={y} r={4} fill="#fff" stroke={bgColor} strokeWidth={2} />
        </g>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400 dark:text-[#9CA3AF] font-normal uppercase tracking-wide">Rating Progression</p>
        <div className="flex items-center gap-3 text-[10px]">
          {cfPrediction && (
            <span className="text-gray-500 dark:text-[#6B7280]">
              CF Prediction: <span className={`font-medium ${cfPrediction.diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>{cfPrediction.val}</span>
            </span>
          )}
          {lcPrediction && (
            <span className="text-gray-500 dark:text-[#6B7280]">
              LC Prediction: <span className={`font-medium ${lcPrediction.diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>{lcPrediction.val}</span>
            </span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 36, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[Math.max(minRating - 100, 0), 'auto']}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
          />
          {hasCf && (
            <>
              <Line type="monotone" dataKey="cf" name="Codeforces" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls label={(p) => renderPeakLabel(p, cfMaxIndex, '#3b82f6')} />
              <Line type="monotone" dataKey="cfPred" name="Codeforces" legendType="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} activeDot={{ r: 4 }} connectNulls />
            </>
          )}
          {hasLc && (
            <>
              <Line type="monotone" dataKey="lc" name="LeetCode" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls label={(p) => renderPeakLabel(p, lcMaxIndex, '#f59e0b')} />
              <Line type="monotone" dataKey="lcPred" name="LeetCode" legendType="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} activeDot={{ r: 4 }} connectNulls />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
