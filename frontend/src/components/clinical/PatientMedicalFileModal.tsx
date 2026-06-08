'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, User, Calendar, Activity, Pill, Clock, ArrowLeft, Download, ExternalLink, Printer, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PrescriptionPrintView } from './PrescriptionPrintView';

interface PatientMedicalFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
}

export const PatientMedicalFileModal = ({ isOpen, onClose, patientId }: PatientMedicalFileModalProps) => {
  const [printData, setPrintData] = React.useState<any>(null);
  
  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient-file', patientId],
    queryFn: async () => {
      const response = await api.get(`/patients/${patientId}`);
      return response.data;
    },
    enabled: !!patientId && isOpen
  });

  if (!patientId) return null;

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
            className="relative bg-zinc-50 dark:bg-zinc-950 w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden border sub-border flex flex-col"
          >
            {/* Header */}
            <div className="p-8 bg-white dark:bg-zinc-900 border-b sub-border flex justify-between items-center shrink-0">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                     <FileText size={32} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black tracking-tight text-slate-800">الملف الطبي الكامل</h3>
                     <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">المريض: {patient?.fullName || '...'}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <Button variant="outline" className="rounded-xl font-bold h-11" onClick={() => window.print()}>
                     <Download size={18} className="ml-2" /> طباعة الملف
                  </Button>
                  <button onClick={onClose} className="p-3 hover:bg-accent rounded-2xl transition-colors">
                    <X className="w-6 h-6 text-muted-foreground" />
                  </button>
               </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
               {/* Left Sidebar - Patient Quick Info */}
               <div className="w-full md:w-80 bg-white dark:bg-zinc-900 border-l sub-border p-8 overflow-y-auto space-y-8">
                  <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6">المعلومات الشخصية</h4>
                     <div className="space-y-4">
                        <InfoRow icon={User} label="العمر" value={`${new Date().getFullYear() - new Date(patient?.dateOfBirth || '').getFullYear()} سنة`} />
                        <InfoRow icon={Activity} label="فصيلة الدم" value={patient?.bloodGroup || 'غير محدد'} />
                        <InfoRow icon={Calendar} label="تاريخ الميلاد" value={patient?.dateOfBirth ? format(new Date(patient.dateOfBirth), 'dd MMMM yyyy', { locale: ar }) : '...'} />
                        <InfoRow icon={User} label="الجنس" value={patient?.gender === 'MALE' ? 'ذكر' : 'أنثى'} />
                     </div>
                  </div>

                  <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6">بيانات التواصل</h4>
                     <div className="space-y-4 text-xs font-bold text-slate-700">
                        <p>{patient?.contactNumber}</p>
                        <p className="text-muted-foreground">{patient?.address}</p>
                     </div>
                  </div>
               </div>

               {/* Main Timeline */}
               <div className="flex-1 overflow-y-auto p-8 bg-zinc-50 dark:bg-zinc-950">
                  {isLoading ? (
                     <div className="h-full flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                     </div>
                  ) : (
                    <div className="space-y-12">
                       {/* Encounters Timeline */}
                       <section>
                          <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-8 flex items-center gap-3">
                             <Clock className="text-primary" size={18} /> السجل المرضي والزيارات
                          </h4>
                          <div className="relative space-y-8 pr-4">
                             <div className="absolute top-2 bottom-2 right-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                             
                             {patient?.encounters?.length === 0 ? (
                                <p className="text-sm font-bold text-muted-foreground italic mr-8">لا توجد زيارات سابقة مسجلة.</p>
                             ) : (
                               patient?.encounters?.map((enc: any, idx: number) => (
                                 <div key={enc.id} className="relative mr-8 group">
                                    <div className="absolute -right-10 top-2 w-4 h-4 rounded-full bg-white border-2 border-primary shadow-sm z-10 group-hover:scale-125 transition-transform" />
                                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border sub-border shadow-sm hover:shadow-xl transition-all">
                                       <div className="flex justify-between items-start mb-6">
                                          <div>
                                             <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-3 py-1 rounded-full">{format(new Date(enc.createdAt), 'dd MMMM yyyy', { locale: ar })}</span>
                                             <h5 className="text-lg font-black mt-2">{enc.chiefComplaint}</h5>
                                          </div>
                                          <div className="text-left">
                                             <p className="text-[10px] font-black uppercase text-muted-foreground">الطبيب المعالج</p>
                                             <p className="text-xs font-bold">د. {enc.doctor?.fullName}</p>
                                          </div>
                                       </div>

                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                          <div className="space-y-4">
                                             <p className="text-xs font-black text-slate-800 border-b sub-border pb-2">التشخيص والنتائج</p>
                                             <div className="space-y-2">
                                                <p className="text-xs font-bold text-primary italic">التشخيص: {enc.diagnosis || 'لم يحدد'}</p>
                                                <p className="text-xs text-slate-600 leading-relaxed font-medium">{enc.notes}</p>
                                             </div>
                                          </div>

                                           {/* Vitals in Encounter */}
                                          {enc.vitals && (
                                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4">
                                               <p className="text-[10px] font-black uppercase text-primary mb-3">المؤشرات الحيوية</p>
                                               <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                                                  <VitalItem label="الضغط" value={enc.vitals.bloodPressure} />
                                                  <VitalItem label="الحرارة" value={`${enc.vitals.temperatureC}°م`} />
                                                  <VitalItem label="النبض" value={`${enc.vitals.pulseRate} bpm`} />
                                                  <VitalItem label="الوزن" value={`${enc.vitals.weightKg} كجم`} />
                                               </div>
                                            </div>
                                          )}

                                          {/* Files in Encounter */}
                                          {enc.files?.length > 0 && (
                                            <div className="mt-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 col-span-1 md:col-span-2">
                                               <p className="text-[10px] font-black uppercase text-primary mb-3 flex items-center gap-2">
                                                  <Paperclip size={12} /> المرفقات الطبية ({enc.files.length})
                                               </p>
                                               <div className="flex flex-wrap gap-2">
                                                  {enc.files.map((file: any) => (
                                                     <a 
                                                       key={file.id} 
                                                       href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/files/${file.fileUrl}`}
                                                       target="_blank"
                                                       rel="noopener noreferrer"
                                                       className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 rounded-xl border sub-border hover:border-primary transition-all group"
                                                     >
                                                        <FileText size={12} className="text-primary" />
                                                        <span className="text-[10px] font-bold truncate max-w-[120px]">{file.fileName}</span>
                                                        <ExternalLink size={10} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                                     </a>
                                                  ))}
                                               </div>
                                            </div>
                                          )}
                                       </div>

                                       {/* Prescriptions in Encounter */}
                                       {enc.prescription?.[0] && (
                                          <div className="mt-6 pt-6 border-t sub-border flex justify-between items-end">
                                             <div className="flex-1">
                                                <p className="text-[10px] font-black uppercase text-primary mb-3 flex items-center gap-2">
                                                   <Pill size={12} /> الأدوية الموصوفة
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                   {enc.prescription[0].items.map((item: any) => (
                                                      <span key={item.id} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
                                                         {item.medicationName} ({item.dosage})
                                                      </span>
                                                   ))}
                                                </div>
                                             </div>
                                             <Button 
                                               variant="outline" 
                                               size="sm" 
                                               className="h-9 px-4 rounded-xl font-bold gap-2 hover:bg-primary hover:text-white transition-all"
                                               onClick={() => {
                                                  setPrintData(enc.prescription[0]);
                                                  setTimeout(() => window.print(), 100);
                                               }}
                                             >
                                                <Printer size={14} /> طباعة الوصفة
                                             </Button>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                               ))
                             )}
                          </div>
                       </section>
                    </div>
                  )}
               </div>
            </div>
            
            {/* Hidden Print View */}
            {printData && <PrescriptionPrintView prescription={printData} patient={patient} />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

function InfoRow({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
   return (
      <div className="flex items-center gap-3 group">
         <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
            <Icon size={16} />
         </div>
         <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter leading-none">{label}</p>
            <p className="text-xs font-bold text-slate-800 mt-1">{value}</p>
         </div>
      </div>
   );
}

function VitalItem({ label, value }: { label: string, value: string | number }) {
   if (!value) return null;
   return (
      <div className="flex justify-between items-center">
         <span className="text-[9px] font-bold text-muted-foreground">{label}</span>
         <span className="text-[11px] font-black text-slate-800">{value}</span>
      </div>
   );
}
