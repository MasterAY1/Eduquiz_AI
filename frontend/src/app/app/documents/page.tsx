'use client';

import { useDocuments, useUploadDocument, useDeleteDocument } from '@/hooks/useDocuments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { useUIStore } from '@/store/uiStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  FileText,
  Trash2,
  Brain,
  Search,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  FileUp,
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
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 100 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

// Document Card Component to isolate polling state if a document is not yet completed
function DocumentCard({ doc, onDelete }: { doc: any; onDelete: (id: string) => void }) {
  const [currentStatus, setCurrentStatus] = useState(doc.analysis_status);
  
  // Poll if pending or processing
  const isPolling = currentStatus === 'pending' || currentStatus === 'processing';
  
  // Custom polling logic inside card if needed, or query client will naturally invalidate on success
  useEffect(() => {
    setCurrentStatus(doc.analysis_status);
  }, [doc.analysis_status]);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'indexed':
        return (
          <Badge className="bg-[rgba(0,229,160,0.1)] text-[#00E5A0] border border-[rgba(0,229,160,0.2)] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Indexed
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-[rgba(255,176,32,0.1)] text-[#FFB020] border border-[rgba(255,176,32,0.2)] flex items-center gap-1 animate-pulse">
            <Clock className="w-3 h-3" /> Processing
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-[rgba(255,176,32,0.05)] text-[#FFB020] border border-[rgba(255,176,32,0.15)] flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-[rgba(255,107,107,0.1)] text-[#FF6B6B] border border-[rgba(255,107,107,0.2)] flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Failed
          </Badge>
        );
    }
  };

  const getSourceIconColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'text-[#FF6B6B] bg-[rgba(255,107,107,0.08)]';
      case 'docx': return 'text-[#7C6FFF] bg-[rgba(124,111,255,0.08)]';
      case 'ppt': return 'text-[#FFB020] bg-[rgba(255,176,32,0.08)]';
      case 'image': return 'text-[#00E5A0] bg-[rgba(0,229,160,0.08)]';
      default: return 'text-[#00D4FF] bg-[rgba(0,212,255,0.08)]';
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      layout
      className="group relative flex flex-col justify-between p-5 rounded-2xl glass-card border border-[rgba(255,255,255,0.06)] hover:border-[rgba(124,111,255,0.25)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 h-64"
    >
      <div className="space-y-4">
        {/* Top details */}
        <div className="flex justify-between items-start gap-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${getSourceIconColor(doc.source_type)}`}>
            <FileText className="w-5 h-5" />
          </div>
          {getStatusDisplay(currentStatus)}
        </div>

        {/* Title and metadata */}
        <div className="space-y-1">
          <h3 className="font-semibold text-[#F0F0FF] text-base line-clamp-2 group-hover:text-[#7C6FFF] transition-colors leading-tight">
            {doc.title}
          </h3>
          <p className="text-xs text-[#8892A4]">
            {doc.created_at ? formatDistanceToNow(new Date(doc.created_at), { addSuffix: true }) : 'Uploaded just now'}
          </p>
        </div>

        {/* Extracted Details */}
        {doc.subject && (
          <p className="text-xs font-semibold text-[#9D93FF]">
            Subject: {doc.subject}
          </p>
        )}
      </div>

      {/* Buttons / Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-[rgba(255,255,255,0.04)] mt-4">
        {currentStatus === 'indexed' ? (
          <>
            <Link href={`/app/documents/${doc.id}`} className="flex-1">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                Explore Study Guide
              </Button>
            </Link>
            <Link href={`/app/quizzes?docId=${doc.id}`} className="flex-shrink-0">
              <Button variant="primary" size="sm" className="p-2.5 bg-gradient-to-r from-[#7C6FFF] to-[#00D4FF]">
                <Brain className="w-4 h-4 text-white" />
              </Button>
            </Link>
          </>
        ) : currentStatus === 'failed' ? (
          <div className="flex-1 text-xs text-[#FF6B6B] truncate flex items-center gap-1.5 p-1 rounded bg-[rgba(255,107,107,0.05)]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{doc.error_message || 'Indexing failed'}</span>
          </div>
        ) : (
          <div className="flex-1 text-xs text-[#8892A4] animate-pulse flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>AI analyzing document...</span>
          </div>
        )}

        <Button
          onClick={() => onDelete(doc.id)}
          variant="ghost"
          size="sm"
          className="hover:bg-[rgba(255,107,107,0.15)] hover:text-[#FF6B6B] border-none p-2.5 ml-auto text-[#4A5568]"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function DocumentsPage() {
  const { data, isLoading, isError, refetch } = useDocuments();
  const { mutate: uploadDoc, uploadProgress, isPending: isUploading } = useUploadDocument();
  const { mutate: deleteDoc } = useDeleteDocument();
  const [searchQuery, setSearchQuery] = useState('');

  // Dropzone integration
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadDoc(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'image/*': ['.jpg', '.jpeg', '.png'],
    },
  });

  const documents = data?.items || [];

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 space-y-8 pb-12"
    >
      {/* Title */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading">
            Study Material <span className="gradient-text">Library</span>
          </h1>
          <p className="text-[#8892A4] text-sm mt-1">
            Upload text, slide decks, papers, notes or textbook photos to create your RAG Knowledge Base.
          </p>
        </div>
      </motion.div>

      {/* Upload Drag & Drop Area */}
      <motion.div variants={itemVariants}>
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-[#7C6FFF] bg-[rgba(124,111,255,0.06)]'
              : 'border-[rgba(255,255,255,0.1)] hover:border-[rgba(124,111,255,0.3)] bg-[rgba(15,15,45,0.4)]'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4 max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(124,111,255,0.08)] flex items-center justify-center text-[#7C6FFF]">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-[#F0F0FF]">
                {isDragActive ? 'Drop your file here' : 'Drag & drop your files here'}
              </h3>
              <p className="text-xs text-[#8892A4]">
                Supports PDF, DOCX, PPT, TXT, or scan/photo of handwritten notes (Max 10MB)
              </p>
            </div>
            <Button variant="ghost" size="sm" className="pointer-events-none mt-2">
              Browse Files
            </Button>
          </div>

          {/* Uploading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-slate-950/80 rounded-3xl flex flex-col items-center justify-center p-6 space-y-4">
              <FileUp className="w-10 h-10 text-[#7C6FFF] animate-bounce" />
              <div className="space-y-1.5 w-64">
                <div className="flex justify-between text-xs text-[#8892A4] font-medium">
                  <span>Uploading to Cloudinary...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-[rgba(255,255,255,0.06)] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-[#7C6FFF] to-[#00D4FF] rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Search Filter Bar */}
      <motion.div variants={itemVariants} className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]" />
          <input
            type="text"
            placeholder="Search documents by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-glass pl-11"
          />
        </div>
        <Button onClick={() => refetch()} variant="ghost" size="md">
          Refresh
        </Button>
      </motion.div>

      {/* Loading & Listing */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-[#FF6B6B]">
          <AlertCircle className="w-10 h-10 mx-auto mb-3" />
          <p className="font-semibold">Unable to fetch document library.</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-20 border border-[rgba(255,255,255,0.05)] rounded-3xl bg-[rgba(15,15,45,0.2)]">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-20 text-[#8892A4]" />
          <h3 className="text-lg font-bold font-heading text-[#F0F0FF]">No documents found</h3>
          <p className="text-xs text-[#8892A4] mt-1 max-w-xs mx-auto">
            {searchQuery ? 'No materials match your query.' : 'Upload study materials above to get started.'}
          </p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDocs.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} onDelete={(id) => deleteDoc(id)} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
