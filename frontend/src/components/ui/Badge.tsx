'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral' | 'secondary';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  primary: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  neutral: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  secondary: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export function Badge({ variant = 'primary', size = 'sm', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium glass-pill backdrop-blur-md',
        size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
