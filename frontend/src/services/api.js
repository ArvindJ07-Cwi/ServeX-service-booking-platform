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
    timeout: 15000,
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
    login: (credentials) => api.post('/api/auth/login', credentials),
    register: (data) => api.post('/api/auth/register', data),
    getProfile: () => api.get('/api/auth/profile'),
    forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post('/api/auth/reset-password', { token, password }),
};

export const servicesAPI = {
    getAll: (params) => api.get('/api/services', { params }),
    getById: (id) => api.get(`/api/services/${id}`),
    create: (data) => api.post('/api/services', data),
    update: (id, data) => api.put(`/api/services/${id}`, data),
    delete: (id) => api.delete(`/api/services/${id}`),
    getCategories: () => api.get('/api/services/categories'),
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

    // Agent: reject assigned booking
    reject: (id) => api.patch(`/bookings/${id}/reject`),

    // Agent: start service
    start: (id) => api.patch(`/bookings/${id}/start`),

    // Agent: complete service
    complete: (id) => api.patch(`/bookings/${id}/complete`),

    // User/Admin: cancel booking
    cancel: (id) => api.patch(`/bookings/${id}/cancel`),

    // OTP: generate OTP for booking
    generateOtp: (id) => api.post(`/bookings/${id}/generate-otp`),

    // OTP: verify OTP to complete booking
    verifyOtp: (id, otp) => api.post(`/bookings/${id}/verify-otp`, { otp }),

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
    getAgents: (params) => api.get('/users/agents', { params }),
};

export const paymentAPI = {
    // Create Razorpay order
    createOrder: (data) => api.post('/payment/create-order', data),
    // Verify payment and create booking
    verify: (data) => api.post('/payment/verify', data),
};

export const couponAPI = {
    apply: (data) => api.post('/coupons/apply', data), // expects { code, amount }
    getAll: () => api.get('/coupons'),
    create: (data) => api.post('/coupons', data),
    delete: (id) => api.delete(`/coupons/${id}`)
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
