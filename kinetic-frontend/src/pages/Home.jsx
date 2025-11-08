import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import StravaConnect from '../components/StravaConnect';


const Home = () => {
    const { isConnected } = useUserStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (isConnected) {
            navigate('/dashboard');
        }
    }, [isConnected, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gradient-to-br from-purple-600 to-purple-900 text-white">
            <div className="bg-white/95 p-12 rounded-2xl max-w-lg text-gray-800">
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-purple-900 bg-clip-text text-transparent">Kinetic</h1>
                <p className="text-xl text-gray-600 mb-4">Your AI-Powered Fitness Coach</p>
                <p className='text-gray-500 mb-8 leading-relaxed'>Connect your Strava account to get personalized training insights,
                    AI-powered coaching, and detailed analytics.
                </p>
                <StravaConnect />
            </div>
        </div>
    );
};

export default Home;