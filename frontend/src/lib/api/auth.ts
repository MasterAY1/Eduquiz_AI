import { apiClient } from './client';
import type { TokenResponse, User, RegisterData } from '@/types';

export const authApi = {
  register: (data: RegisterData) =>
    apiClient.post<TokenResponse>('/api/v1/auth/register', data).then((r) => r.data),

  login: (email: string, password: string) =>
    apiClient
      .post<TokenResponse>('/api/v1/auth/login', { email, password })
      .then((r) => r.data),

  logout: () => apiClient.post('/api/v1/auth/logout'),

  refresh: (refresh_token: string) =>
    apiClient
      .post<{ access_token: string; refresh_token: string }>('/api/v1/auth/refresh', {
        refresh_token,
      })
      .then((r) => r.data),

  getMe: () => apiClient.get<User>('/api/v1/auth/me').then((r) => r.data),

  updateProfile: (data: Partial<User>) =>
    apiClient.put<User>('/api/v1/auth/me', data).then((r) => r.data),

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('access_token');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    const res = await fetch(`${baseUrl}/api/v1/auth/me/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Failed to upload photo.' }));
      throw { response: { data: errorData } };
    }
    
    return res.json() as Promise<User>;
  },
};
