import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Zap, ArrowRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LevelUpPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col items-center justify-center px-6 transition-colors duration-200">

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg text-center"
      >
        {/* Animated wrench icon */}
        <motion.div
          animate={{ rotate: [0, -14, 14, -8, 8, 0] }}
          transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3.5 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-8"
          style={{
            background: 'rgba(239,68,68,0.09)',
            border: '1px solid rgba(239,68,68,0.2)',
            boxShadow: '0 0 36px rgba(239,68,68,0.1)',
          }}
        >
          <Wrench size={36} className="text-red-500" strokeWidth={1.8} />
        </motion.div>

        {/* Heading */}
        <h1 className="text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic leading-none mb-4">
          LEVEL-UP{' '}
          <span className="text-emerald-600 dark:text-emerald-400 not-italic">CENTER</span>
        </h1>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
          style={{
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.18)',
          }}
        >
          <AlertTriangle size={12} className="text-red-500" />
          <span className="text-red-500 dark:text-red-400 text-xs font-bold uppercase tracking-widest">
            Removed — Under Maintenance
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-3 max-w-sm mx-auto">
          This feature was temporarily removed due to a bug I am  actively fixing.
        </p>


        {/* CTAs */}
        <div className="flex items-center justify-center gap-4">
          <Link to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              boxShadow: '0 4px 16px rgba(34,197,94,0.35)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(34,197,94,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(34,197,94,0.35)'; }}
          >
            Go to Dashboard <ArrowRight size={15} />
          </Link>
          <Link to="/daily"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{
              border: '1px solid rgba(34,197,94,0.25)',
              color: '#22c55e',
              background: 'rgba(34,197,94,0.05)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.05)'; }}
          >
            <Zap size={15} /> Daily Problems
          </Link>
        </div>
      </motion.div>

      {/* Decorative grid */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#ef4444 1px, transparent 1px), linear-gradient(90deg, #ef4444 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />
      {/* Glow blob */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[280px] pointer-events-none -z-10"
        style={{ background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.12) 0%, transparent 70%)' }}
      />
    </div>
  );
}
