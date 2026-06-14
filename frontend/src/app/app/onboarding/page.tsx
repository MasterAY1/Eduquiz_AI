'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, GraduationCap, School, Check, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { authApi } from '@/lib/api/auth';
import { useUIStore } from '@/store/uiStore';

const ACADEMIC_CATEGORIES = [
  { id: 'waec', label: 'WAEC', icon: BookOpen },
  { id: 'neco', label: 'NECO', icon: BookOpen },
  { id: 'jamb', label: 'JAMB', icon: BookOpen },
  { id: 'polytechnic', label: 'Polytechnic', icon: School },
  { id: 'university', label: 'University', icon: GraduationCap },
  { id: 'teacher', label: 'Teacher/Lecturer', icon: UserIcon },
];

const PRESET_SUBJECTS = ['Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics', 'Economics', 'Government', 'Literature', 'Accounting', 'Commerce'];

export default function OnboardingWizard() {
  const router = useRouter();
  const { user, refetchUser } = useAuth();
  const addToast = useUIStore((s) => s.addToast);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    academic_category: '',
    subjects: [] as string[],
    institution: '',
    faculty: '',
    department: '',
    level: '',
  });

  const handleCategorySelect = (id: string) => {
    setForm({ ...form, academic_category: id });
  };

  const toggleSubject = (sub: string) => {
    setForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(sub)
        ? prev.subjects.filter(s => s !== sub)
        : [...prev.subjects, sub]
    }));
  };

  const isExamCandidate = ['waec', 'neco', 'jamb'].includes(form.academic_category);
  const isTertiary = ['polytechnic', 'university'].includes(form.academic_category);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let persona: 'exam_candidate' | 'tertiary_student' | 'educator' = 'exam_candidate';
      if (isTertiary) persona = 'tertiary_student';
      if (form.academic_category === 'teacher') persona = 'educator';

      await authApi.createProfile({
        persona,
        academic_category: form.academic_category,
        institution_name: form.institution || undefined,
        faculty: form.faculty || undefined,
        department: form.department || undefined,
        academic_level: form.level || undefined,
        preferred_subjects: form.subjects.length > 0 ? form.subjects : undefined,
      });

      await refetchUser();
      addToast({ type: 'success', message: 'Profile set up successfully!' });
      router.push('/app/dashboard');
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to set up profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Mesh Background */}
      <div className="mesh-bg">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xl glass-card p-8 md:p-12"
      >
        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Welcome, {user?.full_name?.split(' ')[0]}!</h1>
          <p className="text-slate-400">Let's personalize your learning experience.</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-lg font-bold text-white mb-6">What are you preparing for?</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {ACADEMIC_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all',
                      form.academic_category === cat.id
                        ? 'bg-emerald-500/15 border-emerald-500 shadow-lg shadow-emerald-500/20 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-emerald-500/50 hover:text-white'
                    )}
                  >
                    <cat.icon className="w-6 h-6" />
                    <span className="font-medium text-sm">{cat.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!form.academic_category}
                  variant="primary"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {isExamCandidate && (
                <>
                  <h2 className="text-lg font-bold text-white mb-2">Select your subjects</h2>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_SUBJECTS.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => toggleSubject(sub)}
                        className={cn(
                          'px-3.5 py-2 rounded-full text-sm font-medium transition-all border',
                          form.subjects.includes(sub)
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-emerald-500/30 hover:text-white'
                        )}
                      >
                        {form.subjects.includes(sub) && <Check className="w-3 h-3 inline mr-1" />}
                        {sub}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {isTertiary && (
                <>
                  <h2 className="text-lg font-bold text-white mb-4">Academic Details</h2>
                  <div className="space-y-4">
                    <Input
                      label="Institution Name"
                      placeholder="University of Lagos"
                      value={form.institution}
                      onChange={(e) => setForm({ ...form, institution: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Faculty"
                        placeholder="Science"
                        value={form.faculty}
                        onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                      />
                      <Input
                        label="Department"
                        placeholder="Computer Science"
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                      />
                    </div>
                    <Input
                      label="Current Level"
                      placeholder="300 Level"
                      value={form.level}
                      onChange={(e) => setForm({ ...form, level: e.target.value })}
                    />
                  </div>
                </>
              )}

              {form.academic_category === 'teacher' && (
                <div className="text-slate-400 text-center py-8">
                  Awesome! As an educator, you'll be able to create assessments, upload materials, and track student analytics.
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-white/10">
                <Button onClick={() => setStep(1)} variant="ghost">Back</Button>
                <Button onClick={handleSubmit} variant="primary" loading={loading}>Complete Setup 🎉</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
