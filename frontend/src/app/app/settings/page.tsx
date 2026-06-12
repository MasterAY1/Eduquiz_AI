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
          Account <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-[#8892A4] text-sm mt-1">
          Manage your personal information, school details, and learning subjects.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Card: Summary of stats & Logout */}
        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="p-6 text-center space-y-6 bg-gradient-to-b from-[rgba(124,111,255,0.03)] to-transparent">
            {/* Avatar & Info */}
            <div className="space-y-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#7C6FFF] to-[#00D4FF] flex items-center justify-center text-[#F0F0FF] text-2xl font-bold font-heading mx-auto">
                {user?.full_name?.split(' ').map((n) => n[0]).join('') || 'U'}
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#F0F0FF] leading-snug">{user?.full_name}</h3>
                <p className="text-xs text-[#8892A4] mt-0.5">{user?.email}</p>
              </div>
              <Badge className="bg-[rgba(124,111,255,0.15)] text-[#9D93FF] border border-[rgba(124,111,255,0.25)] font-semibold text-xs capitalize">
                {user?.educational_level || 'student'}
              </Badge>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 border-y border-[rgba(255,255,255,0.06)] py-5 text-left text-xs">
              <div className="space-y-1 text-center">
                <Flame className="w-4 h-4 text-[#FFB020] mx-auto fill-current" />
                <p className="text-[10px] text-[#8892A4] font-bold uppercase">Streak</p>
                <p className="font-bold text-[#F0F0FF]">{user?.streak_days || 0} days</p>
              </div>
              
              <div className="space-y-1 text-center border-x border-[rgba(255,255,255,0.06)]">
                <Zap className="w-4 h-4 text-[#7C6FFF] mx-auto fill-current" />
                <p className="text-[10px] text-[#8892A4] font-bold uppercase">XP</p>
                <p className="font-bold text-[#F0F0FF]">{user?.xp_points || 0}</p>
              </div>

              <div className="space-y-1 text-center">
                <Award className="w-4 h-4 text-[#00E5A0] mx-auto" />
                <p className="text-[10px] text-[#8892A4] font-bold uppercase">Level</p>
                <p className="font-bold text-[#F0F0FF]">Learner</p>
              </div>
            </div>

            {/* Logout button */}
            <Button
              onClick={logout}
              variant="ghost"
              className="w-full text-xs text-[#FF6B6B] hover:bg-[rgba(255,107,107,0.15)] hover:text-[#FF6B6B] border-[rgba(255,107,107,0.2)] flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </Card>
        </motion.div>

        {/* Right Pane: Settings Form */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-4">
              <UserIcon className="w-5 h-5 text-[#7C6FFF]" />
              <h2 className="text-xl font-bold font-heading text-[#F0F0FF]">Personal Information</h2>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-glass"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#4A5568] uppercase tracking-wider">Email Address (Read-only)</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="input-glass opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* School Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-2 pt-2">
                  <School className="w-4 h-4 text-[#00D4FF]" />
                  <h3 className="font-heading font-semibold text-sm text-[#F0F0FF]">School & Department</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8892A4] uppercase tracking-wider">School / University</label>
                    <input
                      type="text"
                      placeholder="e.g. University of Ibadan"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="input-glass"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Department / Faculty</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="input-glass"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Class Level</label>
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
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-2 pt-2">
                  <BookOpen className="w-4 h-4 text-[#00E5A0]" />
                  <h3 className="font-heading font-semibold text-sm text-[#F0F0FF]">Subjects Interests</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Preferred Subjects</label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics, Biology, Chemistry (comma-separated)"
                    value={preferredSubjectsString}
                    onChange={(e) => setPreferredSubjectsString(e.target.value)}
                    className="input-glass"
                  />
                  <p className="text-[10px] text-[#8892A4]">
                    Type your subjects separated by commas (e.g. "Physics, Chemistry, English").
                  </p>
                </div>
              </div>

              {/* Submit btn */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full sm:w-auto font-semibold flex items-center justify-center gap-2 px-6 py-3 glow-primary"
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
