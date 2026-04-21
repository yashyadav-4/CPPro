import { Link } from 'react-router-dom';
import { Mail, Heart } from 'lucide-react';

export default function Footer() {
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
              <a 
                href="mailto:support@cppro.dev" 
                className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-500 transition-colors group"
              >
                <div className="p-2 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-white/5 rounded-lg group-hover:border-emerald-500/30 transition-all">
                  <Mail className="h-4 w-4" />
                </div>
                Contact Support
              </a>
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
                { name: 'Verification', path: '/verify-codeforces' },
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