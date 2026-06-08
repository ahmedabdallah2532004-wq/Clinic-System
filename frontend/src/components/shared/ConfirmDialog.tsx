'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'primary',
  isLoading = false,
}: ConfirmDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[1.5rem]" dir="rtl">
        <DialogHeader className="text-right">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${variant === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-black">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm font-bold text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-3 sm:justify-start mt-6">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            disabled={isLoading}
            className="font-bold flex-1"
          >
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'danger' ? 'destructive' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            className="font-bold flex-1 shadow-lg"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
