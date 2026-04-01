import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DIFF = {
  easy:   { light: '#10b981', dark: '#34d399', label: 'Easy' },
  medium: { light: '#f59e0b', dark: '#fbbf24', label: 'Medium' },
  hard:   { light: '#ef4444', dark: '#f87171', label: 'Hard' },
};

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white dark:bg-[#1a1a28] border border-gray-200 dark:border-[#2a2a3a] shadow-lg rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
        <span className="text-sm font-bold text-gray-900 dark:text-white">{d.label}</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {d.value} problems ({((d.value / d.total) * 100).toFixed(1)}%)
      </p>
    </div>
  );
}

export default function DifficultyDonut({ breakdown, isDark }) {
  const chartData = useMemo(() => [
    { label:'Easy',   value: breakdown.easyCount,   color: isDark ? DIFF.easy.dark   : DIFF.easy.light,   total: breakdown.total },
    { label:'Medium', value: breakdown.mediumCount,  color: isDark ? DIFF.medium.dark : DIFF.medium.light, total: breakdown.total },
    { label:'Hard',   value: breakdown.hardCount,    color: isDark ? DIFF.hard.dark   : DIFF.hard.light,   total: breakdown.total },
  ], [breakdown, isDark]);

  return (
    <motion.div
      className="card-glow card-glow-amber bg-white dark:bg-[#13131d] border border-gray-200 dark:border-[#1e1e2e] rounded-2xl p-6 relative"
      initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Problems Breakdown</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Difficulty distribution across platforms</p>

      <div className="relative">
        <ResponsiveContainer width="100%" height={230}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={68} outerRadius={95}
              paddingAngle={3} dataKey="value" nameKey="label"
              animationBegin={400} animationDuration={1200} animationEasing="ease-out" stroke="none">
              {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip content={<Tip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="text-3xl font-black text-gray-900 dark:text-white num-glow-amber">{breakdown.total}</span>
            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">Total</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-5 mt-2">
        {chartData.map(e => (
          <div key={e.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{e.label}: {e.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
