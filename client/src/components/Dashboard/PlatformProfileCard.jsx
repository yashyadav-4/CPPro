import { motion } from 'framer-motion';
import { Star, TrendingUp, Crown } from 'lucide-react';

const PLATFORMS = [
  {
    key: 'codeforces',
    label: 'Codeforces',
    short: 'CF',
    color: '#3b82f6',
    bgLight: 'bg-blue-50 border-blue-200',
    bgDark: 'dark:bg-blue-500/5 dark:border-blue-500/20',
    badgeLight: 'bg-blue-100 text-blue-700',
    badgeDark: 'dark:bg-blue-500/15 dark:text-blue-400',
    iconBg: 'bg-blue-500',
  },
  {
    key: 'leetcode',
    label: 'LeetCode',
    short: 'LC',
    color: '#f59e0b',
    bgLight: 'bg-amber-50 border-amber-200',
    bgDark: 'dark:bg-amber-500/5 dark:border-amber-500/20',
    badgeLight: 'bg-amber-100 text-amber-700',
    badgeDark: 'dark:bg-amber-500/15 dark:text-amber-400',
    iconBg: 'bg-amber-500',
  },
  {
    key: 'codechef',
    label: 'CodeChef',
    short: 'CC',
    color: '#8b5cf6',
    bgLight: 'bg-violet-50 border-violet-200',
    bgDark: 'dark:bg-violet-500/5 dark:border-violet-500/20',
    badgeLight: 'bg-violet-100 text-violet-700',
    badgeDark: 'dark:bg-violet-500/15 dark:text-violet-400',
    iconBg: 'bg-violet-500',
  },
];

export default function PlatformProfileCard({ profiles }) {
  return (
    <motion.div
      className="card-glow bg-white dark:bg-[#13131d] border border-gray-200 dark:border-[#1e1e2e] rounded-2xl p-6"
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <div className="flex items-center gap-2 mb-5">
        <Crown size={18} className="text-indigo-500" />
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Platform Profiles</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLATFORMS.map((p, i) => {
          const prof = profiles[p.key];
          if (!prof) return null;
          return (
            <motion.div key={p.key}
              className={`rounded-xl border p-4 ${p.bgLight} ${p.bgDark} hover:-translate-y-0.5 transition-transform`}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55 + i * 0.08 }}>
              {/* Platform badge */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 ${p.iconBg} rounded-lg flex items-center justify-center`}>
                  <span className="text-white text-xs font-black">{p.short}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{p.label}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.badgeLight} ${p.badgeDark}`}>
                    {prof.rankName}{p.key === 'codechef' && prof.starCount ? ` · ${prof.starCount}★` : ''}
                  </span>
                </div>
              </div>

              {/* Stars for CodeChef */}
              {p.key === 'codechef' && prof.starCount && (
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: prof.starCount }).map((_, si) => (
                    <Star key={si} size={14} fill={p.color} stroke={p.color} />
                  ))}
                  {Array.from({ length: Math.max(0, 7 - prof.starCount) }).map((_, si) => (
                    <Star key={`e${si}`} size={14} className="text-gray-300 dark:text-gray-600" />
                  ))}
                </div>
              )}

              {/* Ratings */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">{prof.currentRating}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Max</p>
                  <div className="flex items-center gap-1">
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{prof.maxRating}</p>
                    <TrendingUp size={12} className="text-emerald-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
