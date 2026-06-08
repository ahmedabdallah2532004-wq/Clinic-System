'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardList, Stethoscope, FileText, CheckCircle2, Plus, Trash2, Pill, Upload, File as FileIcon, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const HistorySnapshot = ({ patientId }: { patientId: string }) => {
  const { data: patientFile, isLoading } = useQuery({
    queryKey: ['patient-file', patientId],
    queryFn: async () => {
      const response = await api.get(`/patients/${patientId}/file`);
      return response.data;
    },
    enabled: !!patientId
  });

  const lastEncounter = patientFile?.encounters?.[0];

  if (isLoading) return <div className="h-20 flex items-center justify-center bg-accent/10 rounded-2xl animate-pulse text-[10px] font-black uppercase tracking-widest text-muted-foreground">جاري جلب التاريخ المرضي...</div>;
  if (!lastEncounter) return null;

  return (
    <div className="mb-10 p-5 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 rounded-2xl">
       <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-3 flex items-center gap-2">
          <FileText size={12} /> ملخص آخر زيارة ({format(new Date(lastEncounter.createdAt), 'dd MMMM yyyy', { locale: ar })})
       </h4>
       <div className="grid grid-cols-2 gap-4">
          <div>
             <p className="text-[9px] font-black uppercase text-amber-700/60 mb-0.5">التشخيص السابق:</p>
             <p className="text-xs font-bold text-slate-800">{lastEncounter.diagnosis || 'لا يوجد'}</p>
          </div>
          <div>
             <p className="text-[9px] font-black uppercase text-amber-700/60 mb-0.5">الخطة السابقة:</p>
             <p className="text-xs font-bold text-slate-800 truncate">{lastEncounter.treatmentPlan || 'لا يوجد'}</p>
          </div>
       </div>
    </div>
  );
};

interface RecordEncounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
}

export const RecordEncounterModal = ({ isOpen, onClose, appointment }: RecordEncounterModalProps) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [formData, setFormData] = React.useState({
    chiefComplaint: '',
    diagnosis: '',
    notes: '',
    treatmentPlan: '',
    vitals: {
      bloodPressure: '',
      temperatureC: '',
      pulseRate: '',
      weightKg: '',
      heightCm: ''
    },
    prescriptions: [] as any[]
  });

  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Convert numeric fields
      const formattedVitals = {
        ...data.vitals,
        temperatureC: data.vitals.temperatureC ? parseFloat(data.vitals.temperatureC) : undefined,
        pulseRate: data.vitals.pulseRate ? parseInt(data.vitals.pulseRate) : undefined,
        weightKg: data.vitals.weightKg ? parseFloat(data.vitals.weightKg) : undefined,
        heightCm: data.vitals.heightCm ? parseFloat(data.vitals.heightCm) : undefined,
      };

      // 1. Create Encounter
      const response = await api.post('/encounters', {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        chiefComplaint: data.chiefComplaint,
        diagnosis: data.diagnosis,
        notes: data.notes,
        treatmentPlan: data.treatmentPlan,
        vitals: formattedVitals,
        prescriptions: data.prescriptions
      });

      const encounterId = response.data.id;

      // 2. Upload Files
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('patientId', appointment.patientId);
          formData.append('encounterId', encounterId);
          await api.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-file', appointment.patientId] });
      addToast('تم تسجيل الزيارة بنجاح وإصدار الفاتورة.', 'success');
      onClose();
    }
  });

  const addMedication = () => {
    setFormData({
      ...formData,
      prescriptions: [
        ...formData.prescriptions,
        { medicationName: '', dosage: '', frequency: '', duration: '', instructions: '' }
      ]
    });
  };

  const removeMedication = (index: number) => {
    const updated = [...formData.prescriptions];
    updated.splice(index, 1);
    setFormData({ ...formData, prescriptions: updated });
  };

  const updateMedication = (index: number, field: string, value: string) => {
    const updated = [...formData.prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, prescriptions: updated });
  };

  if (!appointment) return null;

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
            className="relative bg-white dark:bg-zinc-900 w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden border sub-border max-h-[90vh] overflow-y-auto"
          >
            <div className="p-10">
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-primary rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-primary/20">
                      <ClipboardList size={28} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black tracking-tight text-slate-800">إنهاء الزيارة الطبية</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">المريض: {appointment.patient?.fullName}</p>
                   </div>
                </div>
                <button onClick={onClose} className="p-3 hover:bg-accent rounded-2xl transition-colors">
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              {/* History Snapshot */}
              <HistorySnapshot patientId={appointment.patientId} />

              <div className="space-y-8">
                {/* Vitals Section */}
                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                      <Stethoscope size={14} /> المؤشرات الحيوية
                   </h4>
                   <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">الضغط (120/80)</label>
                         <input 
                           className="w-full h-10 bg-white dark:bg-zinc-800 rounded-lg px-3 text-xs font-bold border sub-border outline-none focus:ring-2 focus:ring-primary/20"
                           value={formData.vitals.bloodPressure}
                           onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, bloodPressure: e.target.value}})}
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">الحرارة (°م)</label>
                         <input 
                           type="number" step="0.1"
                           className="w-full h-10 bg-white dark:bg-zinc-800 rounded-lg px-3 text-xs font-bold border sub-border outline-none focus:ring-2 focus:ring-primary/20"
                           value={formData.vitals.temperatureC}
                           onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, temperatureC: e.target.value}})}
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">النبض (bpm)</label>
                         <input 
                           type="number"
                           className="w-full h-10 bg-white dark:bg-zinc-800 rounded-lg px-3 text-xs font-bold border sub-border outline-none focus:ring-2 focus:ring-primary/20"
                           value={formData.vitals.pulseRate}
                           onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, pulseRate: e.target.value}})}
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">الوزن (كجم)</label>
                         <input 
                           type="number" step="0.1"
                           className="w-full h-10 bg-white dark:bg-zinc-800 rounded-lg px-3 text-xs font-bold border sub-border outline-none focus:ring-2 focus:ring-primary/20"
                           value={formData.vitals.weightKg}
                           onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, weightKg: e.target.value}})}
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">الطول (سم)</label>
                         <input 
                           type="number"
                           className="w-full h-10 bg-white dark:bg-zinc-800 rounded-lg px-3 text-xs font-bold border sub-border outline-none focus:ring-2 focus:ring-primary/20"
                           value={formData.vitals.heightCm}
                           onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, heightCm: e.target.value}})}
                         />
                      </div>
                   </div>
                </div>

                {/* Prescription Section */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                         <Pill size={14} /> الوصفة الطبية (الأدوية)
                      </h4>
                      <Button type="button" variant="outline" size="sm" onClick={addMedication} className="h-8 text-[10px] font-black uppercase tracking-widest">
                         <Plus size={14} className="ml-1" /> إضافة دواء
                      </Button>
                   </div>
                   
                   {formData.prescriptions.length === 0 ? (
                      <div className="py-8 text-center bg-accent/20 rounded-2xl border border-dashed border-accent">
                         <p className="text-xs font-bold text-muted-foreground">لا توجد أدوية مضافة حالياً.</p>
                      </div>
                   ) : (
                     <div className="space-y-3">
                        {formData.prescriptions.map((med, idx) => (
                          <div key={idx} className="p-5 bg-white dark:bg-zinc-800 border sub-border rounded-2xl flex flex-col gap-4 relative group">
                             <button 
                               type="button"
                               onClick={() => removeMedication(idx)}
                               className="absolute -top-2 -left-2 w-7 h-7 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                <Trash2 size={14} />
                             </button>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input 
                                  placeholder="اسم الدواء"
                                  className="h-10 bg-accent/30 rounded-lg px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                  value={med.medicationName}
                                  onChange={(e) => updateMedication(idx, 'medicationName', e.target.value)}
                                />
                                <input 
                                  placeholder="الجرعة (مثلاً: 500 ملغ)"
                                  className="h-10 bg-accent/30 rounded-lg px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                  value={med.dosage}
                                  onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                                />
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input 
                                  placeholder="التكرار (مثلاً: 3 مرات يومياً)"
                                  className="h-10 bg-accent/30 rounded-lg px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                  value={med.frequency}
                                  onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                                />
                                <input 
                                  placeholder="المدة (مثلاً: 5 أيام)"
                                  className="h-10 bg-accent/30 rounded-lg px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                  value={med.duration}
                                  onChange={(e) => updateMedication(idx, 'duration', e.target.value)}
                                />
                                <input 
                                  placeholder="ملاحظات إضافية"
                                  className="h-10 bg-accent/30 rounded-lg px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                  value={med.instructions}
                                  onChange={(e) => updateMedication(idx, 'instructions', e.target.value)}
                                />
                             </div>
                          </div>
                        ))}
                     </div>
                   )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">الشكوى الرئيسية</label>
                      <input 
                        className="w-full h-12 bg-accent/30 rounded-xl px-4 text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="لماذا حضر المريض؟"
                        value={formData.chiefComplaint}
                        onChange={(e) => setFormData({...formData, chiefComplaint: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">التشخيص السريري</label>
                      <input 
                        className="w-full h-12 bg-accent/30 rounded-xl px-4 text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="التشخيص النهائي..."
                        value={formData.diagnosis}
                        onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">ملاحظات الفحص</label>
                   <textarea 
                     className="w-full bg-accent/30 rounded-2xl p-4 text-sm font-medium border-none focus:ring-2 focus:ring-primary/20 outline-none min-h-[120px]"
                     placeholder="نتائج الفحص السريري بالتفصيل..."
                     value={formData.notes}
                     onChange={(e) => setFormData({...formData, notes: e.target.value})}
                   />
                </div>

                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">الخطة العلاجية</label>
                      <textarea 
                        className="w-full bg-accent/30 rounded-2xl p-4 text-sm font-medium border-none focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px]"
                        placeholder="الخطة العلاجية العامة، المتابعة، إلخ..."
                        value={formData.treatmentPlan}
                        onChange={(e) => setFormData({...formData, treatmentPlan: e.target.value})}
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">المرفقات (أشعة، تحاليل، إلخ)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="relative h-24 bg-accent/30 rounded-2xl border-2 border-dashed border-accent hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group">
                            <input 
                              type="file" 
                              multiple 
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                              onChange={handleFileChange}
                            />
                            <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            <p className="text-[10px] font-black uppercase text-muted-foreground">اضغط لرفع الملفات</p>
                         </div>
                         
                         <div className="flex flex-wrap gap-2 content-start">
                            {uploadedFiles.map((file, idx) => (
                               <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 rounded-xl border sub-border shadow-sm group">
                                  <FileIcon className="w-3 h-3 text-primary" />
                                  <span className="text-[10px] font-bold truncate max-w-[100px]">{file.name}</span>
                                  <button type="button" onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                                     <XCircle className="w-3 h-3" />
                                  </button>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="mt-12 flex gap-4">
                <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={onClose}>إلغاء</Button>
                <Button 
                   className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20"
                   onClick={() => mutation.mutate(formData)}
                   isLoading={mutation.isPending}
                   disabled={!formData.chiefComplaint}
                >
                   <CheckCircle2 className="w-4 h-4 ml-2" /> إتمام الزيارة وإصدار الفاتورة
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
