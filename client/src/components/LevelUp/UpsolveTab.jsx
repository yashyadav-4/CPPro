import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListTodo, Code2, TerminalSquare, CheckCircle, ExternalLink, Loader2, AlertCircle, ArrowDownUp, Clock } from 'lucide-react';
import axios from 'axios';

const VERDICT_LABEL = {
  WA: 'Wrong Answer',
  TLE: 'Time Limit Exceeded',
  MLE: 'Memory Limit Exceeded',
  RE: 'Runtime Error',
  CE: 'Compile Error',
  PA: 'Partial Accepted',
  Unattempted: 'Unattempted',
  OTHER: 'Other',
};

const VERDICT_COLOR = {
  WA: 'bg-red-500',
  TLE: 'bg-amber-500',
  MLE: 'bg-purple-500',
  RE: 'bg-orange-500',
  CE: 'bg-pink-500',
  PA: 'bg-blue-400',
  Unattempted: 'bg-indigo-500',
  OTHER: 'bg-gray-500',
};

const PLATFORMS = [
  { id: 'all', label: 'All', icon: ListTodo },
  { id: 'codeforces', label: 'Codeforces', icon: TerminalSquare },
  { id: 'leetcode', label: 'LeetCode', icon: Code2 },
  { id: 'codechef', label: 'CodeChef', icon: CheckCircle },
];

export default function UpsolveTab() {
  const [activePlatform, setActivePlatform] = useState('all');
  const [sortBy, setSortBy] = useState('recent'); // 'rating' | 'recent'
  const [cfFilter, setCfFilter] = useState('all'); // 'all' | 'contest' | 'wrong_answer'
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lcSessionActive, setLcSessionActive] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchUpsolve = async () => {
      const cacheKey = `cppro_levelup_upsolve_${activePlatform}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (isMounted) {
            setProblems(parsed.problems || []);
            if (parsed.lcSessionActive !== undefined) setLcSessionActive(parsed.lcSessionActive);
            setLoading(false);
          }
        } catch (e) {
          console.warn('Upsolve cache parse error', e);
        }
      } else {
        setLoading(true);
      }
      
      if (isMounted) setError(null);
      
      try {
        const params = activePlatform === 'all' ? {} : { platform: activePlatform };
        const res = await axios.get('/api/levelup/upsolve', { params, withCredentials: true });
        
        if (isMounted) {
          const newProblems = res.data?.data || [];
          const newLcSessionActive = res.data?.lcSessionActive;
          
          const newDataToCache = { problems: newProblems, lcSessionActive: newLcSessionActive };
          const newCacheString = JSON.stringify(newDataToCache);
          
          if (newCacheString !== cached) {
            setProblems(newProblems);
            if (newLcSessionActive !== undefined) setLcSessionActive(newLcSessionActive);
            localStorage.setItem(cacheKey, newCacheString);
          }
        }
      } catch (err) {
        if (isMounted && !localStorage.getItem(cacheKey)) {
          setError(err.response?.data?.message || err.message || 'Failed to fetch upsolve queue');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchUpsolve();
    return () => { isMounted = false; };
  }, [activePlatform]);

  const sortedProblems = useMemo(() => {
    let filtered = problems;
    if (activePlatform === 'codeforces') {
      if (cfFilter === 'contest') {
        filtered = problems.filter(p => p.failReason === 'Unattempted');
      } else if (cfFilter === 'wrong_answer') {
        filtered = problems.filter(p => p.failReason !== 'Unattempted');
      }
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'recent') {
        const timeA = new Date(a.submittedAt || 0).getTime();
        const timeB = new Date(b.submittedAt || 0).getTime();
        return timeB - timeA; // latest first
      } else {
        const getNumeric = (r) => {
          if (r === 'Easy') return 1000;
          if (r === 'Medium') return 1500;
          if (r === 'Hard') return 2000;
          return Number(r) || 0;
        };
        const rA = getNumeric(a.rating);
        const rB = getNumeric(b.rating);
        return rA - rB; // lowest to highest
      }
    });
  }, [problems, sortBy, activePlatform, cfFilter]);

  const getHref = (p) => {
    if (p.platform === 'leetcode') return `https://leetcode.com/problems/${p.problemId}/`;
    if (p.platform === 'codeforces') return p.problemId ? `https://codeforces.com/problemset/problem/${p.problemId.replace(/([A-Z].*)/, '/$1')}` : '#';
    if (p.platform === 'codechef') return `https://www.codechef.com/problems/${p.problemId}`;
    return '#';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/50 dark:bg-[#121212]/50 border border-gray-100 dark:border-gray-800/60 rounded-3xl p-6 md:p-8 backdrop-blur-xl flex flex-col min-h-[500px]"
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <ListTodo className="text-blue-500 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Upsolve Queue</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tackle the problems you missed and build your foundations.</p>
          </div>
        </div>

        {/* Controls: Platform Filters + Sort Toggle */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Sort Toggle */}
          <div className="flex items-center bg-gray-100/80 dark:bg-[#1a1a1a] p-1 rounded-xl border border-gray-200/50 dark:border-gray-800/50">
             <button
                onClick={() => setSortBy('rating')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  sortBy === 'rating' ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700/50' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
             >
                <ArrowDownUp size={12} /> Rating
             </button>
             <button
                onClick={() => setSortBy('recent')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  sortBy === 'recent' ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700/50' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
             >
                <Clock size={12} /> Recent
             </button>
          </div>

          {/* Platform Filters */}
          <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-[#1a1a1a] p-1 rounded-xl border border-gray-200/50 dark:border-gray-800/50 overflow-x-auto hide-scrollbar max-w-full">
            {PLATFORMS.map(plat => {
              const Icon = plat.icon;
              const isActive = activePlatform === plat.id;
              return (
                <button
                  key={plat.id}
                  onClick={() => setActivePlatform(plat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700/50'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <Icon size={12} className={isActive ? 'text-blue-500' : 'opacity-70'} />
                  {plat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* LeetCode Session Warning */}
      {!lcSessionActive && (activePlatform === 'leetcode' || activePlatform === 'all') && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-semibold block mb-1">LeetCode Session Missing</span>
            You haven't added a LeetCode session token. We can only access your public profile, which hides your failed attempts. To unlock your LeetCode upsolve queue, go to Settings and add your session key.
          </div>
        </div>
      )}

      {/* Codeforces Specific Filters */}
      {activePlatform === 'codeforces' && (
        <div className="flex justify-end mb-6 -mt-4">
           <div className="flex items-center bg-gray-100/80 dark:bg-[#1a1a1a] p-1 rounded-xl border border-gray-200/50 dark:border-gray-800/50">
             <button
               onClick={() => setCfFilter('all')}
               className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                 cfFilter === 'all' ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700/50' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
               }`}
             >
               All
             </button>
             <button
               onClick={() => setCfFilter('wrong_answer')}
               className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                 cfFilter === 'wrong_answer' ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700/50' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
               }`}
             >
               Wrong Answer
             </button>
             <button
               onClick={() => setCfFilter('contest')}
               className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                 cfFilter === 'contest' ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700/50' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
               }`}
             >
               Upsolve from Last Contests
             </button>
           </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <AlertCircle className="w-10 h-10 text-red-500 mb-4 opacity-80" />
            <p className="text-gray-900 dark:text-white font-medium">{error}</p>
            <button 
              onClick={() => setActivePlatform(activePlatform)}
              className="mt-4 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : sortedProblems.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 dark:bg-black/20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800/60">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              You have successfully upsolved all the problems you attempted for {PLATFORMS.find(p => p.id === activePlatform)?.label}.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {sortedProblems.map((p, i) => {
                const failReason = p.failReason || p.verdict;
                const verdictLabel = VERDICT_LABEL[failReason] || failReason || 'Failed';
                const dotColor = VERDICT_COLOR[failReason] || 'bg-gray-500';
                
                return (
                  <motion.a
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: (i % 10) * 0.02 }}
                    key={`${p.platform}-${p.problemId}-${i}`}
                    href={getHref(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-xl p-4 hover:border-blue-500/30 dark:hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`w-2 h-2 rounded-full ${dotColor} shadow-sm`} />
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-md">
                          {p.platform}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {p.title}
                        </h3>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                      </div>

                      {p.contestName && (
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                           {p.contestName} • {p.attempts === 0 ? 'Unattempted' : `${p.attempts} attempt${p.attempts !== 1 ? 's' : ''}`}
                         </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 shrink-0 text-right">
                      <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">Difficulty</span>
                        <span className={`text-sm font-bold tabular-nums ${
                          p.rating === 'Easy' ? 'text-emerald-500' :
                          p.rating === 'Medium' ? 'text-amber-500' :
                          p.rating === 'Hard' ? 'text-red-500' :
                          'text-gray-700 dark:text-gray-300'
                        }`}>
                          {p.rating && String(p.rating) !== '0' ? p.rating : '—'}
                        </span>
                      </div>
                      <div className="flex flex-col items-end w-24 sm:w-32">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">Verdict</span>
                        <span className={`text-sm font-semibold capitalize truncate w-full text-right ${failReason === 'Unattempted' ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          {verdictLabel}
                        </span>
                      </div>
                    </div>
                  </motion.a>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
