import axios from 'axios';

// Prefer same-origin '/api' to avoid hard-coding server IPs. Fallback to env or localhost for dev.
const API_URL = (typeof window !== 'undefined' ? '/api' : '') || import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
console.log("API URL:", API_URL);

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Enable sending cookies
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        console.log("Making request to:", config.url, "with data:", config.data);
        return config;
    },
    (error) => {
        console.error("Request error:", error);
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response) => {
        console.log("Response received:", response);
        return response;
    },
    (error) => {
        console.error("Response error:", error.response?.data || error);
        if (error.response?.status === 401) {
            // Handle unauthorized access
            window.location.href = '/#/Login';
        }
        return Promise.reject(error);
    }
);

// Auth Service
export const authService = {
    login: (credentials: { username: string; password: string }) => {
        console.log("Login request with credentials:", credentials);
        return api.post('/auth/login', credentials, {
            validateStatus: function (status) {
                return status < 500; // Resolve only if the status code is less than 500
            }
        });
    },
    register: (userData: { username: string; password: string; firstName: string; lastName: string; email: string; dob: string }) =>
        api.post('/auth/register', userData),
    changePassword: (data: { oldPassword: string; newPassword: string }) =>
        api.post('/auth/change-password', data),
    getCurrentUser: () => api.get('/auth/profile'),
    // User management methods
    getAllUsers: () => api.get('/users'),
    createUser: (userData: {
        username: string;
        password: string;
        firstName: string;
        lastName: string;
        email: string;
        dob: string;
        role: string;
    }) => api.post('/users', userData),
    updateUser: (id: string, userData: {
        firstName?: string;
        lastName?: string;
        email?: string;
        dob?: string;
        role?: string;
    }) => api.put(`/users/${id}`, userData),
    deleteUser: (id: string) => api.delete(`/users/${id}`),
};

// Order Service
export const orderService = {
    getAll: () => api.get('/orders'),
    getById: (id: string) => api.get(`/orders/${id}`),
    getByNumber: (orderNumber: string) => api.get(`/orders/number/${orderNumber}`),
    getByStatus: (status: string) => api.get(`/orders/status/${status}`),
    getByPaymentStatus: (paymentStatus: string) => api.get(`/orders/payment/${paymentStatus}`),
    create: (orderData: {
        orderNumber: string;
        customer: {
            _id: string;
            companyName: string;
            name: string;
            email: string;
            phone: string;
            address: {
                street: string;
                city: string;
                state: string;
                country: string;
                zipCode: string;
            };
        };
        items: Array<{
            productId: string;
            productName: string;
            quantity: number;
            price: number;
        }>;
        totalAmount: number;
        status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
        paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
        shippingAddress: {
            street: string;
            city: string;
            state: string;
            country: string;
            zipCode: string;
        };
        dueDate: string;
        notes?: string;
    }) => api.post('/orders', orderData),
    update: (id: string, orderData: {
        orderNumber?: string;
        customer?: {
            _id?: string;
            companyName?: string;
            name?: string;
            email?: string;
        };
        items?: Array<{
            productId?: string;
            productName?: string;
            quantity?: number;
            price?: number;
        }>;
        totalAmount?: number;
        status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
        paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
        dueDate?: string;
        shippingAddress?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            zipCode?: string;
        };
        notes?: string;
    }) => api.put(`/orders/${id}`, orderData),
    updateStatus: (id: string, status: 'pending' | 'processing' | 'completed' | 'cancelled') =>
        api.patch(`/orders/${id}/status`, { status }),
    updatePaymentStatus: (id: string, paymentStatus: 'pending' | 'paid' | 'overdue') =>
        api.patch(`/orders/${id}/payment`, { paymentStatus }),
    delete: (id: string) => api.delete(`/orders/${id}`),
};

// Customer Service
export const customerService = {
    getAll: () => api.get('/customers'),
    getById: (id: string) => api.get(`/customers/${id}`),
    search: (query: string) => api.get(`/customers/search/${query}`),
    create: (customerData: {
        companyName: string;
        name: string;
        department: string;
        position: string;
        phone?: string;
        address: string;
    }) => api.post('/customers', customerData),
    update: (id: string, customerData: {
        companyName?: string;
        name?: string;
        department?: string;
        position?: string;
        phone?: string;
        address?: string;
    }) => api.put(`/customers/${id}`, customerData),
    delete: (id: string) => api.delete(`/customers/${id}`),
};

// Message Service
export const messageService = {
    getAll: () => api.get('/messages'),
    getById: (id: string) => api.get(`/messages/${id}`),
    getByOrderNumber: (orderNumber: string) => api.get(`/messages/order/${orderNumber}`),
    getByType: (messageType: string) => api.get(`/messages/type/${messageType}`),
    getUnread: () => api.get('/messages/unread'),
    create: (messageData: {
        messageType: 'new order' | 'order status change' | 'order update' | 'others';
        messageTitle: string;
        messageContent: string;
        postedBy: string;
        orderRelated?: boolean;
        orderNumber?: string;
    }) => api.post('/messages', messageData),
    update: (id: string, messageData: {
        messageType?: 'new order' | 'order status change' | 'order update' | 'others';
        messageTitle?: string;
        messageContent?: string;
        postedBy?: string;
        orderRelated?: boolean;
        orderNumber?: string;
    }) => api.put(`/messages/${id}`, messageData),
    markAsRead: (id: string) => api.put(`/messages/${id}/read`),
    delete: (id: string) => api.delete(`/messages/${id}`),
};

// Task Service
export const taskService = {
    getAll: () => api.get('/tasks'),
    getById: (id: string) => api.get(`/tasks/${id}`),
    getByStatus: (status: string) => api.get(`/tasks/status/${status}`),
    getByPriority: (priority: string) => api.get(`/tasks/priority/${priority}`),
    getByAssignee: (assignedTo: string) => api.get(`/tasks/assignee/${assignedTo}`),
    getByOrderNumber: (orderNumber: string) => api.get(`/tasks/order/${orderNumber}`),
    create: (taskData: {
        title: string;
        description: string;
        assignedTo: string;
        assignedBy: string;
        dueDate: string;
        status?: 'pending' | 'in progress' | 'completed';
        priority?: 'low' | 'medium' | 'high';
        orderRelated?: boolean;
        orderNumber?: string;
    }) => api.post('/tasks', taskData),
    update: (id: string, taskData: {
        title?: string;
        description?: string;
        assignedTo?: string;
        assignedBy?: string;
        dueDate?: string;
        status?: 'pending' | 'in progress' | 'completed';
        priority?: 'low' | 'medium' | 'high';
        orderRelated?: boolean;
        orderNumber?: string;
    }) => api.put(`/tasks/${id}`, taskData),
    markAsCompleted: (id: string) => api.patch(`/tasks/${id}/complete`),
    delete: (id: string) => api.delete(`/tasks/${id}`),
};

export default api; 