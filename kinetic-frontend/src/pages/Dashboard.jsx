import { useUserStore } from "../store/userStore";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { analyticsAPI, stravaAPI } from "../services/api";

const Dashboard = () => {
    const { user, isConnected } = useUserStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    // Load dashboard stats when component mounts
    useEffect(() => {
        if (user?.id) {
            loadStats()
        }
    }, [user]);

    const loadStats = async () => {
        try {
            setLoading(true);
            const response = await analyticsAPI.getDashboardStats(user.id);
            setStats(response.data);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            await stravaAPI.syncWorkouts(user.id);
            // Reload stats after sync
            await loadStats();
            alert('Workouts synced successfully!');
        } catch (error) {
            console.error('Error syncing workouts:', error);
            alert('Failed to sync workouts. Please try again.');
        } finally {
            setSyncing(false);
        }
    };

    if(!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Please connect your Strava account</h2>
                <button
                    onClick={() => navigate('/')}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                    Go to Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header with profile */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                        {user?.profile_photo && (
                            <img
                                src={user.profile_photo}
                                alt="Profile"
                                className="w-16 h-16 rounded-full mr-4"
                            />
                        )}
                        <div>
                            <h1 className="text-3xl font-bold">
                                Welcome back, {user?.first_name}!
                            </h1>
                            <p className="text-gray-600">
                                Strava Athlete ID: {user?.strava_athlete_id}
                            </p>
                        </div>
                    </div>
                    
                    {/* Sync Button */}
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {syncing ? 'Syncing...' : 'Sync Workouts'}
                    </button>
                </div>

                {/* Main content */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
                    <p className="text-gray-600 mb-4">
                        Your training insights and analytics.
                    </p>
                    <button
                        onClick={() => navigate('/workouts')}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition"
                    >
                        View All Workouts
                    </button>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm text-gray-600 mb-2">Total Activities</h3>
                        <p className="text-3xl font-bold">
                            {loading ? '...' : stats?.total_activities || 0}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm text-gray-600 mb-2">This Week</h3>
                        <p className="text-3xl font-bold">
                            {loading ? '...' : stats?.this_week || 0}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm text-gray-600 mb-2">Training Load (hours)</h3>
                        <p className="text-3xl font-bold">
                            {loading ? '...' : stats?.training_load?.toFixed(1) || 0}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;