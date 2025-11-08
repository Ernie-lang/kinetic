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
    getAuthUrl: () => api.get('/strava/auth-url'),
    handleCallback: (code) => api.post('/strava/callback', { code }),
    syncWorkouts: (userId) => api.post(`/strava/sync/${userId}`),
    getStatus: (userId) => api.get(`/strava/status/${userId}`),
    disconnect: (userId) => api.post(`/strava/disconnect/${userId}`),
};

// Workouts API
export const workoutsAPI = {
    getUserWorkouts: (userId) => api.get(`/workouts/${userId}`),
};

export default api;