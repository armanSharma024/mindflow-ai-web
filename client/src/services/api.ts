import { Note, User, AuthResponse, AIStatus, ToneOption, ActionItem } from '../types';

const API_BASE = '/api';

export const getAuthToken = (): string | null => localStorage.getItem('mindflow_token');
export const setAuthToken = (token: string): void => localStorage.setItem('mindflow_token', token);
export const removeAuthToken = (): void => localStorage.removeItem('mindflow_token');

export const getCustomApiKey = (): string | null => localStorage.getItem('mindflow_gemini_key');
export const setCustomApiKey = (key: string): void => localStorage.setItem('mindflow_gemini_key', key);
export const removeCustomApiKey = (): void => localStorage.removeItem('mindflow_gemini_key');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    if (response.status === 401) {
      removeAuthToken();
    }
    throw new Error(errorMsg);
  }

  return data as T;
}

// Auth API
export const api = {
  auth: {
    login: (email: string, password: string): Promise<AuthResponse> =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (name: string, email: string, password: string): Promise<AuthResponse> =>
      request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),

    demoLogin: (): Promise<AuthResponse> =>
      request<AuthResponse>('/auth/demo', {
        method: 'POST',
      }),

    me: (): Promise<{ user: User; stats: { totalNotes: number; pinnedNotes: number; categoriesCount: number } }> =>
      request('/auth/me'),
  },

  notes: {
    getAll: (params?: { search?: string; category?: string }): Promise<{ notes: Note[] }> => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.category && params.category !== 'All') query.set('category', params.category);
      const qs = query.toString();
      return request<{ notes: Note[] }>(`/notes${qs ? `?${qs}` : ''}`);
    },

    getById: (id: number): Promise<{ note: Note }> =>
      request<{ note: Note }>(`/notes/${id}`),

    create: (note: Partial<Note>): Promise<{ message: string; note: Note }> =>
      request<{ message: string; note: Note }>('/notes', {
        method: 'POST',
        body: JSON.stringify(note),
      }),

    update: (id: number, note: Partial<Note>): Promise<{ message: string; note: Note }> =>
      request<{ message: string; note: Note }>(`/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(note),
      }),

    togglePin: (id: number): Promise<{ message: string; is_pinned: boolean }> =>
      request<{ message: string; is_pinned: boolean }>(`/notes/${id}/pin`, {
        method: 'PATCH',
      }),

    updateActionItems: (id: number, action_items: ActionItem[]): Promise<{ message: string; action_items: ActionItem[] }> =>
      request<{ message: string; action_items: ActionItem[] }>(`/notes/${id}/action-items`, {
        method: 'PATCH',
        body: JSON.stringify({ action_items }),
      }),

    delete: (id: number): Promise<{ message: string; id: number }> =>
      request<{ message: string; id: number }>(`/notes/${id}`, {
        method: 'DELETE',
      }),

    getCategories: (): Promise<{ categories: { category: string; count: number }[] }> =>
      request('/notes/categories'),
  },

  ai: {
    getStatus: (): Promise<AIStatus> => request<AIStatus>('/ai/status'),

    summarize: (title: string, content: string): Promise<{ summary: string; simulated: boolean }> =>
      request('/ai/summarize', {
        method: 'POST',
        body: JSON.stringify({
          title,
          content,
          customApiKey: getCustomApiKey() || undefined,
        }),
      }),

    extractActionItems: (content: string): Promise<{ action_items: ActionItem[]; simulated: boolean }> =>
      request('/ai/action-items', {
        method: 'POST',
        body: JSON.stringify({
          content,
          customApiKey: getCustomApiKey() || undefined,
        }),
      }),

    expand: (title: string, content: string): Promise<{ expanded: string; simulated: boolean }> =>
      request('/ai/expand', {
        method: 'POST',
        body: JSON.stringify({
          title,
          content,
          customApiKey: getCustomApiKey() || undefined,
        }),
      }),

    rewrite: (content: string, tone: ToneOption): Promise<{ rewritten: string; simulated: boolean }> =>
      request('/ai/rewrite', {
        method: 'POST',
        body: JSON.stringify({
          content,
          tone,
          customApiKey: getCustomApiKey() || undefined,
        }),
      }),

    chat: (message: string, activeNote?: Note | null): Promise<{ reply: string; simulated: boolean }> =>
      request('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message,
          activeNote,
          customApiKey: getCustomApiKey() || undefined,
        }),
      }),
  },
};
