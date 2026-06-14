import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileText,
  Brain,
  Zap,
  Flame,
  Plus,
  Play,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};

export function ExamCandidateDashboard() {
  const { data: stats } = useDashboard();
  const { user } = useAuth();

  const activeProfile = user?.learning_profiles?.find(p => p.is_active);

  if (!stats) return null;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-white">
            Welcome back, <span className="text-emerald-400">{user?.full_name?.split(' ')[0] || 'Learner'}</span>!
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Preparing for {activeProfile?.target_exam || 'your exams'}? Let's get to work!
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
        <Card className="p-5 flex items-center gap-4 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Day Streak</p>
            <p className="text-2xl font-bold font-heading text-amber-500 mt-0.5">{stats.streak_days} Days</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6 fill-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total XP</p>
            <p className="text-2xl font-bold font-heading text-emerald-500 mt-0.5">{stats.xp_points} XP</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 relative overflow-hidden group hover:border-sky-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Quizzes Taken</p>
            <p className="text-2xl font-bold font-heading text-sky-400 mt-0.5">{stats.quizzes_taken}</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Avg Score</p>
            <p className="text-2xl font-bold font-heading text-rose-400 mt-0.5">{stats.average_score}%</p>
          </div>
        </Card>
      </motion.div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold font-heading text-white">Recent Mock Exams & Quizzes</h2>
          {stats.recent_attempts.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-2 border-white/10 bg-white/5">
              <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No quizzes taken yet</h3>
              <p className="text-slate-400 max-w-sm mx-auto mb-6">
                Generate a quiz from your uploaded materials to test your knowledge.
              </p>
              <Link href="/app/quizzes">
                <Button variant="primary">Generate Your First Quiz</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {stats.recent_attempts.map((attempt) => (
                <Card key={attempt.attempt_id} className="p-4 flex items-center justify-between group hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white line-clamp-1">{attempt.quiz_title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {attempt.completed_at ? formatDistanceToNow(new Date(attempt.completed_at), { addSuffix: true }) : 'Recently'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-emerald-400">{attempt.percentage}%</p>
                      <p className="text-xs text-slate-500">Score</p>
                    </div>
                    <Link href={`/app/quizzes/${attempt.quiz_id}/results?attempt=${attempt.attempt_id}`}>
                      <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10">
                        <Play className="w-4 h-4 ml-0.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading text-white">Recent Documents</h2>
            <Link href="/app/documents" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium">
              View All
            </Link>
          </div>
          {stats.recent_documents.length === 0 ? (
            <Card className="p-6 text-center border-dashed border-2 border-white/10 bg-white/5">
              <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-400 mb-4">No documents uploaded.</p>
              <Link href="/app/documents">
                <Button variant="secondary" size="sm">Upload Document</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {stats.recent_documents.map((doc) => (
                <Link key={doc.id} href={`/app/documents/${doc.id}`}>
                  <Card className="p-3 flex items-center gap-3 hover:border-emerald-500/30 transition-colors group cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
                        {doc.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">{doc.source_type}</span>
                        <span className="text-[10px] text-slate-500">•</span>
                        <span className="text-[10px] text-slate-500 truncate">
                          {doc.created_at ? formatDistanceToNow(new Date(doc.created_at), { addSuffix: true }) : 'Recently'}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
