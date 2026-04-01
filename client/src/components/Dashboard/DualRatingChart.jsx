import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CF_COLOR = '#6366f1';
const LC_COLOR = '#f59e0b';

function ChartTip({ active, payload, label, contestLookup }) {
  if (!active || !payload?.length) return null;
  const contest = contestLookup?.[label];
  return (
    <div className="bg-white dark:bg-[#1a1a28] border border-gray-200 dark:border-[#2a2a3a] shadow-lg rounded-xl px-4 py-3 min-w-[180px]">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
          <span className="text-sm font-bold" style={{ color: e.color }}>{e.name}: {e.value}</span>
        </div>
      ))}
      {contest && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-[#2a2a3a]">
          <p className="text-xs text-gray-500 dark:text-gray-400">{contest.name}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Rank: #{contest.rank.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

export default function DualRatingChart({ ratingData, isDark, hasCf = true, hasLc = true }) {
  const bothLinked = hasCf && hasLc;
  const [view, setView] = useState(bothLinked ? 'combined' : hasCf ? 'codeforces' : 'leetcode');

  const { chartData, contestLookup } = useMemo(() => {
    const { dates, codeforcesRatings, leetcodeRatings, contestNames } = ratingData;
    const lookup = {};
    (contestNames || []).forEach(c => { lookup[c.date] = c; });
    const data = dates.map((d, i) => ({
      date: d,
      ...(view !== 'leetcode'   && { Codeforces: codeforcesRatings[i] }),
      ...(view !== 'codeforces' && { LeetCode:   leetcodeRatings[i] }),
    }));
    return { chartData: data, contestLookup: lookup };
  }, [ratingData, view]);

  const gridStroke = isDark ? '#1e1e2e' : '#F3F4F6';

  return (
    <motion.div
      className="card-glow card-glow-violet bg-white dark:bg-[#13131d] border border-gray-200 dark:border-[#1e1e2e] rounded-2xl p-6"
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Rating Progression</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Codeforces & LeetCode contest ratings</p>
        </div>
        {bothLinked && (
          <select value={view} onChange={e => setView(e.target.value)}
            className="text-xs font-medium bg-gray-100 dark:bg-[#1a1a28] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2a2a3a] rounded-lg px-3 py-1.5 outline-none cursor-pointer">
            <option value="combined">Combined</option>
            <option value="codeforces">Codeforces Only</option>
            <option value="leetcode">LeetCode Only</option>
          </select>
        )}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 0, left: 10 }}>
          <defs>
            <linearGradient id="gradCF" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CF_COLOR} stopOpacity={0.2} />
              <stop offset="100%" stopColor={CF_COLOR} stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="gradLC" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={LC_COLOR} stopOpacity={0.2} />
              <stop offset="100%" stopColor={LC_COLOR} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis dataKey="date" stroke={isDark?'#4b5563':'#9CA3AF'} fontSize={10} tickLine={false} axisLine={false} dy={10}
            tickFormatter={d => { const dt=new Date(d); return `${dt.toLocaleString('default',{month:'short'})} '${String(dt.getFullYear()).slice(2)}`; }} />
          <YAxis stroke={isDark?'#4b5563':'#9CA3AF'} fontSize={10} tickLine={false} axisLine={false} dx={-10}
            domain={[dMin => Math.max(0, Math.floor(dMin/100)*100-200), dMax => Math.ceil(dMax/100)*100+100]} />
          <Tooltip content={<ChartTip contestLookup={contestLookup} />} />

          {view !== 'leetcode' && (
            <Area type="monotone" dataKey="Codeforces" stroke={CF_COLOR} strokeWidth={2.5}
              fill="url(#gradCF)" dot={false}
              activeDot={{ r:5, fill:CF_COLOR, stroke: isDark?'#13131d':'#fff', strokeWidth:2 }}
              animationDuration={1000} />
          )}
          {view !== 'codeforces' && (
            <Area type="monotone" dataKey="LeetCode" stroke={LC_COLOR} strokeWidth={2.5}
              fill="url(#gradLC)" dot={false}
              activeDot={{ r:5, fill:LC_COLOR, stroke: isDark?'#13131d':'#fff', strokeWidth:2 }}
              animationDuration={1000} />
          )}
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-6 mt-4">
        {view !== 'leetcode' && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded-full" style={{ backgroundColor: CF_COLOR }} />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Codeforces</span>
          </div>
        )}
        {view !== 'codeforces' && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded-full" style={{ backgroundColor: LC_COLOR }} />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">LeetCode</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
