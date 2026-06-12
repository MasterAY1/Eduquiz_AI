'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    staleTime: 2 * 60 * 1000,
  });
}

export function useDashboardHistory(skip = 0, limit = 20) {
  return useQuery({
    queryKey: ['dashboard-history', skip, limit],
    queryFn: () => dashboardApi.getHistory(skip, limit),
  });
}
