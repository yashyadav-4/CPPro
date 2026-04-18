// CalendarGrid.jsx — monthly calendar grid with contest pill indicators
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS    = ['January','February','March','April','May','June',
                   'July','August','September','October','November','December'];

// ── Platform colour tokens ────────────────────────────────────────────────────
const PLATFORM_META = {
  codeforces: {
    dot:   'bg-blue-500',
    pill:  'bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400',
    dotAttempted: 'bg-white',
    pillAttempted: 'bg-blue-500 dark:bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/20',
    label: 'CF',
  },
  leetcode: {
    dot:   'bg-amber-400',
    pill:  'bg-amber-400/10 dark:bg-amber-400/15 border border-amber-400/20 text-amber-600 dark:text-amber-400',
    dotAttempted: 'bg-white',
    pillAttempted: 'bg-amber-500 dark:bg-amber-600 border-amber-600 text-white shadow-sm shadow-amber-500/20',
    label: 'LC',
  },
};

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildCalendarDays(year, month) {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);

  // Mon-anchored: Mon=0 … Sun=6
  const startDow = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(d);
  // pad to complete last row with 6 cols = rows of 7
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CalendarGrid({ contests = [], year, month, onPrev, onNext, loading }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-5 flex-1">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {[...Array(7)].map((_,i) => <Skeleton key={i} className="h-3 w-full mb-1 rounded" />)}
          {[...Array(35)].map((_,i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const days = buildCalendarDays(year, month);

  // Build a map: dateKey → [contests]
  const contestMap = {};
  contests.forEach(c => {
    if (!c.startTime) return;
    const d = c.startTime;
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (!contestMap[key]) contestMap[key] = [];
    contestMap[key].push(c);
  });

  const today = new Date();
  const isToday = (day) =>
    day &&
    today.getFullYear() === year &&
    today.getMonth()    === month &&
    today.getDate()     === day;

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-5 flex flex-col flex-1 min-w-0">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
            {MONTHS[month]} {year}
          </h2>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-normal uppercase tracking-widest mt-0.5">
            Contest Calendar
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 mr-3">
            {Object.entries(PLATFORM_META).map(([k, m]) => (
              <div key={k} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${m.dot}`} />
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={onPrev}
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.08] hover:text-gray-700 dark:hover:text-gray-200 transition-all"
            aria-label="Previous month"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={onNext}
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.08] hover:text-gray-700 dark:hover:text-gray-200 transition-all"
            aria-label="Next month"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Weekday labels ── */}
      <div className="grid grid-cols-7 gap-1 mb-1 shrink-0">
        {WEEKDAYS.map(w => (
          <div key={w} className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest py-1">
            {w}
          </div>
        ))}
      </div>

      {/* ── Day cells ── */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {days.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="rounded-lg" />;
          }

          const key      = dateKey(year, month, day);
          const dayItems = contestMap[key] || [];
          const today_   = isToday(day);

          return (
            <div
              key={key}
              className={`
                relative rounded-lg p-1 flex flex-col gap-0.5 transition-all duration-200 cursor-default min-h-[100px]
                ${today_
                  ? 'bg-emerald-50 dark:bg-emerald-500/[0.08] border border-emerald-200 dark:border-emerald-500/30'
                  : dayItems.length > 0
                    ? 'bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.04]'
                    : 'border border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                }
              `}
            >
              {/* Day number */}
              <span className={`text-[11px] font-semibold leading-none mb-0.5 ${
                today_
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-500'
              }`}>
                {day}
              </span>

              {/* Contest pills — show up to 4, then overflow indicator */}
              {dayItems.slice(0, 4).map((c, i) => {
                const meta = PLATFORM_META[c.platform] || PLATFORM_META.codeforces;
                return (
                  <a
                    key={i}
                    href={c.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={c.name}
                    className={`
                      flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold leading-none truncate
                      ${c.attempted ? meta.pillAttempted : meta.pill} hover:opacity-80 transition-opacity
                    `}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.attempted ? meta.dotAttempted : meta.dot}`} />
                    <span className="truncate pr-1">{c.name}</span>
                    {c.attempted && (
                      <span className="shrink-0 text-[8.5px] opacity-90 tracking-wide border-l border-white/30 pl-1.5 ml-auto flex gap-1">
                        {c.attempted.rank && <span>#{c.attempted.rank}</span>}
                        {c.attempted.rank && c.attempted.solvedCount > 0 && <span className="opacity-70">·</span>}
                        {c.attempted.solvedCount > 0 && <span>{c.attempted.solvedCount} AC</span>}
                      </span>
                    )}
                  </a>
                );
              })}

              {dayItems.length > 4 && (
                <span className="text-[9px] text-gray-400 dark:text-gray-600 font-medium pl-0.5 mt-auto">
                  +{dayItems.length - 4} more
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
