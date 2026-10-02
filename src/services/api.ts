import { ApiResponse, FilterOptions, Task, TaskMetrics, User, DatabaseStatus } from '../types';

const TOKEN_KEY = 'taskflow_jwt_token';

export async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Server returned an invalid JSON response. Please try again.');
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await parseJsonResponse<T>(response);

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
        ? data.message
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (data && typeof data === 'object' && 'success' in data && data.success === false) {
    throw new Error(
      'message' in data && typeof data.message === 'string'
        ? data.message
        : 'Request failed.'
    );
  }

  if (!data) {
    throw new Error('The server returned an empty response. Please try again.');
  }

  return data;
}

export const authApi = {
  async register(payload: { name: string; email: string; password: string; confirmPassword: string }) {
    const res = await request<ApiResponse<{ user: User; token: string }>>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.data?.token) {
      setStoredToken(res.data.token);
    }
    return res.data!;
  },

  async login(payload: { email: string; password: string }) {
    const res = await request<ApiResponse<{ user: User; token: string }>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.data?.token) {
      setStoredToken(res.data.token);
    }
    return res.data!;
  },

  async getMe() {
    const res = await request<ApiResponse<{ user: User }>>('/api/auth/me');
    return res.data?.user || null;
  },

  logout() {
    clearStoredToken();
  },
};

export const tasksApi = {
  async getTasks(filters?: Partial<FilterOptions>) {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters?.priority && filters.priority !== 'All') params.append('priority', filters.priority);
    if (filters?.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await request<ApiResponse<{ tasks: Task[]; metrics: TaskMetrics }>>(`/api/tasks${query}`);
    return res.data!;
  },

  async getTaskById(id: string) {
    const res = await request<ApiResponse<Task>>(`/api/tasks/${id}`);
    return res.data!;
  },

  async createTask(task: {
    title: string;
    description?: string;
    status: string;
    priority: string;
    category: string;
    due_date?: string | null;
  }) {
    const res = await request<ApiResponse<Task>>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
    return res.data!;
  },

  async updateTask(
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      status: string;
      priority: string;
      category: string;
      due_date: string | null;
    }>
  ) {
    const res = await request<ApiResponse<Task>>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.data!;
  },

  async deleteTask(id: string) {
    const res = await request<ApiResponse<void>>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
    return res.success;
  },
};

export const healthApi = {
  async check() {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) return null;
      const data = await parseJsonResponse<{ success: boolean; status: string; database: DatabaseStatus }>(res);
      return data;
    } catch {
      return null;
    }
  },
};
