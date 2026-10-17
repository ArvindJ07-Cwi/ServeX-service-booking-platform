import axios from 'axios';

// Smart base URL:
// 1. If VITE_API_BASE_URL is set (Render dashboard / .env.development), use it.
// 2. If running on HTTPS (production) but env var is missing, use relative '/api'.
// 3. Only fall back to localhost in actual local development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    || (typeof window !== 'undefined' && window.location.protocol === 'https:'
        ? `${window.location.origin}/api`
        : 'http://localhost:5000/api');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 45000, // 45s — Render free tier cold starts can take up to 45s
});

// Request interceptor — attach JWT token from sessionStorage (per-tab session)
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('servx_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — auto-retry up to 2 times on network errors, timeouts, or 500/502/503/504 status codes (Render waking up / DB reconnecting)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        if (!config) return Promise.reject(error);

        config._retryCount = config._retryCount || 0;
        const maxRetries = 2;

        const status = error.response?.status;
        const shouldRetry =
            config._retryCount < maxRetries &&
            (error.code === 'ECONNABORTED' ||
                !error.response ||
                [500, 502, 503, 504].includes(status));

        if (shouldRetry) {
            config._retryCount += 1;
            const backoffMs = config._retryCount * 1500; // 1.5s then 3s
            console.warn(`[API] Request failed (${status || error.code}). Retrying attempt ${config._retryCount}/${maxRetries} in ${backoffMs}ms...`);
            await new Promise((r) => setTimeout(r, backoffMs));
            return api(config);
        }

        return Promise.reject(error);
    }
);


// ─────────────────────────────────────────────────────────────────────────────
// NOTE: baseURL already ends with /api, so all paths below are RELATIVE to /api
// e.g. '/auth/login' → full URL: baseURL + '/auth/login' = '.../api/auth/login'
// ─────────────────────────────────────────────────────────────────────────────

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (data) => api.post('/auth/register', data),
    getProfile: () => api.get('/auth/profile'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
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
    create: (data) => api.post('/bookings', { ...data, service_id: data.service || data.service_id }),
    getMyBookings: () => api.get('/bookings/my'),
    getAvailable: () => api.get('/bookings/available'),
    accept: (id) => api.patch(`/bookings/${id}/accept`),
    reject: (id) => api.patch(`/bookings/${id}/reject`),
    start: (id) => api.patch(`/bookings/${id}/start`),
    complete: (id) => api.patch(`/bookings/${id}/complete`),
    cancel: (id) => api.patch(`/bookings/${id}/cancel`),
    generateOtp: (id) => api.post(`/bookings/${id}/generate-otp`),
    verifyOtp: (id, otp) => api.post(`/bookings/${id}/verify-otp`, { otp }),
    getAll: (params) => api.get('/bookings/all', { params }),
    getById: (id) => api.get(`/bookings/${id}`),
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
    getAgents: (params) => api.get('/users/agents', { params }),
};

export const paymentAPI = {
    createOrder: (data) => api.post('/payment/create-order', data),
    verify: (data) => api.post('/payment/verify', data),
};

export const couponAPI = {
    apply: (data) => api.post('/coupons/apply', data),
    getAll: () => api.get('/coupons'),
    create: (data) => api.post('/coupons', data),
    delete: (id) => api.delete(`/coupons/${id}`),
};

export const reviewsAPI = {
    create: (data) => api.post('/reviews', data),
    getByBooking: (bookingId) => api.get(`/reviews/booking/${bookingId}`),
    getByService: (serviceId) => api.get(`/reviews/service/${serviceId}`),
    getByAgent: (agentId) => api.get(`/reviews/agent/${agentId}`),
};

export const adminAPI = {
    getDashboardStats: () => api.get('/admin/dashboard'),
    getUsers: () => api.get('/admin/users'),
    getAgents: () => api.get('/admin/agents'),
    updateUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { availability_status: status }),
    getPayments: () => api.get('/admin/payments'),
    updateBookingStatus: (id, status) => api.patch(`/admin/bookings/${id}/status`, { status }),
};

export const chatAPI = {
    getMessages: (bookingId) => api.get(`/chat/${bookingId}`),
};

export const notificationsAPI = {
    getAll: () => api.get('/notifications'),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markAsRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllAsRead: () => api.patch('/notifications/read-all'),
    delete: (id) => api.delete(`/notifications/${id}`),
};

export const uploadAPI = {
    uploadImage: (formData) => api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
};

export default api;
