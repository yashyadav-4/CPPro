import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';

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

    const lookup = {};
    topics.forEach((t) => {
      const tag = t.tag || t._id || '';
      if (tag) lookup[tag.toLowerCase()] = t.count;
    });

    return TARGET_TOPICS.map((t) => ({
      topic: t.label,
      value: lookup[t.tag] || 0,
    }));
  }, [topics]);

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <motion.div
      className="bg-white border border-gray-200 shadow-sm rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="mb-2 text-center md:text-left">
        <h3 className="text-lg font-bold text-gray-900">Topic Proficiency</h3>
        <p className="text-xs text-gray-500 font-medium">Based on recent 100 solves</p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
          <PolarGrid stroke="#E5E7EB" gridType="polygon" />
          <PolarAngleAxis
            dataKey="topic"
            tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis domain={[0, maxValue]} tick={false} axisLine={false} />
          <Radar
            name="Proficiency"
            dataKey="value"
            stroke="#4F46E5"
            strokeWidth={2}
            fill="#4F46E5"
            fillOpacity={0.15}
            dot={{ r: 4, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2 }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
