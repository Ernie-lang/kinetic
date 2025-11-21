import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { stravaAPI } from '../services/api';
import { useUserStore } from '../store/userStore';

const StravaCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUser } = useUserStore();
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const errorParam = searchParams.get('error');

            if (errorParam == 'access_denied') {
                setStatus('error');
                setError('Access denied. you need to authorize Strava to continue.');
                setTimeout(() => navigate('/'), 3000);
                return;
            }

            if (!code) {
                setStatus('error');
                setError('No authorization code received.');
                setTimeout(() => navigate('/'), 3000);
                return;
            }

            try {
                setStatus('processing');

                // Exchange code for tokens and create/update user
                const response = await stravaAPI.handleCallback(code);
                const userData = response.data;

                // Store user data
                setUser(userData);

                // Sync workouts
                setStatus('syncing');
                await stravaAPI.syncWorkouts(userData.id);

                // Success!
                setStatus('success');
                setTimeout(() => navigate('/dashboard'), 2000);
            } catch (err) {
                console.error('Callback error: ', err);
                setStatus('error');
                setError(err.response?.data?.detail || 'Failed to connect to Strava.');
                setTimeout(() => navigate('/'), 3000);
            }
        };

        handleCallback();
    }, [searchParams, navigate, setUser]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          {status === 'processing' && (
            <>
              <div className="w-12 h-12 border-4 border-gray-300 border-t-orange-600 rounded-full animate-spin mb-4" />
              <h2 className="text-2xl font-bold mb-2">Connecting to Strava...</h2>
              <p className="text-gray-600">Please wait while we set up your account.</p>
            </>
          )}
    
          {status === 'syncing' && (
            <>
              <div className="w-12 h-12 border-4 border-gray-300 border-t-orange-600 rounded-full animate-spin mb-4" />
              <h2 className="text-2xl font-bold mb-2">Syncing your workouts...</h2>
              <p className="text-gray-600">Fetching your activities from Strava.</p>
            </>
          )}
    
          {status === 'success' && (
            <>
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Successfully Connected!</h2>
              <p className="text-gray-600">Redirecting to dashboard...</p>
            </>
          )}
    
          {status === 'error' && (
            <>
              <div className="text-6xl text-red-600 mb-4">✗</div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Connection Failed</h2>
              <p className="text-gray-600 mb-2">{error}</p>
              <p className="text-gray-400 text-sm">Redirecting back...</p>
            </>
          )}
        </div>
    );
};

export default StravaCallback;