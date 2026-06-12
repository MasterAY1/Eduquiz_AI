'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, hint, className, type, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#8892A4] mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4A5568]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={cn(
              'input-glass',
              leftIcon && 'pl-10',
              (rightIcon || isPassword) && 'pr-10',
              error && 'border-[#FF6B6B] focus:ring-[rgba(255,107,107,0.15)] focus:border-[#FF6B6B]',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4A5568] hover:text-[#8892A4] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          {!isPassword && rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4A5568]">
              {rightIcon}
            </div>
          )}
        </div>
        {hint && !error && (
          <p className="mt-1.5 text-xs text-[#4A5568]">{hint}</p>
        )}
        {error && (
          <p className="mt-1.5 text-xs text-[#FF6B6B]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-[#8892A4] mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'input-glass resize-none',
            error && 'border-[#FF6B6B]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-[#FF6B6B]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
