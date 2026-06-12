'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral' | 'secondary';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-[rgba(0,229,160,0.15)] text-[#00E5A0] border border-[rgba(0,229,160,0.3)]',
  warning: 'bg-[rgba(255,176,32,0.15)] text-[#FFB020] border border-[rgba(255,176,32,0.3)]',
  error: 'bg-[rgba(255,107,107,0.15)] text-[#FF6B6B] border border-[rgba(255,107,107,0.3)]',
  info: 'bg-[rgba(0,212,255,0.15)] text-[#00D4FF] border border-[rgba(0,212,255,0.3)]',
  primary: 'bg-[rgba(124,111,255,0.15)] text-[#9D93FF] border border-[rgba(124,111,255,0.3)]',
  neutral: 'bg-[rgba(136,146,164,0.15)] text-[#8892A4] border border-[rgba(136,146,164,0.2)]',
  secondary: 'bg-[rgba(0,212,255,0.1)] text-[#00D4FF] border border-[rgba(0,212,255,0.2)]',
};

export function Badge({ variant = 'primary', size = 'sm', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
