import React from 'react';
import { Mail, Bug, MessageCircle } from 'lucide-react';

export default function HelpSupport() {
    return (
        <div className="min-h-[calc(100vh-6rem)] w-full flex items-center justify-center p-6 relative">
            <div className="w-full max-w-2xl bg-white/70 dark:bg-black/60 backdrop-blur-xl border border-white/[0.08] dark:border-white/[0.05] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8 md:p-12 overflow-hidden relative z-10 transition-all duration-300">
                {/* Decorative gradients */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 rounded-3xl pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/20 blur-[100px] rounded-full"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 blur-[100px] rounded-full"></div>
                </div>

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-4 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl mb-6 shadow-inner ring-1 ring-emerald-500/20">
                        <MessageCircle size={40} strokeWidth={1.5} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">Help & Support</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        I am here to help! Whether you have a question, feature request, or need assistance, feel free to reach out.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Contact Support Card */}
                    <div className="bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 transition-transform hover:scale-[1.01] duration-300">
                        <div className="p-4 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0">
                            <Mail size={32} />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Email Support</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                                Get in touch with me directly.I will try my best to get back to you as soon as possible.
                            </p>
                            <a href="mailto:support@cppro.dev" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20 w-fit">
                                <Mail size={18} />
                                support@cppro.dev
                            </a>
                        </div>
                    </div>

                    {/* Bug Report Card */}
                    <div className="bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 transition-transform hover:scale-[1.01] duration-300">
                        <div className="p-4 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl flex-shrink-0">
                            <Bug size={32} />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Report a Bug</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                If you found any bug, please report it to me directly. It will greatly help me enrich and improve my community!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
