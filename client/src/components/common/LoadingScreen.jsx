import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 1;
      });
    }, 20); // ~2 seconds total

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {/* Background Glow */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          width: '40vw',
          height: '40vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      <div style={{ position: 'relative', textAlign: 'center' }}>
        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 'clamp(3rem, 8vw, 5rem)',
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '0.1em',
            margin: 0,
            padding: '0 20px',
            textTransform: 'uppercase',
            position: 'relative',
            zIndex: 1
          }}
        >
          CPPRO
        </motion.h1>

        {/* Progress Bar Container */}
        <div style={{ 
          width: '100%', 
          maxWidth: '300px', 
          height: '1px', 
          background: 'rgba(255,255,255,0.1)', 
          margin: '2rem auto',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <motion.div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              background: '#fff',
              width: `${progress}%`
            }}
          />
        </div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.4em',
            textTransform: 'uppercase'
          }}
        >
          UNLOCKING GROWTH
        </motion.div>
      </div>

      {/* Aesthetic Dots */}
      <div style={{ position: 'absolute', bottom: '5%', left: '5%', display: 'flex', gap: '8px' }}>
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
            style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#fff' }}
          />
        ))}
      </div>
    </motion.div>
  );
}
