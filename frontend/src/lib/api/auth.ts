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
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        try {
          const res = await apiClient.post<User>('/api/v1/auth/me/avatar', {
            file_base64: base64String
          });
          resolve(res.data);
        } catch (e: any) {
          reject(e);
        }
      };
      
      reader.onerror = () => {
        reject({ response: { data: { detail: 'Failed to read file on frontend' } } });
      };
      
      reader.readAsDataURL(file);
    });
  },
};
