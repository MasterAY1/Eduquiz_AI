import { apiClient } from './client';
import type { DashboardStats, RecentAttempt } from '@/types';

export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>('/api/v1/dashboard/stats').then((r) => r.data),

  getHistory: (skip = 0, limit = 20) =>
    apiClient
      .get<RecentAttempt[]>('/api/v1/dashboard/history', { params: { skip, limit } })
      .then((r) => r.data),
};
