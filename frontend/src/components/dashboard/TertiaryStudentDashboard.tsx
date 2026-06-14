import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileText,
  Brain,
  Library,
  BookOpen,
  Plus,
  ArrowRight,
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

export function TertiaryStudentDashboard() {
  const { data: stats } = useDashboard();
  const { user } = useAuth();

  const activeProfile = user?.learning_profiles?.find(p => p.is_active);

  if (!stats) return null;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 p-8 rounded-3xl border border-blue-500/20 shadow-xl shadow-blue-500/5">
        <div>
          <div className="flex items-center gap-2 mb-2 text-blue-400 text-sm font-semibold tracking-wider uppercase">
            <Library className="w-4 h-4" />
            <span>{activeProfile?.institution_name || 'Tertiary Institution'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-white">
            Welcome, <span className="text-blue-400">{user?.full_name?.split(' ')[0] || 'Scholar'}</span>
          </h1>
          <p className="text-blue-200/70 text-sm mt-2 max-w-xl">
            {activeProfile?.faculty && activeProfile?.department
              ? `Studying in the Department of ${activeProfile.department}, Faculty of ${activeProfile.faculty}.`
              : 'Organize your lecture notes, generate practice quizzes, and stay ahead of your coursework.'}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/app/documents">
            <Button variant="secondary" className="bg-white/5 border-white/10 hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-400">
              <FileText className="w-4 h-4 mr-2" />
              Upload Lecture Note
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Course Materials
          </h2>
          {stats.recent_documents.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-2 border-white/10 bg-white/5">
              <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No materials uploaded</h3>
              <p className="text-slate-400 max-w-sm mx-auto mb-6">
                Upload your PDFs, slides, or lecture notes to get AI summaries and quizzes.
              </p>
              <Link href="/app/documents">
                <Button variant="primary" className="bg-blue-500 hover:bg-blue-600">Upload Now</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats.recent_documents.map((doc) => (
                <Link key={doc.id} href={`/app/documents/${doc.id}`}>
                  <Card className="p-5 hover:border-blue-500/30 transition-colors group cursor-pointer h-full flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {doc.title}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-md uppercase font-bold">
                        {doc.source_type}
                      </span>
                      <span className="text-xs text-slate-500">
                        {doc.created_at ? formatDistanceToNow(new Date(doc.created_at), { addSuffix: true }) : 'Recently'}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading text-white">Recent Quizzes</h2>
            <Link href="/app/quizzes" className="text-sm text-blue-400 hover:text-blue-300 font-medium">
              View All
            </Link>
          </div>
          {stats.recent_attempts.length === 0 ? (
            <Card className="p-6 text-center border-dashed border-2 border-white/10 bg-white/5">
              <Brain className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-400 mb-4">No practice quizzes taken.</p>
              <Link href="/app/quizzes">
                <Button variant="secondary" size="sm" className="hover:text-blue-400 hover:border-blue-400">Generate Quiz</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {stats.recent_attempts.map((attempt) => (
                <Link key={attempt.attempt_id} href={`/app/quizzes/${attempt.quiz_id}/results?attempt=${attempt.attempt_id}`}>
                  <Card className="p-4 flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                    <div>
                      <h4 className="font-semibold text-white text-sm line-clamp-1">{attempt.quiz_title}</h4>
                      <p className="text-xs text-slate-400 mt-1">Score: <span className="text-blue-400 font-bold">{attempt.percentage}%</span></p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
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
