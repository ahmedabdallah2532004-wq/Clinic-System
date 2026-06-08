'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CalendarView from '@/components/calendar/CalendarView';
import { AppointmentDetailModal } from '@/components/calendar/AppointmentDetailModal';
import { Plus, Search, Filter, Download, Calendar as CalendarIcon, List, Clock, User, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppointmentsPage() {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  
  // Booking Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookingFormData, setBookingFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    notes: ''
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // Fetch Appointments
  const { data: rawAppointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const response = await api.get('/appointments');
      return response.data;
    }
  });

  // Fetch Patients & Doctors for dropdowns
  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await api.get('/patients');
      return response.data;
    }
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const response = await api.get('/doctors');
      return response.data;
    }
  });

  // Extract unique specialties
  const specializations = Array.from(
    new Set((doctors || []).map((d: any) => d.specialization).filter(Boolean))
  ) as string[];

  // Mutations
  const bookingMutation = useMutation({
    mutationFn: async (data: typeof bookingFormData) => {
      const startDateTime = new Date(`${data.date}T${data.time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 mins
      
      return api.post('/appointments', {
        doctorId: data.doctorId,
        patientId: data.patientId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: data.notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      addToast('تم حجز الموعد بنجاح!', 'success');
      setIsBookModalOpen(false);
      setBookingFormData({ patientId: '', doctorId: '', date: '', time: '', notes: '' });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'فشل حجز الموعد. يرجى التحقق من توفر الطبيب.';
      addToast(msg, 'error');
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return api.patch(`/appointments/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      addToast('Appointment status updated', 'success');
      setIsDetailModalOpen(false);
    }
  });

  function getStatusColor(status: string) {
    switch (status) {
      case 'SCHEDULED': return '#0066FF';
      case 'IN_PROGRESS': return '#8b5cf6';
      case 'COMPLETED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      default: return '#64748b';
    }
  }

  const handleEventClick = (info: any) => {
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      extendedProps: info.event.extendedProps
    });
    setIsDetailModalOpen(true);
  };

  // Filter logic
  const filteredAppointmentsData = rawAppointments?.filter((apt: any) => {
    const matchesSearch = 
      apt.patient?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.doctor?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.notes && apt.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesSpecialty = 
      selectedSpecialty === 'All' || 
      apt.doctor?.specialization === selectedSpecialty;
      
    return matchesSearch && matchesSpecialty;
  }) || [];

  const appointments = filteredAppointmentsData.map((apt: any) => ({
    id: apt.id,
    title: `${apt.patient?.fullName} - ${apt.notes || 'Consultation'}`,
    start: apt.startTime,
    end: apt.endTime,
    backgroundColor: getStatusColor(apt.status),
    extendedProps: {
      patientName: apt.patient?.fullName,
      doctorName: apt.doctor?.fullName,
      status: apt.status,
      notes: apt.notes
    }
  }));

  const handleExport = () => {
    if (filteredAppointmentsData.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8,"
      + "المريض,الطبيب,البدء,الانتهاء,الحالة,ملاحظات\n"
      + filteredAppointmentsData.map((a: any) => 
          `"${a.patient?.fullName}","${a.doctor?.fullName}","${a.startTime}","${a.endTime}","${a.status}","${a.notes || ''}"`
        ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clinic-schedule-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Advanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Clinical Scheduler</h1>
            <p className="text-muted-foreground mt-1 font-medium italic">Synchronized management of medical appointments and specialist availability.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             <div className="bg-white dark:bg-zinc-900 border sub-border rounded-2xl p-1.5 flex items-center shadow-sm">
                <button 
                  onClick={() => setViewMode('calendar')}
                  className={cn(
                    "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                    viewMode === 'calendar' ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-accent text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="w-3.5 h-3.5" /> Calendar
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                    viewMode === 'list' ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-accent text-muted-foreground"
                  )}
                >
                  <List className="w-3.5 h-3.5" /> List View
                </button>
             </div>
             
             <div className="h-10 w-px bg-border mx-2 hidden md:block" />
             
             <Button 
               variant="premium" 
               size="sm" 
               className="font-black uppercase tracking-widest text-[10px] h-11 px-6 rounded-xl"
               onClick={handleExport}
             >
                <Download className="w-4 h-4 mr-2" /> Export
             </Button>
             <Button 
               size="sm" 
               className="font-black uppercase tracking-widest text-[10px] h-11 px-6 rounded-xl shadow-xl shadow-primary/20" 
               onClick={() => setIsBookModalOpen(true)}
             >
                <Plus className="w-4 h-4 mr-2" /> Book Visit
             </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
           {/* Sidebar Filter */}
           <div className="hidden xl:block space-y-6">
              <Card className="p-8 premium-card bg-white dark:bg-zinc-900 border sub-border rounded-[2rem]">
                 <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Search className="w-4 h-4 text-primary" /> Advanced Search
                 </h3>
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Search Keywords</label>
                       <Input 
                        placeholder="Patient or Doctor..." 
                        className="h-12 text-sm rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Specialty</label>
                       <select 
                         value={selectedSpecialty}
                         onChange={(e) => setSelectedSpecialty(e.target.value)}
                         className="w-full h-12 bg-accent/30 border-none rounded-xl px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                       >
                          <option value="All">All Specializations</option>
                          {specializations.map((spec) => (
                            <option key={spec} value={spec}>{spec}</option>
                          ))}
                       </select>
                    </div>
                    <Button 
                      variant="premium" 
                      className="w-full h-12 text-[10px] font-black uppercase tracking-widest rounded-xl"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedSpecialty('All');
                      }}
                    >
                      Reset filters
                    </Button>
                 </div>
              </Card>

              <Card className="p-8 bg-primary text-white border-none rounded-[2rem] shadow-2xl shadow-primary/20 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10 -mr-8 -mt-8 rotate-12"><Clock size={100} /></div>
                 <h3 className="text-sm font-black uppercase tracking-widest mb-6 relative z-10">Today's Load</h3>
                 <div className="space-y-4 mt-4 relative z-10">
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                       <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Scheduled</span>
                       <span className="font-black text-2xl">{filteredAppointmentsData?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                       <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">In Progress</span>
                       <span className="font-black text-2xl text-emerald-300">
                          {filteredAppointmentsData?.filter((a: any) => a.status === 'IN_PROGRESS').length}
                       </span>
                    </div>
                 </div>
              </Card>
           </div>

           {/* Calendar / List View */}
           <div className="xl:col-span-3">
              {isLoading ? (
                <div className="h-[800px] flex items-center justify-center bg-white dark:bg-zinc-900 rounded-[2.5rem] border sub-border">
                   <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Consulting Schedule...</p>
                   </div>
                </div>
              ) : viewMode === 'calendar' ? (
                <Card className="p-6 bg-white dark:bg-zinc-900 border sub-border rounded-[2.5rem] shadow-sm min-h-[800px]">
                   <CalendarView 
                    events={appointments} 
                    onEventClick={handleEventClick}
                   />
                </Card>
              ) : (
                <div className="space-y-4">
                   {filteredAppointmentsData.length === 0 ? (
                     <div className="py-20 text-center bg-accent/20 rounded-[2.5rem] border-2 border-dashed border-accent">
                        <p className="text-sm font-bold text-muted-foreground">لا توجد مواعيد مطابقة لخيارات البحث.</p>
                     </div>
                   ) : (
                     filteredAppointmentsData.map((apt: any) => (
                       <Card key={apt.id} className="group rounded-[2rem] border sub-border hover:border-primary/50 transition-all overflow-hidden shadow-sm">
                          <CardContent className="p-0">
                             <div className="flex flex-col md:flex-row items-center gap-8 p-8">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-accent flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                                   <User size={28} />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                   <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-2">
                                      <span className={cn(
                                         "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                                         apt.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                         apt.status === 'SCHEDULED' ? "bg-primary/5 text-primary border-primary/10" :
                                         "bg-amber-50 text-amber-600 border-amber-100"
                                      )}>
                                         {apt.status}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                                         {format(new Date(apt.startTime), 'MMM dd, hh:mm aa')}
                                      </span>
                                   </div>
                                   <h3 className="text-xl font-black text-slate-800">{apt.patient?.fullName}</h3>
                                   <p className="text-sm text-muted-foreground font-bold mt-1">Specialist: {apt.doctor?.fullName}</p>
                                </div>
                                <div className="flex gap-3">
                                   <Button variant="ghost" className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] border sub-border" onClick={() => handleEventClick({ event: { id: apt.id, title: apt.patient.fullName, start: apt.startTime, end: apt.endTime, extendedProps: { ...apt, patientName: apt.patient.fullName, doctorName: apt.doctor.fullName } } })}>Details</Button>
                                   {apt.status === 'SCHEDULED' && (
                                     <Button className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px]" onClick={() => statusMutation.mutate({ id: apt.id, status: 'COMPLETED' })}>Complete</Button>
                                   )}
                                </div>
                             </div>
                          </CardContent>
                       </Card>
                     ))
                   )}
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AppointmentDetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        event={selectedEvent}
        onStatusUpdate={(id, status) => statusMutation.mutate({ id, status })}
      />

      {/* Book Visit Modal */}
      <AnimatePresence>
        {isBookModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setIsBookModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 rounded-[2rem] border sub-border max-w-lg w-full overflow-hidden shadow-2xl relative z-10 p-8 text-right">
              <div className="flex justify-between items-center mb-6 border-b pb-4 flex-row-reverse">
                <h3 className="text-lg font-black text-slate-800">حجز موعد زيارة جديد</h3>
                <button onClick={() => setIsBookModalOpen(false)} className="p-1.5 hover:bg-accent rounded-lg transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); bookingMutation.mutate(bookingFormData); }} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">المريض</label>
                  <select 
                    value={bookingFormData.patientId} 
                    onChange={e => setBookingFormData({...bookingFormData, patientId: e.target.value})} 
                    className="w-full h-11 bg-accent/20 rounded-lg px-3 text-xs font-bold outline-none text-right"
                    required
                  >
                    <option value="">-- اختر المريض --</option>
                    {patients?.map((pat: any) => (
                      <option key={pat.id} value={pat.id}>{pat.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">الطبيب</label>
                  <select 
                    value={bookingFormData.doctorId} 
                    onChange={e => setBookingFormData({...bookingFormData, doctorId: e.target.value})} 
                    className="w-full h-11 bg-accent/20 rounded-lg px-3 text-xs font-bold outline-none text-right"
                    required
                  >
                    <option value="">-- اختر الطبيب --</option>
                    {doctors?.map((doc: any) => (
                      <option key={doc.id} value={doc.id}>{doc.fullName} ({doc.specialization})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">الوقت</label>
                    <Input type="time" value={bookingFormData.time} onChange={e => setBookingFormData({...bookingFormData, time: e.target.value})} className="h-11 font-bold text-sm text-right" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">التاريخ</label>
                    <Input type="date" value={bookingFormData.date} onChange={e => setBookingFormData({...bookingFormData, date: e.target.value})} className="h-11 font-bold text-sm text-right" required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ملاحظات الحجز</label>
                  <textarea 
                    rows={3} 
                    value={bookingFormData.notes} 
                    onChange={e => setBookingFormData({...bookingFormData, notes: e.target.value})} 
                    className="w-full bg-accent/20 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 text-right"
                    placeholder="سبب الاستشارة أو الشكوى..."
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest" onClick={() => setIsBookModalOpen(false)}>إلغاء</Button>
                  <Button 
                    type="submit" 
                    className="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/10"
                    disabled={bookingMutation.isPending}
                  >
                    {bookingMutation.isPending ? 'جاري الحجز...' : 'تأكيد الحجز'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
