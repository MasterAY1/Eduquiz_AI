'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass-card p-4 flex items-center gap-4">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-44" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
