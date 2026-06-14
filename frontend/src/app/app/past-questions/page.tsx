'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, UploadCloud, BookOpen, Search, Target, Lightbulb, AlertCircle, Loader2, FileUp, ListChecks, Brain } from 'lucide-react';
import { useUploadDocument } from '@/hooks/useDocuments';
import { usePastQuestionIntelligence } from '@/hooks/useAnalytics';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useDropzone } from 'react-dropzone';
import { Skeleton } from '@/components/ui/SkeletonLoader';

export default function PastQuestionsPage() {
  const [subject, setSubject] = useState('Biology');
  const [searchInput, setSearchInput] = useState('');

  const { data: intelligence, isLoading, refetch } = usePastQuestionIntelligence(subject);
  const { mutate: uploadDoc, uploadProgress, isPending: isUploading } = useUploadDocument();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSubject(searchInput.trim());
      setSearchInput('');
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadDoc(
        { file: acceptedFiles[0], category: 'past_question' },
        {
          onSuccess: () => {
            // Refetch intelligence after upload (it might take time to index, so they can manually refresh too)
            setTimeout(() => refetch(), 3000);
          }
        }
      );
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white flex items-center gap-3">
            <History className="w-8 h-8 text-sky-400" />
            Past Question Intelligence
          </h1>
          <p className="text-slate-400 mt-1">Upload past papers and let AI extract the most likely exam areas.</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input 
            placeholder="Search subject (e.g. English)" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64 bg-surface border-white/10"
          />
          <Button type="submit" variant="primary" className="bg-sky-500 hover:bg-sky-600">
            Analyze
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Upload */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-6 bg-surface/50 border-white/5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <UploadCloud className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-white">Add Past Questions</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Upload past question papers for <b>{subject}</b>. Ensure the subject name is clear in the document content.
            </p>

            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'border-sky-400 bg-sky-500/10'
                  : 'border-white/10 hover:border-sky-500/30 bg-black/20'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center space-y-2">
                <FileUp className="w-8 h-8 text-sky-400/50 mb-2" />
                <h3 className="text-sm font-semibold text-white">
                  {isDragActive ? 'Drop paper here' : 'Drag & drop paper'}
                </h3>
                <p className="text-[10px] text-slate-400">PDF, DOCX, TXT (Max 10MB)</p>
              </div>

              {/* Uploading overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-slate-950/90 rounded-2xl flex flex-col items-center justify-center p-4">
                  <Loader2 className="w-6 h-6 text-sky-400 animate-spin mb-3" />
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-400 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-sky-300 mt-2 font-medium">{uploadProgress}%</span>
                </div>
              )}
            </div>
            
            <Button variant="ghost" size="sm" className="w-full mt-2 border border-white/20" onClick={() => refetch()}>
              Refresh Intelligence
            </Button>
          </Card>
        </div>

        {/* Right Column: Intelligence Report */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          ) : intelligence && intelligence.frequently_repeated_topics?.length > 0 ? (
            <div className="space-y-6">
              
              {/* Top Repeated Topics */}
              <Card className="p-6 bg-surface/50 border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                  <ListChecks className="w-32 h-32 text-sky-500" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-sky-400" />
                    Frequently Repeated Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {intelligence.frequently_repeated_topics.map((topic, i) => (
                      <Badge key={i} className="bg-sky-500/10 text-sky-300 border border-sky-500/20 py-1.5 px-3">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>

              {/* AI Predictions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-emerald-500/5 border-emerald-500/15">
                  <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Likely Exam Areas
                  </h3>
                  <ul className="space-y-3">
                    {intelligence.likely_exam_areas.map((area, i) => (
                      <li key={i} className="flex gap-3 text-sm text-emerald-100/80 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-6 bg-amber-500/5 border-amber-500/15">
                  <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Revision Recommendations
                  </h3>
                  <ul className="space-y-3">
                    {intelligence.revision_recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-3 text-sm text-amber-100/80 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

            </div>
          ) : (
            <Card className="p-12 text-center border-dashed border-white/10 bg-surface/30 flex flex-col items-center justify-center">
              <AlertCircle className="w-12 h-12 text-slate-500 mb-4" />
              <h3 className="text-lg font-semibold text-white">No Past Questions Found</h3>
              <p className="text-slate-400 mt-2 max-w-sm leading-relaxed">
                We need more past question papers for <b>{subject}</b> to generate intelligence. Upload some PDF or DOCX past papers using the panel on the left.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
