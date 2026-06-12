'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Building2, GraduationCap, Check } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { RegisterData } from '@/types';

// Step 1 Schema
const step1Schema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

type Step1Data = z.infer<typeof step1Schema>;

const educationalLevels = [
  { value: 'primary', label: 'Primary School', icon: '📚' },
  { value: 'jss', label: 'Junior Secondary (JSS)', icon: '🏫' },
  { value: 'sss', label: 'Senior Secondary (SSS)', icon: '🎓' },
  { value: 'polytechnic', label: 'Polytechnic', icon: '🔧' },
  { value: 'col_of_edu', label: 'College of Education', icon: '📖' },
  { value: 'university', label: 'University', icon: '🎓' },
] as const;

const subjectsByLevel: Record<string, string[]> = {
  primary: ['English', 'Mathematics', 'Science', 'Social Studies', 'Basic Technology', 'Yoruba', 'Igbo', 'Hausa'],
  jss: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Literature', 'Economics', 'Geography', 'History', 'Commerce', 'Agricultural Science', 'French', 'Computer Science'],
  sss: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Further Maths', 'English', 'Literature', 'Economics', 'Geography', 'Government', 'History', 'Commerce', 'Agricultural Science', 'French', 'Computer Science'],
  polytechnic: ['Accounting', 'Engineering', 'Computer Science', 'Business Admin', 'Mass Communication', 'Education', 'Sciences', 'Architecture'],
  col_of_edu: ['Education', 'English', 'Mathematics', 'Sciences', 'Social Studies', 'Business Studies'],
  university: ['Accounting', 'Engineering', 'Medicine', 'Law', 'Computer Science', 'Business Admin', 'Mass Communication', 'Education', 'Economics', 'Psychology', 'Pharmacy'],
};

interface FormState {
  full_name: string;
  email: string;
  password: string;
  educational_level: RegisterData['educational_level'] | '';
  school_name: string;
  department: string;
  class_level: string;
  preferred_subjects: string[];
}

export default function RegisterPage() {
  const { register: registerMutation } = useAuth();
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState<FormState>({
    full_name: '',
    email: '',
    password: '',
    educational_level: '',
    school_name: '',
    department: '',
    class_level: '',
    preferred_subjects: [],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      full_name: formState.full_name,
      email: formState.email,
      password: formState.password,
    },
  });

  const onStep1Submit = (data: Step1Data) => {
    setFormState((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const onStep2Next = () => {
    setStep(3);
  };

  const toggleSubject = (subject: string) => {
    setFormState((prev) => ({
      ...prev,
      preferred_subjects: prev.preferred_subjects.includes(subject)
        ? prev.preferred_subjects.filter((s) => s !== subject)
        : [...prev.preferred_subjects, subject],
    }));
  };

  const onFinalSubmit = () => {
    if (!formState.educational_level) return;
    const payload: RegisterData = {
      full_name: formState.full_name,
      email: formState.email,
      password: formState.password,
      educational_level: formState.educational_level as RegisterData['educational_level'],
      school_name: formState.school_name || undefined,
      department: formState.department || undefined,
      class_level: formState.class_level || undefined,
      preferred_subjects: formState.preferred_subjects.length ? formState.preferred_subjects : undefined,
    };
    registerMutation.mutate(payload);
  };

  const availableSubjects = subjectsByLevel[formState.educational_level || 'sss'] || subjectsByLevel.sss;

  const stepLabels = ['Account Info', 'Education', 'Subjects'];

  return (
    <div>
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8 gap-3">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  isDone
                    ? 'bg-gradient-to-r from-[#7C6FFF] to-[#00D4FF] text-white'
                    : isActive
                    ? 'bg-gradient-to-r from-[#7C6FFF] to-[#00D4FF] text-white shadow-lg shadow-[rgba(124,111,255,0.4)]'
                    : 'bg-[rgba(255,255,255,0.06)] text-[#4A5568] border border-[rgba(255,255,255,0.08)]'
                )}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
              </div>
              {i < stepLabels.length - 1 && (
                <div className={cn('w-10 h-px transition-all', step > stepNum ? 'bg-[#7C6FFF]' : 'bg-[rgba(255,255,255,0.1)]')} />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1 */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-6 text-center">
              <h1 className="font-heading text-2xl font-bold mb-1">
                Create Your <span className="gradient-text">Account</span>
              </h1>
              <p className="text-[#8892A4] text-sm">Step 1 of 3 — Basic information</p>
            </div>

            <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="John Doe"
                leftIcon={<User className="w-4 h-4" />}
                error={errors.full_name?.message}
                id="register-name"
                {...register('full_name')}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                id="register-email"
                {...register('email')}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Min. 8 characters"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                id="register-password"
                {...register('password')}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat your password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.confirm_password?.message}
                id="register-confirm-password"
                {...register('confirm_password')}
              />
              <Button type="submit" variant="primary" fullWidth size="lg" id="step1-next">
                Next Step →
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-[#8892A4]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#7C6FFF] hover:text-[#9D93FF] font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-6 text-center">
              <h2 className="font-heading text-2xl font-bold mb-1">
                Your <span className="gradient-text">Education</span>
              </h2>
              <p className="text-[#8892A4] text-sm">Step 2 of 3 — Education details</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#8892A4] mb-2">
                  Educational Level <span className="text-[#FF6B6B]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {educationalLevels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setFormState((prev) => ({ ...prev, educational_level: level.value }))}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all border',
                        formState.educational_level === level.value
                          ? 'bg-gradient-to-r from-[rgba(124,111,255,0.2)] to-[rgba(0,212,255,0.1)] border-[rgba(124,111,255,0.5)] text-[#F0F0FF]'
                          : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#8892A4] hover:border-[rgba(255,255,255,0.12)] hover:text-[#F0F0FF]'
                      )}
                    >
                      <span>{level.icon}</span>
                      <span className="text-xs">{level.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="School Name (optional)"
                placeholder="University of Lagos"
                leftIcon={<Building2 className="w-4 h-4" />}
                value={formState.school_name}
                onChange={(e) => setFormState((prev) => ({ ...prev, school_name: e.target.value }))}
                id="register-school"
              />
              <Input
                label="Department (optional)"
                placeholder="Computer Science"
                leftIcon={<GraduationCap className="w-4 h-4" />}
                value={formState.department}
                onChange={(e) => setFormState((prev) => ({ ...prev, department: e.target.value }))}
                id="register-department"
              />
              <Input
                label="Class/Level (optional)"
                placeholder="e.g. SS3, 200L, Year 2"
                value={formState.class_level}
                onChange={(e) => setFormState((prev) => ({ ...prev, class_level: e.target.value }))}
                id="register-class"
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={() => setStep(1)}
                  id="step2-back"
                >
                  ← Back
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  onClick={onStep2Next}
                  disabled={!formState.educational_level}
                  id="step2-next"
                >
                  Next Step →
                </Button>
              </div>
              <button
                type="button"
                onClick={onStep2Next}
                className="w-full text-center text-xs text-[#4A5568] hover:text-[#8892A4] transition-colors py-1"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-6 text-center">
              <h2 className="font-heading text-2xl font-bold mb-1">
                Your <span className="gradient-text">Subjects</span>
              </h2>
              <p className="text-[#8892A4] text-sm">Step 3 of 3 — Select subjects you study</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
                {availableSubjects.map((subject) => {
                  const selected = formState.preferred_subjects.includes(subject);
                  return (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className={cn(
                        'px-3.5 py-2 rounded-full text-sm font-medium transition-all border',
                        selected
                          ? 'bg-gradient-to-r from-[#7C6FFF] to-[#00D4FF] border-transparent text-white shadow-lg shadow-[rgba(124,111,255,0.3)]'
                          : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-[#8892A4] hover:border-[rgba(124,111,255,0.3)] hover:text-[#F0F0FF]'
                      )}
                    >
                      {selected && <Check className="w-3 h-3 inline mr-1" />}
                      {subject}
                    </button>
                  );
                })}
              </div>

              {formState.preferred_subjects.length > 0 && (
                <p className="text-xs text-[#7C6FFF]">
                  {formState.preferred_subjects.length} subject{formState.preferred_subjects.length > 1 ? 's' : ''} selected
                </p>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="ghost" fullWidth onClick={() => setStep(2)} id="step3-back">
                  ← Back
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  onClick={onFinalSubmit}
                  loading={registerMutation.isPending}
                  id="step3-submit"
                >
                  Create Account 🎉
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
