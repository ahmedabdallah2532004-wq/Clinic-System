'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CalendarView from '@/components/calendar/CalendarView';
import { Plus, UserPlus, User, CreditCard, Search, CheckCircle2, Clock, Activity, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { RegisterPatientModal } from '@/components/receptionist/RegisterPatientModal';
import { InvoicePrintView } from '@/components/billing/InvoicePrintView';
import { Combobox } from '@/components/ui/Combobox';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const bookingSchema = z.object({
  patientId: z.string().min(1, 'يرجى اختيار مريض'),
  doctorId: z.string().min(1, 'يرجى اختيار طبيب'),
  date: z.string().min(1, 'يرجى اختيار التاريخ'),
  time: z.string().min(1, 'يرجى اختيار الوقت'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function ReceptionistDashboard() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [printInvoiceData, _setPrintInvoiceData] = useState<any>(null);

  // Fetch all appointments for the calendar
  const { data: appointments } = useQuery({
    queryKey: ['all-appointments'],
    queryFn: async () => {
      const response = await api.get('/appointments');
      return response.data;
    },
    refetchInterval: 15000, // Auto-refresh every 15s
  });

  // Fetch invoices for the recent list
  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await api.get('/billing/invoices');
      return response.data;
    },
    refetchInterval: 15000,
  });

  const calendarEvents = appointments?.map((appt: any) => ({
    id: appt.id,
    title: `${appt.patient?.fullName} - ${appt.notes || 'Checkup'}`,
    start: appt.startTime,
    end: appt.endTime,
    backgroundColor: appt.status === 'COMPLETED' ? '#10b981' : appt.status === 'IN_PROGRESS' ? '#0066FF' : '#f59e0b',
    extendedProps: {
      patientName: appt.patient?.fullName,
      doctorName: appt.doctor?.fullName,
      status: appt.status
    }
  })) || [];

  // Fetch doctors
  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const response = await api.get('/doctors');
      return response.data;
    }
  });

  // Fetch patients
  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await api.get('/patients');
      return response.data;
    }
  });

  const { addToast } = useToast();

  const {
    control,
    register,
    handleSubmit: handleBookingSubmit,
    reset: resetBooking,
    setValue: setBookingValue,
    watch: _watchBooking,
    formState: { errors: bookingErrors }
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      patientId: '',
      doctorId: '',
      date: '',
      time: ''
    }
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const startDateTime = new Date(`${data.date}T${data.time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

      return api.post('/appointments', {
        doctorId: data.doctorId,
        patientId: data.patientId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: `حجز من مكتب الاستقبال`
      });
    },
    onSuccess: () => {
      addToast('تم حجز الموعد بنجاح!', 'success');
      setIsModalOpen(false);
      resetBooking();
      queryClient.invalidateQueries({ queryKey: ['all-appointments'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'فشل حجز الموعد. يرجى التحقق من التوفر.';
      addToast(msg, 'error');
    }
  });

  const handleBookAppointment = (data: BookingFormData) => {
    bookingMutation.mutate(data);
  };

  const checkInMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/appointments/${id}/status`, { status: 'CHECKED_IN' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-appointments'] });
    }
  });

  const waitingPatients = appointments?.filter((a: any) => a.status === 'CHECKED_IN') || [];

  const [searchQuery, setSearchQuery] = useState('');

  // Filtered results for search
  const searchResults = React.useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    
    // Search in appointments
    const filteredAppts = appointments?.filter((a: any) => 
      a.patient?.fullName.toLowerCase().includes(q) || 
      a.patient?.contactNumber.includes(q) ||
      a.id.toLowerCase().includes(q)
    ).map((a: any) => ({ ...a, type: 'appointment' })) || [];

    // Search in patients not already in filteredAppts
    const filteredPatients = patients?.filter((p: any) => 
      (p.fullName.toLowerCase().includes(q) || p.contactNumber.includes(q)) &&
      !filteredAppts.some((a: any) => a.patientId === p.id)
    ).map((p: any) => ({ ...p, type: 'patient' })) || [];

    return [...filteredAppts, ...filteredPatients].slice(0, 10);
  }, [searchQuery, appointments, patients]);

  const filteredAppointments = appointments?.filter((a: any) => a.status === 'SCHEDULED') || [];

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">مركز الاستقبال</h1>
          <p className="text-muted-foreground mt-1 font-medium">{format(new Date(), 'EEEE, d MMMM yyyy', { locale: ar })}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="premium" className="flex-1 md:flex-none font-bold" onClick={() => setIsRegisterModalOpen(true)}>
            <UserPlus size={18} className="ml-2" />
            مريض جديد
          </Button>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none font-bold shadow-lg shadow-primary/20"
          >
            <Plus size={18} className="ml-2" />
            حجز موعد
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-8">
          {/* Quick Search Bar */}
          <div className="relative group">
             <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
             <input 
               type="text"
               placeholder="ابحث عن مريض بالاسم، رقم الموبايل، أو رقم الموعد..."
               className="w-full h-16 bg-white dark:bg-zinc-900 rounded-[2rem] pr-14 pl-6 text-sm font-bold border sub-border shadow-xl shadow-zinc-200/50 dark:shadow-none outline-none focus:ring-4 focus:ring-primary/5 transition-all"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>

          <Card className="p-2 bg-white dark:bg-zinc-900 border sub-border shadow-sm rounded-[2.5rem] overflow-hidden">
            <CalendarView events={calendarEvents} />
          </Card>

          {/* Search Results / Quick Check-in List */}
          <Card className="p-8 bg-white dark:bg-zinc-900 border sub-border rounded-[2.5rem] shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-800">
                  {searchQuery ? 'نتائج البحث' : 'قائمة التحقق السريع (اليوم)'}
                </h3>
                {searchQuery && (
                  <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="h-8 text-[10px] font-black uppercase">إلغاء البحث</Button>
                )}
             </div>
             <div className="space-y-4">
                {(searchQuery ? searchResults : filteredAppointments.slice(0, 5)).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border sub-border group hover:border-primary/50 transition-all">
                     <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-black",
                          item.type === 'appointment' ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-600"
                        )}>
                           {item.type === 'appointment' ? <Clock size={18} /> : <User size={18} />}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-slate-800">
                             {item.type === 'appointment' ? item.patient?.fullName : item.fullName}
                           </p>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                             {item.type === 'appointment' 
                               ? `${format(new Date(item.startTime), 'hh:mm aa', { locale: ar })} - موعد`
                               : `${item.contactNumber} - مريض`
                             }
                           </p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        {item.type === 'appointment' && item.status === 'SCHEDULED' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-9 px-4 rounded-xl font-bold text-xs hover:bg-primary hover:text-white transition-all"
                            onClick={() => checkInMutation.mutate(item.id)}
                            disabled={checkInMutation.isPending}
                          >
                            تحويل للانتظار
                          </Button>
                        )}
                        {item.type === 'patient' && (
                          <Button 
                            size="sm" 
                            variant="primary" 
                            className="h-9 px-4 rounded-xl font-bold text-xs"
                            onClick={() => {
                              setBookingValue('patientId', item.id);
                              setIsModalOpen(true);
                            }}
                          >
                            حجز موعد
                          </Button>
                        )}
                     </div>
                  </div>
                ))}
                {searchQuery && searchResults.length === 0 && (
                  <p className="text-center py-6 text-sm font-bold text-muted-foreground">لا توجد نتائج بحث مطابقة.</p>
                )}
                {!searchQuery && filteredAppointments.length === 0 && (
                  <p className="text-center py-6 text-sm font-bold text-muted-foreground">لا توجد مواعيد مجدولة حالياً.</p>
                )}
             </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Waiting Room */}
          <Card className="premium-card bg-zinc-900 text-white border-none shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Clock className="w-20 h-20 rotate-12" />
            </div>
            <CardHeader className="p-6 relative z-10">
              <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-primary">
                <Activity className="w-4 h-4" />
                غرفة الانتظار
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4 relative z-10">
              {waitingPatients.length === 0 ? (
                <div className="py-10 text-center border border-white/10 rounded-2xl border-dashed">
                   <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">لا يوجد مرضى حالياً</p>
                </div>
              ) : (
                waitingPatients.map((p: any) => (
                  <div key={p.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group">
                     <div>
                        <p className="text-sm font-bold text-white">{p.patient?.fullName}</p>
                        <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-tight">مع د. {p.doctor?.fullName}</p>
                     </div>
                     <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(0,102,255,0.5)]" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="premium-card bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-primary uppercase tracking-wider">ضغط اليوم</p>
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-4xl font-black text-primary">{appointments?.length || 0} / 24</h3>
              <p className="text-xs text-primary/70 font-medium mt-2">إحصائيات المواعيد لليوم</p>
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card className="premium-card">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="text-primary" size={16} />
                الفواتير الأخيرة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {(invoices || []).slice(0, 3).map((inv: any) => (
                <div key={inv.id} className="group p-4 bg-accent/30 hover:bg-accent/50 rounded-xl transition-all border border-transparent hover:border-primary/20">
                   <div className="flex justify-between items-start mb-2">
                     <p className="text-xs font-bold text-slate-800">#INV-{inv.id.slice(0, 6).toUpperCase()}</p>
                     <span className="text-xs font-black text-primary">{Number(inv.totalAmount).toLocaleString()} ج.م</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{inv.patient?.fullName}</p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => {
                              window.open(`${api.defaults.baseURL}/reports/invoice/${inv.id}`, '_blank');
                           }}
                           className="p-1.5 hover:bg-white rounded-lg text-muted-foreground hover:text-primary transition-colors"
                         >
                            <Printer size={12} />
                         </button>
                      </div>
                   </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-xs font-bold py-2" onClick={() => window.location.href='/admin/billing'}>عرض كافة الفواتير</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden Print View */}
      {printInvoiceData && <InvoicePrintView invoice={printInvoiceData} />}

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md animate-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md p-8 shadow-2xl border sub-border">
            <h3 className="text-2xl font-bold tracking-tight mb-2">حجز موعد جديد</h3>
            <p className="text-sm text-muted-foreground mb-8">جدولة موعد مريض جديد في النظام.</p>
            
            <div className="space-y-5">
              <Controller
                name="patientId"
                control={control}
                render={({ field }) => (
                  <Combobox 
                    label="المريض"
                    placeholder="ابحث عن مريض..."
                    options={patients?.map((p: any) => ({
                      value: p.id,
                      label: p.fullName,
                      details: p.contactNumber
                    })) || []}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {bookingErrors.patientId && <p className="text-[10px] font-bold text-destructive mr-1">{bookingErrors.patientId.message}</p>}
              
              <Controller
                name="doctorId"
                control={control}
                render={({ field }) => (
                  <Combobox 
                    label="الطبيب المختص"
                    placeholder="اختر الطبيب..."
                    options={doctors?.map((doc: any) => ({
                      value: doc.id,
                      label: `د. ${doc.fullName}`,
                      details: doc.specialties?.[0]?.name || 'عام'
                    })) || []}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {bookingErrors.doctorId && <p className="text-[10px] font-bold text-destructive mr-1">{bookingErrors.doctorId.message}</p>}

              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="التاريخ" 
                  type="date" 
                  {...register('date')} 
                  errorMessage={bookingErrors.date?.message}
                />
                <Input 
                  label="الوقت" 
                  type="time" 
                  {...register('time')} 
                  errorMessage={bookingErrors.time?.message}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <Button 
                variant="premium"
                className="flex-1 font-bold"
                onClick={() => setIsModalOpen(false)}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleBookingSubmit(handleBookAppointment)}
                className="flex-1 font-bold shadow-lg shadow-primary/20"
                isLoading={bookingMutation.isPending}
              >
                تأكيد الحجز
              </Button>
            </div>
          </div>
        </div>
      )}

      <RegisterPatientModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
        onSuccess={(patient) => {
          setBookingValue('patientId', patient.id);
          setIsModalOpen(true);
        }}
      />
    </DashboardLayout>
  );
}
