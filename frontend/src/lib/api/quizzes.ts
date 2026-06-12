import { apiClient } from './client';
import type { Quiz, QuizAttempt, GenerateQuizData } from '@/types';

export const quizzesApi = {
  generate: (data: GenerateQuizData) =>
    apiClient.post<Quiz>('/api/v1/quizzes/generate', data).then((r) => r.data),

  list: () => apiClient.get<Quiz[]>('/api/v1/quizzes').then((r) => r.data),

  get: (id: string) => apiClient.get<Quiz>(`/api/v1/quizzes/${id}`).then((r) => r.data),

  startAttempt: (quizId: string) =>
    apiClient
      .post<{ attempt_id: string }>(`/api/v1/quizzes/${quizId}/attempt/start`)
      .then((r) => r.data),

  submitAttempt: (
    attemptId: string,
    answers: Record<string, string>,
    time_taken_seconds?: number
  ) =>
    apiClient
      .post<QuizAttempt>(`/api/v1/quizzes/attempt/${attemptId}/submit`, {
        answers,
        time_taken_seconds,
      })
      .then((r) => r.data),

  getAttempt: (attemptId: string) =>
    apiClient
      .get<QuizAttempt>(`/api/v1/quizzes/attempt/${attemptId}`)
      .then((r) => r.data),
};
