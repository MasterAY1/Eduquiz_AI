'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Plus, GraduationCap, BookOpen, School, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { authApi } from '@/lib/api/auth';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'next/navigation';

const personaConfig = {
  exam_candidate: { icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  tertiary_student: { icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  educator: { icon: UserIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

export function ProfileSwitcher() {
  const { user, refetchUser } = useAuth();
  const addToast = useUIStore((s) => s.addToast);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!user || !user.learning_profiles) return null;

  const activeProfile = user.learning_profiles.find((p) => p.is_active) || user.learning_profiles[0];
  if (!activeProfile) return null;

  const ActiveIcon = personaConfig[activeProfile.persona]?.icon || BookOpen;
  const activeColor = personaConfig[activeProfile.persona]?.color || 'text-emerald-400';
  const activeBg = personaConfig[activeProfile.persona]?.bg || 'bg-emerald-500/10';

  const handleSwitch = async (profileId: string) => {
    if (profileId === activeProfile.id) {
      setIsOpen(false);
      return;
    }
    
    setLoadingId(profileId);
    try {
      await authApi.activateProfile(profileId);
      await refetchUser();
      addToast({ type: 'success', message: 'Profile switched successfully!' });
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to switch profile' });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", activeBg)}>
            <ActiveIcon className={cn("w-4 h-4", activeColor)} />
          </div>
          <div className="text-left flex flex-col">
            <span className="text-sm font-semibold text-white">
              {activeProfile.academic_category.charAt(0).toUpperCase() + activeProfile.academic_category.slice(1)}
            </span>
            <span className="text-[10px] text-slate-400">
              {activeProfile.institution_name || 'Personalized Dashboard'}
            </span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full left-0 right-0 mt-2 p-2 rounded-xl border border-white/10 bg-surface/90 backdrop-blur-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="px-2 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Switch Profile
              </div>
              
              <div className="space-y-1">
                {user.learning_profiles.map((profile) => {
                  const Icon = personaConfig[profile.persona]?.icon || BookOpen;
                  const isActive = profile.id === activeProfile.id;
                  const isLoading = loadingId === profile.id;
                  
                  return (
                    <button
                      key={profile.id}
                      onClick={() => handleSwitch(profile.id)}
                      disabled={isLoading}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-lg text-sm transition-all",
                        isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{profile.academic_category.charAt(0).toUpperCase() + profile.academic_category.slice(1)}</span>
                      </div>
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      ) : isActive ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/app/onboarding');
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-sm text-emerald-400 hover:bg-emerald-500/10 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Profile</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
