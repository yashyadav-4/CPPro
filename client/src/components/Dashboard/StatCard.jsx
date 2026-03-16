import { motion } from 'framer-motion';
import { Target, Zap, Flame, TrendingUp, Trophy } from 'lucide-react';

const ICON_MAP = {
  total: Target,
  active: Zap,
  streak: Flame,
};

const COLOR_MAP = {
  total: { iconBg: 'bg-green-50', iconColor: 'text-green-600', badgeText: 'text-green-700', badgeBg: 'bg-green-100', barColor: 'bg-green-500' },
  active: { iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', badgeText: 'text-indigo-700', badgeBg: 'bg-indigo-100', barColor: 'bg-indigo-500' },
  streak: { iconBg: 'bg-orange-50', iconColor: 'text-orange-600', badgeText: 'text-orange-700', badgeBg: 'bg-orange-100', barColor: 'bg-orange-500' },
};

export default function StatCard({
  type = 'total',
  label,
  value,
  badgeText,
  sublabel,
  highlightSub = false,
  personalBest,
  unit,
}) {
  const Icon = ICON_MAP[type] || Target;
  const colors = COLOR_MAP[type] || COLOR_MAP.total;
  const delay = type === 'total' ? 0.1 : type === 'active' ? 0.2 : 0.3;

  const bars = [4, 6, 3, 8, 5, 7, 4, 9, 6, 3];

  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.iconBg} ${colors.iconColor}`}>
          <Icon size={20} />
        </div>
        
        {badgeText && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${colors.badgeBg} ${colors.badgeText}`}>
            {type === 'total' && <TrendingUp size={12} />}
            {type === 'streak' && personalBest != null && <Trophy size={12} />}
            {personalBest != null ? `PB: ${personalBest}` : badgeText}
          </span>
        )}
        {!badgeText && personalBest != null && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700`}>
            <Trophy size={12} /> PB: {personalBest}
          </span>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <h2 className="text-3xl font-extrabold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h2>
          {unit && <span className={`text-sm font-semibold ${colors.iconColor}`}>{unit}</span>}
        </div>
        {sublabel && (
          <p className={`text-sm mt-2 ${highlightSub ? 'text-green-600 font-medium' : colors.iconColor}`}>
            {sublabel}
          </p>
        )}
      </div>

      {/* Mini sparkline bars */}
      <div className="absolute bottom-0 right-4 flex items-end gap-1 h-12 opacity-40 group-hover:opacity-100 transition-opacity">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-t-sm ${colors.barColor}`}
            style={{
              height: `${h * 4}px`,
              opacity: 0.3 + h * 0.07,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
