import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="nexus-tooltip">
      <p className="nexus-tooltip-label">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="nexus-tooltip-value" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function RatingChart({ history, prediction }) {
  const chartData = useMemo(() => {
    if (!history?.length) return [];

    const historyPoints = history.map((p) => ({
      date: new Date(p.date).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      }),
      historical: p.rating,
      prediction: null,
    }));

    // Bridge: last history point starts the prediction line
    const predPoints = (prediction || []).map((p) => ({
      date: new Date(p.date).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      }),
      historical: null,
      prediction: p.predictedRating,
    }));

    // Connect the two lines by duplicating the last history point in prediction
    if (historyPoints.length > 0 && predPoints.length > 0) {
      const bridge = { ...historyPoints[historyPoints.length - 1] };
      bridge.prediction = bridge.historical;
      historyPoints[historyPoints.length - 1] = bridge;
    }

    return [...historyPoints, ...predPoints];
  }, [history, prediction]);

  return (
    <motion.div
      className="glass-card rating-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
    >
      <div className="chart-card-header">
        <h3 className="chart-card-title">Rating Projection</h3>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <div className="chart-legend-line" style={{ background: '#3b82f6' }} />
            <span>Historical</span>
          </div>
          <div className="chart-legend-item">
            <div
              className="chart-legend-line dashed"
              style={{ color: '#a855f7' }}
            />
            <span>6-Month Prediction</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <defs>
            <linearGradient id="gradHistory" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradPrediction" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
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
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Historical solid line */}
          <Area
            type="monotone"
            dataKey="historical"
            name="Historical"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#gradHistory)"
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6', stroke: '#0d1117', strokeWidth: 2 }}
            connectNulls={false}
          />

          {/* Prediction dashed line */}
          <Area
            type="monotone"
            dataKey="prediction"
            name="Prediction"
            stroke="#a855f7"
            strokeWidth={2}
            strokeDasharray="6 4"
            fill="url(#gradPrediction)"
            dot={false}
            activeDot={{ r: 4, fill: '#a855f7', stroke: '#0d1117', strokeWidth: 2 }}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
