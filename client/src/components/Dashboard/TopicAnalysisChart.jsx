import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white dark:bg-[#1a1a28] border border-gray-200 dark:border-[#2a2a3a] shadow-lg rounded-xl px-4 py-3">
      <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{d.topic}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{d.count} problems</p>
    </div>
  );
}

export default function TopicAnalysisChart({ topics, isDark }) {
  const sorted = useMemo(() =>
    [...topics].sort((a, b) => b.count - a.count).slice(0, 10),
  [topics]);

  const maxCount = sorted.length ? sorted[0].count : 1;

  function barColor(count) {
    const t = count / maxCount;
    if (t > 0.7) return isDark ? '#818cf8' : '#4F46E5';
    if (t > 0.4) return isDark ? '#6366f1' : '#6366F1';
    return isDark ? '#3730a3' : '#818CF8';
  }

  return (
    <motion.div
      className="card-glow card-glow-indigo bg-white dark:bg-[#13131d] border border-gray-200 dark:border-[#1e1e2e] rounded-2xl p-6"
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}>
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 size={18} className="text-indigo-500" />
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Topic Analysis</h3>
        <span className="ml-auto text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1a1a28] px-2.5 py-1 rounded-full">
          Top {sorted.length}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e1e2e' : '#F3F4F6'} horizontal={false} />
          <XAxis type="number" stroke={isDark ? '#4b5563' : '#9CA3AF'} fontSize={10} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="topic" stroke={isDark ? '#6b7280' : '#6B7280'} fontSize={11}
            tickLine={false} axisLine={false} width={110} />
          <Tooltip content={<Tip />} cursor={{ fill: isDark ? '#ffffff06' : '#F9FAFB' }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}
            animationDuration={1200} animationEasing="ease-out">
            {sorted.map((e, i) => (
              <Cell key={i} fill={barColor(e.count)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
