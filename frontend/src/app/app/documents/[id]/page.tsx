'use client';

import { useDocument } from '@/hooks/useDocuments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileText,
  Brain,
  ChevronLeft,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  ListCheck,
} from 'lucide-react';
import { format } from 'date-fns';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function DocumentDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: doc, isLoading, isError } = useDocument(id);

  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 w-full lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
          <Layers className="w-8 h-8 text-[rose-500]" />
        </div>
        <h3 className="text-xl font-bold font-heading text-[white]">Document not found</h3>
        <p className="text-[slate-400] max-w-sm">
          We could not load the study guide details. It might have been deleted.
        </p>
        <Link href="/app/documents">
          <Button variant="primary">Back to Library</Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 space-y-8 pb-12 max-w-7xl mx-auto"
    >
      {/* Back button */}
      <motion.div variants={itemVariants}>
        <Link href="/app/documents" className="inline-flex items-center gap-1 text-xs text-[slate-400] hover:text-[emerald-400] transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to Library
        </Link>
      </motion.div>

      {/* Header card */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-emerald-500/10 to-sky-500/5 border-emerald-500/15 relative overflow-hidden">
          <div className="flex gap-4 items-start min-w-0 z-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-[emerald-400] flex-shrink-0">
              <FileText className="w-7 h-7" />
            </div>
            <div className="space-y-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[white] truncate">
                {doc.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[slate-400]">
                {doc.subject && (
                  <Badge className="bg-emerald-500/15 text-[emerald-300] border border-emerald-500/25 font-semibold">
                    {doc.subject}
                  </Badge>
                )}
                {doc.detected_level && (
                  <span className="capitalize">Level: {doc.detected_level}</span>
                )}
                <span>•</span>
                <span>{doc.word_count || 0} words</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {doc.created_at ? format(new Date(doc.created_at), 'MMM d, yyyy') : 'Recently'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="z-10 flex-shrink-0">
            <Link href={`/app/quizzes?docId=${doc.id}`}>
              <Button variant="primary" size="md" className="flex items-center gap-2 glow-primary">
                <Brain className="w-4.5 h-4.5" />
                Generate Practice Quiz
              </Button>
            </Link>
          </div>
          
          {/* Background element */}
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-radial-gradient opacity-10 blur-2xl pointer-events-none" />
        </Card>
      </motion.div>

      {/* Details layout */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Summary (Col span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <BookOpen className="w-5 h-5 text-[emerald-400]" />
              <h2 className="text-xl font-bold font-heading text-[white]">AI Study Guide & Summary</h2>
            </div>
            
            <div className="text-sm text-[slate-400] space-y-4 leading-relaxed whitespace-pre-line font-medium text-justify">
              {doc.summary || 'Summary is not available for this document.'}
            </div>
          </Card>
        </div>

        {/* Topics sidebar */}
        <div className="space-y-6">
          {/* Extracted Topics Card */}
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <Layers className="w-5 h-5 text-[sky-400]" />
              <h2 className="text-xl font-bold font-heading text-[white]">Topics Covered</h2>
            </div>

            <div className="space-y-4">
              {!doc.topics || doc.topics.length === 0 ? (
                <p className="text-xs text-[slate-400] italic">No topics extracted.</p>
              ) : (
                doc.topics.map((topic) => {
                  const sub = doc.subtopics?.[topic] || [];
                  return (
                    <div key={topic} className="space-y-2">
                      <div className="flex items-center gap-2 text-[white] font-semibold text-sm">
                        <Sparkles className="w-3.5 h-3.5 text-[amber-400]" />
                        <span>{topic}</span>
                      </div>
                      
                      {sub.length > 0 && (
                        <div className="pl-6 border-l border-white/10 space-y-1.5">
                          {sub.map((subtopic: string) => (
                            <div key={subtopic} className="text-xs text-[slate-400] flex items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-[sky-400]" />
                              <span>{subtopic}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* RAG Knowledge base details */}
          <Card className="p-5 bg-white/5 border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-xs text-[slate-400]">
              <ListCheck className="w-4 h-4 text-[emerald-400]" />
              <span className="font-semibold uppercase tracking-wider">RAG Knowledge Base</span>
            </div>
            <p className="text-xs text-[slate-400]">
              This document was divided into <strong className="text-[white] font-semibold">{doc.chunk_count} semantic chunks</strong> and indexed using 768-dimensional embeddings for accurate quiz matching.
            </p>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}
