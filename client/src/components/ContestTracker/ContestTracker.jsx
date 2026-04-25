// ContestTracker.jsx — main page: calendar (left) + upcoming sidebar (right)
import { useState } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

import { useContestData } from '../../hooks/useContestData';
import CalendarGrid      from './CalendarGrid';
import UpcomingSidebar   from './UpcomingSidebar';

// ── Helper: today's year/month ────────────────────────────────────────────────
function todayYM() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() };
}

export default function ContestTracker() {
  const { contests, loading, error } = useContestData();

  // Separate state for which month the calendar is showing
  const [{ year, month }, setYM] = useState(todayYM);

  const goPrev = () =>
    setYM(({ year: y, month: m }) =>
      m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 }
    );

  const goNext = () =>
    setYM(({ year: y, month: m }) =>
      m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 }
    );

  return (
    <div className="bg-[#ffffff] dark:bg-[#0a0a0a] px-6 py-6 min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-4">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-lg font-medium text-gray-900 dark:text-white">
                Contest Tracker
              </h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-normal mt-0.5">
                Codeforces + LeetCode + CodeChef
              </p>
            </div>

            {/* Visual Legend */}
            <div className="hidden xl:flex items-center gap-4 text-[9px] font-semibold text-gray-500 dark:text-gray-400 ml-2 pl-6 border-l border-gray-200 dark:border-white/10">
              {/* CF */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>CF Unattempted</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500 dark:bg-blue-600 border border-blue-600 text-white shadow-sm shadow-blue-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>CF Attempted</span>
                </div>
              </div>

              {/* LC */}
              <div className="flex items-center gap-1.5 border-l border-gray-200 dark:border-white/10 pl-4">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400/10 dark:bg-amber-400/15 border border-amber-400/20 text-amber-600 dark:text-amber-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>LC Unattempted</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500 dark:bg-amber-600 border border-amber-600 text-white shadow-sm shadow-amber-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>LC Attempted</span>
                </div>
              </div>

              {/* CC */}
              <div className="flex items-center gap-1.5 border-l border-gray-200 dark:border-white/10 pl-4">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>CC Unattempted</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500 dark:bg-emerald-600 border border-emerald-600 text-white shadow-sm shadow-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>CC Attempted</span>
                </div>
              </div>
            </div>
          </div>

          {/* Auto-update info chip — no manual refresh needed */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06]">
            <RefreshCcw size={11} className="text-gray-400 dark:text-gray-500 shrink-0" />
            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
              Auto-updated every 6h
            </span>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && !loading && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/[0.08] border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
            <AlertTriangle size={15} className="shrink-0" />
            <span className="font-normal">
              Could not fetch contest data — {error}. Showing cached data if available.
            </span>
          </div>
        )}

        {/* ── Main layout: calendar + sidebar ── */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* Calendar takes remaining space */}
          <CalendarGrid
            contests={contests}
            year={year}
            month={month}
            onPrev={goPrev}
            onNext={goNext}
            loading={loading}
          />

          {/* Upcoming sidebar fixed width */}
          <UpcomingSidebar
            contests={contests}
            loading={loading}
          />
        </div>

      </div>
    </div>
  );
}
