import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';

export const usePerformanceReport = (subject: string) => {
  return useQuery({
    queryKey: ['performance', subject],
    queryFn: () => analyticsApi.getPerformanceReport(subject),
    enabled: !!subject,
  });
};

export const usePastQuestionIntelligence = (subject: string) => {
  return useQuery({
    queryKey: ['pastQuestionIntelligence', subject],
    queryFn: () => analyticsApi.getPastQuestionIntelligence(subject),
    enabled: !!subject,
  });
};
