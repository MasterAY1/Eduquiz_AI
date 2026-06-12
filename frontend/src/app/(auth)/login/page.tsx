'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login.mutate({ email: data.email, password: data.password });
  };

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl font-bold mb-2">
          Welcome <span className="gradient-text">Back</span>
        </h1>
        <p className="text-[#8892A4] text-sm">Sign in to continue your learning journey</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          autoComplete="email"
          id="login-email"
          {...register('email')}
        />

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            autoComplete="current-password"
            id="login-password"
            {...register('password')}
          />
          <div className="flex justify-end mt-2">
            <Link
              href="#"
              className="text-xs text-[#7C6FFF] hover:text-[#9D93FF] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          loading={login.isPending}
          id="login-submit"
        >
          Sign In
        </Button>
      </form>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
        <span className="text-xs text-[#4A5568]">or</span>
        <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
      </div>

      <p className="text-center text-sm text-[#8892A4]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[#7C6FFF] hover:text-[#9D93FF] font-semibold transition-colors">
          Sign up free
        </Link>
      </p>
    </div>
  );
}
