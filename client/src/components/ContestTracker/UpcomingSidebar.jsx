// UpcomingSidebar.jsx — Upcoming + Past contest sections with live countdowns
import { useState, useEffect } from 'react';
import { ExternalLink, Clock, CalendarDays, ChevronDown, ChevronUp, Trophy } from 'lucide-react';

// ── Platform colour tokens ─────────────────────────────────────────────────────
const PLATFORM_META = {
  codeforces: {
    dot:    'bg-blue-500',
    badge:  'bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400',
    abbr:   'CF',
  },
  leetcode: {
    dot:    'bg-amber-400',
    badge:  'bg-amber-400/10 dark:bg-amber-400/15 border border-amber-400/20 text-amber-600 dark:text-amber-400',
    abbr:   'LC',
  },
  codechef: {
    dot:    'bg-emerald-500',
    badge:  'bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    abbr:   'CC',
  },
};

const MONTH_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN',
                    'JUL','AUG','SEP','OCT','NOV','DEC'];

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

// ── Countdown hook — ticks every 30s ─────────────────────────────────────────
function useNow(interval = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

// ── Relative time formatter ────────────────────────────────────────────────────
function formatRelative(startTime, now) {
  const ms = startTime.getTime() - now;

  if (ms < 0) {
    const elapsed = Math.abs(ms);
    const h = Math.floor(elapsed / 3_600_000);
    const m = Math.floor((elapsed % 3_600_000) / 60_000);
    const d = Math.floor(h / 24);
    if (d > 0) return { label: `${d}d ago`, running: false, past: true };
    if (h > 0) return { label: `${h}h ${m}m ago`, running: true, past: false };
    return { label: `${m}m ago`, running: true, past: false };
  }

  const totalMin = Math.floor(ms / 60_000);
  const days  = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins  = totalMin % 60;

  if (days > 0) return { label: `In ${days}d ${hours}h`, running: false, past: false };
  if (hours > 0) return { label: `Starts in ${hours}h ${mins}m`, running: false, past: false };
  return { label: `Starts in ${mins}m`, running: false, past: false };
}

// ── Date badge ────────────────────────────────────────────────────────────────
function DateBadge({ date, muted = false }) {
  const d = new Date(date);
  return (
    <div className={`flex flex-col items-center justify-center w-10 shrink-0 rounded-lg py-1.5 px-1 border ${
      muted
        ? 'bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.04]'
        : 'bg-gray-100 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.06]'
    }`}>
      <span className={`text-[9px] font-bold uppercase tracking-widest leading-none ${
        muted ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'
      }`}>
        {MONTH_ABBR[d.getMonth()]}
      </span>
      <span className={`text-base font-black leading-tight ${
        muted ? 'text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-100'
      }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {String(d.getDate()).padStart(2, '0')}
      </span>
    </div>
  );
}

// ── Single contest row ────────────────────────────────────────────────────────
function ContestRow({ c, now, muted = false }) {
  const meta = PLATFORM_META[c.platform] || PLATFORM_META.codeforces;
  const rel  = formatRelative(c.startTime, now);
  const isLive = rel.running && !rel.past;

  return (
    <a
      href={c.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-start gap-3 py-2.5 group transition-all duration-200 rounded-lg -mx-1 px-1 ${
        c.attempted && muted
          ? 'bg-emerald-50/50 dark:bg-emerald-500/[0.04] opacity-100 hover:bg-emerald-50 dark:hover:bg-emerald-500/[0.08]'
          : muted
            ? 'opacity-60 hover:opacity-80 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
            : isLive
              ? 'hover:bg-emerald-50 dark:hover:bg-emerald-500/[0.06]'
              : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
      }`}
    >
      <DateBadge date={c.startTime} muted={muted} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className={`text-xs font-medium leading-snug truncate pr-1 transition-colors ${
            muted
              ? 'text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-400'
              : 'text-gray-800 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-white'
          }`}>
            {c.name}
          </p>
          <ExternalLink
            size={11}
            className={`shrink-0 mt-0.5 transition-colors ${
              muted
                ? 'text-gray-200 dark:text-gray-700 group-hover:text-gray-400 dark:group-hover:text-gray-500'
                : 'text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {/* Platform badge */}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${meta.badge}`}>
            {meta.abbr}
          </span>

          {/* Countdown / relative time */}
          <div className={`flex items-center gap-1 text-[10px] font-medium ${
            isLive
              ? 'text-emerald-600 dark:text-emerald-400'
              : rel.past
                ? 'text-gray-400 dark:text-gray-500'
                : 'text-gray-500 dark:text-gray-400'
          }`}>
            <Clock size={9} className="shrink-0" />
            {isLive && (
              <span className="relative flex w-1.5 h-1.5 mr-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
            )}
            <span>{rel.label}</span>
          </div>

          {/* Duration */}
          {c.duration && (
            <span className="text-[10px] text-gray-400 dark:text-gray-600 font-normal">
              · {c.duration >= 60
                ? `${Math.floor(c.duration / 60)}h${c.duration % 60 > 0 ? ` ${c.duration % 60}m` : ''}`
                : `${c.duration}m`}
            </span>
          )}
        </div>

        {/* User Attempt Stats */}
        {c.attempted && (
          <div className="flex items-center gap-3 mt-2 mb-0.5">
            {c.attempted.rank && (
              <div className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-amber-600 dark:text-amber-500">
                <Trophy size={10} />
                <span>Rank #{c.attempted.rank}</span>
              </div>
            )}
            {c.attempted.solvedCount > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-emerald-600 dark:text-emerald-500">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                <span>{c.attempted.solvedCount} Solved</span>
              </div>
            )}
          </div>
        )}
      </div>
    </a>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function UpcomingSidebar({ contests = [], loading }) {
  const now = useNow(30_000);
  const [pastExpanded, setPastExpanded] = useState(false);

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-5 flex flex-col w-full lg:w-[320px] shrink-0">
        <Skeleton className="h-3 w-32 mb-5" />
        {[...Array(6)].map((_,i) => (
          <div key={i} className="flex items-start gap-3 mb-4">
            <Skeleton className="w-10 h-12 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2.5 w-2/3" />
              <Skeleton className="h-2 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Split: upcoming = starts in future OR started <2h ago (live)
  //        past     = started >2h ago (i.e. finished or ongoing-but-old)
  const upcoming = contests
    .filter(c => c.startTime && c.startTime.getTime() > now - 2 * 3_600_000)
    .sort((a, b) => a.startTime - b.startTime)
    .slice(0, 12);

  const past = contests
    .filter(c => c.startTime && c.startTime.getTime() <= now - 2 * 3_600_000)
    .sort((a, b) => b.startTime - a.startTime); // newest-first

  const pastVisible = pastExpanded ? past : past.slice(0, 5);

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-5 flex flex-col w-full lg:w-[320px] shrink-0">

      {/* ── Upcoming header ── */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold text-gray-900 dark:text-white tracking-tight">
            Upcoming Contests
          </p>
        </div>
        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/[0.04] px-2 py-0.5 rounded-full">
          {upcoming.length}
        </span>
      </div>

      {/* ── Upcoming list ── */}
      <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.04] overflow-y-auto max-h-[480px] pr-0.5 mb-4">
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 font-normal text-center py-6">
            No upcoming contests found
          </p>
        ) : (
          upcoming.map((c, i) => (
            <ContestRow key={c.id || i} c={c} now={now} />
          ))
        )}
      </div>

      {/* ── Divider ── */}
      {past.length > 0 && (
        <div className="border-t border-gray-100 dark:border-white/[0.06] pt-4">

          {/* Past header — also toggles expand */}
          <button
            onClick={() => setPastExpanded(p => !p)}
            className="flex items-center justify-between w-full mb-2 group"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Past Contests
              </span>
              <span className="text-[9px] font-medium text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-white/[0.04] px-1.5 py-0.5 rounded-full">
                {past.length}
              </span>
            </div>
            {pastExpanded
              ? <ChevronUp size={13} className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              : <ChevronDown size={13} className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            }
          </button>

          {/* Past list */}
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.03] overflow-y-auto max-h-[400px] pr-0.5">
            {pastVisible.map((c, i) => (
              <ContestRow key={c.id || i} c={c} now={now} muted />
            ))}
          </div>

          {/* "Show more / less" */}
          {past.length > 5 && (
            <button
              onClick={() => setPastExpanded(p => !p)}
              className="mt-2 w-full text-[10px] font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-center"
            >
              {pastExpanded ? 'Show less' : `Show all ${past.length} past contests`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
