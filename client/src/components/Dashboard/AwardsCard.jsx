import { motion } from 'framer-motion';
import { Award, Medal, Trophy } from 'lucide-react';

const TYPE_STYLES = {
  gold:   { icon: Trophy, bg: 'bg-yellow-50 dark:bg-yellow-500/10', border: 'border-yellow-200 dark:border-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-400', iconColor: '#eab308' },
  silver: { icon: Medal,  bg: 'bg-gray-50 dark:bg-gray-500/10',     border: 'border-gray-200 dark:border-gray-500/20',   text: 'text-gray-600 dark:text-gray-300',    iconColor: '#94a3b8' },
  bronze: { icon: Award,  bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', text: 'text-orange-700 dark:text-orange-400', iconColor: '#d97706' },
};

const PLATFORM_PILL = {
  leetcode:   'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  codeforces: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  codechef:   'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
};

export default function AwardsCard({ awards }) {
  return (
    <motion.div
      className="card-glow card-glow-amber bg-white dark:bg-[#13131d] border border-gray-200 dark:border-[#1e1e2e] rounded-2xl p-6"
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}>
      <div className="flex items-center gap-2 mb-5">
        <Trophy size={18} className="text-amber-500" />
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Awards & Badges</h3>
        <span className="ml-auto text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1a1a28] px-2.5 py-1 rounded-full">
          {awards.length}
        </span>
      </div>

      {awards.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No awards yet. Keep coding!</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {awards.map((award, i) => {
            const style = TYPE_STYLES[award.type] || TYPE_STYLES.bronze;
            const Icon = style.icon;
            return (
              <motion.div key={award.id}
                className={`${style.bg} border ${style.border} rounded-xl p-3 text-center hover:-translate-y-0.5 transition-transform`}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.05 }}>
                <Icon size={22} style={{ color: style.iconColor }} className="mx-auto mb-2" />
                <p className={`text-xs font-bold ${style.text} mb-1.5 leading-tight`}>{award.title}</p>
                <span className={`platform-pill ${PLATFORM_PILL[award.platform] || ''}`}>
                  {award.platform === 'leetcode' ? 'LC' : award.platform === 'codeforces' ? 'CF' : 'CC'}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
