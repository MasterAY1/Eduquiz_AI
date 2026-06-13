'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Settings,
  User as UserIcon,
  School,
  BookOpen,
  LogOut,
  Save,
  Award,
  Zap,
  Flame,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();

  // Profile fields state
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [department, setDepartment] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [preferredSubjectsString, setPreferredSubjectsString] = useState('');

  // Hydrate fields on user load
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setSchoolName(user.school_name || '');
      setDepartment(user.department || '');
      setClassLevel(user.class_level || '');
      setPreferredSubjectsString((user.preferred_subjects || []).join(', '));
    }
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const preferred_subjects = preferredSubjectsString
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    updateProfile.mutate({
      full_name: fullName,
      school_name: schoolName || undefined,
      department: department || undefined,
      class_level: classLevel || undefined,
      preferred_subjects,
    });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 space-y-8 pb-12 max-w-4xl mx-auto"
    >
      {/* Title */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading">
          Account <span className="text-emerald-400">Settings</span>
        </h1>
        <p className="text-[slate-400] text-sm mt-1">
          Manage your personal information, school details, and learning subjects.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Card: Summary of stats & Logout */}
        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="p-6 text-center space-y-6 bg-gradient-to-b from-emerald-500/5 to-transparent">
            {/* Avatar & Info */}
            <div className="space-y-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[emerald-400] to-[sky-400] flex items-center justify-center text-[white] text-2xl font-bold font-heading mx-auto">
                {user?.full_name?.split(' ').map((n) => n[0]).join('') || 'U'}
              </div>
              <div>
                <h3 className="font-bold text-lg text-[white] leading-snug">{user?.full_name}</h3>
                <p className="text-xs text-[slate-400] mt-0.5">{user?.email}</p>
              </div>
              <Badge className="bg-emerald-500/15 text-[emerald-300] border border-emerald-500/25 font-semibold text-xs capitalize">
                {user?.educational_level || 'student'}
              </Badge>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 border-y border-white/10 py-5 text-left text-xs">
              <div className="space-y-1 text-center">
                <Flame className="w-4 h-4 text-[amber-400] mx-auto fill-current" />
                <p className="text-[10px] text-[slate-400] font-bold uppercase">Streak</p>
                <p className="font-bold text-[white]">{user?.streak_days || 0} days</p>
              </div>
              
              <div className="space-y-1 text-center border-x border-white/10">
                <Zap className="w-4 h-4 text-[emerald-400] mx-auto fill-current" />
                <p className="text-[10px] text-[slate-400] font-bold uppercase">XP</p>
                <p className="font-bold text-[white]">{user?.xp_points || 0}</p>
              </div>

              <div className="space-y-1 text-center">
                <Award className="w-4 h-4 text-[emerald-400] mx-auto" />
                <p className="text-[10px] text-[slate-400] font-bold uppercase">Level</p>
                <p className="font-bold text-[white]">Learner</p>
              </div>
            </div>

            {/* Logout button */}
            <Button
              onClick={logout}
              variant="ghost"
              className="w-full text-xs text-[rose-500] hover:bg-rose-500/15 hover:text-[rose-500] border-rose-500/20 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </Card>
        </motion.div>

        {/* Right Pane: Settings Form */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <UserIcon className="w-5 h-5 text-[emerald-400]" />
              <h2 className="text-xl font-bold font-heading text-[white]">Personal Information</h2>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              {/* Name & Email with Avatar Layout */}
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start bg-white/5 p-4 sm:p-6 rounded-2xl border border-white/10">
                <div className="flex flex-col items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-400 to-sky-400 p-[3px] flex-shrink-0 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                    <div className="w-full h-full rounded-full bg-[#0a0a1a] flex items-center justify-center">
                      <span className="text-3xl font-bold font-heading text-white">
                        {user?.full_name?.split(' ').map((n) => n[0]).join('') || 'U'}
                      </span>
                    </div>
                  </div>
                  <button type="button" className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors">
                    Upload Photo
                  </button>
                </div>
                
                <div className="flex-1 space-y-5 w-full">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[slate-400] uppercase tracking-wider flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5 text-emerald-500" /> Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-glass bg-[#0F0F2D] border-white/5"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[slate-500] uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Email Address <span className="text-emerald-500/70 ml-auto lowercase text-[10px]">Primary</span>
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="input-glass bg-[#0F0F2D] border-white/5 opacity-60 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* School Information */}
              <div className="space-y-5 pt-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <School className="w-5 h-5 text-[sky-400]" />
                  <h3 className="font-heading font-semibold text-base text-[white]">School & Department</h3>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[slate-400] uppercase tracking-wider">School / University</label>
                    <input
                      type="text"
                      placeholder="e.g. University of Ibadan"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="input-glass"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[slate-400] uppercase tracking-wider">Department / Faculty</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="input-glass"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[slate-400] uppercase tracking-wider">Class Level</label>
                    <input
                      type="text"
                      placeholder="e.g. 100 Level, SS3"
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value)}
                      className="input-glass"
                    />
                  </div>
                </div>
              </div>

              {/* Preferred Subjects */}
              <div className="space-y-5 pt-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <BookOpen className="w-5 h-5 text-[emerald-400]" />
                  <h3 className="font-heading font-semibold text-base text-[white]">Subjects Interests</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[slate-400] uppercase tracking-wider">Preferred Subjects</label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics, Biology, Chemistry (comma-separated)"
                    value={preferredSubjectsString}
                    onChange={(e) => setPreferredSubjectsString(e.target.value)}
                    className="input-glass"
                  />
                  <p className="text-[10px] text-[slate-400]">
                    Type your subjects separated by commas (e.g. "Physics, Chemistry, English").
                  </p>
                </div>
              </div>

              {/* Submit btn */}
              <div className="pt-6 border-t border-white/10 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full sm:w-auto font-semibold flex items-center justify-center gap-2 px-8 py-3 glow-primary"
                  disabled={updateProfile.isPending}
                >
                  <Save className="w-4 h-4" />
                  {updateProfile.isPending ? 'Saving...' : 'Save Profile Settings'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
