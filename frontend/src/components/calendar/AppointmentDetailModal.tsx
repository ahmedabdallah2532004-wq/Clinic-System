'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, User, Stethoscope, FileText, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  onDelete?: (id: string) => void;
  onStatusUpdate?: (id: string, status: string) => void;
}

export const AppointmentDetailModal = ({ isOpen, onClose, event, onDelete, onStatusUpdate }: AppointmentDetailModalProps) => {
  if (!event) return null;

  const { title, start, extendedProps } = event;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border sub-border"
          >
            {/* Header / Accent Bar */}
            <div className="h-2 w-full bg-primary" />
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                     <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full">
                       {extendedProps?.status || 'Scheduled'}
                     </span>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-accent rounded-xl transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date</p>
                      <p className="text-sm font-semibold">{new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Time</p>
                      <p className="text-sm font-semibold">{new Date(start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-accent/30 rounded-2xl border border-transparent hover:border-primary/20 transition-all">
                    <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Patient</p>
                       <p className="text-sm font-bold">{extendedProps?.patientName || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-accent/30 rounded-2xl border border-transparent hover:border-primary/20 transition-all">
                    <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm">
                      <Stethoscope className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Specialist</p>
                       <p className="text-sm font-bold">{extendedProps?.doctorName || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {extendedProps?.notes && (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border sub-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                       <FileText className="w-3 h-3" /> Clinical Notes
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed italic">"{extendedProps.notes}"</p>
                  </div>
                )}
              </div>

              <div className="mt-10 flex gap-3">
                <Button variant="premium" className="flex-1 font-bold text-destructive hover:bg-destructive/10" onClick={() => onDelete?.(event.id)}>
                   <Trash2 className="w-4 h-4 mr-2" /> Cancel Visit
                </Button>
                <Button className="flex-1 font-bold shadow-lg shadow-primary/20" onClick={() => onStatusUpdate?.(event.id, 'COMPLETED')}>
                   <CheckCircle2 className="w-4 h-4 mr-2" /> Complete
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
