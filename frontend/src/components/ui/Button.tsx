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
      'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#080817] disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const variants = {
      primary:
        'bg-gradient-to-r from-[#7C6FFF] to-[#00D4FF] text-white shadow-lg hover:shadow-[0_8px_30px_rgba(124,111,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 focus:ring-[#7C6FFF]',
      secondary:
        'bg-transparent border border-[#7C6FFF] text-[#7C6FFF] hover:bg-[rgba(124,111,255,0.1)] hover:border-[#9D93FF] focus:ring-[#7C6FFF]',
      ghost:
        'bg-transparent border border-[rgba(255,255,255,0.12)] text-[#F0F0FF] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.2)] focus:ring-white/30',
      danger:
        'bg-gradient-to-r from-[#FF6B6B] to-[#FF4545] text-white hover:shadow-[0_8px_30px_rgba(255,107,107,0.4)] hover:-translate-y-0.5 active:translate-y-0 focus:ring-[#FF6B6B]',
      success:
        'bg-gradient-to-r from-[#00E5A0] to-[#00C87A] text-[#080817] hover:shadow-[0_8px_30px_rgba(0,229,160,0.4)] hover:-translate-y-0.5 active:translate-y-0 focus:ring-[#00E5A0]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-7 py-3.5 text-base',
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
