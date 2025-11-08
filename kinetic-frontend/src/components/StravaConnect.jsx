import { useState } from 'react';
import { stravaAPI } from '../services/api';
import { useUserStore } from '../store/userStore';

const StravaConnect = () => {
    const { user, isConnected, clearUser } = useUserStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleConnect = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await stravaAPI.getAuthUrl();
            const authUrl = response.data.auth_url;

            // Redirect to Strava OAuth page
            window.location.href = authUrl;
        } catch (err) {
            setError('Failed to connect with Strava. Please try again.');
            console.error('Strava connection error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            await stravaAPI.disconnect(user.id);
            clearUser();

            alert('Successfully disconnected from Strava.');
        } catch (err) {
            setError('Failed to disconnect from Strava. Please try again.');
            console.error('Strava disconnect error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isConnected) {
        return (
            <div>
                {error && (
                <div className="text-red-600 mb-4 text-sm">{error}</div>
            )}
            <button
                onClick={handleConnect}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition">
                    {loading ? 'Connecting...' : 'Connect with Strava'}
                </button>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <p className="font-bold text-green-600 mb-1">Connected to Strava</p>
            {user && (
                <p className="text-sm text-gray-600">
                    {user.first_name} {user.last_name}
                </p>
            )}
            <button
                onClick={handleDisconnect}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded disabled:opacity-50 transition text-sm"
            >
                {loading ? 'Disconnecting...' : 'Disconnect'}
            </button>
        </div>
    );
};

export default StravaConnect;