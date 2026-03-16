import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const CELL_SIZE = 13;
const CELL_GAP = 3;
const ROWS = 7;
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getColor(count, maxCount) {
  if (count === 0) return '#EEF2FF'; // empty (very light indigo)
  const intensity = Math.min(count / Math.max(maxCount, 1), 1);
  if (intensity < 0.25) return '#C7D2FE'; // indigo-200
  if (intensity < 0.5) return '#818CF8'; // indigo-400
  if (intensity < 0.75) return '#6366F1'; // indigo-500
  return '#4F46E5'; // indigo-600 (most active)
}

export default function Heatmap({ data }) {
  const { weeks, maxCount, monthLabels } = useMemo(() => {
    if (!data || data.length === 0) {
      return { weeks: [], maxCount: 0, monthLabels: [] };
    }

    const weeks = [];
    let currentWeek = [];
    let maxCount = 0;
    const monthLabels = [];
    let lastMonth = -1;

    const firstDate = new Date(data[0].date);
    const startDayOfWeek = firstDate.getDay();

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
      className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 overflow-x-auto relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles size={16} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Activity Pulse</h3>
      </div>

      <div className="overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-gray-200">
        <svg width={svgWidth} height={svgHeight} className="min-w-max">
          {monthLabels.map((m, i) => (
            <text
              key={i}
              x={40 + m.weekIndex * (CELL_SIZE + CELL_GAP)}
              y={10}
              fill="#6B7280"
              fontSize="12"
              className="font-medium"
              fontFamily="inherit"
            >
              {m.label}
            </text>
          ))}

          {DAY_LABELS.map((label, i) => (
            label && (
              <text
                key={i}
                x={0}
                y={24 + i * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2}
                fill="#9CA3AF"
                fontSize="11"
                className="font-medium"
                fontFamily="inherit"
                dominantBaseline="central"
              >
                {label}
              </text>
            )
          ))}

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
                  className="transition-colors duration-200 hover:stroke-indigo-300 hover:stroke-2 cursor-pointer"
                >
                  <title>{day.date}: {day.count} submissions</title>
                </rect>
              );
            })
          )}
        </svg>
      </div>

      <div className="absolute right-6 top-6 flex items-center text-xs text-gray-500 gap-2 font-medium">
        <span>Less</span>
        <div className="flex gap-1.5">
          {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
            <div
              key={i}
              className="w-3.5 h-3.5 rounded-[2px]"
              style={{
                backgroundColor: getColor(intensity * 10, 10),
              }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </motion.div>
  );
}
