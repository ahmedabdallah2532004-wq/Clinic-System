'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Mail, Lock, User, Shield, BookOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const doctorSchema = z.object({
  email: z.string().email('الرجاء إدخال بريد إلكتروني صالح'),
  password: z.string().min(6, 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل'),
  fullName: z.string().min(3, 'يجب أن يتكون الاسم الكامل من 3 أحرف على الأقل'),
  licenseNumber: z.string().min(3, 'يجب أن يتكون رقم الترخيص من 3 أحرف على الأقل'),
  bio: z.string().optional(),
});

type DoctorFormData = z.infer<typeof doctorSchema>;

interface OnboardDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OnboardDoctorModal = ({ isOpen, onClose, onSuccess }: OnboardDoctorModalProps) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<number[]>([]);

  // Fetch specialties
  const { data: specialties, isLoading: isLoadingSpecialties } = useQuery({
    queryKey: ['specialties'],
    queryFn: async () => {
      const response = await api.get('/doctors/specialties');
      return response.data;
    },
    enabled: isOpen
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      licenseNumber: '',
      bio: ''
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: DoctorFormData & { specialtyIds: number[] }) => {
      return api.post('/doctors/onboard', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      addToast('تم تسجيل الطبيب بنجاح!', 'success');
      if (onSuccess) onSuccess();
      onClose();
      reset();
      setSelectedSpecialtyIds([]);
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'فشل تسجيل الطبيب في النظام.', 'error');
    }
  });

  const handleSpecialtyToggle = (id: number) => {
    setSelectedSpecialtyIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const onSubmit = (data: DoctorFormData) => {
    if (selectedSpecialtyIds.length === 0) {
      addToast('الرجاء تحديد تخصص طبي واحد على الأقل.', 'warning');
      return;
    }
    mutation.mutate({
      ...data,
      specialtyIds: selectedSpecialtyIds
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border sub-border max-h-[90vh] overflow-y-auto"
          >
            <div className="p-10 text-right" dir="rtl">
              <div className="flex justify-between items-start mb-10 flex-row-reverse">
                <div className="flex items-center gap-4 flex-row-reverse">
                  <div className="w-14 h-14 bg-primary rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-primary/20">
                    <UserPlus size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">إضافة طبيب جديد</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">إنشاء حساب مستخدم وملف للطبيب بالعيادة</p>
                  </div>
                </div>
                <button type="button" onClick={onClose} className="p-3 hover:bg-accent rounded-2xl transition-colors">
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Account details section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b pb-2 sub-border">1. بيانات حساب المستخدم</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary mr-1 block">البريد الإلكتروني</label>
                      <div className="relative">
                        <Mail size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="email"
                          {...register('email')}
                          className={cn(
                            "w-full h-12 bg-accent/30 rounded-xl pr-10 pl-4 text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-right",
                            errors.email && "ring-2 ring-destructive/20 bg-destructive/5"
                          )}
                          placeholder="specialist@clinic.com"
                        />
                      </div>
                      {errors.email && <p className="text-[10px] font-bold text-destructive mr-1">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary mr-1 block">كلمة المرور الأولية</label>
                      <div className="relative">
                        <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="password"
                          {...register('password')}
                          className={cn(
                            "w-full h-12 bg-accent/30 rounded-xl pr-10 pl-4 text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-right",
                            errors.password && "ring-2 ring-destructive/20 bg-destructive/5"
                          )}
                          placeholder="••••••••"
                        />
                      </div>
                      {errors.password && <p className="text-[10px] font-bold text-destructive mr-1">{errors.password.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Professional details section */}
                <div className="space-y-4 pt-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b pb-2 sub-border">2. البيانات المهنية والترخيص</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary mr-1 block">الاسم الكامل</label>
                      <div className="relative">
                        <User size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          {...register('fullName')}
                          className={cn(
                            "w-full h-12 bg-accent/30 rounded-xl pr-10 pl-4 text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-right",
                            errors.fullName && "ring-2 ring-destructive/20 bg-destructive/5"
                          )}
                          placeholder="مثلاً: د. أحمد سليمان"
                        />
                      </div>
                      {errors.fullName && <p className="text-[10px] font-bold text-destructive mr-1">{errors.fullName.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary mr-1 block">رقم الترخيص الطبي</label>
                      <div className="relative">
                        <Shield size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          {...register('licenseNumber')}
                          className={cn(
                            "w-full h-12 bg-accent/30 rounded-xl pr-10 pl-4 text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-right",
                            errors.licenseNumber && "ring-2 ring-destructive/20 bg-destructive/5"
                          )}
                          placeholder="LIC98765"
                        />
                      </div>
                      {errors.licenseNumber && <p className="text-[10px] font-bold text-destructive mr-1">{errors.licenseNumber.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary mr-1 block">النبذة المهنية</label>
                    <div className="relative">
                      <BookOpen size={14} className="absolute right-4 top-4 text-muted-foreground" />
                      <textarea
                        {...register('bio')}
                        className="w-full bg-accent/30 rounded-2xl p-4 pr-10 pl-4 text-sm font-medium border-none focus:ring-2 focus:ring-primary/20 outline-none min-h-[80px] transition-all text-right"
                        placeholder="اكتب نبذة عن مؤهلات الطبيب، وتعليمه، والخبرات الطبية..."
                      />
                    </div>
                  </div>
                </div>

                {/* Specialties section */}
                <div className="space-y-4 pt-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b pb-2 sub-border">3. التخصصات الطبية</h4>
                  {isLoadingSpecialties ? (
                    <div className="py-6 flex justify-center">
                      <div className="w-6 h-6 border-2 border-primary/25 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {specialties?.map((spec: any) => {
                        const isSelected = selectedSpecialtyIds.includes(spec.id);
                        return (
                          <button
                            type="button"
                            key={spec.id}
                            onClick={() => handleSpecialtyToggle(spec.id)}
                            className={cn(
                              "flex items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all text-center",
                              isSelected 
                                ? "bg-primary/10 border-primary text-primary shadow-sm"
                                : "bg-accent/10 border-transparent text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                            )}
                          >
                            {spec.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-12 flex gap-4">
                  <Button type="button" variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={onClose}>
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20"
                    isLoading={mutation.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 ml-2" /> إكمال التسجيل
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
