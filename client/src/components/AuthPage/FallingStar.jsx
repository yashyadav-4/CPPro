import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';

const TOTAL_STARS = 40;

export default function FallingStars() {
    const { isDark } = useTheme();
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const stars = useMemo(() => {
        const starArray = [];
        for (let i = 0; i < TOTAL_STARS; i++) {
            const leftPosition = Math.random() * 100;
            const size = 1.2 + Math.random() * 2.5; 
            const animationDuration = 10 + Math.random() * 15;
            const animationDelay = Math.random() * -25;
            const opacity = isDark ? (0.4 + Math.random() * 0.4) : (0.2 + Math.random() * 0.3);
            const color = isDark ? '#ffffff' : '#0f172a';

            starArray.push({
                id: i,
                leftPosition,
                size,
                animationDuration,
                animationDelay,
                opacity,
                color
            });
        }
        return starArray;
    }, [isDark]);

    const gridColor = isDark ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)';
    const accentGrid = isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(22, 163, 74, 0.3)';

    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
            {/* Base Grid */}
            <div style={{ 
                position: 'absolute', inset: 0, 
                backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px,transparent 1px),linear-gradient(90deg,${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px,transparent 1px)`, 
                backgroundSize: '64px 64px', zIndex: -2 
            }} />

            {/* Interactive Emerald Grid Layer */}
            <div style={{ 
                position: 'absolute', inset: 0, 
                backgroundImage: `linear-gradient(${accentGrid} 1px,transparent 1px),linear-gradient(90deg,${accentGrid} 1px,transparent 1px)`, 
                backgroundSize: '64px 64px',
                zIndex: -1,
                WebkitMaskImage: `radial-gradient(circle 250px at ${mousePos.x}px ${mousePos.y}px, black, transparent)`,
                maskImage: `radial-gradient(circle 250px at ${mousePos.x}px ${mousePos.y}px, black, transparent)`,
                transition: 'mask-image 0.1s ease-out'
            }} />

            {/* Subtle Static Glows */}
            <div style={{ position: 'absolute', top: '20%', right: '10%', width: '600px', height: '600px', borderRadius: '50%', background: `radial-gradient(circle, ${isDark ? 'rgba(34, 197, 94, 0.05)' : 'rgba(22, 163, 74, 0.03)'} 0%, transparent 70%)`, pointerEvents: 'none', zIndex: -2 }} />
            
            {stars.map((star) => (
                <motion.div
                    key={star.id}
                    initial={{ y: '-10vh' }}
                    animate={{ y: '110vh' }}
                    transition={{ 
                        duration: star.animationDuration, 
                        repeat: Infinity, 
                        delay: star.animationDelay,
                        ease: "linear" 
                    }}
                    style={{
                        position: 'absolute',
                        left: `${star.leftPosition}%`,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        backgroundColor: star.color,
                        borderRadius: '50%',
                        opacity: star.opacity,
                        boxShadow: isDark ? `0 0 6px rgba(255,255,255,0.4)` : 'none'
                    }}
                />
            ))}
        </div>
    );
}
