import { Link, useLocation } from "react-router-dom"
import { Bell, Settings, HelpCircle, Search, ChevronDown, User } from 'lucide-react'
import './Header.css'

export default function Header() {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <header className="header">
            {/* Left Section - Logo & Navigation */}
            <div className="header-left">
                <Link to='/' className="header-logo">
                    <span className="logo-text">CP<span className="logo-accent">Pro</span></span>
                </Link>

                <nav className="header-nav">
                    <Link
                        to='/'
                        className={`nav-item ${isActive('/') ? 'active' : ''}`}
                    >
                        Home
                    </Link>
                    <Link
                        to='/dashboard'
                        className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                    >
                        Dashboard
                    </Link>
                    <Link
                        to='/leaderboard'
                        className={`nav-item ${isActive('/leaderboard') ? 'active' : ''}`}
                    >
                        Leaderboard
                    </Link>

                    <Link
                        to='/CodeTemplate'
                        className={`nav-item ${isActive('/CodeTemplate') ? 'active' : ''}`}
                    >
                        Code Snippet
                    </Link>
                    <Link
                        to='/community'
                        className={`nav-item ${isActive('/community') ? 'active' : ''}`}
                    >
                        Community
                    </Link>
                </nav>
            </div>

            {/* Center Section - Search */}
            {/* <div className="header-center">
                <div className="search-box">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search problems, contests..."
                        className="search-input"
                    />
                    <span className="search-shortcut">⌘K</span>
                </div>
            </div> */}

            {/* Right Section - Actions & Profile */}

            <div className="header-right">
                <button className="profile-btn">
                    <div className="avatar">
                        <User size={18} />
                    </div>
                    <ChevronDown size={14} className="chevron" />
                </button>
            </div>
        </header>
    )
}