'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export function useAuth() {
  const store = useAuthStore();
  const addToast = useUIStore((s) => s.addToast);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, refetch } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    enabled: store.isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      store.login(data.user, data.access_token, data.refresh_token);
      addToast({ type: 'success', message: `Welcome back, ${data.user.full_name.split(' ')[0]}! 👋` });
      
      if (!data.user.learning_profiles || data.user.learning_profiles.length === 0) {
        router.push('/app/onboarding');
      } else {
        router.push('/app/dashboard');
      }
    },
    onError: () => {
      addToast({ type: 'error', message: 'Invalid email or password. Please try again.' });
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      store.login(data.user, data.access_token, data.refresh_token);
      addToast({ type: 'success', message: `Welcome to EduQuiz AI, ${data.user.full_name.split(' ')[0]}! 🎉` });
      router.push('/app/onboarding');
    },
    onError: () => {
      addToast({ type: 'error', message: 'Registration failed. Please try again.' });
    },
  });

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors on logout
    }
    store.logout();
    queryClient.clear();
    router.push('/login');
  };

  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      store.setUser(data);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      addToast({ type: 'success', message: 'Profile updated successfully!' });
    },
    onError: () => {
      addToast({ type: 'error', message: 'Failed to update profile. Please try again.' });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: authApi.uploadAvatar,
    onSuccess: (data) => {
      store.setUser(data);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      addToast({ type: 'success', message: 'Profile photo updated successfully!' });
    },
    onError: (error: any) => {
      let msg = 'Failed to upload photo. Please try again.';
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          msg = JSON.stringify(error.response.data.detail);
        } else {
          msg = String(error.response.data.detail);
        }
      }
      addToast({ type: 'error', message: msg });
    },
  });

  return {
    user: user || store.user,
    isAuthenticated: store.isAuthenticated,
    login: loginMutation,
    register: registerMutation,
    logout,
    updateProfile: updateProfileMutation,
    uploadAvatar: uploadAvatarMutation,
    refetchUser: refetch,
  };
}
