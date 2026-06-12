'use client';

import { useQuiz, useAttempt, useSubmitAttempt } from '@/hooks/useQuizzes';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Brain,
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Award,
  Zap,
  Flame,
  Info,
  Timer,
  Check,
} from 'lucide-react';

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    transition: { duration: 0.2 },
  }),
};

export default function QuizAttemptPage() {
  const { attemptId } = useParams() as { attemptId: string };
  const searchParams = useSearchParams();
  const quizId = searchParams.get('quizId');
  const router = useRouter();

  // Attempt Query (will succeed if already submitted/completed)
  const { data: attemptResult, isLoading: loadingAttempt, isError: attemptNotFinished } = useAttempt(attemptId);
  const { data: quiz, isLoading: loadingQuiz } = useQuiz(quizId || '');
  const { mutate: submitAttempt, isPending: submitting } = useSubmitAttempt();

  // Test Taking State
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const timeTakenRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Time tracker
  useEffect(() => {
    if (attemptResult) return; // Already finished, no timer needed

    if (quiz && timeLeft === null) {
      if (quiz.time_limit_minutes) {
        setTimeLeft(quiz.time_limit_minutes * 60);
      } else {
        setTimeLeft(-1); // Unlimited timer incrementing upwards
      }
    }
  }, [quiz, attemptResult, timeLeft]);

  // Clock countdown loop
  useEffect(() => {
    if (attemptResult || timeLeft === null) return;

    timerRef.current = setInterval(() => {
      timeTakenRef.current += 1;

      if (timeLeft > 0) {
        setTimeLeft((prev) => {
          if (prev && prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, attemptResult]);

  const handleAutoSubmit = () => {
    handleSubmit(true);
  };

  const handleAnswerSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleTheoryAnswerSelect = (questionId: string, part: string, value: string) => {
    setAnswers((prev) => {
      const current = prev[questionId] || {};
      const newAnswer = typeof current === 'object' ? { ...current } : {};
      newAnswer[part] = value;
      return { ...prev, [questionId]: newAnswer };
    });
  };

  const handleNext = () => {
    if (!quiz) return;
    if (activeQuestionIdx < quiz.questions.length - 1) {
      setDirection(1);
      setActiveQuestionIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeQuestionIdx > 0) {
      setDirection(-1);
      setActiveQuestionIdx((prev) => prev - 1);
    }
  };

  const handleSubmit = (auto = false) => {
    setConfirmSubmitOpen(false);
    submitAttempt(
      {
        attemptId,
        answers,
        time_taken_seconds: timeTakenRef.current,
      },
      {
        onSuccess: () => {
          // Invalidate and refresh page to load the completed attempt results view
          router.replace(`/app/quizzes/attempt/${attemptId}`);
        },
      }
    );
  };

  // Format time
  const formatTime = (secs: number) => {
    if (secs === -1) {
      // Show elapsed time instead
      const m = Math.floor(timeTakenRef.current / 60);
      const s = timeTakenRef.current % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} elapsed`;
    }
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Render loading skeleton
  if (loadingAttempt && (loadingQuiz || !quizId)) {
    return (
      <div className="space-y-8 p-6 max-w-5xl mx-auto">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 w-full lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RESULTS VIEW (If attempt is completed)
  // ───────────────────────────────────────────────────────────────────────────
  if (attemptResult) {
    const scoreColor =
      attemptResult.percentage >= 70
        ? 'text-[#00E5A0]'
        : attemptResult.percentage >= 45
        ? 'text-[#FFB020]'
        : 'text-[#FF6B6B]';

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 space-y-8 pb-12 max-w-4xl mx-auto"
      >
        {/* Back navigation */}
        <div>
          <Link href="/app/quizzes" className="inline-flex items-center gap-1 text-xs text-[#8892A4] hover:text-[#7C6FFF] transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to Quizzes
          </Link>
        </div>

        {/* Results Banner */}
        <Card className="p-6 md:p-8 space-y-6 md:space-y-0 md:flex items-center justify-between gap-8 border-[rgba(124,111,255,0.15)] bg-gradient-to-b from-[rgba(124,111,255,0.03)] to-transparent relative overflow-hidden">
          <div className="space-y-4 max-w-md z-10">
            <Badge className="bg-[rgba(0,229,160,0.15)] text-[#00E5A0] border border-[rgba(0,229,160,0.25)] font-bold text-xs">
              Quiz Completed
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold font-heading text-[#F0F0FF]">
              Evaluation Result
            </h1>
            <p className="text-sm text-[#8892A4] leading-relaxed">
              {attemptResult.overall_evaluation || 'Review your performance and explanations below.'}
            </p>
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-1.5 text-[#FFB020]">
                <Flame className="w-5 h-5 fill-current" />
                <span className="text-sm font-semibold">Streak Maintained</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#7C6FFF]">
                <Zap className="w-5 h-5 fill-current" />
                <span className="text-sm font-semibold">+{attemptResult.xp_earned} XP Earned</span>
              </div>
            </div>
          </div>

          {/* Radial score display */}
          <div className="flex flex-col items-center justify-center flex-shrink-0 z-10 mt-6 md:mt-0">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  className="stroke-[rgba(255,255,255,0.04)]"
                  fill="transparent"
                  strokeWidth="8"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  className="stroke-[#7C6FFF]"
                  fill="transparent"
                  strokeWidth="8"
                  strokeDasharray={377}
                  strokeDashoffset={377 - (377 * attemptResult.percentage) / 100}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>
              <div className="text-center z-10">
                <p className={`text-4xl font-bold font-heading ${scoreColor}`}>
                  {Math.round(attemptResult.score)}
                </p>
                <p className="text-[10px] text-[#8892A4] font-bold uppercase mt-0.5">
                  Out of {attemptResult.max_score}
                </p>
              </div>
            </div>
            <p className="text-sm font-bold text-[#F0F0FF] mt-3">Score: {attemptResult.percentage}%</p>
          </div>
        </Card>

        {/* Detailed Question Review */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold font-heading text-[#F0F0FF]">Questions Review</h2>

          <div className="space-y-4">
            {attemptResult.questions.map((q, idx) => (
              <Card
                key={q.question_id}
                className={`p-5 space-y-4 border transition-all ${
                  q.is_correct
                    ? 'border-[rgba(0,229,160,0.15)] bg-[rgba(0,229,160,0.01)]'
                    : 'border-[rgba(255,107,107,0.15)] bg-[rgba(255,107,107,0.01)]'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[rgba(255,255,255,0.04)] text-xs font-semibold text-[#8892A4] flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <p className="font-semibold text-sm text-[#F0F0FF]">{q.question_text}</p>
                  </div>
                  
                  {q.is_correct ? (
                    <Badge className="bg-[rgba(0,229,160,0.1)] text-[#00E5A0] border border-[rgba(0,229,160,0.2)] flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Correct
                    </Badge>
                  ) : (
                    <Badge className="bg-[rgba(255,107,107,0.1)] text-[#FF6B6B] border border-[rgba(255,107,107,0.2)] flex items-center gap-1 font-bold">
                      <XCircle className="w-3 h-3" /> Incorrect
                    </Badge>
                  )}
                </div>

                <div className="pl-9 space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <span className="text-[#8892A4] font-medium flex-shrink-0">Your answer:</span>
                    <div className={`space-y-1 ${q.is_correct ? 'text-[#00E5A0]' : 'text-[#FF6B6B]'}`}>
                      {!q.user_answer ? (
                        <strong>No response</strong>
                      ) : typeof q.user_answer === 'object' ? (
                        <div className="space-y-2 mt-1">
                          {Object.entries(q.user_answer).map(([part, text]) => (
                            <div key={part} className="flex gap-2 bg-[rgba(255,255,255,0.02)] p-2 rounded-lg border border-[rgba(255,255,255,0.05)]">
                              <strong className="text-[#9D93FF] uppercase">{part}:</strong>
                              <span className="whitespace-pre-wrap font-medium">{String(text) || 'No response'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <strong className="whitespace-pre-wrap">{String(q.user_answer)}</strong>
                      )}
                    </div>
                  </div>

                  {!q.is_correct && q.correct_answer && (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 pt-1">
                      <span className="text-[#8892A4] font-medium flex-shrink-0">Correct answer:</span>
                      <strong className="text-[#00E5A0] whitespace-pre-wrap">{q.correct_answer}</strong>
                    </div>
                  )}

                  {q.explanation && (
                    <div className="mt-3 p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-[#8892A4] leading-relaxed flex gap-2">
                      <Info className="w-4 h-4 text-[#7C6FFF] flex-shrink-0 mt-0.5" />
                      <span>{q.explanation}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ACTIVE TEST TAKING VIEW (If quiz is loading/active)
  // ───────────────────────────────────────────────────────────────────────────
  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <AlertCircle className="w-10 h-10 text-[#FFB020]" />
        <h3 className="text-xl font-bold font-heading text-[#F0F0FF]">Failed to load test</h3>
        <p className="text-[#8892A4] max-w-sm">No valid quiz details were found. Return to list and generate one.</p>
        <Link href="/app/quizzes">
          <Button variant="primary">Back to Quizzes</Button>
        </Link>
      </div>
    );
  }

  const activeQuestion = quiz.questions[activeQuestionIdx];
  const isMcq = activeQuestion.question_type === 'mcq' || activeQuestion.question_type === 'true_false';
  const hasAnswered = answers[activeQuestion.id] !== undefined && answers[activeQuestion.id] !== '';

  return (
    <div className="p-6 pb-12 max-w-5xl mx-auto space-y-6">
      {/* Top Test Nav */}
      <div className="flex justify-between items-center bg-[rgba(15,15,45,0.5)] border border-[rgba(255,255,255,0.05)] p-4 rounded-2xl backdrop-blur-glass">
        <div>
          <h2 className="font-heading font-semibold text-[#F0F0FF] truncate max-w-[200px] sm:max-w-md">
            {quiz.title}
          </h2>
          <p className="text-[10px] text-[#8892A4] uppercase font-bold tracking-wider mt-0.5">
            Question {activeQuestionIdx + 1} of {quiz.questions.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[rgba(255,255,255,0.04)] text-xs text-[#8892A4]">
            <Timer className="w-4 h-4 text-[#7C6FFF]" />
            <span className="font-bold text-[#F0F0FF]">{timeLeft !== null ? formatTime(timeLeft) : 'Loading...'}</span>
          </div>
          <Button
            onClick={() => setConfirmSubmitOpen(true)}
            variant="primary"
            size="sm"
            className="bg-gradient-to-r from-[#7C6FFF] to-[#00D4FF] font-semibold flex items-center gap-1"
          >
            Submit
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* CBT Core View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Active Question Block */}
        <div className="lg:col-span-2 space-y-6 overflow-hidden">
          <Card className="p-6 md:p-8 min-h-[360px] flex flex-col justify-between relative">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={activeQuestion.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-6"
              >
                {/* Question metadata badge */}
                <div className="flex items-center justify-between">
                  <Badge className="bg-[rgba(124,111,255,0.08)] text-[#9D93FF] border border-[rgba(124,111,255,0.15)] uppercase text-[10px] font-bold">
                    {activeQuestion.question_type.replace('_', ' ')}
                  </Badge>
                  <span className="text-[10px] text-[#8892A4]">
                    Marks: {activeQuestion.marks || '1.0'}
                  </span>
                </div>

                {/* Question text */}
                <h3 className="text-base md:text-lg font-semibold text-[#F0F0FF] leading-snug">
                  {activeQuestion.question_text}
                </h3>

                {/* Input Fields / Options */}
                {isMcq && activeQuestion.options ? (
                  <div className="space-y-3">
                    {activeQuestion.options.map((opt) => {
                      const selected = answers[activeQuestion.id] === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleAnswerSelect(activeQuestion.id, opt.key)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all text-sm font-medium flex items-center gap-3 ${
                            selected
                              ? 'bg-gradient-to-r from-[rgba(124,111,255,0.15)] to-[rgba(0,212,255,0.05)] text-[#F0F0FF] border-[#7C6FFF] glow-primary/10'
                              : 'bg-[rgba(255,255,255,0.02)] text-[#8892A4] border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#F0F0FF]'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            selected
                              ? 'border-[#7C6FFF] bg-[#7C6FFF] text-white'
                              : 'border-[rgba(255,255,255,0.15)] text-[#8892A4]'
                          }`}>
                            {selected ? <Check className="w-3.5 h-3.5" /> : opt.key}
                          </div>
                          <span>{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : activeQuestion.question_type === 'theory' && activeQuestion.options?.length ? (
                  <div className="space-y-6">
                    {activeQuestion.options.map((opt: any) => (
                      <div key={opt.part || opt.key} className="space-y-3 p-4 rounded-xl border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.01)]">
                        <div className="flex items-start justify-between gap-4">
                          <label className="text-sm font-medium text-[#F0F0FF] flex gap-3 leading-relaxed">
                            <span className="flex-shrink-0 w-6 h-6 rounded border border-[rgba(124,111,255,0.3)] bg-[rgba(124,111,255,0.1)] text-[#9D93FF] flex items-center justify-center text-xs font-bold uppercase mt-0.5">
                              {opt.part || opt.key}
                            </span>
                            <span>{opt.text}</span>
                          </label>
                          {opt.marks && (
                            <Badge className="flex-shrink-0 bg-[rgba(255,255,255,0.05)] text-[#8892A4] text-[10px] font-bold border border-[rgba(255,255,255,0.1)]">
                              {opt.marks} Marks
                            </Badge>
                          )}
                        </div>
                        <textarea
                          placeholder="Type your response here..."
                          value={answers[activeQuestion.id]?.[opt.part || opt.key] || ''}
                          onChange={(e) => handleTheoryAnswerSelect(activeQuestion.id, opt.part || opt.key, e.target.value)}
                          rows={4}
                          className="input-glass w-full"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Type your response here..."
                      value={answers[activeQuestion.id] || ''}
                      onChange={(e) => handleAnswerSelect(activeQuestion.id, e.target.value)}
                      rows={5}
                      className="input-glass"
                    />
                    <p className="text-[10px] text-[#4A5568]">
                      Note: spelling matters for short answers. Essay/theory answers are evaluated using AI semantic processing.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Bottom Question Prev/Next Nav */}
            <div className="flex justify-between items-center pt-6 border-t border-[rgba(255,255,255,0.04)] mt-8">
              <Button
                onClick={handlePrev}
                disabled={activeQuestionIdx === 0}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <Button
                onClick={handleNext}
                disabled={activeQuestionIdx === quiz.questions.length - 1}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: CBT Numbers Grid */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="font-bold text-[#F0F0FF] text-sm">Question Navigator</h3>
              <p className="text-[10px] text-[#8892A4] mt-0.5">Click number to hop directly to question</p>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-2">
              {quiz.questions.map((q, idx) => {
                const isActive = idx === activeQuestionIdx;
                const hasAnswer = answers[q.id] !== undefined && answers[q.id] !== '';

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setDirection(idx > activeQuestionIdx ? 1 : -1);
                      setActiveQuestionIdx(idx);
                    }}
                    className={`w-10 h-10 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                      isActive
                        ? 'border border-[#7C6FFF] bg-[rgba(124,111,255,0.15)] text-[#F0F0FF] glow-primary/5'
                        : hasAnswer
                        ? 'bg-[rgba(124,111,255,0.25)] text-[#9D93FF] border border-[rgba(124,111,255,0.3)]'
                        : 'bg-[rgba(255,255,255,0.02)] text-[#8892A4] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.15)]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            
            <div className="flex gap-4 pt-2 border-t border-[rgba(255,255,255,0.04)] text-[10px] text-[#8892A4]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-[rgba(124,111,255,0.25)] border border-[rgba(124,111,255,0.3)]" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-transparent border border-[rgba(255,255,255,0.05)]" />
                <span>Unanswered</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <Card className="p-6 max-w-sm w-full space-y-4 border-[rgba(124,111,255,0.2)]">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#7C6FFF]" />
              <h3 className="font-heading font-bold text-lg text-[#F0F0FF]">Submit Quiz?</h3>
            </div>
            <p className="text-xs text-[#8892A4] leading-relaxed">
              Are you sure you want to finish this quiz attempt? Unanswered questions will be marked incorrect. AI feedback will evaluate your results immediately.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setConfirmSubmitOpen(false)}
                variant="ghost"
                size="sm"
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                onClick={() => handleSubmit(false)}
                variant="primary"
                size="sm"
                className="flex-1 bg-gradient-to-r from-[#7C6FFF] to-[#00D4FF] glow-primary"
                disabled={submitting}
              >
                {submitting ? 'Evaluating...' : 'Confirm'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
