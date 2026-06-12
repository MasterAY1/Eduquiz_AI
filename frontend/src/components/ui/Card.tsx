'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  gradient?: boolean;
  glow?: boolean;
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ gradient = false, glow = false, hover = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'glass-card',
          gradient && 'bg-gradient-card',
          glow && 'glow-primary',
          hover && 'card-hover cursor-pointer',
          className
        )}
        style={
          gradient
            ? {
                background:
                  'linear-gradient(135deg, rgba(124,111,255,0.08) 0%, rgba(0,212,255,0.04) 100%)',
              }
            : undefined
        }
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
