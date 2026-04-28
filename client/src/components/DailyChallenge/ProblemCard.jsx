import { ExternalLink, CheckCircle2, Clock, Zap, Dumbbell, Tag, Star } from 'lucide-react';

const PLATFORM_COLORS = {
    codeforces: { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  text: '#3b82f6',  label: 'CF'  },
    leetcode:   { bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)',  text: '#f97316',  label: 'LC'  },
    codechef:   { bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.25)',  text: '#8b5cf6',  label: 'CC'  },
};

const LC_DIFFICULTY_COLOR = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' };

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
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400 dark:text-gray-500">
            {typeof difficulty === 'number' ? `${difficulty}` : difficulty}
        </span>
    );
}

export default function ProblemCard({ type, problem, loading }) {
    const isChallenger = type === 'challenger';
    const isBonus = type === 'bonus';
    const Icon = isBonus ? Star : isChallenger ? Zap : Dumbbell;
    const title = isBonus ? 'BONUS CHALLENGE' : isChallenger ? 'DAILY CHALLENGER' : 'DAILY WORKOUT';
    const accentColor = isBonus ? '#8b5cf6' : isChallenger ? '#f59e0b' : '#22c55e';

    if (loading) {
        return (
            <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-5 flex-1 animate-pulse">
                <div className="h-3 w-32 bg-gray-100 dark:bg-white/5 rounded mb-4" />
                <div className="h-5 w-3/4 bg-gray-100 dark:bg-white/5 rounded mb-3" />
                <div className="h-3 w-1/2 bg-gray-100 dark:bg-white/5 rounded mb-6" />
                <div className="h-9 w-full bg-gray-100 dark:bg-white/5 rounded" />
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-5 flex-1 flex flex-col items-center justify-center min-h-[200px] gap-2">
                <Icon size={28} className="text-gray-300 dark:text-gray-700" />
                <p className="text-[13px] text-gray-400 dark:text-gray-600">
                    {isBonus ? 'No bonus today — link a 3rd platform to unlock' : isChallenger ? 'No challenger assigned' : 'No workout assigned'}
                </p>
            </div>
        );
    }

    const platform = PLATFORM_COLORS[problem.platform] || PLATFORM_COLORS.codeforces;

    if (problem.isSolved) {
        return (
            <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-5 flex-1 flex flex-col relative overflow-hidden"
                style={{ borderColor: `${accentColor}40` }}>
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
                <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={14} style={{ color: accentColor }} />
                    <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: accentColor }}>{title}</span>
                    <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${accentColor}15`, color: accentColor }}>SOLVED</span>
                </div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-snug mb-1">{problem.title}</p>
                {problem.solvedAt && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-600 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(problem.solvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                )}
                {isChallenger && problem.weakTag && (
                    <p className="text-[11px] text-amber-500 dark:text-amber-400 mt-2 flex items-center gap-1">
                        <Tag size={10} /> Weakness targeted: {problem.weakTag}
                    </p>
                )}
                <div className="flex-1" />
                <a href={problem.url} target="_blank" rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-lg text-[12px] font-medium transition-all duration-150 hover:brightness-110"
                    style={{ background: `${accentColor}0d`, color: accentColor, border: `1px solid ${accentColor}20` }}>
                    Review on {problem.platform === 'codeforces' ? 'Codeforces' : problem.platform === 'leetcode' ? 'LeetCode' : 'CodeChef'}
                    <ExternalLink size={12} />
                </a>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl p-5 flex-1 flex flex-col relative overflow-hidden"
            style={{ borderColor: `${accentColor}25` }}>
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${accentColor}80, transparent)` }} />

            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Icon size={13} style={{ color: accentColor }} />
                <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: accentColor }}>{title}</span>
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: platform.bg, color: platform.text, border: `1px solid ${platform.border}` }}>
                    {platform.label}
                </span>
            </div>

            {/* Problem title */}
            <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-snug mb-2">{problem.title}</p>

            {/* Difficulty + tags row */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
                <DifficultyBadge platform={problem.platform} difficulty={problem.difficulty} />
                {(problem.tags || []).slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.05] px-1.5 py-0.5 rounded-full">
                        {tag}
                    </span>
                ))}
            </div>

            {/* Weak tag (challenger only) */}
            {isChallenger && problem.weakTag && (
                <p className="text-[11px] text-amber-500 dark:text-amber-400 mb-1 flex items-center gap-1">
                    <Tag size={10} /> Targeting weakness: <span className="font-semibold">{problem.weakTag}</span>
                </p>
            )}

            {/* Popularity */}
            {problem.solvedCount > 0 && (
                <p className="text-[11px] text-gray-400 dark:text-gray-600 mb-4">
                    {problem.solvedCount.toLocaleString()} solvers
                </p>
            )}

            <div className="flex-1" />

            {/* CTA */}
            <a href={problem.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
                style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30` }}>
                Solve on {problem.platform === 'codeforces' ? 'Codeforces' : problem.platform === 'leetcode' ? 'LeetCode' : 'CodeChef'}
                <ExternalLink size={13} />
            </a>

            <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center mt-2">
                Auto-detected as solved on next sync
            </p>
        </div>
    );
}
