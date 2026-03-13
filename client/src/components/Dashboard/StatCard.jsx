import { motion } from 'framer-motion';
import { Target, Zap, Flame, TrendingUp, Trophy } from 'lucide-react';

const ICON_MAP = {
  total: Target,
  active: Zap,
  streak: Flame,
};

const COLOR_MAP = {
  total: 'green',
  active: 'blue',
  streak: 'orange',
};

/**
 * Reusable neon stat card.
 * @param {string}  type      - 'total' | 'active' | 'streak'
 * @param {string}  label     - e.g. "Total Solved"
 * @param {number}  value     - the big number
 * @param {string}  badgeText - e.g. "+74 this week"
 * @param {string}  sublabel  - e.g. "Top 2% globally" or "Don't break the chain!"
 * @param {boolean} highlightSub - cyan highlight the sublabel
 * @param {number}  personalBest - optional PB value for streak
 * @param {string}  unit      - optional unit text e.g. "Days"
 */
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
  const color = COLOR_MAP[type] || 'green';
  const delay = type === 'total' ? 0.1 : type === 'active' ? 0.2 : 0.3;

  // Mini bars data (decorative sparkline)
  const bars = [4, 6, 3, 8, 5, 7, 4, 9, 6, 3];

  return (
    <motion.div
      className={`glass-card stat-${type}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="stat-card-inner">
        {/* Header: icon + badge */}
        <div className="stat-header">
          <div className={`stat-icon-wrap ${color}`}>
            <Icon size={18} />
          </div>
          {badgeText && (
            <span className={`stat-badge ${color}`}>
              {type === 'total' && <TrendingUp size={12} />}
              {type === 'streak' && personalBest != null && <Trophy size={12} />}
              {personalBest != null ? `PB: ${personalBest}` : badgeText}
            </span>
          )}
          {!badgeText && personalBest != null && (
            <span className={`stat-badge amber`}>
              <Trophy size={12} /> PB: {personalBest}
            </span>
          )}
        </div>

        {/* Label */}
        <span className="stat-label">{label}</span>

        {/* Value */}
        <div className="stat-value">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span className={`stat-value-unit ${color}`}>{unit}</span>}
        </div>

        {/* Sublabel or mini bars */}
        {sublabel && (
          <span className={`stat-sublabel ${highlightSub ? 'highlight' : ''}`}>
            {sublabel}
          </span>
        )}

        {/* Mini sparkline bars */}
        <div className="mini-bars">
          {bars.map((h, i) => (
            <div
              key={i}
              className="mini-bar"
              style={{
                height: `${h * 3}px`,
                background:
                  color === 'green'
                    ? `rgba(34,197,94,${0.3 + h * 0.06})`
                    : color === 'blue'
                    ? `rgba(56,189,248,${0.3 + h * 0.06})`
                    : `rgba(251,146,60,${0.3 + h * 0.06})`,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
