import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true, // Important pour les cookies HttpOnly
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor pour gérer les 401 globalement
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && window.location.pathname !== '/login') {
            // Redirect to login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ... existing code ...

export interface ThreadUser {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
}

export interface ThreadMessage {
    id: number;
    content: string;
    createdAt: string;
    sender: ThreadUser;
}

export interface MessageThread {
    id: number;
    lastMessageAt: string;
    unreadCount?: number; // Only present in list view
    student?: {
        id: number;
        firstName: string;
        lastName: string;
    };
    participants: {
        user: ThreadUser;
    }[];
    messages: ThreadMessage[];
}

// ... types ...

export const getThreads = async (): Promise<MessageThread[]> => {
    const response = await api.get('/threads');
    return response.data;
};

export const getThread = async (id: number): Promise<MessageThread> => {
    const response = await api.get(`/threads/${id}`);
    return response.data;
};

export const sendMessage = async (threadId: number, content: string): Promise<ThreadMessage> => {
    const response = await api.post(`/threads/${threadId}/messages`, { content });
    return response.data;
};

export const markThreadRead = async (threadId: number): Promise<void> => {
    await api.post(`/threads/${threadId}/read`);
};

export const getMyStudents = async (): Promise<ThreadUser[]> => {
    const response = await api.get('/users/me/students');
    return response.data;
};

export const createThread = async (studentId: number, recipientRole: string): Promise<MessageThread> => {
    const response = await api.post('/threads', { studentId, recipientRole });
    return response.data;
};

export default api;
