'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  History, 
  FileText, 
  CreditCard, 
  Clock,
  Download,
  Calendar
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';

import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Modal open states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  // Payment inputs states
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Reschedule inputs states
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // 1. Fetch Patient Profile (to get patientId)
  const { data: patient, isLoading: profileLoading } = useQuery({
    queryKey: ['patient-profile-me'],
    queryFn: async () => {
      const response = await api.get('/patients/me');
      return response.data;
    },
    enabled: !!user?.id
  });

  const patientId = patient?.id;

  // 2. Fetch Appointments
  const { data: appointments } = useQuery({
    queryKey: ['patient-appointments', patientId],
    queryFn: async () => {
      const response = await api.get(`/appointments/patient/${patientId}`);
      return response.data;
    },
    enabled: !!patientId
  });

  // 3. Fetch Invoices
  const { data: invoices } = useQuery({
    queryKey: ['patient-invoices', patientId],
    queryFn: async () => {
      const response = await api.get(`/billing/invoices/patient/${patientId}`);
      return response.data;
    },
    enabled: !!patientId
  });

  const nextAppointment = appointments?.find((a: any) => a.status === 'SCHEDULED');
  const pastRecords = patient?.encounters || [];
  const activePrescriptions = patient?.prescriptions || [];
  const unpaidBills = invoices?.filter((inv: any) => inv.status === 'PENDING') || [];

  // Card formatting helpers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardExpiry(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setCardCvv(value);
  };

  const getCardType = (num: string) => {
    const cleanNum = num.replace(/\D/g, '');
    if (cleanNum.startsWith('4')) return 'Visa';
    if (cleanNum.startsWith('5')) return 'Mastercard';
    if (cleanNum.startsWith('3')) return 'American Express';
    return 'بطاقة ائتمانية';
  };

  const formattedCardDisplay = () => {
    const raw = cardNumber.replace(/\s/g, '');
    let display = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) display += ' ';
      display += raw[i] || '•';
    }
    return display;
  };

  // Payment Submission
  const settleBalanceMutation = useMutation({
    mutationFn: async () => {
      await api.post('/billing/payments/bulk', {
        invoiceIds: unpaidBills.map((inv: any) => inv.id),
        method: 'CARD'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-invoices', patientId] });
      addToast('تم سداد جميع المبالغ المستحقة بنجاح!', 'success');
      setIsPaymentModalOpen(false);
      setCardNumber('');
      setCardHolder('');
      setCardExpiry('');
      setCardCvv('');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'فشلت عملية الدفع. يرجى المحاولة مرة أخرى.', 'error');
    }
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) {
      addToast('يرجى ملء جميع حقول البطاقة الائتمانية.', 'error');
      return;
    }
    settleBalanceMutation.mutate();
  };

  // Reschedule actions
  const openRescheduleModal = () => {
    if (nextAppointment) {
      const date = new Date(nextAppointment.startTime);
      setRescheduleDate(format(date, 'yyyy-MM-dd'));
      setRescheduleTime(format(date, 'HH:mm'));
      setIsRescheduleModalOpen(true);
    }
  };

  const rescheduleMutation = useMutation({
    mutationFn: async (data: { startTime: string; endTime: string }) => {
      return api.patch(`/appointments/${nextAppointment.id}/reschedule`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments', patientId] });
      addToast('تمت إعادة جدولة موعدك بنجاح!', 'success');
      setIsRescheduleModalOpen(false);
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'فشلت إعادة الجدولة. يرجى اختيار موعد آخر.', 'error');
    }
  });

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime || !nextAppointment) return;

    const originalStart = new Date(nextAppointment.startTime);
    const originalEnd = new Date(nextAppointment.endTime);
    const durationMs = originalEnd.getTime() - originalStart.getTime();

    const [year, month, day] = rescheduleDate.split('-').map(Number);
    const [hours, minutes] = rescheduleTime.split(':').map(Number);
    const newStart = new Date(year, month - 1, day, hours, minutes, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);

    rescheduleMutation.mutate({
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString()
    });
  };

  if (profileLoading) return (
    <DashboardLayout>
       <div className="h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
       </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" dir="rtl">
        {/* Left Column: History & Meds */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border sub-border shadow-sm text-right">
            <h3 className="text-xl font-black tracking-tight text-slate-800 mb-8 flex items-center gap-3 justify-start">
              <History className="text-primary" size={24} />
              السجل الزمني الطبي
            </h3>
            
            {pastRecords.length === 0 ? (
              <div className="py-12 text-center bg-accent/20 rounded-2xl border border-dashed border-accent">
                 <p className="text-sm font-bold text-muted-foreground">لا توجد سجلات طبية سابقة حالياً.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {pastRecords.map((record: any, i: number) => (
                  <div key={record.id} className="flex gap-6 relative group">
                    {i !== pastRecords.length - 1 && <div className="absolute right-5 top-10 bottom-0 w-0.5 bg-zinc-100 dark:bg-zinc-800"></div>}
                    <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-primary z-10 border-4 border-white dark:border-zinc-900 group-hover:bg-primary/10 transition-colors">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 pb-8 pr-2 text-right">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg">{record.chiefComplaint || 'استشارة عامة'}</h4>
                          <p className="text-xs font-black text-primary uppercase tracking-widest mt-0.5">
                            {format(new Date(record.createdAt), 'dd MMMM yyyy', { locale: ar })} • د. {record.doctor?.fullName}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed italic line-clamp-2">
                        {record.treatmentPlan || 'استشارة طبية وتقييم الحالة العامة.'}
                      </p>
                      <button 
                        onClick={() => addToast('جاري تحميل التقرير الطبي...', 'info')}
                        className="mt-4 text-[10px] flex items-center gap-2 text-muted-foreground hover:text-primary font-black uppercase tracking-widest transition-colors"
                      >
                        <Download size={14} /> التقرير الطبي الكامل
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border sub-border shadow-sm text-right">
            <h3 className="text-xl font-black tracking-tight text-slate-800 mb-8 flex items-center gap-3 justify-start">
              <FileText className="text-emerald-600" size={24} />
              الوصفات الطبية النشطة
            </h3>
            
            {activePrescriptions.length === 0 ? (
               <div className="py-12 text-center bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-100">
                  <p className="text-sm font-bold text-emerald-600/60">لا توجد أدوية موصوفة حالياً.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {activePrescriptions.map((presc: any) => (
                  <div key={presc.id} className="p-6 bg-emerald-50/30 rounded-[1.5rem] border border-emerald-100 hover:shadow-md transition-shadow text-right">
                    {presc.items.map((item: any, idx: number) => (
                      <div key={idx} className="mb-4 last:mb-0">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-black text-slate-800">{item.medicationName}</p>
                          <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black">نشط</span>
                        </div>
                        <p className="text-xs font-bold text-emerald-700">{item.dosage} • {item.frequency}</p>
                        <p className="text-[10px] text-emerald-600/70 mt-2 font-black uppercase tracking-tighter italic">المدة: {item.duration}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Appointments & Billing */}
        <div className="space-y-8">
          <section className="bg-primary p-8 text-white border-none rounded-[2rem] shadow-2xl shadow-primary/20 relative overflow-hidden group text-right">
            <div className="absolute top-0 left-0 p-8 opacity-10 -ml-8 -mt-8 rotate-12 group-hover:rotate-0 transition-transform duration-500">
               <Calendar size={120} />
            </div>
            
            <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10 justify-start">
              <Clock size={20} />
              الجلسة القادمة
            </h3>
            
            {nextAppointment ? (
              <div className="relative z-10">
                <div className="mb-8">
                  <p className="text-5xl font-black tracking-tighter">{format(new Date(nextAppointment.startTime), 'dd')}</p>
                  <p className="text-primary-foreground/80 font-black uppercase tracking-widest text-xs mt-1">
                    {format(new Date(nextAppointment.startTime), 'EEEE, hh:mm aa', { locale: ar })}
                  </p>
                </div>
                <div className="p-4 bg-white/10 rounded-2xl mb-8 backdrop-blur-md border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/60 mb-1">الطبيب المعالج</p>
                  <p className="font-bold text-lg">د. {nextAppointment.doctor?.fullName}</p>
                  <p className="text-xs text-primary-foreground/70">{nextAppointment.doctor?.licenseNumber || 'مرخص'}</p>
                </div>
                <Button 
                  variant="premium" 
                  className="w-full h-14 bg-white text-primary hover:bg-zinc-100 rounded-[1rem] font-black uppercase tracking-widest shadow-xl"
                  onClick={openRescheduleModal}
                >
                  تعديل الحجز
                </Button>
              </div>
            ) : (
              <div className="relative z-10 py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/20">
                 <p className="text-sm font-bold text-white/60 mb-4">لا توجد مواعيد قادمة</p>
                 <Button 
                   variant="premium" 
                   size="sm" 
                   className="bg-white text-primary font-black uppercase tracking-widest text-[10px]"
                   onClick={() => router.push('/patient/book')}
                 >
                    حجز الآن
                 </Button>
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border sub-border shadow-sm text-right">
            <h3 className="text-lg font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2 justify-start">
              <CreditCard className="text-primary" size={20} />
              الرصيد المالي
            </h3>
            
            {unpaidBills.length === 0 ? (
               <div className="py-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">تمت تسوية الحساب بالكامل</p>
               </div>
            ) : (
              <div className="space-y-4 mb-8">
                {unpaidBills.map((inv: any) => (
                  <div key={inv.id} className="flex justify-between items-center p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border sub-border">
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-800">الرسوم الطبية</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5">تاريخ الاستحقاق: {format(new Date(inv.dueDate), 'dd MMMM', { locale: ar })}</p>
                    </div>
                    <span className="font-black text-lg text-slate-800">{parseFloat(inv.totalAmount).toLocaleString()} ج.م</span>
                  </div>
                ))}
              </div>
            )}
            
            {unpaidBills.length > 0 && (
              <Button 
                className="w-full h-14 rounded-[1rem] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                تسوية المبالغ المستحقة
              </Button>
            )}
          </section>
        </div>
      </div>

      {/* Settle Balance / Card Checkout Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border sub-border rounded-[2rem] p-8 shadow-2xl text-right" dir="rtl">
          <div className="mb-6">
            <h3 className="text-2xl font-black tracking-tight text-slate-800">بوابة الدفع الإلكتروني</h3>
            <p className="text-sm text-muted-foreground mt-1">قم بتسوية المستحقات المتبقية عبر بوابة الدفع الآمنة الخاصة بنا.</p>
          </div>

          {/* Visual Credit Card Preview */}
          <div className="relative w-full h-48 bg-gradient-to-br from-indigo-900 via-slate-900 to-zinc-900 text-white p-6 rounded-2xl shadow-xl overflow-hidden mb-6 flex flex-col justify-between border border-zinc-700/30">
            <div className="absolute inset-0 bg-white/5 opacity-5 pointer-events-none" />
            <div className="flex justify-between items-start">
              <div className="w-10 h-7 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-md shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 border border-black/10 opacity-30 grid grid-cols-3 grid-rows-3" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full text-white/90">
                {getCardType(cardNumber)}
              </span>
            </div>
            <div className="my-2 text-xl font-mono tracking-widest text-center" dir="ltr">
              {formattedCardDisplay()}
            </div>
            <div className="flex justify-between items-end">
              <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/40">حامل البطاقة</p>
                <p className="text-sm font-bold uppercase truncate max-w-[200px]">
                  {cardHolder || 'اسم حامل البطاقة'}
                </p>
              </div>
              <div className="text-left">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/40">تاريخ الانتهاء</p>
                <p className="text-sm font-mono font-bold">
                  {cardExpiry || 'MM/YY'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border sub-border flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-slate-800">الإجمالي المستحق</span>
              <span className="text-xl font-black text-primary">
                {unpaidBills.reduce((acc: number, inv: any) => acc + parseFloat(inv.totalAmount), 0).toLocaleString()} ج.م
              </span>
            </div>

            <Input 
              label="اسم حامل البطاقة" 
              placeholder="مثال: أحمد عبد الله"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              required
            />
            
            <Input 
              label="رقم البطاقة" 
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={handleCardNumberChange}
              maxLength={19}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="تاريخ الانتهاء" 
                placeholder="MM/YY"
                value={cardExpiry}
                onChange={handleExpiryChange}
                maxLength={5}
                required
              />
              <Input 
                label="رمز الأمان (CVV)" 
                placeholder="000"
                type="password"
                value={cardCvv}
                onChange={handleCvvChange}
                maxLength={3}
                required
              />
            </div>

            <div className="flex gap-3 mt-8">
              <Button 
                type="button" 
                variant="ghost" 
                className="flex-1 font-bold"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                className="flex-1 font-bold shadow-lg shadow-primary/20"
                isLoading={settleBalanceMutation.isPending}
              >
                تأكيد الدفع
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reschedule Session Modal */}
      <Dialog open={isRescheduleModalOpen} onOpenChange={setIsRescheduleModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border sub-border rounded-[2rem] p-8 shadow-2xl text-right" dir="rtl">
          <div className="mb-6">
            <h3 className="text-2xl font-black tracking-tight text-slate-800">إعادة جدولة الحجز</h3>
            <p className="text-sm text-muted-foreground mt-1 font-medium">اختر تاريخاً ووقت بدء جديد لموعدك الطبي.</p>
          </div>

          <form onSubmit={handleRescheduleSubmit} className="space-y-4">
            <Input 
              label="التاريخ المفضل" 
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              required
            />
            
            <Input 
              label="وقت البدء" 
              type="time"
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
              required
            />

            {nextAppointment && (
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mt-4 text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-1">الجدول الزمني الحالي</p>
                <p className="text-xs font-bold text-slate-800">
                  {format(new Date(nextAppointment.startTime), 'EEEE, dd MMMM yyyy', { locale: ar })} @ {format(new Date(nextAppointment.startTime), 'hh:mm aa', { locale: ar })}
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <Button 
                type="button" 
                variant="ghost" 
                className="flex-1 font-bold"
                onClick={() => setIsRescheduleModalOpen(false)}
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                className="flex-1 font-bold shadow-lg shadow-primary/20"
                isLoading={rescheduleMutation.isPending}
              >
                إعادة جدولة
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
