import { motion } from 'framer-motion';

const rows = [
  { spans: ['skeleton-card skeleton-sm', 'skeleton-card skeleton-sm', 'skeleton-card skeleton-sm', 'skeleton-card skeleton-sm'] },
  { spans: ['skeleton-card skeleton-lg span-full'] },
  { spans: ['skeleton-card skeleton-lg span-half', 'skeleton-card skeleton-lg span-half'] },
  { spans: ['skeleton-card skeleton-lg span-full'] },
];

export default function SkeletonLoader() {
  return (
    <div className="skeleton-grid">
      {rows.map((row, ri) =>
        row.spans.map((cls, ci) => (
          <motion.div
            key={`${ri}-${ci}`}
            className={cls}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: ri * 0.08 + ci * 0.04, duration: 0.4 }}
          >
            {ri === 0 && ci === 0 ? (
              <div className="skeleton-circle" />
            ) : (
              <>
                <div className="skeleton-bar short" />
                <div className="skeleton-bar medium" />
              </>
            )}
          </motion.div>
        ))
      )}
    </div>
  );
}
