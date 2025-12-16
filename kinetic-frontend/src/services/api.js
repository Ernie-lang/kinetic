import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Strava API endpoints
export const stravaAPI = {
    getAuthUrl: () => api.get('/strava/auth/url'),
    handleCallback: (code) => api.post(`/strava/auth/callback?code=${code}`),
    syncWorkouts: (userId) => api.post(`/strava/sync/${userId}`),
    getStatus: (userId) => api.get(`/strava/status/${userId}`),
    disconnect: (userId) => api.delete(`/strava/disconnect/${userId}`),
};

// Workouts API
export const workoutsAPI = {
    getUserWorkouts: (userId) => api.get(`/workouts/${userId}`),
};

// Chat API endpoints
export const chatAPI = {
    sendMessage: (userId, message) => api.post(`/chat/message`, { user_id: userId, message }),
    getHistory: async (userId) => {
        const response = await api.get(`/chat/history/${userId}`);
        return { data: response.data.messages };
    },
    getUsage: (userId) => api.get(`/chat/usage/${userId}`),
};

// Analytics API endpoints
export const analyticsAPI = {
    getDashboardStats: (userId) => api.get(`/analytics/dashboard/${userId}`),
    getWeeklySummary: (userId) => api.get(`/analytics/weekly/${userId}`),
};

// Programs API endpoints
export const programsAPI = {
    generate: (userId, programData) => api.post('/programs/generate', {
        user_id: userId,
        ...programData
    }),
    getAll: (userId) => api.get(`/programs/${userId}`),
    getDetail: (programId) => api.get(`/programs/detail/${programId}`),
    markComplete: (workoutId) => api.put(`/programs/workout/${workoutId}/complete`),
    delete: (programId) => api.delete(`/programs/${programId}`),
    regenerateWeek: (weekId, userId, adjustmentRequest) => api.put(`/programs/week/${weekId}/regenerate`, {
        user_id: userId,
        adjustment_request: adjustmentRequest
    }),
};

export default api;