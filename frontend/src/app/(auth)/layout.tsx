'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Brain, ArrowLeft } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Liquid Glass Mesh Background */}
      <div className="mesh-bg">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>

      {/* Back to Home */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-6 left-6 z-20"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
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
        className="mb-10 z-20"
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 box-shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="font-heading font-bold text-3xl tracking-tight text-white">EduQuiz</span>
          <span className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
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
        <div className="glass-card p-10">{children}</div>
      </motion.div>
    </div>
  );
}
