'use client';

import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { Button } from '@/components/ui/Button';
import { Award } from 'lucide-react';
import { ExamCandidateDashboard } from '@/components/dashboard/ExamCandidateDashboard';
import { TertiaryStudentDashboard } from '@/components/dashboard/TertiaryStudentDashboard';
import { EducatorDashboard } from '@/components/dashboard/EducatorDashboard';

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboard();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 w-full lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
          <Award className="w-8 h-8 text-rose-500" />
        </div>
        <h3 className="text-xl font-bold font-heading text-white">Failed to load dashboard</h3>
        <p className="text-slate-400 max-w-sm">
          Something went wrong while retrieving your learning metrics. Please refresh the page.
        </p>
        <Button onClick={() => window.location.reload()} variant="primary">
          Try Again
        </Button>
      </div>
    );
  }

  const activeProfile = user?.learning_profiles?.find((p) => p.is_active) || user?.learning_profiles?.[0];
  const persona = activeProfile?.persona || 'exam_candidate';

  return (
    <div className="p-6 pb-12">
      {persona === 'exam_candidate' && <ExamCandidateDashboard />}
      {persona === 'tertiary_student' && <TertiaryStudentDashboard />}
      {persona === 'educator' && <EducatorDashboard />}
    </div>
  );
}
