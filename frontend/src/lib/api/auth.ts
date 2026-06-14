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

  uploadAvatar: (file: File): Promise<User> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', new Blob([file], { type: file.type || 'image/jpeg' }), file.name || 'avatar.jpg');
      
      const token = localStorage.getItem('access_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${baseUrl}/api/v1/auth/me/avatar`, true);
      
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            resolve({} as User);
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject({ response: { data: err } });
          } catch (e) {
            reject({ response: { data: { detail: `HTTP ${xhr.status} Error` } } });
          }
        }
      };
      
      xhr.onerror = () => {
        reject({ response: { data: { detail: 'Network error during upload' } } });
      };
      
      xhr.send(formData);
    });
  },
};
