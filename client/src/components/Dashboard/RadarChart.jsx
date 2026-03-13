import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

// We show exactly these 5 topics; map from raw tags → display names
const TARGET_TOPICS = [
  { tag: 'dp', label: 'DP' },
  { tag: 'graphs', label: 'Graphs' },
  { tag: 'math', label: 'Math' },
  { tag: 'strings', label: 'Strings' },
  { tag: 'greedy', label: 'Greedy' },
];

export default function RadarChartComponent({ topics }) {
  const chartData = useMemo(() => {
    if (!topics?.length) return TARGET_TOPICS.map((t) => ({ topic: t.label, value: 0 }));

    // Build lookup from raw tags (normalize to lowercase)
    const lookup = {};
    topics.forEach((t) => {
      const tag = t.tag || t._id || '';
      if (tag) {
        lookup[tag.toLowerCase()] = t.count;
      }
    });

    return TARGET_TOPICS.map((t) => ({
      topic: t.label,
      value: lookup[t.tag] || 0,
    }));
  }, [topics]);

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <motion.div
      className="glass-card radar-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">Topic Proficiency</h3>
          <p className="radar-subtitle">Based on recent 100 solves</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid
            stroke="rgba(56, 189, 248, 0.1)"
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="topic"
            tick={{
              fill: '#9ca3af',
              fontSize: 12,
              fontWeight: 500,
            }}
          />
          <PolarRadiusAxis
            domain={[0, maxValue]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Proficiency"
            dataKey="value"
            stroke="#38bdf8"
            strokeWidth={2}
            fill="rgba(56, 189, 248, 0.15)"
            fillOpacity={1}
            dot={{
              r: 4,
              fill: '#38bdf8',
              stroke: '#0d1117',
              strokeWidth: 2,
            }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
