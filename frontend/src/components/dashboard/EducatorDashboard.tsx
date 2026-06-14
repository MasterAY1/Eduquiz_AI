import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileText,
  Brain,
  Users,
  BarChart3,
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

export function EducatorDashboard() {
  const { data: stats } = useDashboard();
  const { user } = useAuth();

  const activeProfile = user?.learning_profiles?.find(p => p.is_active);

  if (!stats) return null;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-purple-900/40 to-fuchsia-900/40 p-8 rounded-3xl border border-purple-500/20 shadow-xl shadow-purple-500/5">
        <div>
          <div className="flex items-center gap-2 mb-2 text-purple-400 text-sm font-semibold tracking-wider uppercase">
            <Users className="w-4 h-4" />
            <span>Educator Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-white">
            Welcome, <span className="text-purple-400">{user?.full_name?.split(' ')[0] || 'Teacher'}</span>
          </h1>
          <p className="text-purple-200/70 text-sm mt-2 max-w-xl">
            Manage your classroom materials, generate AI-powered assessments, and track performance.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/app/documents">
            <Button variant="secondary" className="bg-white/5 border-white/10 hover:bg-purple-500/20 hover:border-purple-500/50 hover:text-purple-400 w-full">
              <FileText className="w-4 h-4 mr-2" />
              Upload Material
            </Button>
          </Link>
          <Link href="/app/quizzes">
            <Button className="bg-purple-600 hover:bg-purple-500 text-white w-full border-none shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <Plus className="w-4 h-4 mr-2" />
              Create Assessment
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center gap-4 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
            <FileText className="w-7 h-7 fill-purple-500" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Materials Uploaded</p>
            <p className="text-3xl font-bold font-heading text-white mt-1">{stats.total_documents}</p>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center gap-4 relative overflow-hidden group hover:border-fuchsia-500/30 transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-500 group-hover:scale-110 transition-transform">
            <Brain className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Assessments Created</p>
            <p className="text-3xl font-bold font-heading text-white mt-1">{stats.total_quizzes}</p>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4 relative overflow-hidden group hover:border-pink-500/30 transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Student Engagement</p>
            <p className="text-3xl font-bold font-heading text-white mt-1">{stats.quizzes_taken}</p>
          </div>
        </Card>
      </motion.div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Recent Materials
            </h2>
            <Link href="/app/documents" className="text-sm text-purple-400 hover:text-purple-300 font-medium">
              View All
            </Link>
          </div>
          {stats.recent_documents.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-2 border-white/10 bg-white/5">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 mb-6">No teaching materials uploaded.</p>
              <Link href="/app/documents">
                <Button className="bg-purple-600 hover:bg-purple-500 text-white">Upload Syllabus or Notes</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {stats.recent_documents.slice(0, 4).map((doc) => (
                <Link key={doc.id} href={`/app/documents/${doc.id}`}>
                  <Card className="p-4 flex items-center justify-between hover:border-purple-500/30 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-purple-400 transition-colors">
                          {doc.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {doc.created_at ? formatDistanceToNow(new Date(doc.created_at), { addSuffix: true }) : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400" />
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Recent Assessments
            </h2>
            <Link href="/app/quizzes" className="text-sm text-purple-400 hover:text-purple-300 font-medium">
              View All
            </Link>
          </div>
          {stats.total_quizzes === 0 ? (
            <Card className="p-8 text-center border-dashed border-2 border-white/10 bg-white/5">
              <Brain className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 mb-6">No assessments created.</p>
              <Link href="/app/quizzes">
                <Button className="bg-purple-600 hover:bg-purple-500 text-white">Generate Assessment</Button>
              </Link>
            </Card>
          ) : (
            <Card className="p-8 text-center bg-white/5">
              <BarChart3 className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Assessments Active</h3>
              <p className="text-slate-400 max-w-sm mx-auto">
                Navigate to the Quizzes page to manage your generated assessments and view participant results.
              </p>
              <Link href="/app/quizzes">
                <Button variant="secondary" className="mt-6 border-purple-500/50 text-purple-400 hover:bg-purple-500/10">Manage Assessments</Button>
              </Link>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
