// ActivityHeatmap.jsx — 2-year CSS grid heatmap, always ends at today, auto-scrolled right
import { useRef, useEffect } from 'react';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getColor = (count) => {
  if (count === 0) return 'bg-gray-100 dark:bg-white/5';
  if (count <= 2) return 'bg-green-300/40 dark:bg-green-900/40';
  if (count <= 4) return 'bg-green-400/60 dark:bg-green-700/60';
  if (count <= 6) return 'bg-green-500/80 dark:bg-green-600/80';
  return 'bg-green-500 dark:bg-green-500';
};

/**
 * Compute the heatmap start date using a growing window:
 * - Minimum: 1 year ago (even if no old data exists yet)
 * - Grows as earliest data date moves further back
 * - Maximum: 5 years ago (after that, old days get dropped — rolling window)
 */
function computeStartDate(earliestDataStr) {
  const today = new Date();
  const oneYearAgo  = new Date(today); oneYearAgo.setFullYear(today.getFullYear() - 1);
  const fiveYearsAgo = new Date(today); fiveYearsAgo.setFullYear(today.getFullYear() - 5);

  if (!earliestDataStr) return oneYearAgo;

  const earliest = new Date(earliestDataStr);
  if (isNaN(earliest.getTime())) return oneYearAgo;

  // Use whichever is earlier: actual data start or 1-year-ago baseline
  const desiredStart = earliest < oneYearAgo ? earliest : oneYearAgo;
  // Never go further back than 5 years
  return desiredStart < fiveYearsAgo ? fiveYearsAgo : desiredStart;
}

function generateDates(startDate) {
  const dates = [];
  const today = new Date();
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  while (current <= today) {
    dates.push(current.toLocaleDateString('en-CA'));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export default function ActivityHeatmap({ loading, heatmapData }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [heatmapData]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
        <Skeleton className="h-3 w-28 mb-4" />
        <Skeleton className="h-16 w-full rounded" />
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString('en-CA');
  const fiveYearsAgoStr = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 5); return d.toLocaleDateString('en-CA'); })();

  // Build map — reject anything outside the 5-year window (catches epoch/1970 dates)
  const map = {};
  (heatmapData || []).forEach(d => {
    if (d.date >= fiveYearsAgoStr && d.date <= todayStr) {
      map[d.date] = (map[d.date] || 0) + d.count;
    }
  });

  // Find earliest real data point to size the window
  const sortedDataDates = Object.keys(map).sort();
  const startDate = computeStartDate(sortedDataDates[0]);
  const allDates = generateDates(startDate);

  // Group into weeks (columns of 7 rows)
  const weeks = [];
  let week = [];
  // Pad start so first cell is on correct day-of-week
  const firstDate = new Date(allDates[0]);
  const startDow = (firstDate.getDay() + 6) % 7; // Mon=0
  for (let p = 0; p < startDow; p++) week.push(null);

  allDates.forEach(date => {
    week.push(date);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
      }
    });
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
  
    // Month labels positioning
    const monthLabels = [];
    let lastMonth = -1;
    let lastYear = -1;
    weeks.forEach((w, wi) => {
      const dateStr = w.find(d => d);
      if (!dateStr) return;
      const dObj = new Date(dateStr);
      const m = dObj.getMonth();
      const y = dObj.getFullYear();
      if (m !== lastMonth || y !== lastYear) {
        // Show year on January
        monthLabels.push({ index: wi, label: m === 0 ? `'${String(y).slice(2)}` : MONTHS[m] });
        lastMonth = m;
        lastYear = y;
      }
    });

  const totalActive = Object.values(map).filter(c => c > 0).length;

  // Dynamic label: "Last 1 Year", "Last 2 Years", etc.
  const windowYears = Math.round((new Date() - startDate) / (365.25 * 24 * 3600 * 1000) * 10) / 10;
  const windowLabel = windowYears < 1.1
    ? 'Last 1 Year'
    : windowYears >= 4.9
      ? 'Last 5 Years'
      : `Last ${Math.round(windowYears)} Years`;

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 dark:text-[#9CA3AF] font-normal uppercase tracking-wide">Activity — {windowLabel}</p>
        <span className="text-xs text-gray-400 dark:text-[#9CA3AF] font-normal">{totalActive} active days</span>
      </div>


      <div className="overflow-x-auto" ref={scrollRef}>
        <div style={{ position: 'relative' }}>
          {/* Month labels */}
          <div className="flex mb-1" style={{ paddingLeft: '0px' }}>
            {weeks.map((_, wi) => {
              const label = monthLabels.find(l => l.index === wi);
              return (
                <div key={wi} className="shrink-0" style={{ width: '12px', marginRight: '2px' }}>
                  {label && (
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 font-normal">{label.label}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid: transpose weeks into rows */}
          <div style={{ display: 'flex', gap: '2px' }}>
            {weeks.map((w, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {w.map((date, di) => (
                  <div
                    key={di}
                    title={date ? `${date}: ${map[date] || 0} submissions` : ''}
                    className={`w-3 h-3 rounded-sm transition-colors ${date ? getColor(map[date] || 0) : 'bg-transparent opacity-0'}`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-2 justify-end">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">Less</span>
            {['bg-gray-100 dark:bg-white/5', 'bg-green-200 dark:bg-green-900/50', 'bg-green-300 dark:bg-green-700/60', 'bg-green-400 dark:bg-green-600', 'bg-green-500 dark:bg-green-500'].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
