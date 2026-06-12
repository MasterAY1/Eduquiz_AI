'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileText,
  Brain,
  Award,
  Zap,
  Flame,
  ChevronRight,
  Plus,
  Play,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboard();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 w-full lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-[rgba(255,107,107,0.1)] flex items-center justify-center">
          <Award className="w-8 h-8 text-[#FF6B6B]" />
        </div>
        <h3 className="text-xl font-bold font-heading text-[#F0F0FF]">Failed to load dashboard</h3>
        <p className="text-[#8892A4] max-w-sm">
          Something went wrong while retrieving your learning metrics. Please refresh the page.
        </p>
        <Button onClick={() => window.location.reload()} variant="primary">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 p-6 pb-12"
    >
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading">
            Welcome back, <span className="gradient-text">{user?.full_name?.split(' ')[0] || 'Learner'}</span>!
          </h1>
          <p className="text-[#8892A4] text-sm mt-1">
            Analyze new study material or review your recent attempts. Keep the momentum going!
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/app/documents">
            <Button variant="ghost" size="md" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Upload Material
            </Button>
          </Link>
          <Link href="/app/quizzes">
            <Button variant="primary" size="md" className="flex items-center gap-2 glow-primary">
              <Plus className="w-4 h-4" />
              Generate Quiz
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Streak */}
        <Card className="p-5 flex items-center gap-4 relative overflow-hidden group hover:border-[rgba(255,176,32,0.3)] transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-[rgba(255,176,32,0.1)] flex items-center justify-center text-[#FFB020] group-hover:scale-110 transition-transform">
            <Flame className="w-6 h-6 fill-[#FFB020]" />
          </div>
          <div>
            <p className="text-xs text-[#8892A4] font-medium uppercase tracking-wider">Day Streak</p>
            <p className="text-2xl font-bold font-heading text-[#FFB020] mt-0.5">{stats.streak_days} Days</p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 text-[#FFB020]">
            <Flame className="w-20 h-20 fill-[#FFB020]" />
          </div>
        </Card>

        {/* XP Points */}
        <Card className="p-5 flex items-center gap-4 relative overflow-hidden group hover:border-[rgba(124,111,255,0.3)] transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-[rgba(124,111,255,0.1)] flex items-center justify-center text-[#7C6FFF] group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6 fill-[#7C6FFF]" />
          </div>
          <div>
            <p className="text-xs text-[#8892A4] font-medium uppercase tracking-wider">Total XP</p>
            <p className="text-2xl font-bold font-heading text-[#7C6FFF] mt-0.5">{stats.xp_points} XP</p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 text-[#7C6FFF]">
            <Zap className="w-20 h-20 fill-[#7C6FFF]" />
          </div>
        </Card>

        {/* Quizzes Taken */}
        <Card className="p-5 flex items-center gap-4 relative overflow-hidden group hover:border-[rgba(0,212,255,0.3)] transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center text-[#00D4FF] group-hover:scale-110 transition-transform">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#8892A4] font-medium uppercase tracking-wider">Quizzes Taken</p>
            <p className="text-2xl font-bold font-heading text-[#00D4FF] mt-0.5">{stats.quizzes_taken}</p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 text-[#00D4FF]">
            <Brain className="w-20 h-20" />
          </div>
        </Card>

        {/* Average Score */}
        <Card className="p-5 flex items-center gap-4 relative overflow-hidden group hover:border-[rgba(0,229,160,0.3)] transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-[rgba(0,229,160,0.1)] flex items-center justify-center text-[#00E5A0] group-hover:scale-110 transition-transform">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#8892A4] font-medium uppercase tracking-wider">Average Score</p>
            <p className="text-2xl font-bold font-heading text-[#00E5A0] mt-0.5">{stats.average_score}%</p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 text-[#00E5A0]">
            <Award className="w-20 h-20" />
          </div>
        </Card>
      </motion.div>

      {/* Main Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Attempts list */}
        <Card className="lg:col-span-2 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold font-heading text-[#F0F0FF]">Recent Quiz Attempts</h2>
              <p className="text-xs text-[#8892A4]">Your performance over your latest evaluations</p>
            </div>
            <Link href="/app/quizzes" className="text-xs font-semibold text-[#7C6FFF] hover:text-[#9D93FF] flex items-center gap-1 transition-colors">
              View All Quizzes
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {stats.recent_attempts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-[#8892A4]">
                <Brain className="w-10 h-10 mb-3 opacity-30 text-[#8892A4]" />
                <p className="text-sm font-medium">No quiz attempts yet</p>
                <p className="text-xs mt-1">Generate and attempt a quiz to see your scores here.</p>
              </div>
            ) : (
              stats.recent_attempts.map((attempt) => (
                <div
                  key={attempt.attempt_id}
                  className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.04)] transition-all duration-200"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-[#F0F0FF]">{attempt.quiz_title}</p>
                    <p className="text-xs text-[#8892A4]">
                      {attempt.created_at
                        ? formatDistanceToNow(new Date(attempt.created_at), { addSuffix: true })
                        : 'Recently Completed'}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-bold text-[#F0F0FF]">
                        {attempt.score}/{attempt.max_score}
                      </p>
                      <p className="text-[10px] text-[#8892A4] font-medium uppercase">{attempt.percentage}%</p>
                    </div>
                    <Link href={`/app/quizzes/attempt/${attempt.attempt_id}`}>
                      <Button variant="ghost" size="sm" className="p-2.5">
                        <Play className="w-3.5 h-3.5 fill-[#F0F0FF]" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Documents list */}
        <Card className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold font-heading text-[#F0F0FF]">Study Materials</h2>
              <p className="text-xs text-[#8892A4]">Recently uploaded files</p>
            </div>
            <Link href="/app/documents" className="text-xs font-semibold text-[#7C6FFF] hover:text-[#9D93FF] flex items-center gap-1 transition-colors">
              Library
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {stats.recent_documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-[#8892A4]">
                <FileText className="w-10 h-10 mb-3 opacity-30 text-[#8892A4]" />
                <p className="text-sm font-medium">No documents yet</p>
                <p className="text-xs mt-1">Upload a file to create your custom knowledge base.</p>
              </div>
            ) : (
              stats.recent_documents.map((doc) => (
                <Link key={doc.id} href={`/app/documents/${doc.id}`} className="block">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(124,111,255,0.2)] transition-all duration-200">
                    <div className="w-9 h-9 rounded-lg bg-[rgba(124,111,255,0.1)] flex items-center justify-center text-[#7C6FFF]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-[#F0F0FF] truncate">{doc.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[#8892A4] uppercase font-bold">{doc.source_type}</span>
                        <span className="text-[#4A5568] text-[9px]">•</span>
                        <span className={`text-[10px] font-medium ${
                          doc.analysis_status === 'indexed' ? 'text-[#00E5A0]' :
                          doc.analysis_status === 'failed' ? 'text-[#FF6B6B]' :
                          'text-[#FFB020]'
                        }`}>
                          {doc.analysis_status === 'indexed' ? 'Ready' :
                           doc.analysis_status === 'failed' ? 'Failed' :
                           doc.analysis_status === 'processing' ? 'Processing…' :
                           'Pending'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#4A5568]" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
