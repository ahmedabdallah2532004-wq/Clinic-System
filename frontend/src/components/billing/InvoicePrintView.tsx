'use client';

import React from 'react';
import { Receipt, Phone, Mail, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface InvoicePrintViewProps {
  invoice: any;
}

export const InvoicePrintView = ({ invoice }: InvoicePrintViewProps) => {
  const { data: settings } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    }
  });

  if (!invoice) return null;

  return (
    <div className="print-only p-12 bg-white text-slate-900 min-h-screen font-sans" dir="rtl">
      {/* Letterhead Header */}
      <div className="flex justify-between items-start border-b-2 border-primary pb-8 mb-10">
        <div className="flex items-center gap-4">
           <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden">
              {settings?.clinicLogo ? (
                 <img src={settings.clinicLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                 <Receipt size={36} />
              )}
           </div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{settings?.clinicName || 'عيادة أنتي جرافتي'}</h1>
              <p className="text-sm font-bold text-primary uppercase tracking-widest mt-1">فاتورة ضريبية مبسطة</p>
           </div>
        </div>
        <div className="text-left space-y-1 text-[10px] font-bold text-slate-500">
           <div className="flex items-center justify-end gap-2"><span>{settings?.phone || '05xxxxxxx'}</span> <Phone size={12} /></div>
           <div className="flex items-center justify-end gap-2"><span>{settings?.email || 'info@clinic.com'}</span> <Mail size={12} /></div>
           <div className="flex items-center justify-end gap-2"><span>{settings?.address || 'القاهرة، مصر'}</span> <MapPin size={12} /></div>
        </div>
      </div>

      {/* Invoice Meta Info */}
      <div className="flex justify-between items-end mb-12">
         <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800">فاتورة #INV-{invoice.id.slice(0, 8).toUpperCase()}</h2>
            <p className="text-sm font-bold text-muted-foreground">{format(new Date(invoice.createdAt), 'dd MMMM yyyy - hh:mm aa', { locale: ar })}</p>
         </div>
         <div className={invoice.status === 'PAID' ? "bg-emerald-500 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest" : "bg-amber-500 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest"}>
            {invoice.status === 'PAID' ? 'تم السداد' : 'قيد الانتظار'}
         </div>
      </div>

      {/* Patient Bar */}
      <div className="p-6 bg-zinc-50 rounded-2xl border sub-border mb-12">
         <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
               <div className="flex gap-4">
                  <span className="text-[10px] font-black text-muted-foreground uppercase min-w-[80px]">المريض:</span>
                  <span className="text-sm font-black text-slate-800">{invoice.patient?.fullName}</span>
               </div>
               <div className="flex gap-4">
                  <span className="text-[10px] font-black text-muted-foreground uppercase min-w-[80px]">رقم الموبايل:</span>
                  <span className="text-sm font-bold">{invoice.patient?.contactNumber}</span>
               </div>
            </div>
            <div className="space-y-3 text-left">
               <div className="flex justify-end gap-4">
                  <span className="text-sm font-black text-slate-800">د. {invoice.encounter?.doctor?.fullName || '...'}</span>
                  <span className="text-[10px] font-black text-muted-foreground uppercase">الطبيب:</span>
               </div>
               <div className="flex justify-end gap-4">
                  <span className="text-sm font-bold">{invoice.encounter?.chiefComplaint || 'كشف طبي عام'}</span>
                  <span className="text-[10px] font-black text-muted-foreground uppercase">نوع الخدمة:</span>
               </div>
            </div>
         </div>
      </div>

      {/* Items Table */}
      <div className="mb-16">
         <table className="w-full">
            <thead>
               <tr className="border-b-2 border-slate-200">
                  <th className="py-4 text-right text-xs font-black uppercase text-slate-500">البيان / الخدمة</th>
                  <th className="py-4 text-center text-xs font-black uppercase text-slate-500">الكمية</th>
                  <th className="py-4 text-left text-xs font-black uppercase text-slate-500">السعر</th>
                  <th className="py-4 text-left text-xs font-black uppercase text-slate-500">الإجمالي</th>
               </tr>
            </thead>
            <tbody className="divide-y border-b">
               {invoice.items?.length > 0 ? invoice.items.map((item: any, idx: number) => (
                  <tr key={idx}>
                     <td className="py-6">
                        <p className="text-sm font-black text-slate-900">{item.service?.name || 'كشف طبي'}</p>
                     </td>
                     <td className="py-6 text-center text-sm font-bold text-slate-700">1</td>
                     <td className="py-6 text-left text-sm font-bold text-slate-700">{item.unitPrice} ج.م</td>
                     <td className="py-6 text-left text-sm font-black text-slate-900">{item.unitPrice} ج.م</td>
                  </tr>
               )) : (
                  <tr>
                     <td className="py-6">
                        <p className="text-sm font-black text-slate-900">كشف طبي عام</p>
                     </td>
                     <td className="py-6 text-center text-sm font-bold text-slate-700">1</td>
                     <td className="py-6 text-left text-sm font-bold text-slate-700">{invoice.totalAmount} ج.م</td>
                     <td className="py-6 text-left text-sm font-black text-slate-900">{invoice.totalAmount} ج.م</td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mb-20">
         <div className="w-64 space-y-3">
            <div className="flex justify-between text-sm font-bold text-slate-500">
               <span>المبلغ الفرعي:</span>
               <span>{invoice.totalAmount} ج.م</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-500">
               <span>ضريبة القيمة المضافة ({settings?.vatPercentage || 14}%):</span>
               <span>{(Number(invoice.totalAmount) * (settings?.vatPercentage || 14) / 100).toFixed(2)} ج.م</span>
            </div>
            <div className="flex justify-between pt-4 border-t-2 border-slate-900 text-lg font-black text-slate-900">
               <span>الإجمالي الكلي:</span>
               <span>{(Number(invoice.totalAmount) * (1 + (settings?.vatPercentage || 14) / 100)).toFixed(2)} ج.م</span>
            </div>
         </div>
      </div>

      {/* Footer / QR Area */}
      <div className="mt-auto pt-20 flex justify-between items-end border-t border-dashed">
         <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">شكراً لثقتكم بنا</p>
            <div className="w-24 h-24 bg-zinc-100 rounded-xl flex items-center justify-center text-[10px] font-black text-zinc-400">QR CODE</div>
         </div>
         <div className="text-center space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مكتب المحاسبة / التحصيل</p>
            <div className="w-48 border-b-2 border-slate-900 pb-2"></div>
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
