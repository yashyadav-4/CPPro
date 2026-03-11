import { useState } from 'react';
import { Github, Twitter, Mail, Code2, Heart, ExternalLink, ChevronUp } from 'lucide-react';


export default function Footer() {

  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setTimeout(() => {
        setIsSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'Changelog', href: '#changelog' },
      { name: 'Roadmap', href: '#roadmap' },
    ],
    resources: [
      { name: 'Documentation', href: '#docs' },
      { name: 'API Reference', href: '#api' },
      { name: 'Community', href: '#community' },
      { name: 'Blog', href: '#blog' },
    ],
  };

  return (
    <footer className="relative bg-[#0a0a0a] border-t border-[#1a1a1a]">
      {/* Animated top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#333] to-transparent opacity-40" />

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">

          {/* Brand section */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative p-2 bg-white/10 rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <Code2 className="w-6 h-6 text-white relative z-10" />
                <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                CP<span className="text-neutral-400 font-normal">Tracker</span>
              </span>
            </div>

            <p className="text-neutral-400 leading-relaxed max-w-sm">
              Master your competitive programming journey with intelligent progress tracking,
              personalized insights, and performance analytics.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-4">
              {[Github, Twitter, Mail].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="p-2 rounded-full border border-[#333] text-neutral-400 hover:border-neutral-300 hover:text-white hover:bg-white/5 transition-all duration-300 hover:scale-110"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links sections */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {category}
                </h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="group flex items-center gap-1 text-sm text-neutral-400 hover:text-white transition-colors duration-200"
                      >
                        <span className="relative">
                          {link.name}
                          <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300" />
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter section */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Stay Updated
            </h3>
            <p className="text-sm text-neutral-400">
              Get the latest updates on new features and platform improvements.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dev@example.com"
                  className="w-full px-4 py-2.5 text-sm bg-[#111] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all duration-200 placeholder:text-neutral-600"
                />
              </div>
              <button
                type="submit"
                disabled={isSubscribed}
                className={`w-full py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-300 ${isSubscribed
                    ? 'bg-[#3b82f6] text-white'
                    : 'bg-white text-black hover:bg-neutral-200 hover:shadow-lg hover:shadow-white/5'
                  }`}
              >
                {isSubscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-[#1a1a1a] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-1 text-sm text-neutral-500">
            <span>© 2026 CPTracker. Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
            <span>for competitive programmers.</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-neutral-500">
            <span className="hidden md:inline">System Status: <span className="text-emerald-500 font-medium">Operational</span></span>
            <button
              onClick={scrollToTop}
              className="group flex items-center gap-2 hover:text-white transition-colors duration-200"
            >
              <span>Back to top</span>
              <ChevronUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-[#111] via-[#222] to-[#111]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-[#333] to-transparent" />
    </footer>
  );
}