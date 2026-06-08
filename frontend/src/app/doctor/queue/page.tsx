'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ClipboardList, User, Play, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function DoctorQueue() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['doctor-queue', user?.id],
    queryFn: async () => {
      const response = await api.get(`/appointments/doctor/${user?.id}`);
      return response.data;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30s
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return api.patch(`/appointments/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
    }
  });

  const waitingPatients = appointments?.filter((a: any) => a.status === 'SCHEDULED' || a.status === 'IN_PROGRESS' || a.status === 'CHECKED_IN') || [];
  const activePatient = waitingPatients.find((a: any) => a.status === 'IN_PROGRESS');
  const upcomingPatients = waitingPatients.filter((a: any) => a.status === 'SCHEDULED' || a.status === 'CHECKED_IN');

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-800">قائمة الانتظار النشطة</h1>
        <p className="text-muted-foreground mt-1 font-medium uppercase tracking-widest text-[10px]">مراقبة تدفق المرضى المباشر ليوم {format(new Date(), 'EEEE, d MMMM', { locale: ar })}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
          ) : waitingPatients.length === 0 ? (
             <div className="py-20 text-center bg-accent/20 rounded-[2rem] border-2 border-dashed border-accent">
                <p className="text-lg font-bold text-muted-foreground">غرفة الانتظار فارغة حالياً.</p>
             </div>
          ) : (
            <>
              {activePatient && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary mr-2">قيد الكشف حالياً</h3>
                  <Card className="overflow-hidden border-2 border-primary bg-primary/5 rounded-[2rem] shadow-xl shadow-primary/10">
                    <CardContent className="p-8">
                      <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-20 h-20 rounded-[2rem] bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                           <User size={32} />
                        </div>
                        <div className="flex-1 text-center md:text-right">
                          <h3 className="text-2xl font-black tracking-tight text-slate-800">{activePatient.patient?.fullName}</h3>
                          <p className="text-sm font-bold text-primary mt-1">بدأت الجلسة الساعة {format(new Date(activePatient.startTime), 'hh:mm aa', { locale: ar })}</p>
                        </div>
                        <Button 
                          variant="premium" 
                          className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                          onClick={() => statusMutation.mutate({ id: activePatient.id, status: 'COMPLETED' })}
                        >
                          <CheckCircle2 size={20} className="ml-2" /> إنهاء الزيارة
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {upcomingPatients.length > 0 && (
                <div className="space-y-4">
                   <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mr-2">التالي في القائمة</h3>
                   <div className="space-y-3">
                      {upcomingPatients.map((appt: any) => (
                        <Card key={appt.id} className="sub-border rounded-[1.5rem] hover:border-primary/50 transition-all group">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-6">
                               <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                  <Clock size={20} />
                               </div>
                               <div className="flex-1">
                                  <h4 className="font-bold text-slate-800">{appt.patient?.fullName}</h4>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">موعد محدد الساعة {format(new Date(appt.startTime), 'hh:mm aa', { locale: ar })}</p>
                               </div>
                               <Button 
                                 className="rounded-xl font-bold"
                                 onClick={() => statusMutation.mutate({ id: appt.id, status: 'IN_PROGRESS' })}
                               >
                                  <Play size={16} className="ml-2" /> بدء الجلسة
                               </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                   </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-6">
          <Card className="premium-card bg-zinc-900 text-white border-none p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 -mr-8 -mt-8 rotate-12"><ClipboardList size={120} /></div>
             <h4 className="font-black text-xl mb-8 relative z-10">إحصائيات الانتظار</h4>
             <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center py-4 border-b border-white/10">
                   <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">في الانتظار</span>
                   <span className="font-black text-3xl text-primary">{upcomingPatients.length}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-white/10">
                   <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">متوسط الانتظار</span>
                   <span className="font-black text-3xl text-emerald-400">12 دقيقة</span>
                </div>
             </div>
             <Button 
               className="w-full mt-10 h-14 bg-white text-black hover:bg-zinc-200 rounded-[1.25rem] font-black uppercase tracking-widest shadow-xl"
               onClick={() => {
                  if (upcomingPatients[0]) {
                    statusMutation.mutate({ id: upcomingPatients[0].id, status: 'IN_PROGRESS' });
                  } else {
                    alert('غرفة الانتظار فارغة!');
                  }
               }}
             >
                نداء المريض التالي
             </Button>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
