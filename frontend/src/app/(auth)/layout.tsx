'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Brain, ArrowLeft } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080817] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-40 animate-gradient-shift"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(124,111,255,0.2) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,212,255,0.15) 0%, transparent 70%)',
          }}
        />
        <div className="absolute inset-0 starfield opacity-50" />
      </div>

      {/* Back to Home */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-6 left-6"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-[#8892A4] hover:text-[#F0F0FF] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </motion.div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C6FFF] to-[#00D4FF] flex items-center justify-center shadow-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-bold text-2xl gradient-text">EduQuiz</span>
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-[rgba(124,111,255,0.2)] text-[#9D93FF] font-semibold">
            AI
          </span>
        </Link>
      </motion.div>

      {/* Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', damping: 25 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card p-8">{children}</div>
      </motion.div>
    </div>
  );
}
