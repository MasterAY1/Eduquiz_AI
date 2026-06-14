import { apiClient } from './client';

export interface TopicPerformance {
  topic: string;
  total_attempts: number;
  success_rate: number;
  is_weakness: boolean;
}

export interface PerformanceReport {
  subject: string;
  overall_score: number;
  topics: TopicPerformance[];
  weaknesses: string[];
  strengths: string[];
}

export interface PastQuestionIntelligence {
  subject: string;
  frequently_repeated_topics: string[];
  likely_exam_areas: string[];
  revision_recommendations: string[];
}

export const analyticsApi = {
  getPerformanceReport: async (subject: string) => {
    const { data } = await apiClient.get<PerformanceReport>(`/analytics/performance/${encodeURIComponent(subject)}`);
    return data;
  },

  getPastQuestionIntelligence: async (subject: string) => {
    const { data } = await apiClient.get<PastQuestionIntelligence>(`/analytics/past-questions/topics/${encodeURIComponent(subject)}`);
    return data;
  },
};
