import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

function getRatingColor(rating) {
  const r = parseInt(rating) || 0;
  // Use shades of indigo based on rating
  if (r < 1000) return '#C7D2FE'; // indigo-200
  if (r < 1400) return '#818CF8'; // indigo-400
  if (r < 1800) return '#6366F1'; // indigo-500
  if (r < 2200) return '#4F46E5'; // indigo-600
  return '#3730A3'; // indigo-800
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 shadow-md rounded-lg p-3">
      <p className="text-gray-500 text-xs font-semibold mb-1">Rating {d.rating}</p>
      <p className="text-sm font-bold text-gray-900">{d.count} problems</p>
    </div>
  );
}

export default function DifficultyChart({ difficulty }) {
  const { chartData, totalSolved } = useMemo(() => {
    if (!difficulty?.length) return { chartData: [], totalSolved: 0 };

    const mapped = difficulty.map(d => ({
      ...d,
      rating: d.rating || d._id || 0,
      count: d.count || 0
    }));

    const sorted = mapped.sort((a, b) => (parseInt(a.rating) || 0) - (parseInt(b.rating) || 0));
    const total = sorted.reduce((sum, d) => sum + d.count, 0);
    return { chartData: sorted, totalSolved: total };
  }, [difficulty]);

  return (
    <motion.div
      className="bg-white border border-gray-200 shadow-sm rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.55 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Difficulty Distribution</h3>
        <span className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full border border-gray-200">
          Total Solves: {totalSolved.toLocaleString()}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="rating" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} dy={10} />
          <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={getRatingColor(entry.rating)} className="hover:opacity-80 transition-opacity" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
