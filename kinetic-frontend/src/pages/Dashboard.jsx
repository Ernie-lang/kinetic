import { useUserStore } from "../store/userStore";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const { user, isConnected } = useUserStore();
    const navigate = useNavigate();

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
                <div className="flex items-center mb-8">
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
                {/* Main content */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
                    <p className="text-gray-600 mb-4">
                        Your training insights and analytics will appear here.
                    </p>
                    <button
                        onClick={() => navigate('/workouts')}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition"
                    >
                        View Workouts
                    </button>
                </div>
                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm text-gray-600 mb-2">Total Activities</h3>
                        <p className="text-3xl font-bold">-</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm text-gray-600 mb-2">This Week</h3>
                        <p className="text-3xl font-bold">-</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm text-gray-600 mb-2">Training Load</h3>
                        <p className="text-3xl font-bold">-</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;