import {
  ApiResponse,
  User,
  Appointment,
  AppointmentStatus,
  ChatSession,
  ChatMessage,
  AIEvaluation
} from '../types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = { ...this.getHeaders(), ...options.headers };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.error?.message || `Request failed with status ${response.status}`;
        const error = new Error(errorMsg) as any;
        error.code = data.error?.code || 'API_ERROR';
        error.status = response.status;
        error.details = data.error?.details;

        // Auto-logout on token expiration
        if (response.status === 401 && typeof window !== 'undefined') {
          if (data.error?.code === 'TOKEN_EXPIRED' || data.error?.code === 'INVALID_TOKEN') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
              window.location.href = '/login?expired=1';
            }
          }
        }

        throw error;
      }

      return data.data as T;
    } catch (err: any) {
      // Re-throw formatted error
      throw err;
    }
  }

  // Auth API
  auth = {
    register: (payload: { email: string; password: string; name: string }) =>
      this.request<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    login: (payload: { email: string; password: string }) =>
      this.request<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    getMe: () => this.request<{ user: User }>('/auth/me')
  };

  // Appointments API
  appointments = {
    list: (params?: { status?: AppointmentStatus; from?: string; to?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.from) searchParams.set('from', params.from);
      if (params?.to) searchParams.set('to', params.to);
      const query = searchParams.toString();
      return this.request<Appointment[]>(`/appointments${query ? `?${query}` : ''}`);
    },

    create: (payload: {
      service: string;
      appointmentDate: string;
      appointmentTime: string;
      notes?: string | null;
    }) =>
      this.request<Appointment>('/appointments', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    get: (id: string) => this.request<Appointment>(`/appointments/${id}`),

    updateStatus: (id: string, status: AppointmentStatus) =>
      this.request<Appointment>(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }),

    validate: (payload: {
      service: string;
      appointmentDate: string;
      appointmentTime: string;
    }) =>
      this.request<{ available: boolean }>(`/appointments/validate`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
  };

  // Chat API
  chat = {
    listSessions: () => this.request<ChatSession[]>('/chat/sessions'),

    createSession: (title?: string) =>
      this.request<ChatSession>('/chat/sessions', {
        method: 'POST',
        body: JSON.stringify({ title })
      }),

    getSession: (id: string) => this.request<ChatSession>(`/chat/sessions/${id}`),

    getMessages: (sessionId: string) =>
      this.request<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`),

    sendMessage: (sessionId: string, content: string) =>
      this.request<{
        userMessage: ChatMessage;
        assistantMessage: ChatMessage;
        aiEvaluation: AIEvaluation;
      }>(`/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
      }),

    deleteSession: (id: string) =>
      this.request<{ deleted: boolean }>(`/chat/sessions/${id}`, {
        method: 'DELETE'
      })
  };
}

export const api = new ApiClient();
export default api;
