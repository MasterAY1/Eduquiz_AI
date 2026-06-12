'use client';

import { useQuiz, useStartAttempt } from '@/hooks/useQuizzes';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Brain,
  ChevronLeft,
  Clock,
  Award,
  BookOpen,
  CheckSquare,
  Zap,
  Play,
  ClipboardList,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const difficultyColors = {
  easy: 'bg-[rgba(0,229,160,0.1)] text-[#00E5A0] border border-[rgba(0,229,160,0.2)]',
  medium: 'bg-[rgba(255,176,32,0.1)] text-[#FFB020] border border-[rgba(255,176,32,0.2)]',
  hard: 'bg-[rgba(255,107,107,0.1)] text-[#FF6B6B] border border-[rgba(255,107,107,0.2)]',
};

export default function QuizLobbyPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: quiz, isLoading, isError } = useQuiz(id);
  const { mutate: startAttempt, isPending: starting } = useStartAttempt();

  const handleStart = () => {
    if (!quiz) return;
    startAttempt(quiz.id, {
      onSuccess: (data) => {
        router.push(`/app/quizzes/attempt/${data.attempt_id}?quizId=${quiz.id}`);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 p-6 max-w-3xl mx-auto">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-[rgba(255,107,107,0.1)] flex items-center justify-center">
          <Brain className="w-8 h-8 text-[#FF6B6B]" />
        </div>
        <h3 className="text-xl font-bold font-heading text-[#F0F0FF]">Quiz not found</h3>
        <p className="text-[#8892A4] max-w-sm">
          We could not load this quiz. It might have been deleted or doesn't belong to your account.
        </p>
        <Link href="/app/quizzes">
          <Button variant="primary">Back to Quizzes</Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 space-y-8 pb-12 max-w-3xl mx-auto"
    >
      {/* Back button */}
      <motion.div variants={itemVariants}>
        <Link href="/app/quizzes" className="inline-flex items-center gap-1 text-xs text-[#8892A4] hover:text-[#7C6FFF] transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to Quizzes
        </Link>
      </motion.div>

      {/* Main Lobby Card */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 md:p-8 space-y-6 text-center border-[rgba(124,111,255,0.15)] relative overflow-hidden bg-gradient-to-b from-[rgba(124,111,255,0.05)] to-transparent">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(124,111,255,0.1)] flex items-center justify-center text-[#7C6FFF] mx-auto">
            <Brain className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold font-heading text-[#F0F0FF]">
              {quiz.title}
            </h1>
            <div className="flex justify-center items-center gap-2.5 flex-wrap">
              {quiz.subject && (
                <Badge className="bg-[rgba(124,111,255,0.15)] text-[#9D93FF] border border-[rgba(124,111,255,0.25)] font-semibold text-xs">
                  {quiz.subject}
                </Badge>
              )}
              <Badge className={`${difficultyColors[quiz.difficulty as keyof typeof difficultyColors]} text-xs uppercase font-bold`}>
                {quiz.difficulty}
              </Badge>
              <Badge className="bg-[rgba(0,212,255,0.1)] text-[#00D4FF] border border-[rgba(0,212,255,0.2)] font-semibold text-xs uppercase">
                {quiz.exam_style}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-4 text-left border-y border-[rgba(255,255,255,0.06)] py-6">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-[#8892A4]" />
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#8892A4]">Questions</p>
                <p className="font-semibold text-[#F0F0FF]">{quiz.question_count} Qs</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#8892A4]" />
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#8892A4]">Time Limit</p>
                <p className="font-semibold text-[#F0F0FF]">
                  {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} Mins` : 'No Limit'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 max-w-md mx-auto space-y-4">
            <Button
              onClick={handleStart}
              variant="primary"
              className="w-full py-4 text-base glow-primary font-semibold flex items-center justify-center gap-2"
              disabled={starting}
            >
              <Play className="w-4 h-4 fill-white" />
              {starting ? 'Starting Attempt...' : 'Start Quiz Attempt'}
            </Button>
            <p className="text-[10px] text-[#8892A4]">
              By starting, a timer will begin. Once submitted, your scores will be logged in your profile history and you will earn XP.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Instructions Card */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-4">
            <Award className="w-5 h-5 text-[#FFB020]" />
            <h2 className="text-lg font-bold font-heading text-[#F0F0FF]">Exam Instructions</h2>
          </div>

          <ul className="space-y-3 text-xs text-[#8892A4] list-disc pl-5 leading-relaxed">
            <li>Ensure you have a stable internet connection before beginning.</li>
            <li>Once you start, the timer will countdown continuously. Leaving the page does NOT pause the timer.</li>
            <li>For multiple-choice questions (MCQs), select the single best option.</li>
            <li>For fill-in-the-blank questions, input the exact spelling of your answer.</li>
            <li>For theory questions, type your explanation completely. The AI evaluator will scan and award partial credit.</li>
            <li>Double-check all responses before hitting the final submit button.</li>
          </ul>
        </Card>
      </motion.div>
    </motion.div>
  );
}
