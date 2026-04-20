// CFRatingDistribution — Histogram of problems solved by difficulty rating band
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

const BANDS = [
  { label: '≤900',  min: 0,    max: 900,  color: 'bg-gray-400 dark:bg-gray-500' },
  { label: '1000',  min: 1000, max: 1099, color: 'bg-emerald-400' },
  { label: '1100',  min: 1100, max: 1199, color: 'bg-emerald-500' },
  { label: '1200',  min: 1200, max: 1299, color: 'bg-teal-400' },
  { label: '1300',  min: 1300, max: 1399, color: 'bg-cyan-400' },
  { label: '1400',  min: 1400, max: 1499, color: 'bg-blue-400' },
  { label: '1500',  min: 1500, max: 1599, color: 'bg-blue-500' },
  { label: '1600',  min: 1600, max: 1699, color: 'bg-violet-400' },
  { label: '1700',  min: 1700, max: 1799, color: 'bg-violet-500' },
  { label: '1800',  min: 1800, max: 1899, color: 'bg-purple-500' },
  { label: '1900',  min: 1900, max: 1999, color: 'bg-orange-400' },
  { label: '2000',  min: 2000, max: 2099, color: 'bg-orange-500' },
  { label: '2100+', min: 2100, max: Infinity, color: 'bg-red-500' },
];

export default function CFRatingDistribution({ loading, cfDiffBands }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
        <Skeleton className="h-3 w-40 mb-4" />
        <div className="flex items-end gap-1 h-24">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="flex-1" style={{ height: `${20 + Math.random() * 60}%` }} />
          ))}
        </div>
      </div>
    );
  }

  // Bucket raw cfDiffBands into defined bands
  const bucketed = BANDS.map(band => {
    const count = (cfDiffBands || [])
      .filter(d => d.rating >= band.min && d.rating <= band.max)
      .reduce((sum, d) => sum + d.count, 0);
    return { ...band, count };
  }).filter(b => b.count > 0);

  const totalSolved = bucketed.reduce((s, b) => s + b.count, 0);
  const maxCount = Math.max(...bucketed.map(b => b.count), 1);

  if (bucketed.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4 flex items-center justify-center min-h-[120px]">
        <span className="text-sm text-gray-400 font-normal">No CF difficulty data yet</span>
      </div>
    );
  }

  // Categorise for summary chips
  const easy   = bucketed.filter(b => b.min <= 1199).reduce((s, b) => s + b.count, 0);
  const medium = bucketed.filter(b => b.min >= 1200 && b.min <= 1599).reduce((s, b) => s + b.count, 0);
  const hard   = bucketed.filter(b => b.min >= 1600).reduce((s, b) => s + b.count, 0);

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          CF Rating Distribution
        </p>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">{totalSolved} problems solved</span>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 mb-4">
        <span className="text-[10px] text-emerald-500 font-semibold">≤1199: {easy}</span>
        <span className="text-[10px] text-blue-400 font-semibold">1200–1599: {medium}</span>
        <span className="text-[10px] text-purple-400 font-semibold">1600+: {hard}</span>
      </div>

      {/* Histogram bars — 96px usable bar height (h-28 = 112px, 16px reserved for hover count label) */}
      <div className="flex items-end gap-1 h-28 mb-2">
        {bucketed.map((band, i) => {
          const barPx = Math.max(Math.round((band.count / maxCount) * 96), 4);
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end gap-0.5 group"
              title={`${band.label}: ${band.count} problems`}
            >
              <span className="text-[9px] text-gray-400 dark:text-gray-500 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity leading-none">
                {band.count}
              </span>
              <div
                className={`w-full rounded-t-sm transition-all duration-500 ${band.color} opacity-80 group-hover:opacity-100`}
                style={{ height: `${barPx}px` }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex gap-1">
        {bucketed.map((band, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[8px] text-gray-400 dark:text-gray-500 leading-none">{band.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
