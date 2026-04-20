import { ExternalLink } from 'lucide-react';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded ${className}`} />
);

const CF_BADGE = (
  <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
    CF
  </span>
);
const LC_BADGE = (
  <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
    LC
  </span>
);

function timeAgo(value) {
  if (!value) return '';
  // CF uses Date string, LC uses unix timestamp string
  const ms = typeof value === 'number' || /^\d+$/.test(String(value))
    ? Number(value) * 1000
    : new Date(value).getTime();
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getMs(value) {
  if (!value) return 0;
  return typeof value === 'number' || /^\d+$/.test(String(value))
    ? Number(value) * 1000
    : new Date(value).getTime();
}

export default function RecentSubmissions({ loading, cfSubmissions, lcSubmissions, view = 'all' }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
        <Skeleton className="h-3 w-40 mb-4" />
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  // Normalise CF items
  const cfItems = (cfSubmissions || []).map(s => ({
    platform: 'cf',
    title: s.title || s.problemId || 'Unknown',
    url: s.url || null,
    difficulty: s.difficulty ? `${s.difficulty}` : null,
    time: s.submittedAt,
  }));

  // Normalise LC items
  const lcItems = (lcSubmissions || []).map(s => {
    const slug = s.titleSlug || s.title?.toLowerCase().replace(/\s+/g, '-') || '';
    return {
      platform: 'lc',
      title: s.title || s.titleSlug || 'Unknown',
      url: slug ? `https://leetcode.com/problems/${slug}/` : null,
      difficulty: null,
      time: s.timestamp,
    };
  });

  // Merge + sort by time desc
  const merged = [...cfItems, ...lcItems]
    .sort((a, b) => getMs(b.time) - getMs(a.time))
    .slice(0, 15);

  const title = view === 'cf'
    ? 'Recent AC Submissions (CF)'
    : view === 'lc'
      ? 'Recent AC Submissions (LC)'
      : 'Recent AC Submissions';

  if (merged.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
        <p className="text-xs text-gray-400 dark:text-[#9CA3AF] font-normal uppercase tracking-wide mb-3">{title}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No recent submissions</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-4">
      <p className="text-xs text-gray-400 dark:text-[#9CA3AF] font-normal uppercase tracking-wide mb-3">{title}</p>
      <div className="space-y-0.5">
        {merged.map((item, i) => (
          <a
            key={i}
            href={item.url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors group ${
              item.url ? 'hover:bg-gray-50 dark:hover:bg-white/[0.04] cursor-pointer' : 'cursor-default'
            }`}
          >
            {/* Platform badge */}
            {view === 'all' && (item.platform === 'cf' ? CF_BADGE : LC_BADGE)}

            {/* Dot */}
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-emerald-500" />

            {/* Title */}
            <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {item.title}
            </span>

            {/* Difficulty (CF only) */}
            {item.difficulty && (
              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 flex-shrink-0">
                {item.difficulty}
              </span>
            )}

            {/* AC badge */}
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
              AC
            </span>

            {/* Time */}
            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 w-12 text-right">
              {timeAgo(item.time)}
            </span>

            {/* External link icon */}
            {item.url && (
              <ExternalLink size={11} className="text-gray-300 dark:text-gray-600 flex-shrink-0 group-hover:text-emerald-500 transition-colors" />
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
