import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from "react-router-dom"
import { Sun, Moon, LogOut, Menu, X, Shield, Settings } from 'lucide-react'

export default function Header() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark';
    });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState({ name: 'User', email: '', initial: 'U' });
    const navigate = useNavigate();

    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(prev => !prev);

    useEffect(() => {
        fetch('/api/auth/verify', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data.authenticated && data.user) {
                    setIsAuthenticated(true);
                    setUser({
                        name: data.user.name || data.user.username || 'User',
                        email: data.user.email || 'No email',
                        initial: (data.user.name || data.user.username || 'U').charAt(0).toUpperCase()
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
    
    const navItems = ['Home', 'Dashboard', 'Leaderboard', 'Learning', 'Level-up', 'Code Snippet', 'Community'];

    return (
        <header className="sticky top-0 z-50 w-full bg-white dark:bg-[#242424] border-b border-black/[0.07] dark:border-white/[0.08] shadow-sm transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left Section - Logo */}
                    <Link to='/' className="flex flex-shrink-0 items-center gap-2">
                        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                            &lt;/&gt; CPPro
                        </span>
                    </Link>

                    {/* Center Section - Navigation (Desktop) */}
                    <nav className="hidden md:flex space-x-8">
                        {navItems.map((item) => {
                            const path = item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '')}`;
                            return (
                                <NavLink
                                    key={item}
                                    to={path}
                                    end={item === 'Home'}
                                    className={({ isActive }) => 
                                        `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                                            isActive 
                                            ? 'border-indigo-600 text-gray-900 dark:text-white' 
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
                    <div className="hidden md:flex items-center gap-4">
                        <button 
                            className="p-2 text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors" 
                            onClick={toggleTheme}
                            title="Toggle Theme"
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {isAuthenticated ? (
                            <div className="relative">
                                <button 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                                    className="flex items-center gap-2 focus:outline-none"
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-400/25">
                                        {user.initial}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-100">{user.name}</span>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#242424] rounded-md shadow-lg py-1 border border-black/[0.07] dark:border-white/[0.08] ring-1 ring-black/5 dark:ring-white/10 z-50">
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
                                <Link to="/login" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Log in</Link>
                                <Link to="/signup" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Sign up</Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex md:hidden items-center gap-4">
                        <button 
                            className="p-2 text-gray-500 dark:text-gray-300 rounded-full" 
                            onClick={toggleTheme}
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
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
                <div className="md:hidden bg-white dark:bg-[#242424] border-t border-black/[0.07] dark:border-white/[0.08]">
                    <div className="pt-2 pb-3 space-y-1">
                        {navItems.map((item) => {
                            const path = item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '')}`;
                            return (
                                <NavLink
                                    key={item}
                                    to={path}
                                    end={item === 'Home'}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) => 
                                        `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                                            isActive 
                                            ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10' 
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
                                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full flex justify-center items-center py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-300 dark:border-white/20 rounded-lg transition-colors">Log in</Link>
                                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="w-full flex justify-center items-center py-2 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">Sign up</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}