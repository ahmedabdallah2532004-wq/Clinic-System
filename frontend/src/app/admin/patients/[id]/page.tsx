'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable } from '@/components/shared/DataTable';
import { Input } from '@/components/ui/Input';
import { 
  ArrowLeft, 
  Heart, 
  Activity, 
  Thermometer, 
  Droplet, 
  Clock, 
  FileText, 
  Pill, 
  Paperclip, 
  Plus,
  TrendingUp,
  MoreVertical,
  ChevronRight,
  User,
  Phone,
  Calendar as CalendarIcon,
  MapPin,
  CheckCircle2,
  X
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuthStore } from '@/store/authStore';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useToast } from '@/hooks/useToast';
import { RecordEncounterModal } from '@/components/clinical/RecordEncounterModal';

export default function PatientProfilePage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'timeline' | 'vitals' | 'prescriptions' | 'files' | 'finance'>('timeline');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDoctorSelectOpen, setIsDoctorSelectOpen] = useState(false);
  const [isEncounterModalOpen, setIsEncounterModalOpen] = useState(false);
  
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [createdAppointment, setCreatedAppointment] = useState<any>(null);

  const [editFormData, setEditFormData] = useState({
    fullName: '',
    contactNumber: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: 'O+',
    emergencyContact: '',
    address: ''
  });

  const isDoctorOrAdmin = user?.roles.some(r => ['ADMIN', 'DOCTOR'].includes(r));
  const isReceptionistOrAdmin = user?.roles.some(r => ['ADMIN', 'RECEPTIONIST'].includes(r));

  // Queries
  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const response = await api.get(`/patients/${id}`);
      return response.data;
    }
  });

  const { data: billingSummary } = useQuery({
    queryKey: ['patient-billing', id],
    queryFn: async () => {
      const response = await api.get(`/billing/invoices/patient/${id}`);
      const invoices = response.data;
      const total = invoices.reduce((acc: any, inv: any) => acc + Number(inv.totalAmount), 0);
      const paid = invoices.filter((inv: any) => inv.status === 'PAID').reduce((acc: any, inv: any) => acc + Number(inv.totalAmount), 0);
      return { total, paid, pending: total - paid, invoices };
    },
    enabled: !!id
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const response = await api.get('/doctors');
      return response.data;
    },
    enabled: isDoctorSelectOpen
  });

  // Mutations
  const editProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const formattedData = {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined
      };
      return api.patch(`/patients/${id}`, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      addToast('تم تعديل بيانات المريض بنجاح!', 'success');
      setIsEditModalOpen(false);
    },
    onError: (err: any) => {
      addToast('فشل تعديل البيانات: ' + (err.response?.data?.message || err.message), 'error');
    }
  });

  const createWalkinMutation = useMutation({
    mutationFn: async (doctorId: string) => {
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      const response = await api.post('/appointments', {
        doctorId,
        patientId: id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes: 'كشف مباشر عاجل'
      });
      return response.data;
    },
    onSuccess: (data) => {
      setCreatedAppointment({
        id: data.id,
        patientId: id,
        doctorId: selectedDoctorId,
        patient: { fullName: patient?.fullName }
      });
      setIsDoctorSelectOpen(false);
      setIsEncounterModalOpen(true);
    },
    onError: (err: any) => {
      addToast('فشل بدء الكشف: ' + (err.response?.data?.message || err.message), 'error');
    }
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editProfileMutation.mutate(editFormData);
  };

  const handleCreateWalkin = () => {
    if (!selectedDoctorId) {
      addToast('الرجاء اختيار الطبيب أولاً', 'error');
      return;
    }
    createWalkinMutation.mutate(selectedDoctorId);
  };

  if (isLoading) return (
    <DashboardLayout>
       <div className="h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
       </div>
    </DashboardLayout>
  );

  return (
    <RoleGuard allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST']}>
    <DashboardLayout>
      <div className="space-y-8" dir="rtl">
        {/* Profile Header */}
        <div className="flex flex-col gap-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors group w-fit"
          >
            <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> العودة للسجل العام
          </button>

          <div className="flex flex-col lg:flex-row justify-between gap-8 bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border sub-border shadow-2xl shadow-zinc-200/30 dark:shadow-none relative overflow-hidden">
             <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mt-32 blur-3xl" />
             
             <div className="flex flex-col md:flex-row gap-8 relative z-10">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-primary/20">
                   {patient?.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </div>
                <div className="space-y-4 text-right">
                   <div>
                      <h1 className="text-3xl font-black tracking-tight text-slate-800">{patient?.fullName}</h1>
                      <div className="flex items-center justify-end gap-3 mt-1.5 flex-row-reverse">
                         <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{patient?.gender === 'MALE' ? 'ذكر' : 'أنثى'} • {patient?.dateOfBirth ? (new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()) : 'N/A'} سنة</span>
                         <div className="w-1 h-1 bg-zinc-300 rounded-full" />
                         <span className="text-sm font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-full">ID: {patient?.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                   </div>
                   <div className="flex flex-wrap gap-2 justify-end">
                      <div className="px-3 py-1.5 bg-accent/50 rounded-lg text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                         <Droplet className="w-3.5 h-3.5 text-destructive" /> فصيلة الدم: {patient?.bloodGroup || 'غير محدد'}
                      </div>
                      <div className="px-3 py-1.5 bg-accent/50 rounded-lg text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                         <Activity className="w-3.5 h-3.5 text-primary" /> رقم الهاتف: {patient?.contactNumber || 'لا يوجد'}
                      </div>
                   </div>
                </div>
             </div>

             <div className="flex flex-wrap items-center gap-3 relative z-10 self-start">
                {isReceptionistOrAdmin && (
                  <Button 
                    variant="premium" 
                    className="font-bold"
                    onClick={() => {
                      setEditFormData({
                        fullName: patient?.fullName || '',
                        contactNumber: patient?.contactNumber || '',
                        dateOfBirth: patient?.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
                        gender: patient?.gender || 'MALE',
                        bloodGroup: patient?.bloodGroup || 'O+',
                        emergencyContact: patient?.emergencyContact || '',
                        address: patient?.address || ''
                      });
                      setIsEditModalOpen(true);
                    }}
                  >
                    تعديل الملف
                  </Button>
                )}
                {isDoctorOrAdmin && (
                   <Button 
                     className="font-bold shadow-lg shadow-primary/20"
                     onClick={() => setIsDoctorSelectOpen(true)}
                   >
                      <Plus className="w-4 h-4 ml-2" /> تسجيل كشف جديد
                   </Button>
                )}
             </div>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="premium-card p-6 border-emerald-100 bg-emerald-50/30">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">إجمالي المدفوعات</p>
              <h3 className="text-2xl font-black text-emerald-700">{billingSummary?.paid.toLocaleString() || 0} ر.س</h3>
           </Card>
           <Card className="premium-card p-6 border-amber-100 bg-amber-50/30">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">المستحقات المعلقة</p>
              <h3 className="text-2xl font-black text-amber-700">{billingSummary?.pending.toLocaleString() || 0} ر.س</h3>
           </Card>
           <Card className="premium-card p-6 border-primary/10 bg-primary/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">عدد الزيارات</p>
              <h3 className="text-2xl font-black text-primary">{patient?.encounters?.length || 0}</h3>
           </Card>
        </div>

        {/* Tabs Section */}
        <div className="space-y-6">
           <div className="flex items-center gap-8 border-b sub-border px-4 overflow-x-auto whitespace-nowrap scrollbar-hide flex-row-reverse">
              {[
                { id: 'timeline', label: 'التسلسل السريري', icon: Clock },
                { id: 'vitals', label: 'المؤشرات الحيوية', icon: Activity },
                { id: 'prescriptions', label: 'الوصفات الطبية', icon: Pill },
                { id: 'finance', label: 'السجل المالي', icon: FileText },
                { id: 'files', label: 'الملفات المرفقة', icon: Paperclip }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all relative",
                    activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTabProfileFinalSecure"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" 
                    />
                  )}
                </button>
              ))}
           </div>

           <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                 {activeTab === 'timeline' && (
                   <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-right">
                      {(patient?.encounters || []).length > 0 ? patient.encounters.map((enc: any) => (
                        <div key={enc.id} className="flex gap-6 group flex-row-reverse">
                           <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-sm relative z-10 group-hover:bg-primary/10 transition-colors">
                                 <FileText className="w-5 h-5 text-primary" />
                              </div>
                              <div className="w-0.5 flex-1 bg-zinc-100 dark:bg-zinc-800 my-2" />
                           </div>
                           <div className="flex-1 pb-10">
                              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border sub-border shadow-sm group-hover:shadow-md transition-shadow">
                                 <div className="flex justify-between items-start mb-4 flex-row-reverse">
                                    <div>
                                       <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{format(new Date(enc.createdAt), 'dd MMMM yyyy', { locale: ar })} • كشف طبي</span>
                                       <h4 className="text-lg font-bold mt-1">
                                          {isDoctorOrAdmin ? (enc.diagnosis || 'كشف روتيني') : 'زيارة طبية مؤمنة'}
                                       </h4>
                                    </div>
                                    {isDoctorOrAdmin && <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="w-4 h-4" /></Button>}
                                 </div>
                                 <p className="text-sm text-muted-foreground leading-relaxed italic">
                                    {isDoctorOrAdmin ? `"${enc.notes}"` : 'الملاحظات الطبية مخفية لدواعي الخصوصية.'}
                                 </p>
                                 <div className="mt-6 flex items-center justify-between border-t sub-border pt-4 flex-row-reverse">
                                    <div className="flex items-center gap-2">
                                       <div className="w-6 h-6 rounded-full bg-zinc-200" />
                                       <span className="text-[10px] font-bold text-muted-foreground">د. {enc.doctor?.fullName || 'غير معروف'}</span>
                                    </div>
                                    {isDoctorOrAdmin && (
                                       <button className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                                          عرض التقرير الكامل <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                                       </button>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </div>
                      )) : (
                        <div className="py-20 text-center bg-accent/20 rounded-[2rem] border-2 border-dashed border-accent">
                           <p className="text-sm font-bold text-muted-foreground">لا يوجد تاريخ مرضي مسجل لهذا المريض.</p>
                        </div>
                      )}
                   </motion.div>
                 )}

                 {activeTab === 'vitals' && (
                    <motion.div key="vitals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {patient?.encounters?.filter((e: any) => e.vitals).length > 0 ? (
                             patient.encounters.filter((e: any) => e.vitals).map((enc: any) => {
                                const v = enc.vitals;
                                return (
                                   <Card key={enc.id} className="p-6 bg-white dark:bg-zinc-900 border sub-border rounded-2xl shadow-sm hover:border-primary/20 transition-all text-right">
                                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-100 flex-row-reverse">
                                         <span className="text-xs font-bold text-primary">{format(new Date(enc.createdAt), 'dd MMMM yyyy', { locale: ar })}</span>
                                         <span className="text-[10px] text-muted-foreground font-semibold">د. {enc.doctor?.fullName}</span>
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                         {v.bloodPressure && (
                                            <div className="p-2 bg-accent/30 rounded-xl flex items-center gap-2 flex-row-reverse">
                                               <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                                               <div className="text-right">
                                                  <p className="text-[9px] text-muted-foreground font-black leading-none">ضغط الدم</p>
                                                  <p className="text-xs font-black mt-1">{v.bloodPressure}</p>
                                               </div>
                                            </div>
                                         )}
                                         {v.temperatureC && (
                                            <div className="p-2 bg-accent/30 rounded-xl flex items-center gap-2 flex-row-reverse">
                                               <Thermometer className="w-4 h-4 text-amber-500 shrink-0" />
                                               <div className="text-right">
                                                  <p className="text-[9px] text-muted-foreground font-black leading-none">الحرارة</p>
                                                  <p className="text-xs font-black mt-1">{v.temperatureC} °م</p>
                                               </div>
                                            </div>
                                         )}
                                         {v.pulseRate && (
                                            <div className="p-2 bg-accent/30 rounded-xl flex items-center gap-2 flex-row-reverse">
                                               <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
                                               <div className="text-right">
                                                  <p className="text-[9px] text-muted-foreground font-black leading-none">النبض</p>
                                                  <p className="text-xs font-black mt-1">{v.pulseRate} bpm</p>
                                               </div>
                                            </div>
                                         )}
                                         {v.weightKg && (
                                            <div className="p-2 bg-accent/30 rounded-xl flex items-center gap-2 flex-row-reverse">
                                               <TrendingUp className="w-4 h-4 text-blue-500 shrink-0" />
                                               <div className="text-right">
                                                  <p className="text-[9px] text-muted-foreground font-black leading-none">الوزن</p>
                                                  <p className="text-xs font-black mt-1">{v.weightKg} كجم</p>
                                               </div>
                                            </div>
                                         )}
                                         {v.heightCm && (
                                            <div className="p-2 bg-accent/30 rounded-xl flex items-center gap-2 flex-row-reverse">
                                               <Activity className="w-4 h-4 text-violet-500 shrink-0" />
                                               <div className="text-right">
                                                  <p className="text-[9px] text-muted-foreground font-black leading-none">الطول</p>
                                                  <p className="text-xs font-black mt-1">{v.heightCm} سم</p>
                                               </div>
                                            </div>
                                         )}
                                      </div>
                                   </Card>
                                );
                             })
                          ) : (
                             <div className="col-span-2 py-20 text-center bg-accent/20 rounded-[2rem] border-2 border-dashed border-accent">
                                <p className="text-sm font-bold text-muted-foreground">لا توجد مؤشرات حيوية مسجلة.</p>
                             </div>
                          )}
                       </div>
                    </motion.div>
                 )}

                 {activeTab === 'prescriptions' && (
                    <motion.div key="prescriptions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                       {(patient?.prescriptions || []).length > 0 ? (
                          patient.prescriptions.map((pres: any) => (
                             <Card key={pres.id} className="p-6 bg-white dark:bg-zinc-900 border sub-border rounded-[2rem] shadow-sm text-right">
                                <div className="flex justify-between items-center mb-6 pb-2 border-b sub-border flex-row-reverse">
                                   <div>
                                      <span className="text-[10px] font-black uppercase text-primary bg-primary/5 px-3 py-1 rounded-full">{format(new Date(pres.issuedAt), 'dd MMMM yyyy', { locale: ar })}</span>
                                   </div>
                                   <span className="text-xs font-bold text-muted-foreground">الطبيب الواصف: د. {pres.doctor?.fullName}</span>
                                </div>
                                <DataTable 
                                   columns={[
                                      { header: 'اسم الدواء', accessorKey: 'medicationName' },
                                      { header: 'الجرعة', accessorKey: 'dosage' },
                                      { header: 'التكرار', accessorKey: 'frequency' },
                                      { header: 'المدة', accessorKey: 'duration' },
                                      { header: 'تعليمات وإرشادات', accessorKey: 'instructions' }
                                   ]}
                                   data={pres.items || []}
                                />
                             </Card>
                          ))
                       ) : (
                          <div className="py-20 text-center bg-accent/20 rounded-[2rem] border-2 border-dashed border-accent">
                             <p className="text-sm font-bold text-muted-foreground">لا توجد وصفات طبية مسجلة.</p>
                          </div>
                       )}
                    </motion.div>
                 )}

                 {activeTab === 'files' && (
                    <motion.div key="files" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                       {(patient?.files || []).length > 0 ? (
                          <DataTable 
                             columns={[
                                { header: 'اسم الملف', accessorKey: 'fileName', cell: (i: any) => <span className="font-bold flex items-center gap-2 flex-row-reverse justify-end"><Paperclip className="w-3.5 h-3.5 text-primary" /> {i.fileName}</span> },
                                { header: 'نوع الملف', accessorKey: 'fileType', cell: (i: any) => <span className="text-xs font-medium uppercase">{i.fileType.split('/')[1] || i.fileType}</span> },
                                { header: 'الحجم', accessorKey: 'fileSize', cell: (i: any) => <span className="text-xs font-medium">{Math.round(i.fileSize / 1024)} KB</span> },
                                { header: 'تاريخ الرفع', accessorKey: 'createdAt', cell: (i: any) => format(new Date(i.createdAt), 'dd/MM/yyyy') },
                                { header: 'رابط الملف', accessorKey: 'fileUrl', cell: (i: any) => (
                                   <a href={i.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-black text-primary hover:underline flex items-center gap-1">
                                      تحميل/عرض
                                   </a>
                                )}
                             ]}
                             data={patient.files || []}
                          />
                       ) : (
                          <div className="py-20 text-center bg-accent/20 rounded-[2rem] border-2 border-dashed border-accent">
                             <p className="text-sm font-bold text-muted-foreground">لا توجد ملفات مرفقة.</p>
                          </div>
                       )}
                    </motion.div>
                 )}

                 {activeTab === 'finance' && (
                    <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                       <DataTable 
                          columns={[
                             { header: 'رقم الفاتورة', accessorKey: 'id', cell: (i: any) => <span className="font-bold">#INV-{i.id.slice(0, 8).toUpperCase()}</span> },
                             { header: 'التاريخ', accessorKey: 'createdAt', cell: (i: any) => format(new Date(i.createdAt), 'dd/MM/yyyy') },
                             { header: 'المبلغ الكلي', accessorKey: 'totalAmount', cell: (i: any) => <span className="font-black text-primary">{Number(i.totalAmount).toLocaleString()} ر.س</span> },
                             { header: 'الحالة', accessorKey: 'status', cell: (i: any) => (
                                <span className={cn(
                                   "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                   i.status === 'PAID' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                )}>
                                   {i.status === 'PAID' ? 'تم السداد' : 'قيد الانتظار'}
                                </span>
                             )}
                          ]}
                          data={billingSummary?.invoices || []}
                       />
                    </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>
      </div>

      {/* 1. Edit Patient Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 rounded-[2rem] border sub-border max-w-lg w-full overflow-hidden shadow-2xl relative z-10 p-8 text-right">
              <div className="flex justify-between items-center mb-6 border-b pb-4 flex-row-reverse">
                <h3 className="text-lg font-black text-slate-800">تعديل ملف المريض</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 hover:bg-accent rounded-lg transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">الاسم الكامل</label>
                  <Input value={editFormData.fullName} onChange={e => setEditFormData({...editFormData, fullName: e.target.value})} className="h-11 font-bold text-sm text-right" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">رقم الهاتف</label>
                    <Input value={editFormData.contactNumber} onChange={e => setEditFormData({...editFormData, contactNumber: e.target.value})} className="h-11 font-bold text-sm text-right" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">تاريخ الميلاد</label>
                    <Input type="date" value={editFormData.dateOfBirth} onChange={e => setEditFormData({...editFormData, dateOfBirth: e.target.value})} className="h-11 font-bold text-sm text-right" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">الجنس</label>
                    <select value={editFormData.gender} onChange={e => setEditFormData({...editFormData, gender: e.target.value})} className="w-full h-11 bg-accent/20 rounded-lg px-3 text-xs font-bold outline-none text-right">
                      <option value="MALE">ذكر</option>
                      <option value="FEMALE">أنثى</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">فصيلة الدم</label>
                    <select value={editFormData.bloodGroup} onChange={e => setEditFormData({...editFormData, bloodGroup: e.target.value})} className="w-full h-11 bg-accent/20 rounded-lg px-3 text-xs font-bold outline-none text-right">
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">الاتصال في الطوارئ</label>
                  <Input value={editFormData.emergencyContact} onChange={e => setEditFormData({...editFormData, emergencyContact: e.target.value})} className="h-11 font-bold text-sm text-right" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">العنوان</label>
                  <textarea rows={2} value={editFormData.address} onChange={e => setEditFormData({...editFormData, address: e.target.value})} className="w-full bg-accent/20 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 text-right" />
                </div>
                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest" onClick={() => setIsEditModalOpen(false)}>إلغاء</Button>
                  <Button type="submit" className="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/10" disabled={editProfileMutation.isPending}>
                    {editProfileMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Walk-in Doctor Selector Modal */}
      <AnimatePresence>
        {isDoctorSelectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setIsDoctorSelectOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 rounded-[2rem] border sub-border max-w-sm w-full overflow-hidden shadow-2xl relative z-10 p-8 text-right">
              <div className="flex justify-between items-center mb-6 border-b pb-4 flex-row-reverse">
                <h3 className="text-lg font-black text-slate-800">اختيار طبيب الكشف</h3>
                <button onClick={() => setIsDoctorSelectOpen(false)} className="p-1.5 hover:bg-accent rounded-lg transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">اختر الطبيب المعالج</label>
                  <select 
                    value={selectedDoctorId} 
                    onChange={e => setSelectedDoctorId(e.target.value)} 
                    className="w-full h-12 bg-accent/20 rounded-xl px-3 text-xs font-bold outline-none text-right"
                  >
                    <option value="">-- اختر طبيباً --</option>
                    {doctors?.map((doc: any) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.fullName} ({doc.specialization || 'ممارس عام'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <Button variant="ghost" className="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest" onClick={() => setIsDoctorSelectOpen(false)}>إلغاء</Button>
                  <Button 
                    className="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/10"
                    onClick={handleCreateWalkin}
                    disabled={createWalkinMutation.isPending || !selectedDoctorId}
                  >
                    {createWalkinMutation.isPending ? 'جاري التحضير...' : 'متابعة'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Record Encounter Modal */}
      <RecordEncounterModal 
        isOpen={isEncounterModalOpen}
        onClose={() => {
          setIsEncounterModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['patient', id] });
        }}
        appointment={createdAppointment}
      />
    </DashboardLayout>
    </RoleGuard>
  );
}
