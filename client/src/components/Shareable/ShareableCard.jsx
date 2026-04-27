// ShareableCard.jsx — fixed 1200×630 OG-sized canvas for social previews.
// Pure inline styles + hex colors keep html2canvas renders pixel-faithful.
// NOTE: No CSS `gap` is used — html2canvas v1.x does not support flex gap.
//       All spacing uses explicit margin on children instead.
import { forwardRef } from 'react';

// ── Shared Palette (Theme Independent) ───────────────────────────────────────
const EMERALD = '#10b981';
const CF_BLUE = '#3b82f6';
const LC_AMBER = '#f59e0b';
const ORANGE = '#f97316';
const GREEN_SUCCESS = '#34d399';

const FONT_SANS = "'DM Sans', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

// Compute theme variables dynamically based on `isDark` prop
function getThemeVars(isDark) {
  if (isDark) {
    return {
      SURFACE: '#0a0a0a',
      CARD_BG_ELEVATED: '#151515',
      BORDER: 'rgba(255,255,255,0.08)',
      BORDER_SOFT: 'rgba(255,255,255,0.05)',
      TEXT_PRIMARY: '#f9fafb', // gray-50
      TEXT_BODY: '#d1d5db',    // gray-300
      TEXT_MUTED: '#9ca3af',   // gray-400
      TEXT_DIM: '#6b7280',     // gray-500
      DOT_GRID: 'rgba(255,255,255,0.048)',
      STRIPES: 'rgba(255,255,255,0.012)',
      WATERMARK_BG: 'rgba(255,255,255,0.05)',
      WATERMARK_BORDER: 'rgba(255,255,255,0.12)',
    };
  } else {
    return {
      SURFACE: '#ffffff',
      CARD_BG_ELEVATED: '#f8fafc', // slate-50
      BORDER: 'rgba(0,0,0,0.08)',
      BORDER_SOFT: 'rgba(0,0,0,0.05)',
      TEXT_PRIMARY: '#111827', // gray-900
      TEXT_BODY: '#374151',    // gray-700
      TEXT_MUTED: '#6b7280',   // gray-500
      TEXT_DIM: '#9ca3af',     // gray-400
      DOT_GRID: 'rgba(0,0,0,0.04)',
      STRIPES: 'rgba(0,0,0,0.015)',
      WATERMARK_BG: 'rgba(0,0,0,0.03)',
      WATERMARK_BORDER: 'rgba(0,0,0,0.06)',
    };
  }
}

const CC_EMERALD = EMERALD;

const CF_RANK_COLOR = {
  'newbie': '#9ca3af', 'pupil': '#22c55e', 'specialist': '#06b6d4',
  'expert': '#3b82f6', 'candidate master': '#8b5cf6', 'master': '#f97316',
  'international master': '#fb923c', 'grandmaster': '#ef4444',
  'international grandmaster': '#dc2626', 'legendary grandmaster': '#b91c1c',
  'unrated': '#6b7280',
};
const LC_RANK_COLOR = {
  'beginner': '#9ca3af', 'intermediate': '#f59e0b',
  'knight': '#14b8a6', 'guardian': '#10b981',
  'unrated': '#6b7280',
};
const CC_RANK_COLOR = {
  '1 star': '#9ca3af', '2 star': '#22c55e', '3 star': '#06b6d4',
  '4 star': '#3b82f6', '5 star': '#f59e0b', '6 star': '#f97316',
  '7 star': '#ef4444', 'unrated': '#6b7280',
};
const rankColor = (platform, rank) => {
  const map = platform === 'cf' ? CF_RANK_COLOR : platform === 'cc' ? CC_RANK_COLOR : LC_RANK_COLOR;
  return map[(rank || '').toLowerCase()] || '#6b7280';
};

// ── Platform SVGs ─────────────────────────────────────────────────────────────
function CodeChefMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.5 2 6 5 6 8c0 1.5.5 3 1.5 4C6 13.5 5 15.5 5 17.5 5 20.5 7.5 22 12 22s7-1.5 7-4.5c0-2-.9-4-2.5-5.5C17.5 11 18 9.5 18 8c0-3-2.5-6-6-6z" fill="#10b981" opacity="0.9" />
      <path d="M12 5c-2 0-3.5 1.5-3.5 3.5S10 12 12 12s3.5-1.5 3.5-3.5S14 5 12 5z" fill="white" opacity="0.85" />
    </svg>
  );
}
function CodeforcesMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="5" height="9" fill="#1F8ACB" />
      <rect x="9.5" y="6" width="5" height="15" fill="#1F8ACB" />
      <rect x="16" y="2" width="5" height="19" fill="#E84142" />
    </svg>
  );
}
function LeetCodeMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFA116">
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125 1.513 5.527 5.527 0 0 0 .524 1.83 5.4 5.4 0 0 0 1.258 1.547l3.851 3.535A1.374 1.374 0 0 0 8.647 24h.016a1.37 1.37 0 0 0 1.055-.546l.01-.013c.277-.386.23-.923-.105-1.255l-3.858-3.54a3.178 3.178 0 0 1-.77-1.026 3.084 3.084 0 0 1-.295-1.07 3.014 3.014 0 0 1 .063-.889 3.045 3.045 0 0 1 .715-1.265l3.86-4.133 5.41-5.792a1.37 1.37 0 0 0 .15-1.42 1.374 1.374 0 0 0-1.405-.913z" />
      <path d="M22.062 14.161H10.158a1.37 1.37 0 0 0-1.37 1.37 1.37 1.37 0 0 0 1.37 1.37h11.904a1.37 1.37 0 0 0 1.37-1.37 1.37 1.37 0 0 0-1.37-1.37z" />
    </svg>
  );
}

// ── Smart headline ─────────────────────────────────────────────────────────────
function buildHeadline({ totalSolved, bestStreak, solvedThisMonth, activeDays, platforms }) {
  const names = (platforms || []).join(', ');
  if (solvedThisMonth > 0) {
    return `${solvedThisMonth} problems solved this month — momentum building.`;
  }
  if (bestStreak >= 7 && activeDays > 0) {
    return `Best streak of ${bestStreak} days across ${activeDays} total active days.`;
  }
  if (totalSolved > 0 && names) {
    return `${totalSolved.toLocaleString()} problems solved across ${names}.`;
  }
  if (totalSolved > 0) {
    return `${totalSolved.toLocaleString()} problems solved and counting.`;
  }
  return `On the climb — every submission counts.`;
}

// ── Main component ────────────────────────────────────────────────────────────
const ShareableCard = forwardRef(function ShareableCard({
  // Theme context
  isDark = true,

  // Identity
  userName = '',
  userUsername = '',
  cfHandle = null, cfRating = 0, cfMaxRating = 0, cfRank = null,
  lcHandle = null, lcRating = 0, lcMaxRating = 0, lcRank = null,
  ccHandle = null, ccRating = 0, ccMaxRating = 0, ccRank = null,
  cfSolved = 0, lcSolved = 0, ccSolved = 0,
  ccRatingHistory = [],
  currentStreak = 0, bestStreak = 0,
  cfCurrentStreak = 0, lcStreak = 0,
  acceptanceRate = null,
  cfAcceptanceRate = null,
  topics = [],
  lcEasy = 0, lcMedium = 0, lcHard = 0,
  cfRatingHistory = [], lcRatingHistory = [],
  // Server-authoritative CPScore
  serverCpScore = null,
  // Multi-category rank props
  cpScoreRank = null, cpScoreTotal = null,
  totalQRank = null, totalQTotal = null,
  lcRatingRank = null, lcRatingTotal = null,
  cfRatingRank = null, cfRatingTotal = null,
  // Streak / activity
  activeDays = 0,
  solvedThisMonth = 0,
}, ref) {

  // Retrieve current palette
  const theme = getThemeVars(isDark);

  // ── Helper Subcomponents (Closed over theme) ───────────────────────────────

  const RankPill = ({ rank, total, label, accent }) => {
    if (!rank || rank <= 0) return null;
    const pct = (total && total >= 10) ? Math.round((1 - rank / total) * 100) : null;
    const rgbMap = { [EMERALD]: '16,185,129', [CF_BLUE]: '59,130,246', [LC_AMBER]: '245,158,11' };
    const rgb = rgbMap[accent] || '16,185,129';
    return (
      // marginRight: 8 so rank pills row works without flex gap
      <div style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '4px 11px', borderRadius: 6,
        background: `rgba(${rgb},0.10)`,
        border: `1px solid rgba(${rgb},${isDark ? '0.30' : '0.40'})`,
        marginRight: 8,
        marginBottom: 4,
      }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: accent, lineHeight: '1.6', marginRight: 6 }}>#{rank}</span>
        <span style={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 500, color: theme.TEXT_MUTED, lineHeight: '1.6', marginRight: pct !== null && pct > 0 ? 6 : 0 }}>{label}</span>
        {pct !== null && pct > 0 && (
          <span style={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 600, color: GREEN_SUCCESS, lineHeight: '1.6' }}>· Top {pct}%</span>
        )}
      </div>
    );
  };

  const AccuracyBlock = ({ acceptanceRate, cfAcceptanceRate }) => {
    if (acceptanceRate == null) return null;
    const hasCfAvg = cfAcceptanceRate != null;
    const isAbove = hasCfAvg && acceptanceRate > cfAcceptanceRate;
    const compColor = isAbove ? GREEN_SUCCESS : theme.TEXT_DIM;
    return (
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ width: 3, height: 12, borderRadius: 2, background: EMERALD, opacity: 0.8, marginRight: 8 }} />
          <div style={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.TEXT_DIM, lineHeight: 1.2 }}>Accuracy</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 36, fontWeight: 700, color: theme.TEXT_PRIMARY, letterSpacing: '-0.02em', lineHeight: 1.15, marginRight: 4 }}>{acceptanceRate}</div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 500, color: theme.TEXT_MUTED, lineHeight: 1.15 }}>%</div>
        </div>
        {hasCfAvg && (
          <div style={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 600, color: compColor, lineHeight: 1.2, whiteSpace: 'nowrap', marginTop: 3 }}>
            {isAbove ? '▲' : '–'} avg CF: {cfAcceptanceRate}%
          </div>
        )}
      </div>
    );
  };

  // marginRight: 28 so stats row works without flex gap (absorbed by marginLeft:auto on graph)
  const StatBlock = ({ label, value, accent = EMERALD, suffix = null, mono = true }) => (
    <div style={{ minWidth: 0, marginRight: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ width: 3, height: 12, borderRadius: 2, background: accent, opacity: 0.8, marginRight: 8 }} />
        <div style={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.TEXT_DIM, lineHeight: 1.2 }}>{label}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <div style={{ fontFamily: mono ? FONT_MONO : FONT_SANS, fontSize: 36, fontWeight: 700, color: theme.TEXT_PRIMARY, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{value}</div>
        {suffix && (
          <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 500, color: theme.TEXT_MUTED, marginLeft: 4, lineHeight: 1.15 }}>{suffix}</div>
        )}
      </div>
    </div>
  );

  // marginBottom: 10 so right column works without flex gap
  const PlatformPanel = ({ platform, handle, rating, maxRating, rank }) => {
    const isCf = platform === 'cf';
    const isCc = platform === 'cc';
    const name = isCf ? 'Codeforces' : isCc ? 'CodeChef' : 'LeetCode';
    const accent = isCf ? CF_BLUE : isCc ? CC_EMERALD : LC_AMBER;
    const Icon = isCf ? CodeforcesMark : isCc ? CodeChefMark : LeetCodeMark;
    const rc = rankColor(platform, rank);
    return (
      <div style={{ background: theme.CARD_BG_ELEVATED, border: `1px solid ${theme.BORDER}`, borderRadius: 14, padding: '18px 22px', position: 'relative', overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accent, opacity: 0.9 }} />
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <Icon size={20} />
          <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 700, color: theme.TEXT_PRIMARY, letterSpacing: '-0.01em', marginLeft: 10 }}>{name}</div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, color: theme.TEXT_MUTED, marginLeft: 'auto', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{handle}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 44, fontWeight: 700, color: accent, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{rating || '—'}</div>
          {maxRating ? <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: theme.TEXT_DIM, marginLeft: 10, lineHeight: 1.15 }}>/ {maxRating} peak</div> : null}
        </div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 700, color: rc, letterSpacing: '0.15em', textTransform: 'uppercase', lineHeight: 1.2 }}>{rank || 'Unrated'}</div>
      </div>
    );
  };

  // marginRight: 8 applied on TopicPill itself so topics row works without flex gap
  const TopicPill = ({ name, count, maxCount }) => {
    const fillPct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 14px', borderRadius: 999, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.20)', position: 'relative', overflow: 'hidden', marginRight: 8 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fillPct}%`, background: 'rgba(16,185,129,0.12)', borderRadius: 999, pointerEvents: 'none' }} />
        <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: theme.TEXT_BODY, textTransform: 'capitalize', position: 'relative', marginRight: 8 }}>{name}</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: EMERALD, position: 'relative' }}>{count}</span>
      </div>
    );
  };

  // marginRight: 6 applied on PlatformBadge itself so badges row works without flex gap
  const PlatformBadge = ({ platform }) => {
    const isCf = platform === 'cf';
    const isCc = platform === 'cc';
    const accent = isCf ? CF_BLUE : isCc ? CC_EMERALD : LC_AMBER;
    const bg = isCf ? 'rgba(59,130,246,0.12)' : isCc ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)';
    const border = isCf ? 'rgba(59,130,246,0.25)' : isCc ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)';
    const Icon = isCf ? CodeforcesMark : isCc ? CodeChefMark : LeetCodeMark;
    const label = isCf ? 'CF' : isCc ? 'CC' : 'LC';
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 999, background: bg, border: `1px solid ${border}`, marginRight: 6 }}>
        <div style={{ marginRight: 6 }}><Icon size={12} /></div>
        <span style={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 700, color: accent, letterSpacing: '0.1em' }}>{label}</span>
      </div>
    );
  };

  const PlatformSparkline = ({ history = [], color, width = 260, height = 70, marginRight = 0 }) => {
    if (history.length < 2) return (
      <div style={{ width, height, background: theme.CARD_BG, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${theme.BORDER_SOFT}`, marginRight }}>
        <span style={{ fontSize: 9, color: theme.TEXT_DIM, fontFamily: FONT_SANS }}>Not enough data</span>
      </div>
    );

    const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
    let minR = Infinity, maxR = -Infinity;
    sorted.forEach(d => {
      minR = Math.min(minR, d.rating);
      maxR = Math.max(maxR, d.rating);
    });

    const padding = Math.max(20, (maxR - minR) * 0.1);
    minR = Math.max(0, minR - padding);
    maxR = maxR + padding;
    const range = maxR - minR || 100;

    const paddingLeft = 42;
    const paddingBottom = 16;
    const graphW = width - paddingLeft;
    const graphH = height - paddingBottom;

    const pts = sorted.map((d, i) => {
      const x = (i / (sorted.length - 1)) * graphW;
      const y = graphH - ((d.rating - minR) / range) * graphH;
      return `${x},${y}`;
    }).join(' ');

    const startDate = sorted[0].date.substring(0, 7);
    const endDate = sorted[sorted.length - 1].date.substring(0, 7);

    return (
      <div style={{ width, height, display: 'flex', flexDirection: 'column', marginRight }}>
        <div style={{ display: 'flex', flex: 1 }}>
          <div style={{ width: paddingLeft, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 4, paddingRight: 6 }}>
            <span style={{ fontSize: 9, color: theme.TEXT_DIM, fontFamily: FONT_MONO, textAlign: 'right' }}>{Math.round(maxR)}</span>
            <span style={{ fontSize: 9, color: theme.TEXT_DIM, fontFamily: FONT_MONO, textAlign: 'right' }}>{Math.round(minR)}</span>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg width={graphW} height={graphH} style={{ overflow: 'visible' }}>
              <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={pts.split(' ').pop().split(',')[0]} cy={pts.split(' ').pop().split(',')[1]} r="3" fill={theme.SURFACE} stroke={color} strokeWidth="2" />
            </svg>
          </div>
        </div>
        <div style={{ height: paddingBottom, display: 'flex', justifyContent: 'space-between', paddingLeft }}>
          <span style={{ fontSize: 8, color: theme.TEXT_DIM, fontFamily: FONT_MONO }}>{startDate}</span>
          <span style={{ fontSize: 8, color: theme.TEXT_DIM, fontFamily: FONT_MONO }}>{endDate}</span>
        </div>
      </div>
    );
  };

  const RatingGraph = ({ cfHistory = [], lcHistory = [], ccHistory = [], width = 540, height = 70 }) => {
    const sparklines = [
      cfHistory.length >= 2 ? { history: cfHistory, color: CF_BLUE } : null,
      lcHistory.length >= 2 ? { history: lcHistory, color: LC_AMBER } : null,
      ccHistory.length >= 2 ? { history: ccHistory, color: CC_EMERALD } : null,
    ].filter(Boolean);
    if (sparklines.length === 0) return null;
    const GAP = 16;
    const w = (width - GAP * (sparklines.length - 1)) / sparklines.length;
    return (
      <div style={{ display: 'flex', alignItems: 'center', width }}>
        {sparklines.map((s, i) => (
          <PlatformSparkline
            key={i}
            history={s.history}
            color={s.color}
            width={w}
            height={height}
            marginRight={i < sparklines.length - 1 ? GAP : 0}
          />
        ))}
      </div>
    );
  };

  // ── Compute final stats ──────────────────────────────────────────────────────
  const totalSolved = (cfSolved || 0) + (lcSolved || 0) + (ccSolved || 0);
  const totalContests = (cfRatingHistory?.length || 0) + (lcRatingHistory?.length || 0) + (ccRatingHistory?.length || 0);

  const cpScore = serverCpScore ??
    Math.floor(
      cfRating * 1.5 + lcRating * 1.2 +
      lcHard * 20 + lcMedium * 8 + lcEasy * 2 +
      (cfRatingHistory?.length + lcRatingHistory?.length) * 10 +
      Math.max(0, (cfMaxRating - cfRating) * 0.5) +
      Math.min(Math.max(cfCurrentStreak, lcStreak) * 2, 200)
    );

  const hasCf = !!cfHandle;
  const hasLc = !!lcHandle;
  const hasCc = !!ccHandle;
  const hasCp = cpScore > 0;
  const heroValue = hasCp ? cpScore : totalSolved;
  const heroLabel = hasCp ? 'CPScore' : 'Total Solved';

  const displayName = userName || userUsername || null;
  const displayHandle = cfHandle || lcHandle || ccHandle || 'competitor';

  const showCurrentStreak = currentStreak >= 7;
  const activePlatforms = [hasCf && 'Codeforces', hasLc && 'LeetCode', hasCc && 'CodeChef'].filter(Boolean);
  const headline = buildHeadline({ totalSolved, bestStreak, solvedThisMonth, activeDays, platforms: activePlatforms });

  const top3Topics = (topics || []).filter(t => t?.name).slice(0, 3);
  const maxTopicCount = top3Topics.reduce((m, t) => Math.max(m, t.count || 0), 0);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });

  const rankPills = [
    cpScoreRank   ? { rank: cpScoreRank,  total: cpScoreTotal,  label: 'CPScore',   accent: EMERALD  } : null,
    totalQRank    ? { rank: totalQRank,   total: totalQTotal,   label: 'Questions', accent: EMERALD  } : null,
    hasCf && cfRatingRank ? { rank: cfRatingRank, total: cfRatingTotal, label: 'CF Rating', accent: CF_BLUE  } : null,
    hasLc && lcRatingRank ? { rank: lcRatingRank, total: lcRatingTotal, label: 'LC Rating', accent: LC_AMBER } : null,
  ].filter(Boolean).slice(0, 4);

  return (
    <div
      ref={ref}
      style={{
        width: 1200, height: 630,
        background: theme.SURFACE,
        color: theme.TEXT_PRIMARY,
        fontFamily: FONT_SANS,
        position: 'relative',
        boxSizing: 'border-box',
        backgroundImage:
          'radial-gradient(ellipse 900px 500px at 85% -5%, rgba(16,185,129,0.10), transparent 55%),' +
          'radial-gradient(ellipse 700px 400px at 0% 105%, rgba(59,130,246,0.05), transparent 55%)',
      }}
    >
      {/* Dot grid texture */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${theme.DOT_GRID} 1.2px, transparent 1.2px)`, backgroundSize: '22px 22px', pointerEvents: 'none' }} />
      {/* Faint diagonal stripes */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(135deg, ${theme.STRIPES} 0px, ${theme.STRIPES} 1px, transparent 1px, transparent 18px)`, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', width: '100%', height: '100%', padding: '36px 60px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>

        {/* ── Header ────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBottom: 16,
          marginBottom: 4,
          borderBottom: `1px solid ${theme.BORDER_SOFT}`,
          boxShadow: `0 8px 30px -15px ${EMERALD}40`
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: EMERALD, boxShadow: `0 0 14px ${EMERALD}`, marginRight: 12 }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 22, fontWeight: 700, color: theme.TEXT_PRIMARY, letterSpacing: '-0.02em', marginRight: 12 }}>CPPro</span>
            <span style={{ width: 1, height: 18, background: theme.BORDER, marginRight: 12, display: 'inline-block' }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, color: theme.TEXT_MUTED, letterSpacing: '0.04em' }}>Competitive Programming Analytics</span>
          </div>
          <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 500, color: theme.TEXT_DIM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{dateStr}</span>
        </div>

        {/* ── Hero ──────────────────────────────────────────────── */}
        <div style={{ height: 350, width: '100%', display: 'flex', marginTop: 12 }}>
          {/* Left */}
          <div style={{ flex: '1.05', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', marginRight: 40 }}>

            {/* Identity block — marginBottom replaces flex gap(18) + original 6 = 24 */}
            <div style={{ marginBottom: 24 }}>
              {displayName && (
                <div style={{
                  fontFamily: FONT_SANS, fontSize: 24, fontWeight: 700,
                  color: theme.TEXT_PRIMARY, letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap', maxWidth: 480, lineHeight: 1.4,
                  marginBottom: 2,
                }}>
                  {displayName}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{
                  fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500,
                  color: theme.TEXT_MUTED, overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', maxWidth: 280, marginRight: 8,
                }}>
                  @{displayHandle}
                </span>
                <div style={{ display: 'flex' }}>
                  {hasCf && <PlatformBadge platform="cf" />}
                  {hasLc && <PlatformBadge platform="lc" />}
                  {hasCc && <PlatformBadge platform="cc" />}
                </div>
              </div>
            </div>

            {/* Hero number — marginBottom replaces flex gap(18) */}
            <div style={{ marginBottom: 18 }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 80, fontWeight: 700, color: theme.TEXT_PRIMARY, letterSpacing: '-0.04em', lineHeight: 1.2, display: 'block' }}>
                {heroValue.toLocaleString()}
              </span>
              <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 700, color: EMERALD, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                {heroLabel}
              </span>
            </div>

            {/* Rank pills — marginBottom: 28 = original 10 + flex gap(18) */}
            {rankPills.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
                {rankPills.map((p, i) => (
                  <RankPill key={i} rank={p.rank} total={p.total} label={p.label} accent={p.accent} />
                ))}
              </div>
            )}

            {/* Headline — last child, no marginBottom needed */}
            <p style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 500, color: theme.TEXT_BODY, lineHeight: 1.45, margin: 0, maxWidth: 480 }}>
              {headline}
            </p>
          </div>

          {/* Right — platform panels (PlatformPanel has its own marginBottom: 10) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            {hasCf && <PlatformPanel platform="cf" handle={cfHandle} rating={cfRating} maxRating={cfMaxRating} rank={cfRank} />}
            {hasLc && <PlatformPanel platform="lc" handle={lcHandle} rating={lcRating} maxRating={lcMaxRating} rank={lcRank} />}
            {hasCc && <PlatformPanel platform="cc" handle={ccHandle} rating={ccRating} maxRating={ccMaxRating} rank={ccRank} />}
            {!hasCf && !hasLc && !hasCc && (
              <div style={{ background: theme.CARD_BG_ELEVATED, border: `1px solid ${theme.BORDER}`, borderRadius: 14, padding: '22px 24px', fontFamily: FONT_SANS, fontSize: 14, color: theme.TEXT_MUTED }}>
                No platforms linked yet
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div style={{ height: 140, width: '100%', marginTop: 'auto', paddingTop: 14, borderTop: `1px solid ${theme.BORDER_SOFT}`, display: 'flex', flexDirection: 'column' }}>
          {/* Stats row — StatBlock has marginRight: 28; dividers also get marginRight: 28 */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>

            <StatBlock label="Total Solved" value={totalSolved.toLocaleString()} accent={EMERALD} />
            <div style={{ width: 1, height: 40, background: theme.BORDER_SOFT, marginRight: 28 }} />

            {totalContests > 0 && (
              <>
                <StatBlock label="Total Contests" value={totalContests} accent={CF_BLUE} />
                <div style={{ width: 1, height: 40, background: theme.BORDER_SOFT, marginRight: 28 }} />
              </>
            )}

            {showCurrentStreak
              ? <StatBlock label="Current Streak" value={currentStreak} suffix="d" accent={ORANGE} />
              : <StatBlock label="Active Days" value={activeDays > 0 ? activeDays : bestStreak} suffix={activeDays > 0 ? null : 'd'} accent={ORANGE} />
            }
            <div style={{ width: 1, height: 40, background: theme.BORDER_SOFT, marginRight: 28 }} />

            <StatBlock label="Best Streak" value={bestStreak} suffix="d" accent={ORANGE} />

            <div style={{ marginLeft: 'auto' }}>
              <RatingGraph cfHistory={cfRatingHistory} lcHistory={lcRatingHistory} ccHistory={ccRatingHistory} width={540} height={70} />
            </div>
          </div>

          {/* Topics row — TopicPill has marginRight: 8 */}
          {top3Topics.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto' }}>
              <span style={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 700, color: theme.TEXT_DIM, letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap', marginRight: 14 }}>
                Top Topics
              </span>
              <div style={{ display: 'flex', flexWrap: 'nowrap', overflow: 'hidden' }}>
                {top3Topics.map((t) => (
                  <TopicPill key={t.name} name={t.name} count={t.count} maxCount={maxTopicCount} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ShareableCard;
