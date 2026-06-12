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
    primary: 'from-[#7C6FFF] to-[#00D4FF]',
    success: 'from-[#00E5A0] to-[#00C87A]',
    warning: 'from-[#FFB020] to-[#FF8C42]',
    danger: 'from-[#FF6B6B] to-[#FF4545]',
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
          'w-full rounded-full overflow-hidden',
          sizeStyles[size],
          'bg-[rgba(255,255,255,0.06)]'
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
        <div className="flex justify-between mt-1">
          <span className="text-xs text-[#8892A4]">{percentage.toFixed(0)}%</span>
          <span className="text-xs text-[#8892A4]">
            {value}/{max}
          </span>
        </div>
      )}
    </div>
  );
}
