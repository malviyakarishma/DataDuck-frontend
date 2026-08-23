// Typed API client for QueryMind frontend
// All requests go through this client — never expose credentials in URLs

import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import type {
  TokenResponse, OTPResponse, LoginResponse, User, DatabaseConnection, TestConnectionResponse,
  ChatResponse, ChatMessage, Conversation, SchemaOverview, ApiError
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies cross-domain
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach access token if present
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — handle access token expiry & refresh token expiry
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest.url || '';

    // Do not redirect on auth submission requests (login, register, verify-otp, resend-otp)
    const isAuthSubmission = requestUrl.includes('/auth/login') ||
                             requestUrl.includes('/auth/register') ||
                             requestUrl.includes('/auth/verify-otp') ||
                             requestUrl.includes('/auth/resend-otp');

    if (error.response?.status === 401) {
      if (isAuthSubmission) {
        return Promise.reject(error);
      }

      // 1. Access token expired — attempt refresh token once
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refresh_token: refreshToken,
            }, { withCredentials: true });
            
            const { access_token, refresh_token: new_refresh } = res.data;
            localStorage.setItem('access_token', access_token);
            if (new_refresh) {
              localStorage.setItem('refresh_token', new_refresh);
            }
            if (originalRequest.headers) {
              (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${access_token}`;
            }
            return apiClient(originalRequest);
          }
        } catch {
          // Token refresh failed (Refresh token expired or invalid)
        }
      }

      // 2. Refresh token expired or missing -> throw user outside immediately (clear tokens & redirect)
      _clearTokens();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────

export const authApi = {
  register: async (data: {
    full_name: string;
    email: string;
    password: string;
    confirm_password: string;
  }): Promise<OTPResponse> => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  verifyOtp: async (data: { email: string; otp_code: string }): Promise<TokenResponse> => {
    const res = await apiClient.post('/auth/verify-otp', data);
    _storeTokens(res.data);
    return res.data;
  },

  resendOtp: async (data: { email: string }): Promise<{ message: string; email: string }> => {
    const res = await apiClient.post('/auth/resend-otp', data);
    return res.data;
  },

  login: async (data: { email: string; password: string }): Promise<LoginResponse> => {
    const res = await apiClient.post('/auth/login', data);
    if (!res.data.requires_otp && res.data.access_token) {
      _storeTokens(res.data);
    }
    return res.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    _clearTokens();
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

// ── Databases ─────────────────────────────────────────────────────────────

export const databasesApi = {
  testConnection: async (connection_string: string): Promise<TestConnectionResponse> => {
    const res = await apiClient.post('/databases/test', { connection_string });
    return res.data;
  },

  addDatabase: async (data: { name: string; connection_string: string }): Promise<DatabaseConnection> => {
    const res = await apiClient.post('/databases', data);
    return res.data;
  },

  listDatabases: async (): Promise<{ databases: DatabaseConnection[]; total: number }> => {
    const res = await apiClient.get('/databases');
    return res.data;
  },

  getDatabase: async (id: string): Promise<DatabaseConnection> => {
    const res = await apiClient.get(`/databases/${id}`);
    return res.data;
  },

  deleteDatabase: async (id: string): Promise<void> => {
    await apiClient.delete(`/databases/${id}`);
  },

  analyzeSchema: async (id: string): Promise<unknown> => {
    const res = await apiClient.post(`/databases/${id}/analyze-schema`);
    return res.data;
  },

  getSchemaOverview: async (id: string): Promise<SchemaOverview> => {
    const res = await apiClient.get(`/databases/${id}/overview`);
    return res.data;
  },
};

// ── Chat ─────────────────────────────────────────────────────────────────

export const chatApi = {
  sendMessage: async (data: {
    database_id: string;
    conversation_id?: string;
    message: string;
  }): Promise<ChatResponse> => {
    const res = await apiClient.post('/chat', data);
    return res.data;
  },

  listConversations: async (): Promise<{ conversations: Conversation[]; total: number }> => {
    const res = await apiClient.get('/chat/conversations');
    return res.data;
  },

  getMessages: async (conversationId: string): Promise<{ conversation_id: string; messages: ChatMessage[]; total: number }> => {
    const res = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
    return res.data;
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    await apiClient.delete(`/chat/conversations/${conversationId}`);
  },
};

// ── Health ─────────────────────────────────────────────────────────────────

export const healthApi = {
  check: async (): Promise<{ status: string }> => {
    const res = await apiClient.get('/health');
    return res.data;
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function _storeTokens(data: TokenResponse | LoginResponse) {
  if (typeof window !== 'undefined') {
    if (data.access_token) localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
    if (data.user_id) localStorage.setItem('user_id', data.user_id);
    if (data.email) localStorage.setItem('user_email', data.email);
    if (data.full_name) localStorage.setItem('user_name', data.full_name);
  }
}

function _clearTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
  }
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.error) return data.error;
    if (typeof data === 'string') return data;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('access_token');
}

export function getCurrentUserName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('user_name') || '';
}

export default apiClient;
