'use client';

import React from 'react';
import { Stethoscope, Phone, Mail, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PrescriptionPrintViewProps {
  prescription: any;
  patient: any;
}

export const PrescriptionPrintView = ({ prescription, patient }: PrescriptionPrintViewProps) => {
  if (!prescription || !patient) return null;

  return (
    <div className="print-only p-12 bg-white text-slate-900 min-h-screen font-sans" dir="rtl">
      {/* Letterhead Header */}
      <div className="flex justify-between items-start border-b-2 border-primary pb-8 mb-10">
        <div className="flex items-center gap-4">
           <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Stethoscope size={36} />
           </div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">عيادة أنتي جرافتي</h1>
              <p className="text-sm font-bold text-primary uppercase tracking-widest mt-1">مركز الرعاية الصحية المتقدمة</p>
           </div>
        </div>
        <div className="text-left space-y-1 text-[10px] font-bold text-slate-500">
           <div className="flex items-center justify-end gap-2"><span>05xxxxxxx</span> <Phone size={12} /></div>
           <div className="flex items-center justify-end gap-2"><span>info@antigravity.com</span> <Mail size={12} /></div>
           <div className="flex items-center justify-end gap-2"><span>الرياض، المملكة العربية السعودية</span> <MapPin size={12} /></div>
        </div>
      </div>

      {/* Patient & Doctor Info Bar */}
      <div className="grid grid-cols-2 gap-8 mb-12 p-6 bg-zinc-50 rounded-2xl border sub-border">
         <div className="space-y-3">
            <div className="flex gap-4">
               <span className="text-[10px] font-black text-muted-foreground uppercase min-w-[80px]">المريض:</span>
               <span className="text-sm font-black text-slate-800">{patient.fullName}</span>
            </div>
            <div className="flex gap-4">
               <span className="text-[10px] font-black text-muted-foreground uppercase min-w-[80px]">العمر:</span>
               <span className="text-sm font-bold">{new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} سنة</span>
            </div>
            <div className="flex gap-4">
               <span className="text-[10px] font-black text-muted-foreground uppercase min-w-[80px]">فصيلة الدم:</span>
               <span className="text-sm font-bold">{patient.bloodGroup || 'غير محدد'}</span>
            </div>
         </div>
         <div className="space-y-3 text-left">
            <div className="flex justify-end gap-4">
               <span className="text-sm font-black text-slate-800">د. {prescription.doctor?.fullName}</span>
               <span className="text-[10px] font-black text-muted-foreground uppercase">الطبيب:</span>
            </div>
            <div className="flex justify-end gap-4">
               <span className="text-sm font-bold">{format(new Date(prescription.issuedAt), 'dd MMMM yyyy', { locale: ar })}</span>
               <span className="text-[10px] font-black text-muted-foreground uppercase">التاريخ:</span>
            </div>
            <div className="flex justify-end gap-4">
               <span className="text-sm font-mono font-bold">#{prescription.id.slice(0, 8).toUpperCase()}</span>
               <span className="text-[10px] font-black text-muted-foreground uppercase">رقم الوصفة:</span>
            </div>
         </div>
      </div>

      {/* The Rx Symbol */}
      <div className="mb-8">
         <span className="text-6xl font-serif italic text-primary opacity-20 select-none">Rx</span>
      </div>

      {/* Medication Table */}
      <div className="mb-16">
         <table className="w-full">
            <thead>
               <tr className="border-b-2 border-slate-200">
                  <th className="py-4 text-right text-xs font-black uppercase text-slate-500">الدواء</th>
                  <th className="py-4 text-right text-xs font-black uppercase text-slate-500">الجرعة</th>
                  <th className="py-4 text-right text-xs font-black uppercase text-slate-500">التكرار</th>
                  <th className="py-4 text-right text-xs font-black uppercase text-slate-500">المدة</th>
               </tr>
            </thead>
            <tbody className="divide-y border-b">
               {prescription.items?.map((item: any, idx: number) => (
                  <tr key={idx}>
                     <td className="py-6">
                        <p className="text-lg font-black text-slate-900">{item.medicationName}</p>
                        {item.instructions && <p className="text-xs text-slate-500 mt-1">{item.instructions}</p>}
                     </td>
                     <td className="py-6 text-sm font-bold text-slate-700">{item.dosage}</td>
                     <td className="py-6 text-sm font-bold text-slate-700">{item.frequency}</td>
                     <td className="py-6 text-sm font-bold text-slate-700">{item.duration}</td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {/* Footer / Signature Area */}
      <div className="mt-auto pt-20 flex justify-between items-end">
         <div className="text-center space-y-2 opacity-50">
            <div className="w-32 h-32 border-2 border-dashed border-zinc-200 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-300">ختم العيادة</div>
         </div>
         <div className="text-center w-64 space-y-4">
            <div className="border-b-2 border-slate-900 pb-2">
               {/* Placeholder for Signature */}
            </div>
            <p className="text-xs font-black uppercase tracking-widest">توقيع الطبيب المختص</p>
         </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only, .print-only * {
            visibility: visible;
          }
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
