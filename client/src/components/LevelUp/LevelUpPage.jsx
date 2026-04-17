import React from 'react';
import NextTarget from './NextTarget';
import { useDashboardData } from '../../hooks/useDashboardData';
import UpsolveQueue from '../Dashboard/UpsolveQueue';

const LevelUpPage = () => {
    const { userId, loading, cfData, lcData } = useDashboardData();

    const cf = cfData || {};
    const lc = lcData || {};

    // Upsolve queue: blend CF and LC
    const cfUpsolve = (cf.upsolveQueue || []).sort((a, b) => (a.rating || 0) - (b.rating || 0));
    const lcUpsolve = (lc.upsolveQueue || []).sort((a, b) => (b.attempts || 0) - (a.attempts || 0));

    const half = 5;
    let cfTake = Math.min(cfUpsolve.length, half);
    let lcTake = Math.min(lcUpsolve.length, half);
    
    if (cfTake < half) lcTake = Math.min(lcUpsolve.length, 10 - cfTake);
    if (lcTake < half) cfTake = Math.min(cfUpsolve.length, 10 - lcTake);

    const upsolveProblems = [...cfUpsolve.slice(0, cfTake), ...lcUpsolve.slice(0, lcTake)];

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] px-6 py-10 transition-colors duration-200">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Header Section */}
                <div className="text-left border-l-[6px] border-emerald-600 dark:border-emerald-500 pl-6 mb-10">
                    <h1 className="text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic leading-none mb-3">
                        LEVEL-UP <span className="text-emerald-600 dark:text-emerald-400 not-italic">CENTER</span>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-[0.2em] opacity-80">
                        Analyze Gaps • Master Topics • Step Up
                    </p>
                </div>

                {/* Primary Feature: Next Target Analysis */}
                <div className="relative">
                    {!loading && userId ? (
                        <NextTarget userId={userId} />
                    ) : (
                        <div className="h-64 bg-white dark:bg-[#111111] border border-black/[0.07] dark:border-white/[0.08] rounded-xl animate-pulse flex items-center justify-center shadow-sm">
                            <span className="text-gray-400 dark:text-gray-500 text-sm font-medium uppercase tracking-widest">Calculating Milestone...</span>
                        </div>
                    )}
                </div>

                {/* Upsolve Queue Section */}
                <div className="relative mt-8">
                    {!loading && (cfUpsolve.length > 0 || lcUpsolve.length > 0) && (
                        <UpsolveQueue loading={loading} problems={upsolveProblems} />
                    )}
                </div>

                {/* Secondary/WIP Section */}
                <div className="flex flex-col items-center justify-center py-12 pt-20 border-t border-black/[0.05] dark:border-white/[0.05]">
                    <div className="bg-white/50 dark:bg-[#111111]/50 backdrop-blur-sm border border-black/[0.05] dark:border-white/[0.05] text-center rounded-2xl p-10 max-w-lg w-full shadow-lg shadow-black/[0.02]">
                        <div className="inline-block p-4 rounded-full bg-emerald-50 dark:bg-emerald-500/10 mb-6 border border-emerald-100 dark:border-emerald-500/20">
                            <div className="animate-bounce text-3xl">🚀</div>
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">Advanced Roadmaps</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-10 font-medium leading-relaxed">
                            We're currently building deep-dive paths, peer-to-peer 
                            benchmarking, and 1-on-1 mentor logic into this section.
                        </p>
                        <div className="flex gap-2 justify-center">
                            <span className="w-16 h-1.5 rounded-full bg-emerald-600/40 animate-pulse"></span>
                            <span className="w-8 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                            <span className="w-4 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LevelUpPage;
