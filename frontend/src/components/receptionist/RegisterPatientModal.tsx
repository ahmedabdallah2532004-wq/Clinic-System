'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, User, Calendar, Phone, MapPin, Activity, CheckCircle2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const patientSchema = z.object({
  fullName: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  nationalId: z.string().regex(/^\d{14}$/, 'رقم الهوية القومية يجب أن يكون 14 رقم'),
  dateOfBirth: z.string().refine((val) => {
    if (!val) return false;
    const date = new Date(val);
    return date < new Date();
  }, 'تاريخ الميلاد يجب أن يكون في الماضي'),
  gender: z.enum(['MALE', 'FEMALE']),
  contactNumber: z.string().regex(/^01[0125]\d{8}$/, 'رقم الموبايل يجب أن يبدأ بـ 01 ويتكون من 11 رقم'),
  bloodGroup: z.string().optional(),
  address: z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل'),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface RegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (patient: any) => void;
}

export const RegisterPatientModal = ({ isOpen, onClose, onSuccess }: RegisterPatientModalProps) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      gender: 'MALE',
      fullName: '',
      nationalId: '',
      dateOfBirth: '',
      contactNumber: '',
      bloodGroup: '',
      address: ''
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      return api.post('/patients', {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth).toISOString()
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      addToast('تم تسجيل المريض الجديد بنجاح!', 'success');
      if (onSuccess) onSuccess(res.data);
      onClose();
      reset();
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'فشل تسجيل المريض.', 'error');
    }
  });

  const onSubmit = (data: PatientFormData) => {
    mutation.mutate(data);
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
            <div className="p-10">
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                    <UserPlus size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-slate-800">تسجيل مريض جديد</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">إضافة مريض جديد لقاعدة البيانات</p>
                  </div>
                </div>
                <button type="button" onClick={onClose} className="p-3 hover:bg-accent rounded-2xl transition-colors">
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary mr-1">الاسم الكامل</label>
                    <div className="relative">
                      <User size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        {...register('fullName')}
                        className={cn(
                          "w-full h-12 bg-accent/30 rounded-xl px-4 pr-10 text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none text-right transition-all",
                          errors.fullName && "ring-2 ring-destructive/20 bg-destructive/5"
                        )}
                        placeholder="الاسم الثلاثي..."
                      />
                    </div>
                    {errors.fullName && <p className="text-[10px] font-bold text-destructive mr-1">{errors.fullName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary mr-1">رقم الهوية / الإقامة</label>
                    <div className="relative">
                      <CreditCard size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        {...register('nationalId')}
                        className={cn(
                          "w-full h-12 bg-accent/30 rounded-xl px-4 pr-10 text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none text-right transition-all",
                          errors.nationalId && "ring-2 ring-destructive/20 bg-destructive/5"
                        )}
                        placeholder="رقم الهوية..."
                      />
                    </div>
                    {errors.nationalId && <p className="text-[10px] font-bold text-destructive mr-1">{errors.nationalId.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary mr-1">تاريخ الميلاد</label>
                    <div className="relative">
                      <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="date"
                        {...register('dateOfBirth')}
                        className={cn(
                          "w-full h-12 bg-accent/30 rounded-xl px-4 pr-10 text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none text-right transition-all",
                          errors.dateOfBirth && "ring-2 ring-destructive/20 bg-destructive/5"
                        )}
                      />
                    </div>
                    {errors.dateOfBirth && <p className="text-[10px] font-bold text-destructive mr-1">{errors.dateOfBirth.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary mr-1">الجنس</label>
                    <select
                      {...register('gender')}
                      className="w-full h-12 bg-accent/30 rounded-xl px-4 text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                    >
                      <option value="MALE">ذكر</option>
                      <option value="FEMALE">أنثى</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary mr-1">رقم الجوال</label>
                    <div className="relative">
                      <Phone size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        {...register('contactNumber')}
                        className={cn(
                          "w-full h-12 bg-accent/30 rounded-xl px-4 pr-10 text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none text-right transition-all",
                          errors.contactNumber && "ring-2 ring-destructive/20 bg-destructive/5"
                        )}
                        placeholder="01xxxxxxxxx"
                      />
                    </div>
                    {errors.contactNumber && <p className="text-[10px] font-bold text-destructive mr-1">{errors.contactNumber.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary mr-1">فصيلة الدم</label>
                    <div className="relative">
                      <Activity size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        {...register('bloodGroup')}
                        className="w-full h-12 bg-accent/30 rounded-xl px-4 pr-10 text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none text-right"
                        placeholder="A+, O-, إلخ..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary mr-1">العنوان</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute right-4 top-4 text-muted-foreground" />
                    <textarea
                      {...register('address')}
                      className={cn(
                        "w-full bg-accent/30 rounded-2xl p-4 pr-10 text-sm font-medium border-none focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px] text-right transition-all",
                        errors.address && "ring-2 ring-destructive/20 bg-destructive/5"
                      )}
                      placeholder="المدينة، الحي، الشارع..."
                    />
                  </div>
                  {errors.address && <p className="text-[10px] font-bold text-destructive mr-1">{errors.address.message}</p>}
                </div>

                <div className="mt-12 flex gap-4">
                  <Button type="button" variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={onClose}>إلغاء</Button>
                  <Button
                    type="submit"
                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600"
                    isLoading={mutation.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 ml-2" /> إتمام التسجيل
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
