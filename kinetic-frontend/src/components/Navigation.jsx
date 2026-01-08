import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useUserStore } from '../store/userStore';
import { authAPI } from '../services/api';

export default function Navigation() {
    const location = useLocation();
    const navigate = useNavigate();
    const [analyticsOpen, setAnalyticsOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dropdownRef = useRef(null);
    
    const { user, logout } = useUserStore();

    const isActive = (path) => location.pathname === path;
    const isAnalyticsActive = location.pathname.startsWith('/analytics');

    const linkClass = (path) =>
        `px-4 py-2 rounded-lg transition-colors ${
            isActive(path)
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`;

    const mobileLinkClass = (path) =>
        `block px-4 py-3 rounded-lg transition-colors ${
            isActive(path)
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`;

    useEffect(() => {
        const handleClickOutside = (event) => {
            const isDesktop = window.innerWidth >= 768;
            
            if (isDesktop && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setAnalyticsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        
        try {
            // Call backend to revoke Strava token
            if (user?.id) {
                await authAPI.logout(user.id);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            logout();
            setMobileMenuOpen(false);
            navigate('/');
            setIsLoggingOut(false);
        }
    };

    const handleMobileLinkClick = () => {
        setMobileMenuOpen(false);
    };

    return (
        <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/dashboard" className="flex items-center">
                        <h1 className="text-2xl font-bold text-blue-600">Kinetic</h1>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex space-x-4 items-center">
                        <Link to="/dashboard" className={linkClass('/dashboard')}>Dashboard</Link>
                        <Link to="/workouts" className={linkClass('/workouts')}>Workouts</Link>
                        
                        {/* Analytics Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setAnalyticsOpen(!analyticsOpen)}
                                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                                    isAnalyticsActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                Analytics
                                <svg
                                    className={`w-4 h-4 transition-transform ${analyticsOpen ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Desktop Analytics Dropdown */}
                            {analyticsOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    <Link
                                        to="/analytics/running"
                                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                        onClick={() => setAnalyticsOpen(false)}
                                    >
                                        🏃 Running
                                    </Link>
                                    <Link
                                        to="/analytics/cycling"
                                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                        onClick={() => setAnalyticsOpen(false)}
                                    >
                                        🚴 Cycling
                                    </Link>
                                    <Link
                                        to="/analytics/swimming"
                                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                        onClick={() => setAnalyticsOpen(false)}
                                    >
                                        🏊 Swimming
                                    </Link>
                                </div>
                            )}
                        </div>

                        <Link to="/chat" className={linkClass('/chat')}>Chat</Link>
                        <Link to="/programs" className={linkClass('/programs')}>Programs</Link>
                        
                        {/* Desktop Logout Button */}
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="px-4 py-2 rounded-lg transition-colors text-gray-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoggingOut ? 'Logging out...' : 'Logout'}
                        </button>
                    </div>

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden mt-4 space-y-2">
                        <Link 
                            to="/dashboard" 
                            className={mobileLinkClass('/dashboard')}
                            onClick={handleMobileLinkClick}
                        >
                            Dashboard
                        </Link>
                        <Link 
                            to="/workouts" 
                            className={mobileLinkClass('/workouts')}
                            onClick={handleMobileLinkClick}
                        >
                            Workouts
                        </Link>
                        
                        {/* Mobile Analytics Section */}
                        <div>
                            <button
                                onClick={() => setAnalyticsOpen(!analyticsOpen)}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                                    isAnalyticsActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                Analytics
                                <svg
                                    className={`w-4 h-4 transition-transform ${analyticsOpen ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {/* Mobile Analytics Submenu */}
                            {analyticsOpen && (
                                <div className="ml-4 mt-2 space-y-2">
                                    <Link
                                        to="/analytics/running"
                                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                                        onClick={(e) => {
                                            console.log('Running link clicked');
                                            console.log('Event:', e);
                                            console.log('Current path:', location.pathname);
                                        }}
                                    >
                                        🏃 Running
                                    </Link>
                                    <Link
                                        to="/analytics/cycling"
                                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                                        onClick={(e) => {
                                            console.log('Cycling link clicked');
                                            console.log('Event:', e);
                                            console.log('Current path:', location.pathname);
                                        }}
                                    >
                                        🚴 Cycling
                                    </Link>
                                    <Link
                                        to="/analytics/swimming"
                                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                                        onClick={(e) => {
                                            console.log('Swimming link clicked');
                                            console.log('Event:', e);
                                            console.log('Current path:', location.pathname);
                                        }}
                                    >
                                        🏊 Swimming
                                    </Link>
                                </div>
                            )}
                        </div>

                        <Link 
                            to="/chat" 
                            className={mobileLinkClass('/chat')}
                            onClick={handleMobileLinkClick}
                        >
                            Chat
                        </Link>
                        <Link 
                            to="/programs" 
                            className={mobileLinkClass('/programs')}
                            onClick={handleMobileLinkClick}
                        >
                            Programs
                        </Link>
                        
                        {/* Mobile Logout Button */}
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoggingOut ? 'Logging out...' : 'Logout'}
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}