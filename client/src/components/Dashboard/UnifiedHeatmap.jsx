import { useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const CELL = 12, GAP = 3, ROWS = 7;
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getColor(count, max, dark) {
  if (count === 0) return dark ? '#161622' : '#EEF2FF';
  const t = Math.min(count / Math.max(max, 1), 1);
  if (dark) {
    if (t < 0.25) return '#1e1b4b';
    if (t < 0.5)  return '#3730a3';
    if (t < 0.75) return '#6366f1';
    return '#818cf8';
  }
  if (t < 0.25) return '#C7D2FE';
  if (t < 0.5)  return '#818CF8';
  if (t < 0.75) return '#6366F1';
  return '#4F46E5';
}

export default function UnifiedHeatmap({ data, isDark }) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });

  const { weeks, maxCount, monthLabels } = useMemo(() => {
    if (!data?.length) return { weeks: [], maxCount: 0, monthLabels: [] };
    const weeks = []; let cur = []; let maxC = 0; const mLabels = []; let lastM = -1;
    const first = new Date(data[0].date);
    for (let i = 0; i < first.getDay(); i++) cur.push(null);
    data.forEach(d => {
      const dt = new Date(d.date); const m = dt.getMonth();
      if (m !== lastM) { mLabels.push({ wi: weeks.length, label: MONTHS[m] }); lastM = m; }
      maxC = Math.max(maxC, d.count); cur.push(d);
      if (cur.length === 7) { weeks.push(cur); cur = []; }
    });
    if (cur.length) weeks.push(cur);
    return { weeks, maxCount: maxC, monthLabels: mLabels };
  }, [data]);

  const W = weeks.length * (CELL + GAP) + 40;
  const H = ROWS * (CELL + GAP) + 30;

  const onEnter = (e, day) => {
    if (!ref.current) return;
    const r = e.target.getBoundingClientRect();
    const c = ref.current.getBoundingClientRect();
    setHovered(day);
    setTipPos({ x: r.left - c.left + r.width / 2, y: r.top - c.top - 8 });
  };

  return (
    <motion.div ref={ref}
      className="card-glow bg-white dark:bg-[#13131d] border border-gray-200 dark:border-[#1e1e2e] rounded-2xl p-5 overflow-hidden relative"
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles size={14} />
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Activity Pulse</h3>
        </div>
        <div className="flex items-center text-[10px] text-gray-500 dark:text-gray-400 gap-1.5 font-medium">
          <span>Less</span>
          <div className="flex gap-1">
            {[0,0.25,0.5,0.75,1].map((v,i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: getColor(v*10, 10, isDark) }} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-hidden custom-scroll pb-1">
        <svg width={W} height={H} className="min-w-max">
          {monthLabels.map((m,i) => (
            <text key={i} x={40 + m.wi*(CELL+GAP)} y={10} fill={isDark?'#6b7280':'#6B7280'} fontSize="10" fontWeight="600" fontFamily="inherit">{m.label}</text>
          ))}
          {DAY_LABELS.map((l,i) => l && (
            <text key={i} x={0} y={22+i*(CELL+GAP)+CELL/2} fill={isDark?'#4b5563':'#9CA3AF'} fontSize="9" fontWeight="600" fontFamily="inherit" dominantBaseline="central">{l}</text>
          ))}
          {weeks.map((wk,wi) => wk.map((day,di) => {
            if (!day) return null;
            return (
              <rect key={`${wi}-${di}`}
                x={40+wi*(CELL+GAP)} y={20+di*(CELL+GAP)} width={CELL} height={CELL} rx={3} ry={3}
                fill={getColor(day.count, maxCount, isDark)}
                className="transition-all duration-150 cursor-pointer"
                style={{ stroke: hovered===day?(isDark?'#818cf8':'#6366f1'):'transparent', strokeWidth: hovered===day?2:0 }}
                onMouseEnter={e => onEnter(e, day)} onMouseLeave={() => setHovered(null)} />
            );
          }))}
        </svg>
      </div>

      {hovered && (
        <div className="heatmap-tip absolute z-20 bg-white dark:bg-[#1a1a28] border border-gray-200 dark:border-[#2a2a3a] rounded-lg px-3 py-2 shadow-lg"
          style={{ left: tipPos.x, top: tipPos.y, transform: 'translate(-50%,-100%)' }}>
          <p className="text-xs font-semibold text-gray-900 dark:text-white">{hovered.date}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{hovered.count} submission{hovered.count !== 1 ? 's' : ''}</p>
        </div>
      )}
    </motion.div>
  );
}
