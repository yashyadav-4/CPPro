import { Link, NavLink } from "react-router-dom"
import { Bell, Settings, HelpCircle, Search, ChevronDown, User } from 'lucide-react'
import './Header.css'

export default function Header() {

    return (
        <header className="header">
            {/* Left Section - Logo & Navigation */}
            <div className="header-left">
                <Link to='/' className="header-logo">
                    <span className="logo-text">CP<span className="logo-accent">Pro</span></span>
                </Link>

                <nav className="header-nav">
                    <NavLink
                        to='/'
                        end
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        Home
                    </NavLink>
                    <NavLink
                        to='/dashboard'
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        Dashboard
                    </NavLink>
                    <NavLink
                        to='/leaderboard'
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        Leaderboard
                    </NavLink>

                    <NavLink
                        to='/CodeTemplate'
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        Code Snippet
                    </NavLink>
                    <NavLink
                        to='/community'
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        Community
                    </NavLink>
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