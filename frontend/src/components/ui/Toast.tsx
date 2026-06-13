'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import type { Toast as ToastType } from '@/types';

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
  error: <XCircle className="w-5 h-5 text-rose-400" />,
  info: <Info className="w-5 h-5 text-sky-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
};

const borderColors = {
  success: 'border-l-4 border-l-emerald-500 border-white/5',
  error: 'border-l-4 border-l-rose-500 border-white/5',
  info: 'border-l-4 border-l-sky-500 border-white/5',
  warning: 'border-l-4 border-l-amber-500 border-white/5',
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
      <p className="flex-1 text-sm font-medium text-slate-100 leading-relaxed">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 p-0.5 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
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
