import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Map rating value to a gradient from blue (800) to purple (3000+)
function getRatingColor(rating) {
  const r = parseInt(rating) || 0;
  const min = 800;
  const max = 3000;
  const t = Math.min(Math.max((r - min) / (max - min), 0), 1);

  // Blue (59,130,246) → Purple (168,85,247)
  const red = Math.round(59 + t * (168 - 59));
  const green = Math.round(130 + t * (85 - 130));
  const blue = Math.round(246 + t * (247 - 246));
  return `rgb(${red}, ${green}, ${blue})`;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="nexus-tooltip">
      <p className="nexus-tooltip-label">Rating {d.rating}</p>
      <p className="nexus-tooltip-value">{d.count} problems</p>
    </div>
  );
}

export default function DifficultyChart({ difficulty }) {
  const { chartData, totalSolved } = useMemo(() => {
    if (!difficulty?.length) return { chartData: [], totalSolved: 0 };

    // Sort by rating number
    const sorted = [...difficulty].sort(
      (a, b) => (parseInt(a.rating) || 0) - (parseInt(b.rating) || 0)
    );

    const total = sorted.reduce((sum, d) => sum + d.count, 0);
    return { chartData: sorted, totalSolved: total };
  }, [difficulty]);

  return (
    <motion.div
      className="glass-card difficulty-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.55 }}
    >
      <div className="chart-card-header">
        <h3 className="chart-card-title">Difficulty Distribution</h3>
        <span className="difficulty-badge">Total Solves: {totalSolved.toLocaleString()}</span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="rating"
            stroke="#4b5563"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#4b5563"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
          <Bar
            dataKey="count"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={getRatingColor(entry.rating)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
