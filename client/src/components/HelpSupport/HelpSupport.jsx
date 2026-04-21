import React, { useState } from 'react';
import { Mail, Bug, MessageCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function HelpSupport() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
            >
                <MessageCircle size={28} />
            </button>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-white/95 dark:bg-[#111111]/90 backdrop-blur-2xl border border-gray-200/50 dark:border-white/[0.08] rounded-3xl shadow-2xl p-6 relative z-10 overflow-hidden"
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center mb-6 mt-2">
                                <div className="inline-flex items-center justify-center p-3 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl mb-4 ring-1 ring-emerald-500/20">
                                    <MessageCircle size={28} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Help & Support</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    I am here to help! Whether you have a question or found a bug, feel free to reach out.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <a href="mailto:support@cppro.dev" className="group flex items-center gap-4 bg-gray-50/50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl p-4 transition-all hover:bg-gray-100 dark:hover:bg-white/10">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                                        <Mail size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Email Support</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">support@cppro.dev</p>
                                    </div>
                                </a>

                                <div className="group flex items-center gap-4 bg-gray-50/50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl p-4 transition-all hover:bg-gray-100 dark:hover:bg-white/10">
                                    <div className="p-3 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl">
                                        <Bug size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Report a Bug</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Help me enrich the community!</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
