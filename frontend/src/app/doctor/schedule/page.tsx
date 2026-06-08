'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CalendarView from '@/components/calendar/CalendarView';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, MoreVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';

export default function DoctorSchedule() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [blockDate, setBlockDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ['doctor-schedule', user?.id],
    queryFn: async () => {
      const response = await api.get(`/appointments/doctor/${user?.id}`);
      return response.data;
    },
    enabled: !!user?.id
  });

  const blockMutation = useMutation({
    mutationFn: async (data: { startTime: string; endTime: string; reason: string }) => {
      return api.post('/appointments/block-time', {
        doctorId: user?.id,
        startTime: data.startTime,
        endTime: data.endTime,
        reason: data.reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedule'] });
      addToast('تم حظر الفترة الزمنية بنجاح!', 'success');
      setIsBlockOpen(false);
      setBlockDate('');
      setBlockStartTime('');
      setBlockEndTime('');
      setBlockReason('');
      refetch();
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'فشل حظر الفترة الزمنية.', 'error');
    }
  });

  const handleBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate || !blockStartTime || !blockEndTime) return;
    const startDateTime = new Date(`${blockDate}T${blockStartTime}:00`);
    const endDateTime = new Date(`${blockDate}T${blockEndTime}:00`);

    if (startDateTime >= endDateTime) {
      addToast('يجب أن يكون وقت الانتهاء بعد وقت البدء.', 'error');
      return;
    }

    blockMutation.mutate({
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      reason: blockReason || 'فترة محظورة'
    });
  };

  const calendarEvents = appointments?.map((appt: any) => ({
    id: appt.id,
    title: `${appt.patient?.fullName} - ${appt.notes || 'كشف طبي'}`,
    start: appt.startTime,
    end: appt.endTime,
    backgroundColor: appt.status === 'COMPLETED' ? '#10b981' : appt.status === 'IN_PROGRESS' ? '#0066FF' : '#f59e0b',
    extendedProps: {
      patientName: appt.patient?.fullName,
      status: appt.status
    }
  })) || [];

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 text-right" dir="rtl">
        <div>
          <h1 className="text-3xl font-black tracking-tight">الجدول الزمني السريري</h1>
          <p className="text-muted-foreground mt-1 font-medium">إدارة فترات توفرك ومراجعة الحجوزات والمواعيد القادمة.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="premium" className="font-black uppercase tracking-widest text-xs h-12 px-6 shadow-xl shadow-primary/20" onClick={() => setIsBlockOpen(true)}>
             <Plus className="w-4 h-4 ml-2" /> حظر فترة زمنية
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 text-right" dir="rtl">
        <div className="xl:col-span-3">
           <Card className="p-4 bg-white dark:bg-zinc-900 border sub-border rounded-[2rem] shadow-sm">
              {isLoading ? (
                <div className="h-[600px] flex items-center justify-center">
                   <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              ) : (
                <CalendarView events={calendarEvents} />
              )}
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="premium-card p-6 bg-zinc-50 dark:bg-zinc-800/50 border sub-border rounded-[2rem] text-right">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6">إحصائيات المواعيد</h3>
              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">حالات اليوم</span>
                    <span className="px-3 py-1 bg-primary text-white rounded-full text-[10px] font-black">{appointments?.length || 0} حالات</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">نسبة استغلال الأسبوع</span>
                    <span className="text-lg font-black text-primary">82%</span>
                 </div>
                 <div className="pt-4 border-t sub-border">
                    <p className="text-[10px] font-bold text-muted-foreground leading-relaxed italic">
                       "تم ضبط وتنسيق مواعيد جدولك الزمني بناءً على متوسط ٢٥ دقيقة لكل جلسة مريض."
                    </p>
                 </div>
              </div>
           </Card>

           <div className="p-8 bg-primary rounded-[2rem] text-white shadow-2xl shadow-primary/20 text-right">
              <h4 className="font-black text-lg mb-4 flex items-center gap-2">
                 <Clock size={20} />
                 ملاحظة المناوبات
              </h4>
              <p className="text-xs text-primary-foreground/80 leading-relaxed font-medium">
                 الأسبوع القادم يتضمن إجازة رسمية يوم الخميس. تم إعادة جدولة المواعيد غير الطارئة تلقائياً.
              </p>
           </div>
        </div>
      </div>

      {/* Block Time Modal */}
      {isBlockOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md animate-in text-right" dir="rtl">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md p-8 shadow-2xl border sub-border">
            <h3 className="text-2xl font-bold tracking-tight mb-2">حظر فترة زمنية</h3>
            <p className="text-sm text-muted-foreground mb-8">اختر التاريخ والمدد الزمنية لحظر حجز المواعيد فيها.</p>
            
            <form onSubmit={handleBlockSubmit} className="space-y-4">
              <Input 
                label="التاريخ" 
                type="date" 
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="وقت البدء" 
                  type="time" 
                  value={blockStartTime}
                  onChange={(e) => setBlockStartTime(e.target.value)}
                  required
                />
                <Input 
                  label="وقت الانتهاء" 
                  type="time" 
                  value={blockEndTime}
                  onChange={(e) => setBlockEndTime(e.target.value)}
                  required
                />
              </div>
              <Input 
                label="السبب / ملاحظات" 
                placeholder="مثال: استراحة غداء، مؤتمر علمي"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />

              <div className="flex gap-3 mt-10">
                <Button 
                  type="button"
                  variant="ghost"
                  className="flex-1 font-bold"
                  onClick={() => setIsBlockOpen(false)}
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 font-bold shadow-lg shadow-primary/20"
                  isLoading={blockMutation.isPending}
                >
                  تأكيد الحظر
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
