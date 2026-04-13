// ActivityHeatmap.jsx — 12-month CSS grid heatmap (no canvas, no 3rd-party)
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

function generateLifetimeDates(firstDateStr) {
  const dates = [];
  const todayStr = new Date().toLocaleDateString('en-CA');
  
  let startStr = firstDateStr || todayStr;
  if (startStr > todayStr) startStr = todayStr;

  const [y, m, d] = startStr.split('-').map(Number);
  const current = new Date(y, m - 1, d);
  
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const target = new Date(ty, tm - 1, td);

  while (current <= target) {
    dates.push(
      `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}-${String(current.getDate()).padStart(2,'0')}`
    );
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export default function ActivityHeatmap({ loading, heatmapData }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
        <Skeleton className="h-3 w-28 mb-4" />
        <Skeleton className="h-16 w-full rounded" />
      </div>
    );
  }

  // Build date→count map
  const map = {};
  (heatmapData || []).forEach(d => { map[d.date] = (map[d.date] || 0) + d.count; });

  const sortedDates = Object.keys(map).sort();
  const firstActiveDate = sortedDates.length > 0 ? sortedDates[0] : null;
  const allDates = generateLifetimeDates(firstActiveDate);

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

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 dark:text-[#9CA3AF] font-normal uppercase tracking-wide">Activity — Last 2 Years</p>
        <span className="text-xs text-gray-400 dark:text-[#9CA3AF] font-normal">{totalActive} active days</span>
      </div>


      <div className="overflow-x-auto">
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
                    className={`w-3 h-3 rounded-sm transition-colors ${date ? getColor(map[date] || 0) : 'bg-gray-100 dark:bg-white/5'}`}
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
