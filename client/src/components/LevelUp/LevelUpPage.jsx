import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListTodo, Sparkles, Activity } from 'lucide-react';

import UpsolveTab from './UpsolveTab';
import RecommendedTab from './RecommendedTab';
import ProgressTab from './ProgressTab';

export default function LevelUpPage() {
  const [activeTab, setActiveTab] = useState('upsolve');

  const tabs = [
    { id: 'upsolve', label: 'Upsolve Queue', icon: ListTodo, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'recommended', label: 'Problem Recommendations', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'progress', label: 'Performance Stats', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'upsolve':
        return <UpsolveTab />;
      case 'recommended':
        return <RecommendedTab />;
      case 'progress':
        return <ProgressTab />;
      default:
        return <UpsolveTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pt-24 pb-12 px-6 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-2 uppercase italic">
              LEVEL <span className="text-emerald-600 dark:text-emerald-400 not-italic">UP</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl text-lg">
              Master your weaknesses, track your growth, and follow a personalized training roadmap powered by intelligent recommendations and upsolving.
            </p>
          </div>
        </motion.div>

        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar space-x-2 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-800' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${isActive ? tab.bg : 'bg-transparent'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? tab.color : 'text-current'}`} />
                </div>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

      </div>
      
      {/* Decorative Background */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />
    </div>
  );
}
