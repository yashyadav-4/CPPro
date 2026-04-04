import React from 'react';

const LearningPage = () => {
    return (
        <div className="min-h-screen bg-[#F5F5F3] dark:bg-[#1A1A1A] flex flex-col justify-center items-center p-6">
            <div className="bg-white dark:bg-[#242424] border border-black/[0.07] dark:border-white/[0.08] text-center rounded-xl p-8 max-w-md w-full">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Learning Section</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6 font-normal">Work in Progress! We're building something amazing here.</p>
                <div className="animate-pulse flex space-x-4 justify-center items-center">
                    <div className="rounded-full bg-indigo-200 dark:bg-indigo-900 h-12 w-12"></div>
                    <div className="flex-1 space-y-4 py-1">
                        <div className="h-2 bg-indigo-200 dark:bg-indigo-900 rounded w-3/4 mx-auto"></div>
                        <div className="h-2 bg-indigo-200 dark:bg-indigo-900 rounded w-1/2 mx-auto"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LearningPage;
