import { Link, useLocation } from 'react-router-dom';

export default function Navigation() {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const linkClass = (path) =>
        `px-4 py-2 rounded-lg transition-colors ${
            isActive(path)
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`;
    
    return (
        <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7lx mx-auto px-4">
                {/* Logo */}
                <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-blue-600">Kinetic</h1>
                </div>

                {/* Navigation links */}
                <div className="flex space-x-4">
                    <Link to="/dashboard" className={linkClass('/dashboard')}>Dashboard</Link>
                    <Link to="/workouts" className={linkClass('/workouts')}>Workouts</Link>
                    <Link to="/chat" className={linkClass('/chat')}>Chat</Link>
                </div>
            </div>
        </nav>
    );
}