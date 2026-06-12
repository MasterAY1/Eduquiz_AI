'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { quizzesApi } from '@/lib/api/quizzes';
import { useUIStore } from '@/store/uiStore';
import type { GenerateQuizData } from '@/types';

export function useQuizzes() {
  return useQuery({
    queryKey: ['quizzes'],
    queryFn: quizzesApi.list,
  });
}

export function useQuiz(id: string) {
  return useQuery({
    queryKey: ['quiz', id],
    queryFn: () => quizzesApi.get(id),
    enabled: !!id,
  });
}

export function useGenerateQuiz() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const router = useRouter();

  return useMutation({
    mutationFn: (data: GenerateQuizData) => quizzesApi.generate(data),
    onSuccess: (quiz) => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      addToast({ type: 'success', message: 'Quiz generated successfully! 🎉' });
      router.push(`/app/quizzes/${quiz.id}`);
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      const message = error.response?.data?.detail || 'Failed to generate quiz. Please try again.';
      addToast({ type: 'error', message });
    },
  });
}

export function useStartAttempt() {
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (quizId: string) => quizzesApi.startAttempt(quizId),
    onError: () => {
      addToast({ type: 'error', message: 'Failed to start quiz. Please try again.' });
    },
  });
}

export function useSubmitAttempt() {
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({
      attemptId,
      answers,
      time_taken_seconds,
    }: {
      attemptId: string;
      answers: Record<string, any>;
      time_taken_seconds?: number;
    }) => quizzesApi.submitAttempt(attemptId, answers, time_taken_seconds),
    onError: () => {
      addToast({ type: 'error', message: 'Failed to submit quiz. Please try again.' });
    },
  });
}

export function useAttempt(id: string) {
  return useQuery({
    queryKey: ['attempt', id],
    queryFn: () => quizzesApi.getAttempt(id),
    enabled: !!id,
  });
}
