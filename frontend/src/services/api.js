import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

// Request interceptor — attach role-based JWT token (read directly from localStorage to avoid circular imports)
api.interceptors.request.use(
    (config) => {
        const role = localStorage.getItem('activeRole');
        const token = role ? localStorage.getItem(`token_${role}`) : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle global errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Optional: Redirect to login or clear token
            // localStorage.removeItem('token');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (data) => api.post('/auth/register', data),
    getProfile: () => api.get('/auth/profile'),
};

export const servicesAPI = {
    getAll: (params) => api.get('/services', { params }),
    getById: (id) => api.get(`/services/${id}`),
    create: (data) => api.post('/services', data),
    update: (id, data) => api.put(`/services/${id}`, data),
    delete: (id) => api.delete(`/services/${id}`),
    getCategories: () => api.get('/services/categories'),
};

export const bookingsAPI = {
    // User: create booking
    // Map 'service' (id string) to 'service_id' for backend compatibility
    create: (data) => api.post('/bookings', { ...data, service_id: data.service || data.service_id }),

    // User: get my bookings
    getMyBookings: () => api.get('/bookings/my'),

    // Agent: get available bookings
    getAvailable: () => api.get('/bookings/available'),

    // Agent: accept booking
    accept: (id) => api.patch(`/bookings/${id}/accept`),

    // Agent: start service
    start: (id) => api.patch(`/bookings/${id}/start`),

    // Agent: complete service
    complete: (id) => api.patch(`/bookings/${id}/complete`),

    // User/Admin: cancel booking
    cancel: (id) => api.patch(`/bookings/${id}/cancel`),

    // Admin: get all bookings
    getAll: (params) => api.get('/bookings/all', { params }), // Updated to point to /all

    // Generic Access
    getById: (id) => api.get(`/bookings/${id}`),

    // Deprecated but kept for compatibility during migration if needed
    updateStatus: (id, status) => {
        if (status === 'in_progress') return api.patch(`/bookings/${id}/start`);
        if (status === 'completed') return api.patch(`/bookings/${id}/complete`);
        if (status === 'accepted') return api.patch(`/bookings/${id}/accept`);
        if (status === 'cancelled') return api.patch(`/bookings/${id}/cancel`);
        return Promise.reject(new Error(`Invalid status action: ${status}`));
    }
};

export const usersAPI = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
};

export const paymentAPI = {
    // Create Razorpay order
    createOrder: (data) => api.post('/payment/create-order', data),
    // Verify payment and create booking
    verify: (data) => api.post('/payment/verify', data),
};

export default api;
