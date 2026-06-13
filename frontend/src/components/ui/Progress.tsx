'use client';

import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

export function Progress({
  value,
  max = 100,
  showLabel = false,
  variant = 'primary',
  size = 'md',
  className,
  animated = true,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variantStyles = {
    primary: 'from-emerald-400 to-emerald-600',
    success: 'from-emerald-400 to-emerald-600',
    warning: 'from-amber-400 to-amber-600',
    danger: 'from-rose-400 to-rose-600',
  };

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full rounded-full overflow-hidden shadow-inner',
          sizeStyles[size],
          'bg-black/20 backdrop-blur-sm border border-white/5'
        )}
      >
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r',
            variantStyles[variant],
            animated && 'transition-all duration-700 ease-out'
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1.5">
          <span className="text-xs font-medium text-slate-400">{percentage.toFixed(0)}%</span>
          <span className="text-xs font-medium text-slate-400">
            {value}/{max}
          </span>
        </div>
      )}
    </div>
  );
}
