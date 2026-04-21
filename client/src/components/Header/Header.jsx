import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from "react-router-dom"
import { LogOut, Menu, X, Shield, Settings, Sun, Moon, HelpCircle } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import NotificationBell from '../Notifications/NotificationBell'

import './Header.css'

export default function Header() {
    const { isDark, toggleTheme } = useTheme();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState({ name: 'User', email: '', initial: 'U' });
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/auth/verify', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data.authenticated && data.user) {
                    setIsAuthenticated(true);
                    setUser({
                        name: data.user.name || data.user.username || 'User',
                        email: data.user.email || 'No email',
                        initial: (data.user.name || data.user.username || 'U').charAt(0).toUpperCase(),
                        profilePic: data.user.profilePic || null
                    });
                } else {
                    setIsAuthenticated(false);
                }
            })
            .catch(err => {
                console.error(err);
                setIsAuthenticated(false);
            });
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            // Fallback clear in case the server cookie clear isn't catching it properly
            document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = '/login';
        } catch (err) {
            console.error("Logout failed", err);
            // Even if fetch fails, redirect
            document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = '/login';
        }
    };

    const [activeDropdown, setActiveDropdown] = useState(null);

    const navItems = ['Home', 'Dashboard', 'Leaderboard', 'Contest Tracker', 'Learning', 'Level-up', 'Code Snippet', 'Community'];

    // Custom path overrides for items whose path can't be derived trivially
    const NAV_PATH = {
        'Home': '/',
        'Contest Tracker': '/contest-tracker',
        'Code Snippet': '/codesnippet',
        'Level-up': '/level-up',
    };

    const dropdownThemes = {
        'Learning': [
            { label: 'Competitive Programming', path: '/learning/cp', desc: 'Masters algorithms for contests' },
            { label: 'Data Structures', path: '/learning/dsa', desc: 'Core fundamentals for interviews' }
        ]
    };

    return (
        <header className="sticky top-4 z-50 w-[95%] max-w-[1300px] mx-auto bg-white/70 dark:bg-black/60 backdrop-blur-xl border border-white/[0.08] dark:border-white/[0.05] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] shadow-emerald-500/5 transition-all duration-300">
            <div className="mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16 w-full">
                    {/* Left Section - Logo */}
                    <div className="flex-shrink-0 flex items-center pr-4">
                        <Link to='/' className="flex flex-shrink-0 items-center gap-2">
                            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                                &lt;/&gt; CPPro
                            </span>
                        </Link>
                    </div>

                    {/* Center Section - Navigation (Desktop) */}
                    <nav className="hidden lg:flex flex-1 justify-center gap-3 xl:gap-5 px-2">
                        {navItems.map((item) => {
                            if (dropdownThemes[item]) {
                                return (
                                    <div 
                                        key={item} 
                                        className="relative group py-1"
                                        onMouseEnter={() => setActiveDropdown(item)}
                                        onMouseLeave={() => setActiveDropdown(null)}
                                    >
                                        <button
                                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap gap-1 ${activeDropdown === item || window.location.pathname.startsWith('/learning')
                                                ? 'border-emerald-600 text-gray-900 dark:text-white'
                                                : 'border-transparent text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/25'
                                            }`}
                                        >
                                            {item}
                                            <svg className={`w-3 h-3 transition-transform duration-200 ${activeDropdown === item ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                        
                                        <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 w-64 p-2 bg-white dark:bg-[#0d0d0d] rounded-xl border border-gray-100 dark:border-white/10 shadow-xl transition-all duration-200 origin-top
                                            ${activeDropdown === item ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible'}`}>
                                            <div className="flex flex-col gap-1">
                                                {dropdownThemes[item].map((sub) => (
                                                    <NavLink
                                                        key={sub.path}
                                                        to={sub.path}
                                                        className={({ isActive }) => `flex flex-col p-2.5 rounded-lg transition-all ${isActive 
                                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                                            : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
                                                        onClick={() => setActiveDropdown(null)}
                                                    >
                                                        <span className="text-xs font-semibold">{sub.label}</span>
                                                        <span className="text-[10px] opacity-60 leading-tight mt-0.5">{sub.desc}</span>
                                                    </NavLink>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            const path = NAV_PATH[item] ?? `/${item.toLowerCase().replace(/\s+/g, '')}`;
                            return (
                                <NavLink
                                    key={item}
                                    to={path}
                                    end={item === 'Home'}
                                    className={({ isActive }) =>
                                        `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${isActive
                                            ? 'border-emerald-600 text-gray-900 dark:text-white'
                                            : 'border-transparent text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/25'
                                        }`
                                    }
                                >
                                    {item}
                                </NavLink>
                            );
                        })}
                    </nav>

                    {/* Right Section - Actions & Profile */}
                    <div className="hidden md:flex flex-shrink-0 items-center justify-end gap-3 xl:gap-4">
                        {isAuthenticated && <NotificationBell />}
                        <button
                            onClick={toggleTheme}
                            title={isDark ? 'Light mode' : 'Dark mode'}
                            className="theme-toggle-btn flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-transparent text-gray-600 dark:text-gray-300 text-sm font-medium whitespace-nowrap flex-shrink-0 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            {isDark ? <Sun size={16} className="flex-shrink-0" /> : <Moon size={16} className="flex-shrink-0" />}
                            <span>{isDark ? 'Light' : 'Dark'}</span>
                        </button>

                        {isAuthenticated ? (
                            <div className="relative flex-shrink-0">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                                    className="flex items-center gap-2 focus:outline-none"
                                >
                                    {user.profilePic ? (
                                        <img src={user.profilePic} alt="Profile" className="w-8 h-8 flex-shrink-0 rounded-full object-cover border border-emerald-200 dark:border-emerald-400/25" />
                                    ) : (
                                        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-400/25">
                                            {user.initial}
                                        </div>
                                    )}
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-100 whitespace-nowrap">{user.name}</span>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#111111] rounded-md shadow-lg py-1 border border-black/[0.07] dark:border-white/[0.08] ring-1 ring-black/5 dark:ring-white/10 z-50">
                                        <div className="px-4 py-2 border-b border-gray-100 dark:border-white/[0.08]">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Signed in as</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-300 truncate" title={user.email}>{user.email}</p>
                                        </div>
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2"
                                            onMouseDown={(e) => { e.preventDefault(); navigate('/settings'); setIsDropdownOpen(false); }}
                                        >
                                            <Settings size={16} />
                                            Settings
                                        </button>
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2"
                                            onMouseDown={(e) => { e.preventDefault(); navigate('/verify-codeforces'); setIsDropdownOpen(false); }}
                                        >
                                            <Shield size={16} />
                                            Verification
                                        </button>

                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2"
                                            onMouseDown={(e) => { e.preventDefault(); handleLogout(); }}
                                        >
                                            <LogOut size={16} />
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Log in</Link>
                                <Link to="/signup" className="text-sm font-medium bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/15 dark:shadow-emerald-500/20">Sign up</Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex md:hidden flex-1 justify-end items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-medium hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            {isDark ? <Sun size={14} /> : <Moon size={14} />}
                        </button>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white/90 dark:bg-black/80 backdrop-blur-2xl border-t border-white/[0.08] dark:border-white/[0.05] rounded-b-2xl overflow-hidden shadow-2xl transition-all duration-300">
                    <div className="pt-2 pb-3 space-y-1">
                        {navItems.map((item) => {
                            if (dropdownThemes[item]) {
                                return (
                                    <div key={item} className="space-y-1">
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">{item}</div>
                                        {dropdownThemes[item].map((sub) => (
                                            <NavLink
                                                key={sub.path}
                                                to={sub.path}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={({ isActive }) =>
                                                    `block pl-6 pr-4 py-2 border-l-4 text-base font-medium ${isActive
                                                        ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10'
                                                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20'
                                                    }`
                                                }
                                            >
                                                {sub.label}
                                            </NavLink>
                                        ))}
                                    </div>
                                );
                            }

                            const path = NAV_PATH[item] ?? `/${item.toLowerCase().replace(/\s+/g, '')}`;
                            return (
                                <NavLink
                                    key={item}
                                    to={path}
                                    end={item === 'Home'}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive
                                            ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10'
                                            : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20'
                                        }`
                                    }
                                >
                                    {item}
                                </NavLink>
                            );
                        })}
                        {isAuthenticated ? (
                            <div className="border-t border-gray-200 dark:border-white/[0.08] pt-4 pb-1">
                                <div className="px-4 py-2 mb-2">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-300 truncate">{user.email}</p>
                                </div>
                                <Link
                                    to="/settings"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/10"
                                >
                                    <Settings size={20} />
                                    Settings
                                </Link>
                                <Link
                                    to="/verify-codeforces"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/10"
                                >
                                    <Shield size={20} />
                                    Verification
                                </Link>

                                <button
                                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/10"
                                    onClick={(e) => { e.preventDefault(); handleLogout(); }}
                                >
                                    <LogOut size={20} />
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <div className="border-t border-gray-200 dark:border-white/[0.08] pt-4 pb-1 space-y-2 px-4">
                                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full flex justify-center items-center py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-300 dark:border-white/20 rounded-lg transition-colors">Log in</Link>
                                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="w-full flex justify-center items-center py-2 text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-lg shadow-emerald-500/15 dark:shadow-emerald-500/20">Sign up</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}