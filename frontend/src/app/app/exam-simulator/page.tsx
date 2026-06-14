'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Timer, ArrowRight, ShieldAlert, Cpu, Brain, LayoutDashboard } from 'lucide-react';
import { useExamTemplates } from '@/hooks/useQuizzes';
import { useDocuments } from '@/hooks/useDocuments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useGenerateQuiz } from '@/hooks/useQuizzes';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { useRouter } from 'next/navigation';

export default function ExamSimulatorPage() {
  const router = useRouter();
  const { data: templates, isLoading: templatesLoading } = useExamTemplates();
  const { data: documents, isLoading: docsLoading } = useDocuments();
  const generateQuiz = useGenerateQuiz();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string>('');

  const handleStartExam = () => {
    if (!selectedTemplate || !selectedDocId) return;

    const template = templates?.find((t) => t.id === selectedTemplate);
    if (!template) return;

    // Generate a new quiz with the template's settings
    generateQuiz.mutate({
      document_id: selectedDocId,
      title: `${template.name} Simulation`,
      exam_style: template.exam_style,
      difficulty: 'hard', // Exam simulations are hard
      question_count: template.question_count,
      time_limit_minutes: template.time_limit_minutes,
      question_types: ['mcq'],
    });
  };

  const indexedDocs = documents?.filter((d: any) => d.analysis_status === 'indexed') || [];

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold text-white flex items-center gap-3">
            <Timer className="w-8 h-8 text-rose-400" />
            Exam Simulator
          </h1>
          <p className="text-slate-400 mt-2">
            Enter strict CBT mode. High-stakes simulations for WAEC, NECO, and JAMB. 
            Once you start, the timer cannot be paused.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex gap-4 items-start">
          <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-rose-400 font-semibold mb-1">Strict Exam Environment</h4>
            <ul className="text-sm text-rose-200/80 list-disc list-inside space-y-1">
              <li>Full-screen locked interface</li>
              <li>Questions are heavily randomized</li>
              <li>Timer runs continuously on the server</li>
              <li>Auto-submits instantly when time expires</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Template Selection */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">1. Select Exam Type</h3>
            {templatesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {templates?.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                      selectedTemplate === template.id
                        ? 'bg-rose-500/10 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                        : 'bg-surface/50 border-white/5 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    {selectedTemplate === template.id && (
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent pointer-events-none" />
                    )}
                    <h4 className={`font-bold text-lg mb-1 transition-colors ${
                      selectedTemplate === template.id ? 'text-rose-400' : 'text-white'
                    }`}>
                      {template.name}
                    </h4>
                    <p className="text-sm text-slate-400 mb-3">{template.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-md text-slate-300">
                        <Brain className="w-3.5 h-3.5 text-emerald-400" />
                        {template.question_count} Questions
                      </div>
                      <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-md text-slate-300">
                        <Timer className="w-3.5 h-3.5 text-amber-400" />
                        {template.time_limit_minutes} Mins
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Content Selection & Action */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">2. Select Study Material</h3>
              <Card className="p-6 bg-surface/50 border-white/5">
                {docsLoading ? (
                  <Skeleton className="h-12 w-full rounded-lg" />
                ) : indexedDocs.length === 0 ? (
                  <div className="text-center p-4">
                    <p className="text-slate-400 text-sm mb-3">No indexed documents available to test on.</p>
                    <Button variant="outline" onClick={() => router.push('/app/documents')}>
                      Upload Material First
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400 font-medium">Choose a source document to generate exam questions from:</label>
                    <select
                      value={selectedDocId}
                      onChange={(e) => setSelectedDocId(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-rose-500/50 transition-colors"
                    >
                      <option value="" disabled>-- Select a Document --</option>
                      {indexedDocs.map((doc: any) => (
                         <option key={doc.id} value={doc.id}>{doc.title} ({doc.subject || 'General'})</option>
                      ))}
                    </select>
                  </div>
                )}
              </Card>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-4">3. Initialize Simulation</h3>
              <Card className="p-6 bg-surface/50 border-white/5 relative overflow-hidden">
                <div className="absolute -right-12 -top-12 opacity-5 pointer-events-none">
                  <Cpu className="w-48 h-48" />
                </div>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                    <span className="text-slate-400">Exam Profile</span>
                    <span className="text-white font-medium">
                      {selectedTemplate ? templates?.find(t => t.id === selectedTemplate)?.name : 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                    <span className="text-slate-400">Source Material</span>
                    <span className="text-white font-medium truncate max-w-[200px] text-right">
                      {selectedDocId ? indexedDocs.find((d: any) => d.id === selectedDocId)?.title : 'Not selected'}
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full h-14 text-lg bg-rose-600 hover:bg-rose-700 shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.5)] transition-all group"
                    disabled={!selectedTemplate || !selectedDocId || generateQuiz.isPending}
                    onClick={handleStartExam}
                  >
                    {generateQuiz.isPending ? 'Generating Exam Instance...' : 'Start Exam Simulation'}
                    {!generateQuiz.isPending && (
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    )}
                  </Button>
                </div>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
