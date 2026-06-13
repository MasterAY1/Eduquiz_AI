'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'glass-light' | 'glass-heavy' | 'solid' | 'outlined';
  glow?: boolean;
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'glass', glow = false, hover = false, className, children, ...props }, ref) => {
    
    const variants = {
      'glass': 'glass-card',
      'glass-light': 'glass-card-light',
      'glass-heavy': 'glass-card-heavy',
      'solid': 'bg-surface border border-border rounded-2xl shadow-card',
      'outlined': 'bg-transparent border border-border rounded-2xl',
    };

    return (
      <div
        ref={ref}
        className={cn(
          variants[variant],
          glow && 'glow-primary',
          hover && 'card-hover cursor-pointer hover:-translate-y-1 transition-transform duration-300',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
