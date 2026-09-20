import React from 'react';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

function StatRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-black/[0.04] dark:border-white/[0.05] last:border-0">
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</span>
      <span className="text-sm font-semibold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

export default function GFGQuickStats({
  loading,
  codingScore,
  monthlyScore,
  totalSolved,
  instituteRank,
  institution,
  lastSyncedAt,
}) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 h-full">
        <Skeleton className="h-3 w-24 mb-4" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full mb-2" />)}
      </div>
    );
  }

  const fmt = (n) => n > 0 ? `#${n.toLocaleString()}` : '—';

  const rows = [
    { label: 'Coding Score',      value: codingScore != null ? codingScore.toLocaleString() : '—', color: '#2F8D46' },
    { label: 'Total Solved',      value: totalSolved != null ? totalSolved.toLocaleString() : '—', color: '#10b981' },
    { label: 'Institute Rank',    value: fmt(instituteRank),                                      color: '#3b82f6' },
    { label: 'Institution',       value: institution || '—',                                      color: '#9ca3af' },
    { label: 'Monthly Score',     value: monthlyScore != null ? monthlyScore.toLocaleString() : '0', color: '#8b5cf6' },
  ];

  const syncLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'never';

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          GeeksforGeeks Stats
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-600" title="Last synced at">
          {syncLabel}
        </p>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        {rows.map(r => <StatRow key={r.label} {...r} />)}
      </div>
    </div>
  );
}
