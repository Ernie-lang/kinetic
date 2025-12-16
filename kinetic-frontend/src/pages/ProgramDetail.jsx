import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { programsAPI } from '../services/api';
import { useUserStore } from '../store/userStore';

export default function ProgramDetail() {
    const { user } = useUserStore();
    const { programId } = useParams();
    const navigate = useNavigate();
    const [program, setProgram] = useState(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [showRegenerateModal, setShowRegenerateModal] = useState(false);
    const [selectedWeekId, setSelectedWeekId] = useState(null);
    const [adjustmentRequest, setAdjustmentRequest] = useState('');

    useEffect(() => {
        loadProgram();
    }, [programId]);

    const loadProgram = async () => {
        try {
            setLoading(true);
            const response = await programsAPI.getDetail(programId);
            setProgram(response.data);
        } catch (error) {
            console.error('Error loading program:', error);
            alert('Failed to load program');
            navigate('/programs');
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerateWeek = async () => {
        if (!adjustmentRequest.trim()) {
            alert('Please describe what you want to change');
            return;
        }

        setRegenerating(true);

        try {
            await programsAPI.regenerateWeek(selectedWeekId, user.id, adjustmentRequest);
            await loadProgram();
            setShowRegenerateModal(false);
            setAdjustmentRequest('');
            setSelectedWeekId(null);
        } catch (error) {
            console.error('Error regenerating week:', error);
            alert('Failed to regenerated week. Please try again.');
        } finally {
            setRegenerating(false);
        }
    };

    const handleMarkComplete = async (workoutId) => {
        try {
            await programsAPI.markComplete(workoutId);
            loadProgram();
        } catch (error) {
            console.error('Error marking workout complete:', error);
            alert('Failed to mark workout complete');
        }
    };

    const getWorkoutTypeIcon = (type) => {
        const icons = {
            'Run': '🏃',
            'Cycle': '🚴',
            'Swim': '🏊',
            'Strength': '💪',
            'Rest': '😴'
        };
        return icons[type] || '📋';
    };

    const getIntensityColor = (intensity) => {
        const colors = {
            'Easy': 'bg-green-100 text-green-800',
            'Moderate': 'bg-yellow-100 text-yellow-800',
            'Hard': 'bg-red-100 text-red-800'
        };
        return colors[intensity] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading program...</p>
                </div>
            </div>
        );
    }

    if (!program) {
        return null;
    }

    const totalWorkouts = program.weeks.reduce((sum, week) => sum + week.workouts.length, 0);
    const completedWorkouts = program.weeks.reduce(
        (sum, week) => sum + week.workouts.filter(w => w.completed).length, 0
    );
    const progressPercent = Math.round((completedWorkouts / totalWorkouts) * 100);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/programs')}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Programs
                </button>

                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">{program.title}</h1>
                            <p className="text-gray-600">{program.description}</p>
                        </div>
                        {program.is_active && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                Active
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Goal</p>
                                <p className="font-semibold text-gray-800">{program.goal}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Duration</p>
                                <p className="font-semibold text-gray-800">{program.duration_weeks} weeks</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Progress</p>
                                <p className="font-semibold text-gray-800">{completedWorkouts} / {totalWorkouts} workouts</p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                            <span className="text-sm font-medium text-gray-700">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Weeks */}
                <div className="space-y-6">
                    {program.weeks
                        .sort((a, b) => a.week_number - b.week_number)
                        .map((week) => {
                        const weekCompleted = week.workouts.filter(w => w.completed).length;
                        const weekTotal = week.workouts.length;
                        const weekProgress = Math.round((weekCompleted / weekTotal) * 100);

                        return (
                            <div key={week.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                                {/* Week Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold">Week {week.week_number}</h2>
                                            <p className="text-blue-100 text-sm mt-1">{week.weekly_goal}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedWeekId(week.id);
                                                    setShowRegenerateModal(true);
                                                }}
                                                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                Adjust Week
                                            </button>
                                            <div className="text-right">
                                                <p className="text-sm text-blue-100">Progress</p>
                                                <p className="text-2xl font-bold">{weekProgress}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Workouts */}
                                <div className="p-4 space-y-3">
                                    {week.workouts
                                        .sort((a, b) => a.day_number - b.day_number)
                                        .map((workout) => (
                                        <div
                                            key={workout.id}
                                            className={`border rounded-lg p-4 transition-all ${
                                                workout.completed
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-white border-gray-200 hover:border-blue-300'
                                            }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Checkbox */}
                                                <button
                                                    onClick={() => handleMarkComplete(workout.id)}
                                                    className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                                        workout.completed
                                                            ? 'bg-green-600 border-green-600'
                                                            : 'border-gray-300 hover:border-blue-500'
                                                    }`}
                                                >
                                                    {workout.completed && (
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </button>

                                                {/* Workout Details */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-2xl">{getWorkoutTypeIcon(workout.workout_type)}</span>
                                                        <div>
                                                            <h3 className="font-semibold text-gray-800">
                                                                Day {workout.day_number}: {workout.workout_type}
                                                            </h3>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                {workout.duration_minutes && (
                                                                    <span className="text-sm text-gray-600">
                                                                        {workout.duration_minutes} min
                                                                    </span>
                                                                )}
                                                                <span className={`text-xs px-2 py-1 rounded-full ${getIntensityColor(workout.intensity)}`}>
                                                                    {workout.intensity}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{workout.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Regenerate Week Modal */}
                {showRegenerateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">Adjust Week</h2>
                                    <button
                                        onClick={() => {
                                            setShowRegenerateModal(false);
                                            setAdjustmentRequest('');
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                        disabled={regenerating}
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <p className="text-gray-600 text-sm mb-4">
                                    Tell the AI how you'd like to adjust this week's training plan.
                                </p>

                                <textarea
                                    value={adjustmentRequest}
                                    onChange={(e) => setAdjustmentRequest(e.target.value)}
                                    placeholder="E.g., Make it easier, Add more swimming, Reduce to 3 days, Increase intensity..."
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    rows="4"
                                    disabled={regenerating}
                                />

                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => {
                                            setShowRegenerateModal(false);
                                            setAdjustmentRequest('');
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        disabled={regenerating}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleRegenerateWeek}
                                        disabled={regenerating || !adjustmentRequest.trim()}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {regenerating ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Adjusting...
                                            </span>
                                        ) : (
                                            'Adjust Week'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}