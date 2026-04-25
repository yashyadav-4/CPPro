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

export default function CCQuickStats({
  loading,
  globalRank, countryRank,
  totalSolved, totalSubmissions,
  ccAcceptanceRate, ccSolvedThisMonth,
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
    { label: 'Global Rank',       value: fmt(globalRank),                              color: '#ef4444' },
    { label: 'Country Rank',      value: fmt(countryRank),                             color: '#f97316' },
    { label: 'Total Solved',      value: totalSolved > 0 ? totalSolved : '—',          color: '#10b981' },
    { label: 'Total Submissions', value: totalSubmissions > 0 ? totalSubmissions : '—',color: '#6b7280' },
    { label: 'Acceptance Rate',   value: ccAcceptanceRate != null ? `${ccAcceptanceRate}%` : '—', color: '#3b82f6' },
    { label: 'Solved This Month', value: ccSolvedThisMonth > 0 ? ccSolvedThisMonth : '0', color: '#8b5cf6' },
  ];

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 h-full flex flex-col">
      <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
        CodeChef Stats
      </p>
      <div className="flex-1 flex flex-col justify-center">
        {rows.map(r => <StatRow key={r.label} {...r} />)}
      </div>
    </div>
  );
}
