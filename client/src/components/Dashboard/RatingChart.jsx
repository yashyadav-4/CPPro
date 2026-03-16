import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-md rounded-lg p-3">
      <p className="text-gray-500 text-xs font-semibold mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function RatingChart({ history, prediction }) {
  const chartData = useMemo(() => {
    if (!history?.length) return [];

    // Sort the combined data chronologically by raw date string/timestamp 
    // before turning it into a localized string to ensure chronological order
    const sortedData = [...history, ...(prediction || [])].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Map through sorted data
    let contestCounter = 1;
    const finalPoints = sortedData.map((p) => {
        const isPrediction = p.hasOwnProperty('predictedRating');
        const label = isPrediction ? '+6 Months' : `Contest ${contestCounter++}`;
        return {
            date: label,
            historical: isPrediction ? null : Number(p.rating),
            prediction: isPrediction ? Number(p.predictedRating) : null,
            rawDate: new Date(p.date)
        }
    });

    // Bridge the gap
    let lastHistoricalIndex = -1;
    for (let i = finalPoints.length - 1; i >= 0; i--) {
        if (finalPoints[i].historical !== null) {
            lastHistoricalIndex = i;
            break;
        }
    }

    if (lastHistoricalIndex !== -1 && lastHistoricalIndex < finalPoints.length - 1) {
        // Set prediction value for the last historical point to connect the lines
        finalPoints[lastHistoricalIndex].prediction = finalPoints[lastHistoricalIndex].historical;
    }

    return finalPoints;
  }, [history, prediction]);

  return (
    <motion.div
      className="bg-white border border-gray-200 shadow-sm rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Rating Projection</h3>
        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 bg-indigo-600 rounded-full" />
            <span>Historical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 border-b-2 border-dashed border-purple-500" />
            <span>6-Month Prediction</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 0, left: 10 }}>
          <defs>
            <linearGradient id="gradHistory" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="gradPrediction" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A855F7" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#A855F7" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} dy={10} />
          <YAxis 
             stroke="#9CA3AF" 
             fontSize={11} 
             tickLine={false} 
             axisLine={false} 
             domain={[(dataMin) => Math.max(0, Math.floor(dataMin / 100) * 100 - 100), (dataMax) => Math.ceil(dataMax / 100) * 100 + 100]} 
             dx={-10} 
          />
          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="historical"
            name="Historical"
            stroke="#4F46E5"
            strokeWidth={3}
            fill="url(#gradHistory)"
            dot={false}
            activeDot={{ r: 5, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2 }}
            connectNulls={true}
          />

          <Area
            type="monotone"
            dataKey="prediction"
            name="Prediction"
            stroke="#A855F7"
            strokeWidth={2}
            strokeDasharray="6 4"
            fill="url(#gradPrediction)"
            dot={false}
            activeDot={{ r: 5, fill: '#A855F7', stroke: '#fff', strokeWidth: 2 }}
            connectNulls={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
