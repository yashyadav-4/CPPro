import React from 'react';
import NextTarget from './NextTarget';
import { useDashboardData } from '../../hooks/useDashboardData';

const LevelUpPage = () => {
    const { userId, loading } = useDashboardData();

    return (
        <div className="min-h-screen bg-[#F5F5F3] dark:bg-[#1A1A1A] px-6 py-10">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Header Section */}
                <div className="text-left border-l-8 border-amber-500 pl-6 mb-8">
                    <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter italic mb-2">
                        LEVEL-UP <span className="text-amber-500 not-italic">CENTER</span>
                    </h1>
                    <p className="text-base text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest opacity-80">
                        Analyze Gaps • Master Topics • Step Up
                    </p>
                </div>

                {/* Primary Feature: Next Target Analysis */}
                <div className="relative">
                    {!loading && userId ? (
                        <NextTarget userId={userId} />
                    ) : (
                        <div className="h-64 bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-white/[0.08] rounded-xl animate-pulse flex items-center justify-center">
                            <span className="text-gray-400 text-sm font-medium uppercase tracking-widest animate-pulse">Calculating Milestone...</span>
                        </div>
                    )}
                </div>

                {/* Secondary/WIP Section */}
                <div className="flex flex-col items-center justify-center py-12 pt-20 border-t border-black/[0.05] dark:border-white/[0.05]">
                    <div className="bg-white/40 dark:bg-[#242424]/40 backdrop-blur-sm border border-black/[0.05] dark:border-white/[0.05] text-center rounded-2xl p-10 max-w-lg w-full">
                        <div className="inline-block p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-6">
                            <div className="animate-bounce text-2xl">🚧</div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">More Power Coming Soon</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 font-normal leading-relaxed">
                            We're currently building advanced deep-dive roadmaps, peer comparisons, 
                            and 1-on-1 mentor logic into this section. Stay tuned!
                        </p>
                        <div className="flex gap-2 justify-center">
                            <span className="w-24 h-1.5 rounded-full bg-amber-400/30 animate-pulse"></span>
                            <span className="w-12 h-1.5 rounded-full bg-amber-400/50 animate-pulse"></span>
                            <span className="w-8 h-1.5 rounded-full bg-amber-400/70 animate-pulse"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LevelUpPage;
