'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import type { Toast as ToastType } from '@/types';

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-[#00E5A0]" />,
  error: <XCircle className="w-5 h-5 text-[#FF6B6B]" />,
  info: <Info className="w-5 h-5 text-[#00D4FF]" />,
  warning: <AlertTriangle className="w-5 h-5 text-[#FFB020]" />,
};

const borderColors = {
  success: 'border-[rgba(0,229,160,0.3)]',
  error: 'border-[rgba(255,107,107,0.3)]',
  info: 'border-[rgba(0,212,255,0.3)]',
  warning: 'border-[rgba(255,176,32,0.3)]',
};

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useUIStore((s) => s.removeToast);

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`flex items-start gap-3 glass-card px-4 py-3 min-w-[300px] max-w-[380px] border ${borderColors[toast.type]}`}
    >
      <div className="mt-0.5 flex-shrink-0">{icons[toast.type]}</div>
      <p className="flex-1 text-sm text-[#F0F0FF] leading-relaxed">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 p-0.5 text-[#4A5568] hover:text-[#8892A4] transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function Toast() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
