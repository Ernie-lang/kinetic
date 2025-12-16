import { useState, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { programsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import ProgramGenerator from '../components/ProgramGenerator';

export default function Programs() {
    const { user } = useUserStore();
    const navigate = useNavigate();
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGenerator, setShowGenerator] = useState(false);

    useEffect(() => {
        if (user?.id) {
            loadPrograms();
        }
    }, [user]);

    const loadPrograms = async () => {
        try {
            setLoading(true);
            const response = await programsAPI.getAll(user.id);
            setPrograms(response.data);
        } catch (error) {
            console.error('Error loading programs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProgram = async (programId) => {
        if (!confirm('Are you sure you want to delete this program?')) return;

        try {
            await programsAPI.delete(programId);
            loadPrograms();
        } catch (error) {
            console.error('Error deleting program:', error);
            alert('Failed to delete program');
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">Please connect your Strava account first.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Training Programs</h1>
                        <p className="text-gray-600 mt-1">AI-powered personalized training plans</p>
                    </div>
                    <button
                        onClick={() => setShowGenerator(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Generate New Program
                    </button>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-gray-600 mt-4">Loading programs...</p>
                    </div>
                ) : programs.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Training Programs Yet</h3>
                        <p className="text-gray-600 mb-6">Create your first AI-powered training program to get started!</p>
                        <button
                            onClick={() => setShowGenerator(true)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Generate Program
                        </button>
                    </div>
                ) : (
                    /* Programs Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {programs.map((program) => (
                            <div key={program.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-gray-800">{program.title}</h3>
                                        {program.is_active && (
                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{program.description}</p>
                                    
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                            </svg>
                                            <span className="font-medium">{program.goal}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>{program.duration_weeks} weeks</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Created {new Date(program.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/programs/${program.id}`)}
                                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            View Program
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProgram(program.id)}
                                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Generator Modal */}
                {showGenerator && (
                    <ProgramGenerator
                        userId={user.id}
                        onClose={() => setShowGenerator(false)}
                        onSuccess={() => {
                            loadPrograms();
                            setShowGenerator(false);
                        }}
                    />
                )}
            </div>
        </div>
    );
}