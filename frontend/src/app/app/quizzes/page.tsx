'use client';

import { Suspense } from 'react';
import { useQuizzes, useGenerateQuiz } from '@/hooks/useQuizzes';
import { useDocuments } from '@/hooks/useDocuments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { Badge } from '@/components/ui/Badge';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Brain,
  Plus,
  Play,
  FileText,
  Clock,
  Sparkles,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const difficultyColors = {
  easy: 'bg-emerald-400/10 text-[emerald-400] border border-emerald-500/20',
  medium: 'bg-amber-500/10 text-[amber-400] border border-amber-500/20',
  hard: 'bg-rose-500/10 text-[rose-500] border border-rose-500/20',
};

function QuizzesContent() {
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get('docId');

  const { data: quizzes, isLoading: loadingQuizzes } = useQuizzes();
  const { data: documentsData, isLoading: loadingDocs } = useDocuments();
  const { mutate: generateQuiz, isPending: generating } = useGenerateQuiz();

  // Form State
  const [selectedDocId, setSelectedDocId] = useState('');
  const [examStyle, setExamStyle] = useState('standard');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [questionTypes, setQuestionTypes] = useState<string[]>(['mcq']);
  const [timeLimit, setTimeLimit] = useState<number | ''>('');

  useEffect(() => {
    if (docIdParam) {
      setSelectedDocId(docIdParam);
    } else if (documentsData?.items && documentsData.items.length > 0) {
      // Find first indexed document
      const firstIndexed = documentsData.items.find((d) => d.analysis_status === 'indexed');
      if (firstIndexed) {
        setSelectedDocId(firstIndexed.id);
      }
    }
  }, [docIdParam, documentsData]);

  const handleTypeToggle = (type: string) => {
    if (questionTypes.includes(type)) {
      if (questionTypes.length > 1) {
        setQuestionTypes(questionTypes.filter((t) => t !== type));
      }
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId) return;

    generateQuiz({
      document_id: selectedDocId,
      exam_style: examStyle,
      difficulty,
      question_count: questionCount,
      question_types: questionTypes,
      time_limit_minutes: timeLimit === '' ? undefined : timeLimit,
    });
  };

  const docs = documentsData?.items || [];
  const readyDocs = docs.filter((d) => d.analysis_status === 'indexed');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 space-y-8 pb-12 max-w-7xl mx-auto"
    >
      {/* Page Title */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading">
          Practice <span className="text-emerald-400">Quizzes</span>
        </h1>
        <p className="text-[slate-400] text-sm mt-1">
          Challenge yourself with custom generated assessments synced to your learning library.
        </p>
      </motion.div>

      {/* Generator & List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Generator Form Card */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="p-6 md:p-8 space-y-6 border-emerald-500/15 relative overflow-hidden">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[emerald-400]" />
              <h2 className="text-xl font-bold font-heading text-[white]">AI Generator</h2>
            </div>

            {readyDocs.length === 0 ? (
              <div className="text-center py-6 text-xs text-[slate-400] space-y-3">
                <AlertCircle className="w-8 h-8 text-[amber-400] mx-auto opacity-80" />
                <p>You need at least one successfully indexed document in your library to generate a quiz.</p>
                <Link href="/app/documents" className="block pt-2">
                  <Button variant="primary" size="sm">
                    Upload Material
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleGenerate} className="space-y-4">
                {/* Select Material */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[slate-400] uppercase tracking-wider">Select Study Material</label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="input-glass select-arrow"
                    required
                  >
                    {readyDocs.map((doc) => (
                      <option key={doc.id} value={doc.id} className="bg-[#0F0F2D] text-[white]">
                        {doc.title} ({doc.subject || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Exam Style */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[slate-400] uppercase tracking-wider">Exam Format Style</label>
                  <select
                    value={examStyle}
                    onChange={(e) => setExamStyle(e.target.value)}
                    className="input-glass"
                  >
                    <option value="standard" className="bg-[#0F0F2D]">Standard (General Practice)</option>
                    <option value="waec" className="bg-[#0F0F2D]">WAEC Format (5 Options)</option>
                    <option value="jamb" className="bg-[#0F0F2D]">JAMB Format (4 Options)</option>
                    <option value="neco" className="bg-[#0F0F2D]">NECO Format (5 Options)</option>
                    <option value="bece" className="bg-[#0F0F2D]">BECE Junior Secondary Format</option>
                    <option value="university_theory" className="bg-[#0F0F2D]">University Theory Exam (Sub-parts)</option>
                  </select>
                </div>

                {/* Difficulty & Count */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[slate-400] uppercase tracking-wider">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="input-glass"
                    >
                      <option value="easy" className="bg-[#0F0F2D]">Easy</option>
                      <option value="medium" className="bg-[#0F0F2D]">Medium</option>
                      <option value="hard" className="bg-[#0F0F2D]">Hard</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[slate-400] uppercase tracking-wider">Questions</label>
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="input-glass"
                    >
                      <option value="5" className="bg-[#0F0F2D]">5</option>
                      <option value="10" className="bg-[#0F0F2D]">10</option>
                      <option value="20" className="bg-[#0F0F2D]">20</option>
                      <option value="30" className="bg-[#0F0F2D]">30</option>
                      <option value="50" className="bg-[#0F0F2D]">50</option>
                    </select>
                  </div>
                </div>

                {/* Time Limit */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[slate-400] uppercase tracking-wider">Time Limit (Minutes)</label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value === '' ? '' : Number(e.target.value))}
                    min={1}
                    max={180}
                    className="input-glass"
                  />
                </div>

                {/* Question Types */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[slate-400] uppercase tracking-wider block">Question Types</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'mcq', label: 'Multiple Choice' },
                      { key: 'fill_blank', label: 'Fill in Blank' },
                      { key: 'true_false', label: 'True / False' },
                      { key: 'theory', label: 'Theory / Essay' },
                    ].map((type) => (
                      <button
                        type="button"
                        key={type.key}
                        onClick={() => handleTypeToggle(type.key)}
                        className={`px-3 py-2 text-left text-xs font-semibold rounded-xl border transition-all ${
                          questionTypes.includes(type.key)
                            ? 'bg-[rgba(124,111,255,0.12)] text-[emerald-300] border-[rgba(124,111,255,0.4)]'
                            : 'bg-transparent text-[slate-400] border-white/10 hover:border-white/10'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-4 glow-primary"
                  disabled={generating}
                >
                  <Brain className="w-4 h-4" />
                  Generate Quiz
                </Button>
              </form>
            )}

            {/* Generator Loading Overlay */}
            {generating && (
              <div className="absolute inset-0 bg-slate-950/90 rounded-2xl flex flex-col items-center justify-center p-6 space-y-4">
                <Brain className="w-12 h-12 text-[emerald-400] animate-pulse" />
                <div className="space-y-1.5 text-center">
                  <h3 className="font-semibold text-base text-[white]">Creating Quiz...</h3>
                  <p className="text-xs text-[slate-400] max-w-[200px] leading-relaxed">
                    AI is analyzing your document chunks and formulating WAEC/JAMB format questions.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Quizzes List (Col span 2) */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <Card className="p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold font-heading text-[white]">Your Quizzes</h2>
              <p className="text-xs text-[slate-400] mt-0.5">Explore your generated assessments and test yourself</p>
            </div>

            {loadingQuizzes || loadingDocs ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
            ) : !quizzes || quizzes.length === 0 ? (
              <div className="text-center py-20 border border-white/5 rounded-2xl bg-[rgba(15,15,45,0.1)]">
                <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-25 text-[slate-400]" />
                <h3 className="text-lg font-bold font-heading text-[white]">No quizzes generated</h3>
                <p className="text-xs text-[slate-400] mt-1 max-w-xs mx-auto">
                  Use the generator panel to create quiz assessments based on your uploaded notes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/5 hover:border-emerald-500/20 transition-all duration-300 gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[white] text-base leading-snug">{quiz.title}</span>
                        {quiz.subject && (
                          <Badge className="bg-emerald-500/10 text-[emerald-300] border border-emerald-500/20 font-semibold text-[10px]">
                            {quiz.subject}
                          </Badge>
                        )}
                        <Badge className={`${difficultyColors[quiz.difficulty as keyof typeof difficultyColors]} text-[10px] uppercase font-bold`}>
                          {quiz.difficulty}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[slate-400]">
                        <span className="uppercase font-bold tracking-wider text-[10px] text-[sky-400]">
                          {quiz.exam_style}
                        </span>
                        <span>•</span>
                        <span>{quiz.question_count} Questions</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'No Limit'}
                        </span>
                        <span>•</span>
                        <span>
                          {quiz.created_at
                            ? formatDistanceToNow(new Date(quiz.created_at), { addSuffix: true })
                            : 'Recently'}
                        </span>
                      </div>
                    </div>

                    <Link href={`/app/quizzes/${quiz.id}`} className="w-full sm:w-auto">
                      <Button variant="ghost" size="sm" className="w-full flex items-center gap-2 group-hover:bg-[emerald-400] group-hover:text-white">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Start Quiz
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function QuizzesPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full lg:col-span-2 rounded-2xl" />
        </div>
      </div>
    }>
      <QuizzesContent />
    </Suspense>
  );
}
