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

  uploadAvatar: async (file: File): Promise<User> => {
    // Read the file as base64 data URL
    const base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

    console.log('[Avatar Upload] base64 length:', base64String.length);
    console.log('[Avatar Upload] base64 prefix:', base64String.substring(0, 50));

    const token = localStorage.getItem('access_token');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    console.log('[Avatar Upload] Sending to:', `${baseUrl}/api/v1/auth/me/avatar`);
    console.log('[Avatar Upload] Token present:', !!token);

    const res = await fetch(`${baseUrl}/api/v1/auth/me/avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ file_base64: base64String }),
    });

    console.log('[Avatar Upload] Response status:', res.status);

    const responseBody = await res.json();
    console.log('[Avatar Upload] Response body:', JSON.stringify(responseBody).substring(0, 500));

    if (!res.ok) {
      throw { response: { data: responseBody } };
    }

    return responseBody as User;
  },
};
