import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, AlertCircle, ExternalLink, CheckCircle, Flame, Zap } from 'lucide-react';
import axios from 'axios';

const getHref = (p) => {
  if (p.platform === 'leetcode') return `https://leetcode.com/problems/${p.problemId}/`;
  if (p.platform === 'codeforces') return p.problemId ? `https://codeforces.com/problemset/problem/${p.problemId.replace(/([A-Z].*)/, '/$1')}` : '#';
  if (p.platform === 'codechef') return `https://www.codechef.com/problems/${p.problemId}`;
  return '#';
};

export default function RecommendedTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRecommendations = async () => {
      const cacheKey = 'cppro_levelup_recommendations';
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          if (isMounted) {
            setData(JSON.parse(cached));
            setLoading(false);
          }
        } catch (e) {
          console.warn('Recommendations cache parse error', e);
        }
      } else {
        setLoading(true);
      }
      
      if (isMounted) setError(null);
      
      try {
        const res = await axios.get('/api/levelup/recommendations', { withCredentials: true });
        if (isMounted) {
          const newData = res.data?.data || null;
          const newCacheString = JSON.stringify(newData);
          
          if (newCacheString !== cached) {
            setData(newData);
            localStorage.setItem(cacheKey, newCacheString);
          }
        }
      } catch (err) {
        if (isMounted && !localStorage.getItem(cacheKey)) {
          setError(err.response?.data?.message || err.message || 'Failed to fetch recommendations');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchRecommendations();
    return () => { isMounted = false; };
  }, []);

  const platformMeta = {
    leetcode: { color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10 border-[#f59e0b]/20' },
    codeforces: { color: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10 border-[#3b82f6]/20' },
    codechef: { color: 'text-[#10b981]', bg: 'bg-[#10b981]/10 border-[#10b981]/20' },
  };

  const renderSection = (title, icon, problems, accentColor) => {
    if (!problems || problems.length === 0) return null;
    
    return (
      <div className="mb-10 last:mb-0">
        <div className="flex items-center gap-3 mb-5">
          <div className={`p-2 rounded-xl bg-${accentColor}-500/10 border border-${accentColor}-500/20`}>
            {icon}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {problems.map((p, i) => {
              const meta = platformMeta[p.platform] || { color: 'text-gray-400', bg: 'bg-white/5 border-gray-800' };
              
              return (
                <motion.a
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  key={`${p.platform}-${p.problemId}-${i}`}
                  href={getHref(p)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative overflow-hidden border rounded-2xl p-5 transition-all duration-300 flex flex-col gap-3 ${
                    p.isSolved 
                      ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20' 
                      : `bg-white dark:bg-[#111111] border-gray-100 dark:border-[#222222] hover:border-${accentColor}-500/40 hover:shadow-xl hover:shadow-${accentColor}-500/10 hover:-translate-y-1`
                  }`}
                >
                  {/* Subtle Gradient Glow inside the card */}
                  {!p.isSolved && (
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-${accentColor}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-full pointer-events-none`} />
                  )}

                  {p.isSolved && (
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                      <CheckCircle className="w-24 h-24 text-emerald-500" />
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.color} ${meta.bg}`}>
                          {p.platform}
                        </span>
                        {p.fromPopularSheet && (
                           <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                             <Sparkles size={10} /> Popular
                           </span>
                        )}
                      </div>
                      <h4 className={`text-base font-bold mt-1 transition-colors flex items-center gap-2 ${
                        p.isSolved ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100 group-hover:text-white'
                      }`}>
                        {p.title}
                        {!p.isSolved && <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />}
                      </h4>
                    </div>
                    {p.isSolved && (
                      <div className="p-1.5 bg-emerald-500/10 rounded-full shrink-0 border border-emerald-500/20">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-auto pt-2 relative z-10">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">Rating</span>
                      <span className={`text-sm font-bold tabular-nums ${
                        p.difficulty === 'Easy' ? 'text-emerald-500' :
                        p.difficulty === 'Medium' ? 'text-amber-500' :
                        p.difficulty === 'Hard' ? 'text-red-500' :
                        'text-gray-700 dark:text-gray-200'
                      }`}>
                        {p.difficulty || '—'}
                      </span>
                    </div>
                    {p.weakTag && (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">Targets</span>
                        <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                          {p.weakTag}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.a>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/50 dark:bg-[#121212]/50 border border-gray-100 dark:border-gray-800/60 rounded-3xl p-6 md:p-8 backdrop-blur-xl min-h-[500px] flex flex-col"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-inner">
          <Sparkles className="text-amber-500 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Recommended Problems</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Curated practice updated weekly. We pick 6 problems for each category targeting your rating and weaknesses.
          </p>
        </div>
      </div>

      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <AlertCircle className="w-10 h-10 text-red-500 mb-4 opacity-80" />
            <p className="text-gray-900 dark:text-white font-medium">{error}</p>
          </div>
        ) : data ? (
          <div className="flex flex-col">
            {renderSection('Daily Workout', <CheckCircle className="text-blue-500 w-5 h-5" />, data.workout, 'blue')}
            {renderSection('Challenge', <Flame className="text-orange-500 w-5 h-5" />, data.challenge, 'orange')}
            {renderSection('Bonus Practice', <Zap className="text-purple-500 w-5 h-5" />, data.bonus, 'purple')}
            
            {(!data.workout?.length && !data.challenge?.length && !data.bonus?.length) && (
              <div className="flex flex-col items-center justify-center text-center p-12 bg-gray-50/50 dark:bg-black/20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800/60">
                <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Recommendations Yet</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                  Connect your accounts or wait for our weekly generation job to run.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
