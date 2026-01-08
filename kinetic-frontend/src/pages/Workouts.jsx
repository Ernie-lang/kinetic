import { useState, useEffect } from "react";
import { useUserStore } from "../store/userStore";
import { useNavigate } from "react-router-dom";
import { workoutsAPI } from "../services/api";

const Workouts = () => {
    const { user, isConnected } = useUserStore();
    const navigate = useNavigate();
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isConnected || !user?.id) {
            navigate('/');
            return;
        }

        const fetchWorkouts = async () => {
            try {
                setLoading(true);
                const response = await workoutsAPI.getUserWorkouts(user.id);
                setWorkouts(response.data);
            } catch (err) {
                console.error('Error fetching workouts:', err);
                setError('Failed to load workouts. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchWorkouts();
    }, [user, isConnected, navigate]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const formatDistance = (meters) => {
        const km = (meters / 1000).toFixed(2);
        return `${km} km`;
    };

    // Check if workout type has analytics page
    const hasAnalytics = (workoutType) => {
        const typesWithAnalytics = ['Run', 'Ride', 'Swim'];
        return typesWithAnalytics.includes(workoutType);
    };

    const handleWorkoutClick = (workoutType) => {
        if (!hasAnalytics(workoutType)) return;
        
        // Map workout types to analytics routes
        const typeMap = {
            'Run': 'running',
            'Ride': 'cycling',
            'Swim': 'swimming'
        };
        
        const analyticsRoute = typeMap[workoutType];
        if (analyticsRoute) {
            navigate(`/analytics/${analyticsRoute}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-xl">Loading workouts...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-xl text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Your Workouts</h1>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg transition"
                    >
                        Back to Dashboard
                    </button>
                </div>

                {/* Workouts list */}
                {workouts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <p className="text-xl text-gray-600">
                            No workouts found. Your Strava activities will appear here after syncing.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {workouts.map((workout) => (
                            <div
                                key={workout.id}
                                className={`bg-white rounded-lg shadow p-6 transition ${
                                    hasAnalytics(workout.type) 
                                    ? 'hover:shadow-lg cursor-pointer' 
                                    : 'cursor-default'
                                }`}
                                onClick={() => handleWorkoutClick(workout.type)}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">{workout.name}</h3>
                                        <div className="flex gap-6 text-gray-600 text-sm">
                                            <span>{formatDate(workout.start_date)}</span>
                                            <span>{formatDuration(workout.moving_time)}</span>
                                            {workout.distance && <span>{formatDistance(workout.distance)}</span>}
                                            {workout.average_speed && (
                                                <span>{(workout.average_speed * 3.6).toFixed(1)} km/h</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`px-4 py-2 rounded-full text-white text-sm font-bold ${
                                            workout.type === 'Run' ? 'bg-green-600' : 
                                            workout.type === 'Ride' ? 'bg-blue-600' :
                                            workout.type === 'Swim' ? 'bg-cyan-600' :
                                            'bg-orange-600'
                                        }`}>
                                            {workout.type}
                                        </span>
                                        {hasAnalytics(workout.type) && (
                                            <span className="text-gray-400 text-sm">
                                                View Analytics →
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Workouts;