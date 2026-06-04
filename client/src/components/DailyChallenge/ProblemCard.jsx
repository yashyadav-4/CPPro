import { ExternalLink, CheckCircle2, Clock, Zap, Dumbbell, Tag, Star,
         Building2, BookOpen, Trophy, Heart, Layers } from 'lucide-react';

const PLATFORM_COLORS = {
    codeforces: { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)',  text: '#3b82f6',  label: 'CF'  },
    leetcode:   { bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)',  text: '#f97316',  label: 'LC'  },
    codechef:   { bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.2)',  text: '#8b5cf6',  label: 'CC'  },
};

const LC_DIFFICULTY_COLOR = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' };

// ── Slot config ───────────────────────────────────────────────────────────────
const SLOT_CONFIG = {
    workout:    { num: '01', label: 'WORKOUT',    Icon: Dumbbell, color: '#22c55e' },
    challenger: { num: '02', label: 'CHALLENGER', Icon: Zap,      color: '#f59e0b' },
    bonus:      { num: '★',  label: 'BONUS',      Icon: Star,     color: '#8b5cf6' },
};

// ── Sheet source labels ───────────────────────────────────────────────────────
const SHEET_DISPLAY = {
    'Google Top':        { label: 'Frequently Asked in Google',  Icon: Building2, color: '#4285f4' },
    'Amazon Top':        { label: 'Frequently Asked in Amazon',  Icon: Building2, color: '#f59e0b' },
    'Blind 75':          { label: 'Blind 75',                    Icon: BookOpen,  color: '#eab308' },
    'NeetCode 150':      { label: 'NeetCode 150',               Icon: BookOpen,  color: '#22c55e' },
    'Top Interview 150': { label: 'Top Interview 150',          Icon: BookOpen,  color: '#10b981' },
    'Top 100 Liked':     { label: 'Top 100 Liked',              Icon: BookOpen,  color: '#ef4444' },
    'LeetCode 75':       { label: 'LeetCode 75',                Icon: BookOpen,  color: '#f97316' },
    'Striver SDE':       { label: 'Striver SDE Sheet',          Icon: BookOpen,  color: '#3b82f6' },
    'Striver A2Z':       { label: 'Striver A2Z Sheet',          Icon: BookOpen,  color: '#6366f1' },
    'Babbar 450':        { label: 'Love Babbar 450',            Icon: BookOpen,  color: '#8b5cf6' },
    'CP-31 Sheet':       { label: 'CP-31 Problem Set',          Icon: Trophy,    color: '#06b6d4' },
    'My Favorites':      { label: 'Your Favorites',             Icon: Heart,     color: '#ec4899' },
};

const SHEET_PRIORITY = [
    'Google Top', 'Amazon Top',
    'Blind 75', 'NeetCode 150', 'Top Interview 150', 'Top 100 Liked',
    'LeetCode 75', 'Striver SDE', 'Striver A2Z', 'Babbar 450',
    'CP-31 Sheet', 'My Favorites',
];

function getSheetBadge(problem) {
    if (!problem?.fromPopularSheet || !problem?.sheets?.length) return null;
    for (const key of SHEET_PRIORITY) {
        if (problem.sheets.includes(key)) {
            const d = SHEET_DISPLAY[key];
            if (key === 'CP-31 Sheet' && typeof problem.difficulty === 'number') {
                return { ...d, label: `CP-31 · Rating ${problem.difficulty}` };
            }
            return d;
        }
    }
    return { label: problem.sheets[0], Icon: Layers, color: '#6b7280' };
}

// ── Sheet badge ───────────────────────────────────────────────────────────────
// w-fit prevents flex children from stretching to full card width
function SheetBadge({ problem }) {
    const badge = getSheetBadge(problem);
    if (!badge) return null;
    const { Icon } = badge;
    return (
        <div className="w-fit inline-flex items-center gap-1 px-2 py-[3px] rounded-full mb-2"
            style={{ background: `${badge.color}14`, border: `1px solid ${badge.color}30` }}>
            <Icon size={9} style={{ color: badge.color }} />
            <span className="text-[10px] font-semibold tracking-wide" style={{ color: badge.color }}>
                {badge.label}
            </span>
        </div>
    );
}

// ── Difficulty badge ──────────────────────────────────────────────────────────
function DifficultyBadge({ platform, difficulty }) {
    if (platform === 'leetcode') {
        const color = LC_DIFFICULTY_COLOR[difficulty] || '#888';
        return (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${color}18`, color }}>
                {difficulty}
            </span>
        );
    }
    return (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400">
            {typeof difficulty === 'number' ? difficulty : difficulty}
        </span>
    );
}

// ── Main card ─────────────────────────────────────────────────────────────────
export default function ProblemCard({ type, problem, loading }) {
    const slot        = SLOT_CONFIG[type] || SLOT_CONFIG.bonus;
    const accentColor = slot.color;
    const SlotIcon    = slot.Icon;

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="bg-[#111111] border border-white/[0.07] rounded-xl p-5 flex-1 animate-pulse">
                <div className="flex items-center gap-2 mb-5">
                    <div className="h-3 w-6 bg-white/5 rounded" />
                    <div className="h-3 w-24 bg-white/5 rounded" />
                </div>
                <div className="h-5 w-3/4 bg-white/5 rounded mb-3" />
                <div className="h-3 w-1/2 bg-white/5 rounded mb-6" />
                <div className="h-9 w-full bg-white/5 rounded" />
            </div>
        );
    }

    // ── Empty state ───────────────────────────────────────────────────────────
    if (!problem) {
        return (
            <div className="bg-[#111111] border border-white/[0.07] rounded-xl p-5 flex-1
                flex flex-col items-center justify-center min-h-[190px] gap-2">
                <SlotIcon size={26} className="text-gray-700" />
                <p className="text-[12px] text-gray-600">
                    {type === 'bonus'
                        ? 'Link a 3rd platform to unlock bonus'
                        : type === 'challenger'
                        ? 'No challenger assigned'
                        : 'No workout assigned'}
                </p>
            </div>
        );
    }

    const platform = PLATFORM_COLORS[problem.platform] || PLATFORM_COLORS.codeforces;

    // ── Solved state ──────────────────────────────────────────────────────────
    if (problem.isSolved) {
        return (
            <div className="rounded-xl flex-1 flex flex-col relative overflow-hidden"
                style={{
                    background: `linear-gradient(145deg, #111111 70%, ${accentColor}0a)`,
                    border: `1px solid ${accentColor}30`,
                }}>
                {/* top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />

                <div className="p-5 flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-black tracking-[0.15em] tabular-nums"
                            style={{ color: accentColor }}>{slot.num}</span>
                        <CheckCircle2 size={12} style={{ color: accentColor }} />
                        <span className="text-[10px] font-bold tracking-[0.12em] uppercase"
                            style={{ color: accentColor }}>{slot.label}</span>
                        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}>
                            SOLVED
                        </span>
                    </div>

                    <SheetBadge problem={problem} />

                    <p className="text-[15px] font-semibold text-white leading-snug mb-1">{problem.title}</p>

                    {problem.solvedAt && (
                        <p className="text-[11px] text-gray-600 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(problem.solvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    )}
                    {type === 'challenger' && problem.weakTag && (
                        <p className="text-[11px] text-amber-500 mt-1.5 flex items-center gap-1">
                            <Tag size={10} /> Targeted: <span className="font-semibold">{problem.weakTag}</span>
                        </p>
                    )}

                    <div className="flex-1" />

                    <a href={problem.url} target="_blank" rel="noopener noreferrer"
                        className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-lg
                            text-[12px] font-medium transition-all hover:brightness-110"
                        style={{ background: `${accentColor}0e`, color: accentColor, border: `1px solid ${accentColor}20` }}>
                        Review
                        <ExternalLink size={11} />
                    </a>
                </div>
            </div>
        );
    }

    // ── Default (unsolved) state ──────────────────────────────────────────────
    return (
        <div className="rounded-xl flex-1 flex flex-col relative overflow-hidden"
            style={{
                background: `linear-gradient(145deg, #111111 60%, ${accentColor}08)`,
                border: `1px solid ${accentColor}22`,
            }}>
            {/* top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(90deg, ${accentColor}90, transparent)` }} />

            <div className="p-5 flex flex-col flex-1">
                {/* Header row: slot num + label | platform badge */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black tracking-[0.15em] tabular-nums"
                        style={{ color: accentColor }}>{slot.num}</span>
                    <SlotIcon size={12} style={{ color: accentColor }} />
                    <span className="text-[10px] font-bold tracking-[0.12em] uppercase"
                        style={{ color: accentColor }}>{slot.label}</span>
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: platform.bg, color: platform.text, border: `1px solid ${platform.border}` }}>
                        {platform.label}
                    </span>
                </div>

                {/* Sheet source badge — w-fit prevents full-width stretch */}
                <SheetBadge problem={problem} />

                {/* Problem title */}
                <p className="text-[15px] font-semibold text-white leading-snug mb-2">{problem.title}</p>

                {/* Difficulty + tags */}
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <DifficultyBadge platform={problem.platform} difficulty={problem.difficulty} />
                    {(problem.tags || []).slice(0, 3).map(tag => (
                        <span key={tag}
                            className="text-[10px] text-gray-500 bg-white/[0.04] border border-white/[0.05] px-1.5 py-0.5 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Weak tag */}
                {type === 'challenger' && problem.weakTag && (
                    <p className="text-[11px] text-amber-500 mt-1 flex items-center gap-1">
                        <Tag size={10} /> Targeting weakness: <span className="font-semibold">{problem.weakTag}</span>
                    </p>
                )}

                <div className="flex-1" />

                {/* CTA */}
                <a href={problem.url} target="_blank" rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg
                        text-[13px] font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
                    style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}>
                    Solve on {problem.platform === 'codeforces' ? 'Codeforces' : problem.platform === 'leetcode' ? 'LeetCode' : 'CodeChef'}
                    <ExternalLink size={13} />
                </a>

                <p className="text-[10px] text-gray-700 text-center mt-2">
                    Auto-detected as solved on next sync
                </p>
            </div>
        </div>
    );
}
