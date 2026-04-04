// StatCards.jsx — 3-column grid of key stats, improved readability
const Skeleton = () => (
  <div className="bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
    <div className="animate-pulse space-y-2">
      <div className="h-3 w-20 bg-gray-100 dark:bg-white/5 rounded" />
      <div className="h-8 w-24 bg-gray-100 dark:bg-white/5 rounded" />
      <div className="h-3 w-28 bg-gray-100 dark:bg-white/5 rounded" />
    </div>
  </div>
);

export default function StatCards({
  loading, totalSolved, cfSolved, lcSolved, activeDays,
  totalSubmissions, currentStreak, bestStreak,
  acceptanceRate, cfAcceptanceRate, lcAcceptanceRate,
  solvedThisMonth, activeDaysThisMonth,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  const cards = [
    {
      label: 'TOTAL SOLVED',
      value: totalSolved ?? '—',
      sub: `CF: ${cfSolved ?? 0} | LC: ${lcSolved ?? 0}`,
      color: '#60a5fa', // blue-400
    },
    {
      label: 'ACTIVE DAYS',
      value: activeDays ?? '—',
      sub: activeDaysThisMonth ? `${activeDaysThisMonth} active this month` : 'No activity this month',
      color: '#4ade80', // green-400
    },
    {
      label: 'TOTAL SUBMISSIONS',
      value: totalSubmissions ?? '—',
      sub: solvedThisMonth ? `${solvedThisMonth} solved this month` : 'None this month',
      color: '#c084fc', // purple-400
    },
    {
      label: 'CURRENT STREAK',
      value: currentStreak ? `${currentStreak}` : '0',
      sub: `Best streak: ${bestStreak ?? 0} days`,
      color: currentStreak >= 7 ? '#fb923c' : '#9ca3af', // orange-400 or gray-400
    },
    {
      label: 'ACCEPTANCE RATE',
      value: acceptanceRate != null ? `${acceptanceRate}%` : '—',
      sub: `CF: ${cfAcceptanceRate ?? '—'}% | LC: ${lcAcceptanceRate ?? '—'}%`,
      color: '#22d3ee', // cyan-400
    },
    {
      label: 'SOLVED THIS MONTH',
      value: solvedThisMonth ?? 0,
      sub: acceptanceRate != null ? `${acceptanceRate}% overall acc` : 'No data',
      color: '#f472b6', // pink-400
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {cards.map((c, i) => (
        <div 
          key={i} 
          className="bg-white dark:bg-[#1C1C1C] border-y border-r border-y-black/[0.07] border-r-black/[0.07] dark:border-y-white/[0.06] dark:border-r-white/[0.06] rounded-lg py-6 pr-4 pl-5 border-l-[3px] shadow-sm"
          style={{ borderLeftColor: c.color }}
        >
          <p className="text-[11px] font-semibold text-gray-500 dark:text-[#9CA3AF] tracking-[0.05em] mb-2">{c.label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold text-gray-900 dark:text-[#F9FAFB] leading-none">{c.value}</span>
            <span className="text-[13px] font-medium text-gray-500 dark:text-[#9CA3AF]">{c.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
