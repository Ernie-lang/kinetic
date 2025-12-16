import { useState } from 'react';
import { programsAPI } from '../services/api';

export default function ProgramGenerator({ userId, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        goal: '',
        fitness_level: 'intermediate',
        days_per_week: 4,
        duration_weeks: 8
    });
    const [generating, setGenerating] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.goal.trim()) {
            alert('Please enter your training goal');
            return;
        }

        setGenerating(true);

        try {
            const response = await programsAPI.generate(userId, formData);
            onSuccess(response.data);
            onClose();
        } catch (error) {
            console.error('Error generating program:', error);
            alert('Failed to generate program. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-800">Generate Training Program</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                            disabled={generating}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-gray-600 mt-2 text-sm">
                        AI will create a personalized training program based on your goals and fitness level
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Goal */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Training Goal *
                        </label>
                        <input
                            type="text"
                            value={formData.goal}
                            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                            placeholder="e.g., Run a 5K, Build endurance, Get stronger"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={generating}
                            required
                        />
                    </div>

                    {/* Fitness Level */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Fitness Level
                        </label>
                        <select
                            value={formData.fitness_level}
                            onChange={(e) => setFormData({ ...formData, fitness_level: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={generating}
                        >
                            <option value="beginner">Beginner - Just starting out</option>
                            <option value="intermediate">Intermediate - Regular exercise</option>
                            <option value="advanced">Advanced - Experienced athlete</option>
                        </select>
                    </div>

                    {/* Days per Week */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Training Days per Week: {formData.days_per_week}
                        </label>
                        <input
                            type="range"
                            min="3"
                            max="7"
                            value={formData.days_per_week}
                            onChange={(e) => setFormData({ ...formData, days_per_week: parseInt(e.target.value) })}
                            className="w-full"
                            disabled={generating}
                        />
                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                            <span>3 days</span>
                            <span>7 days</span>
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Program Duration: {formData.duration_weeks} weeks
                        </label>
                        <input
                            type="range"
                            min="4"
                            max="12"
                            value={formData.duration_weeks}
                            onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) })}
                            className="w-full"
                            disabled={generating}
                        />
                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                            <span>4 weeks</span>
                            <span>12 weeks</span>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={generating}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={generating}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {generating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Generating...
                                </span>
                            ) : (
                                'Generate Program'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}