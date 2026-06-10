'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Calendar, 
  Clock, 
  FileText,
  ArrowRight,
  Search as SearchIcon,
  CheckCircle2,
  Stethoscope,
  ClipboardList
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { RecordEncounterModal } from '@/components/clinical/RecordEncounterModal';
import { PatientMedicalFileModal } from '@/components/clinical/PatientMedicalFileModal';
import { ar } from 'date-fns/locale';

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [activePatientId, setActivePatientId] = useState<string>('');

  // Fetch doctor appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['doctor-appointments', user?.id],
    queryFn: async () => {
      const response = await api.get(`/appointments/doctor/${user?.id}`);
      return response.data;
    },
    enabled: !!user?.id
  });

  // Update appointment status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return api.patch(`/appointments/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
    }
  });

  const filteredAppointments = appointments?.filter((appt: any) => 
    appt.patient?.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-3xl font-black tracking-tight text-slate-800">القيادة السريرية</h3>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">
                {format(new Date(), 'EEEE, d MMMM yyyy', { locale: ar })}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-5 py-2.5 bg-primary/10 text-primary rounded-2xl text-[10px] font-black uppercase tracking-tight border border-primary/10 shadow-sm">
                {appointments?.length || 0} إجمالي الحالات
              </span>
              <span className="px-5 py-2.5 bg-emerald-100 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-tight border border-emerald-200 shadow-sm">
                {appointments?.filter((a: any) => a.status === 'COMPLETED').length || 0} منتهية
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
            ) : filteredAppointments?.length === 0 ? (
              <div className="py-20 text-center bg-accent/30 rounded-[3rem] border-2 border-dashed border-accent">
                 <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                 <p className="text-lg font-bold text-muted-foreground">لا توجد جلسات سريرية اليوم.</p>
              </div>
            ) : (
              filteredAppointments?.map((appt: any) => (
                <div 
                  key={appt.id} 
                  className={cn(
                    "group p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border sub-border shadow-sm transition-all hover:shadow-2xl hover:shadow-zinc-200/50 relative overflow-hidden",
                    appt.status === 'IN_PROGRESS' ? "ring-2 ring-primary border-primary bg-primary/5" : ""
                  )}
                >
                  <div className={cn(
                    "absolute right-0 top-0 bottom-0 w-2",
                    appt.status === 'COMPLETED' ? "bg-emerald-500" :
                    appt.status === 'IN_PROGRESS' ? "bg-primary" :
                    appt.status === 'CANCELLED' ? "bg-destructive" : "bg-amber-400"
                  )} />

                  <div className="flex flex-col lg:flex-row items-center gap-10">
                    <div className="w-24 text-center lg:border-l sub-border lg:pl-10 shrink-0">
                      <p className="text-2xl font-black text-primary">{format(new Date(appt.startTime), 'hh:mm')}</p>
                      <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground mt-1">{format(new Date(appt.startTime), 'aa', { locale: ar })}</p>
                    </div>
                    
                    <div className="flex-1 flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-accent flex items-center justify-center text-primary font-black shadow-inner">
                         {appt.patient?.fullName[0]}
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-800 tracking-tight">{appt.patient?.fullName}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded-md">الشكوى</span>
                          <span className="text-[10px] font-bold text-slate-600 italic">"{appt.notes || 'متابعة روتينية'}"</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className={cn(
                        "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                        appt.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        appt.status === 'IN_PROGRESS' ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" :
                        "bg-amber-50 text-amber-600 border-amber-100"
                      )}>
                        {appt.status === 'SCHEDULED' ? 'مجدول' : appt.status === 'IN_PROGRESS' ? 'قيد الكشف' : 'مكتمل'}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-12 h-12 rounded-xl border sub-border hover:bg-primary/10 hover:text-primary transition-all"
                          onClick={() => {
                            setActivePatientId(appt.patientId);
                            setIsHistoryModalOpen(true);
                          }}
                        >
                          <FileText size={20} />
                        </Button>
                        
                        {appt.status !== 'COMPLETED' && (
                          <Button 
                            variant={appt.status === 'IN_PROGRESS' ? "premium" : "primary"}
                            size="icon" 
                            className="w-12 h-12 rounded-xl shadow-xl transition-all"
                            onClick={() => {
                              if (appt.status === 'SCHEDULED') {
                                statusMutation.mutate({ id: appt.id, status: 'IN_PROGRESS' });
                              } else {
                                setSelectedAppointment(appt);
                                setIsModalOpen(true);
                              }
                            }}
                          >
                             {appt.status === 'IN_PROGRESS' ? <ClipboardList size={20} /> : <ArrowRight size={20} className="rotate-180" />}
                          </Button>
                        )}
                        
                        {appt.status === 'COMPLETED' && (
                          <div className="w-12 h-12 flex items-center justify-center text-emerald-500 bg-emerald-50 rounded-xl">
                             <CheckCircle2 size={24} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-8 bg-white dark:bg-zinc-900 border sub-border rounded-[2.5rem] shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
              <SearchIcon size={16} className="text-primary" />
              بحث سريع
            </h4>
            <div className="relative">
               <input 
                 type="text" 
                 placeholder="تصفية الجدول..." 
                 className="w-full h-12 bg-accent/30 border-none rounded-xl text-xs px-5 pr-12 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
               <SearchIcon size={16} className="absolute right-4 top-3.5 text-muted-foreground" />
            </div>
          </Card>

          <div className="p-10 bg-zinc-900 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 left-0 p-8 opacity-10 -rotate-12 group-hover:scale-110 transition-transform"><Stethoscope size={140} /></div>
             <div className="relative z-10">
                <h4 className="font-black text-xl mb-10 flex items-center gap-3 text-primary">
                  <Clock size={24} />
                  الكفاءة
                </h4>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-bold uppercase tracking-widest text-[9px]">وقت الانتظار</span>
                    <span className="font-black text-2xl text-emerald-400">9د</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-bold uppercase tracking-widest text-[9px]">الإنتاجية</span>
                    <span className="font-black text-2xl">100%</span>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    window.open(`${api.defaults.baseURL}/reports/doctor-daily/${user?.id}`, '_blank');
                  }}
                  className="w-full mt-12 h-14 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl"
                >
                   التقرير اليومي
                </Button>
             </div>
          </div>
        </div>
      </div>

      <RecordEncounterModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={selectedAppointment}
      />

      <PatientMedicalFileModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        patientId={activePatientId}
      />
    </DashboardLayout>
  );
}

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("overflow-hidden", className)}>{children}</div>;
}
