'use client';

import React from 'react';
import { useToast } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border min-w-[320px] backdrop-blur-xl",
              toast.type === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
              toast.type === 'error' && "bg-rose-500/10 border-rose-500/20 text-rose-600",
              toast.type === 'info' && "bg-blue-500/10 border-blue-500/20 text-blue-600",
              toast.type === 'warning' && "bg-amber-500/10 border-amber-500/20 text-amber-600"
            )}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
            {(toast.type === 'info' || toast.type === 'warning') && <Info className="w-5 h-5 shrink-0" />}
            
            <p className="text-sm font-bold flex-1">{toast.message}</p>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
