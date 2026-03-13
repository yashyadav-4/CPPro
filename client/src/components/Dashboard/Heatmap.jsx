import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const CELL_SIZE = 13;
const CELL_GAP = 3;
const ROWS = 7; // Mon–Sun
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Color scale: transparent → dark teal → bright cyan
function getColor(count, maxCount) {
  if (count === 0) return 'rgba(56, 189, 248, 0.04)';
  const intensity = Math.min(count / Math.max(maxCount, 1), 1);
  if (intensity < 0.25) return 'rgba(14, 116, 144, 0.5)';
  if (intensity < 0.5) return 'rgba(6, 182, 212, 0.6)';
  if (intensity < 0.75) return 'rgba(34, 211, 238, 0.75)';
  return 'rgba(56, 189, 248, 0.95)';
}

export default function Heatmap({ data }) {
  const { weeks, maxCount, monthLabels } = useMemo(() => {
    if (!data || data.length === 0) {
      return { weeks: [], maxCount: 0, monthLabels: [] };
    }

    // Build week columns
    const weeks = [];
    let currentWeek = [];
    let maxCount = 0;
    const monthLabels = [];
    let lastMonth = -1;

    // Determine the starting day position (0=Sun, 1=Mon..6=Sat)
    const firstDate = new Date(data[0].date);
    const startDayOfWeek = firstDate.getDay(); // 0=Sun

    // Pad the first week
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    data.forEach((d) => {
      const date = new Date(d.date);
      const month = date.getMonth();

      if (month !== lastMonth) {
        monthLabels.push({ weekIndex: weeks.length, label: MONTH_NAMES[month] });
        lastMonth = month;
      }

      maxCount = Math.max(maxCount, d.count);
      currentWeek.push(d);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, maxCount, monthLabels };
  }, [data]);

  const svgWidth = weeks.length * (CELL_SIZE + CELL_GAP) + 40;
  const svgHeight = ROWS * (CELL_SIZE + CELL_GAP) + 30;

  return (
    <motion.div
      className="glass-card heatmap-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
    >
      <div className="heatmap-title">
        <Sparkles size={18} className="heatmap-title-icon" />
        <h3>Activity Pulse</h3>
      </div>

      <div className="heatmap-container">
        <svg width={svgWidth} height={svgHeight} className="heatmap-svg">
          {/* Month labels */}
          {monthLabels.map((m, i) => (
            <text
              key={i}
              x={40 + m.weekIndex * (CELL_SIZE + CELL_GAP)}
              y={10}
              fill="#6b7280"
              fontSize="11"
              fontFamily="system-ui, sans-serif"
            >
              {m.label}
            </text>
          ))}

          {/* Day labels */}
          {DAY_LABELS.map((label, i) => (
            label && (
              <text
                key={i}
                x={0}
                y={24 + i * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2}
                fill="#6b7280"
                fontSize="10"
                fontFamily="system-ui, sans-serif"
                dominantBaseline="central"
              >
                {label}
              </text>
            )
          ))}

          {/* Cells */}
          {weeks.map((week, wi) =>
            week.map((day, di) => {
              if (!day) return null;
              return (
                <rect
                  key={`${wi}-${di}`}
                  x={40 + wi * (CELL_SIZE + CELL_GAP)}
                  y={20 + di * (CELL_SIZE + CELL_GAP)}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={3}
                  ry={3}
                  fill={getColor(day.count, maxCount)}
                  style={{ transition: 'fill 0.2s ease' }}
                >
                  <title>{day.date}: {day.count} submissions</title>
                </rect>
              );
            })
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
          <div
            key={i}
            className="heatmap-legend-box"
            style={{
              backgroundColor: getColor(intensity * 10, 10),
            }}
          />
        ))}
        <span>More</span>
      </div>
    </motion.div>
  );
}
