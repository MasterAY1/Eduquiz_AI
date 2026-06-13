'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const variants = {
      primary: 'btn-primary focus:ring-primary',
      secondary: 'btn-secondary focus:ring-secondary',
      ghost: 'btn-ghost focus:ring-white/30',
      danger:
        'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:-translate-y-0.5 active:translate-y-0 focus:ring-rose-500 box-shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]',
      success:
        'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 focus:ring-emerald-500 box-shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-sm rounded-2xl',
      lg: 'px-8 py-4 text-base rounded-2xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
