import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Heart, Check } from 'lucide-react';

export default function Footer() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText('support@cppro.dev');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <footer className="bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/[0.05] py-16">
      <div className="max-w-[1120px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
                &lt;/&gt; CPPro
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs">
              Track your progress, manage code snippets, and climb the global leaderboards with the ultimate toolkit for competitive programmers.
            </p>
            <div className="pt-2">
              <button 
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-500 transition-colors group"
                aria-label="Copy support email"
              >
                <div className={`p-2 rounded-lg transition-all duration-300 ${copied ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-white/5 group-hover:border-emerald-500/30'}`}>
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </div>
                <div className="relative flex items-center h-5 w-[130px] overflow-hidden">
                  <span 
                    className={`absolute inset-0 flex items-center transition-all duration-300 ${
                      copied ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0 group-hover:-translate-y-full group-hover:opacity-0'
                    }`}
                  >
                    Contact Support
                  </span>
                  <span 
                    className={`absolute inset-0 flex items-center transition-all duration-300 ${
                      copied ? 'opacity-0 -translate-y-full' : 'opacity-0 translate-y-full group-hover:translate-y-0 group-hover:opacity-100'
                    }`}
                  >
                    support@cppro.dev
                  </span>
                  <span 
                    className={`absolute inset-0 flex items-center font-medium text-emerald-500 transition-all duration-300 ${
                      copied ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
                    }`}
                  >
                    Email Copied!
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Column 2: Platform */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-5 font-mono">Platform</h3>
            <ul className="space-y-4">
              {[
                { name: 'Dashboard', path: '/dashboard' },
                { name: 'Leaderboard', path: '/leaderboard' },
                { name: 'Contest Tracker', path: '/contest-tracker' },
                { name: 'Level Up', path: '/level-up' },
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.path} className="text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-5 font-mono">Resources</h3>
            <ul className="space-y-4">
              {[
                { name: 'Learning Paths', path: '/learning' },
                { name: 'Community', path: '/community' },
                { name: 'Code Snippets', path: '/codesnippet' },
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.path} className="text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Account */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-5 font-mono">Account</h3>
            <ul className="space-y-4">
              {[
                { name: 'Verification', path: '/verification' },
                { name: 'Settings', path: '/settings' },
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.path} className="text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 dark:border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-mono">
            © 2026 CPPro. Built by <span className="font-semibold text-gray-900 dark:text-white">YASH</span>
          </p>
        </div>
      </div>
    </footer>
  );
}