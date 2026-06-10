'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Plus,
  Eye,
  CreditCard,
  TrendingUp,
  Receipt,
  Printer,
  Trash2,
  X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Combobox } from '@/components/ui/Combobox';

import { InvoicePrintView } from '@/components/billing/InvoicePrintView';

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Form states for new invoice
  const [newInvoicePatientId, setNewInvoicePatientId] = useState('');
  const [newInvoiceDueDate, setNewInvoiceDueDate] = useState('');
  const [newInvoiceItems, setNewInvoiceItems] = useState<
    { serviceId: string; quantity: number; unitPrice: number }[]
  >([{ serviceId: '', quantity: 1, unitPrice: 0 }]);

  // Fetch Invoices
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await api.get('/billing/invoices');
      return response.data;
    }
  });

  // Fetch Patients
  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await api.get('/patients');
      return response.data;
    }
  });

  // Fetch Medical Services
  const { data: services } = useQuery({
    queryKey: ['medical-services'],
    queryFn: async () => {
      const response = await api.get('/medical-services');
      return response.data;
    }
  });

  // Fetch settings for VAT percentage
  const { data: settings } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    }
  });

  const vatPercentage = settings?.vatPercentage ?? 15;

  // Mutation to collect payment (Cash)
  const collectMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const targetInvoice = invoices?.find((inv: any) => inv.id === invoiceId);
      return api.post('/billing/payments', {
        invoiceId,
        amount: targetInvoice ? Number(targetInvoice.totalAmount) : 0,
        method: 'CASH'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      alert('تم استلام الدفعة بنجاح!');
      // Update selectedInvoice if it is open in view modal
      if (selectedInvoice) {
        setSelectedInvoice((prev: any) => prev ? { ...prev, status: 'PAID' } : null);
      }
    },
    onError: (err: any) => {
      alert('فشل تحصيل الدفعة: ' + (err.response?.data?.message || err.message));
    }
  });

  // Mutation to create a manual invoice
  const createInvoiceMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/billing/invoices', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      alert('تم إنشاء الفاتورة بنجاح!');
      setIsCreateModalOpen(false);
      // Reset form
      setNewInvoicePatientId('');
      setNewInvoiceDueDate('');
      setNewInvoiceItems([{ serviceId: '', quantity: 1, unitPrice: 0 }]);
    },
    onError: (err: any) => {
      alert('فشل إنشاء الفاتورة: ' + (err.response?.data?.message || err.message));
    }
  });

  // Form helpers
  const handleAddInvoiceItem = () => {
    setNewInvoiceItems([...newInvoiceItems, { serviceId: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveInvoiceItem = (index: number) => {
    setNewInvoiceItems(newInvoiceItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, key: string, val: any) => {
    const updated = [...newInvoiceItems];
    if (key === 'serviceId') {
      const selectedService = services?.find((s: any) => s.id.toString() === val);
      updated[index] = {
        ...updated[index],
        serviceId: val,
        unitPrice: selectedService ? Number(selectedService.basePrice) : 0
      };
    } else if (key === 'quantity') {
      updated[index] = {
        ...updated[index],
        quantity: Math.max(1, Number(val))
      };
    } else if (key === 'unitPrice') {
      updated[index] = {
        ...updated[index],
        unitPrice: Math.max(0, Number(val))
      };
    }
    setNewInvoiceItems(updated);
  };

  // Calculations for new invoice
  const subtotal = newInvoiceItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const vatAmount = subtotal * (vatPercentage / 100);
  const totalAmount = subtotal + vatAmount;

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoicePatientId) {
      alert('الرجاء اختيار المريض');
      return;
    }
    if (!newInvoiceDueDate) {
      alert('الرجاء اختيار تاريخ الاستحقاق');
      return;
    }
    const filteredItems = newInvoiceItems.filter(item => item.serviceId !== '');
    if (filteredItems.length === 0) {
      alert('الرجاء إضافة خدمة واحدة على الأقل');
      return;
    }

    createInvoiceMutation.mutate({
      patientId: newInvoicePatientId,
      dueDate: new Date(newInvoiceDueDate),
      totalAmount,
      items: filteredItems.map(item => ({
        serviceId: Number(item.serviceId),
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    });
  };

  // DataTable columns
  const columns = [
    {
      header: 'رقم الفاتورة',
      accessorKey: 'id',
      cell: (item: any) => (
        <span className="font-mono text-xs font-bold text-muted-foreground">#{item.id.slice(0, 8).toUpperCase()}</span>
      )
    },
    {
      header: 'المريض',
      accessorKey: 'patient',
      cell: (item: any) => (
        <div className="flex flex-col">
          <span className="font-bold">{item.patient?.fullName || 'غير معروف'}</span>
          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tight">{item.patient?.contactNumber || 'لا يوجد هاتف'}</span>
        </div>
      )
    },
    {
      header: 'المبلغ',
      accessorKey: 'totalAmount',
      cell: (item: any) => (
        <span className="font-black text-foreground">{Number(item.totalAmount).toLocaleString()} ر.س</span>
      )
    },
    {
      header: 'تاريخ الاستحقاق',
      accessorKey: 'dueDate',
      cell: (item: any) => (
        <span className="text-xs font-medium">{new Date(item.dueDate).toLocaleDateString('ar-SA')}</span>
      )
    },
    {
      header: 'الحالة',
      accessorKey: 'status',
      cell: (item: any) => (
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
          item.status === 'PAID' ? "bg-green-50 text-green-700 border-green-200" :
          item.status === 'PENDING' ? "bg-amber-50 text-amber-700 border-amber-200" :
          "bg-rose-50 text-rose-700 border-rose-200"
        )}>
          {item.status === 'PAID' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          {item.status === 'PAID' ? 'مدفوعة' : item.status === 'PENDING' ? 'قيد الانتظار' : 'ملغاة'}
        </div>
      )
    },
    {
      header: '',
      accessorKey: 'actions',
      cell: (item: any) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="hover:text-primary"
            onClick={() => {
              setSelectedInvoice(item);
              setIsViewModalOpen(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {item.status !== 'PAID' && (
            <Button 
              size="sm" 
              className="h-8 font-bold text-[10px] px-3 shadow-sm"
              onClick={() => collectMutation.mutate(item.id)}
              disabled={collectMutation.isPending}
            >
              {collectMutation.isPending ? '...' : 'تحصيل'}
            </Button>
          )}
        </div>
      )
    }
  ];

  const handleExportCsv = async () => {
    try {
      const response = await api.get('/billing/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `التقرير_المالي_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('فشل تصدير التقرير. يرجى المحاولة لاحقاً.');
    }
  };

  // Convert patients and services for Combobox/Select
  const patientOptions = (patients || []).map((p: any) => ({
    value: p.id,
    label: p.fullName,
    details: p.contactNumber
  }));

  // Calculations for stats
  const totalRevenue = invoices?.filter((inv: any) => inv.status === 'PAID').reduce((sum: number, inv: any) => sum + Number(inv.totalAmount), 0) || 0;
  const pendingRevenue = invoices?.filter((inv: any) => inv.status === 'PENDING').reduce((sum: number, inv: any) => sum + Number(inv.totalAmount), 0) || 0;
  const collectionRate = invoices?.length > 0 
    ? (invoices.filter((inv: any) => inv.status === 'PAID').length / invoices.length * 100).toFixed(1)
    : '100';

  return (
    <DashboardLayout>
      <div className="space-y-8" dir="rtl">
        {/* Financial Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">المركز المالي</h1>
            <p className="text-muted-foreground mt-1 font-medium italic">مراقبة التدفقات النقدية، الفواتير، والمدفوعات السريرية.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="premium" className="font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform" onClick={handleExportCsv}>
                <Download className="w-4 h-4 ml-2" /> تصدير CSV
             </Button>
             <Button className="font-bold shadow-lg shadow-zinc-200" onClick={() => {
               // Setup defaults
               setNewInvoicePatientId('');
               setNewInvoiceDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
               setNewInvoiceItems([{ serviceId: '', quantity: 1, unitPrice: 0 }]);
               setIsCreateModalOpen(true);
             }}>
                <Plus className="w-4 h-4 ml-2" /> فاتورة جديدة
             </Button>
          </div>
        </div>

        {/* Financial KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="premium-card bg-primary text-white border-none shadow-xl shadow-primary/20">
              <CardContent className="p-6">
                 <div className="flex justify-between items-center mb-4">
                    <p className="text-xs font-black uppercase tracking-widest opacity-80">إجمالي المدفوعات المحصلة</p>
                    <TrendingUp className="w-4 h-4" />
                 </div>
                 <h2 className="text-4xl font-black">{totalRevenue.toLocaleString()} ر.س</h2>
                 <p className="text-[10px] mt-2 font-bold opacity-70">إجمالي المبالغ التي تم تحصيلها</p>
              </CardContent>
           </Card>

           <Card className="premium-card bg-amber-500 text-white border-none shadow-xl shadow-amber-500/20">
              <CardContent className="p-6">
                 <div className="flex justify-between items-center mb-4">
                    <p className="text-xs font-black uppercase tracking-widest opacity-80">المبالغ المستحقة المعلقة</p>
                    <Clock className="w-4 h-4" />
                 </div>
                 <h2 className="text-4xl font-black">{pendingRevenue.toLocaleString()} ر.س</h2>
                 <p className="text-[10px] mt-2 font-bold opacity-70">
                   {invoices?.filter((inv: any) => inv.status === 'PENDING').length || 0} فاتورة قيد الانتظار
                 </p>
              </CardContent>
           </Card>

           <Card className="premium-card">
              <CardContent className="p-6">
                 <div className="flex justify-between items-center mb-4">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">نسبة سداد الفواتير</p>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                 </div>
                 <h2 className="text-4xl font-black text-foreground">{collectionRate}%</h2>
                 <p className="text-[10px] mt-2 font-bold text-green-600">نسبة الفواتير المدفوعة بالكامل</p>
              </CardContent>
           </Card>
        </div>

        {/* Invoice Management Section */}
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                 <Receipt className="w-5 h-5 text-primary" /> سجل الفواتير
              </h3>
           </div>

           <div className="animate-in">
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center bg-white dark:bg-zinc-900 rounded-3xl border sub-border">
                   <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">جاري تحميل السجل...</p>
                   </div>
                </div>
              ) : (
                <DataTable 
                  data={invoices || []} 
                  columns={columns} 
                  className="bg-white dark:bg-zinc-900"
                />
              )}
           </div>
        </div>

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Card className="premium-card p-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6">طرق التحصيل</h4>
              <div className="space-y-4">
                 {[
                   { label: 'نقداً (كاش)', value: 100, color: 'bg-emerald-500' },
                   { label: 'بطاقة ائتمان / مدى', value: 0, color: 'bg-primary' },
                   { label: 'تأمين طبي', value: 0, color: 'bg-amber-500' }
                 ].map((m, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                         <span>{m.label}</span>
                         <span>{m.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                         <div className={cn("h-full rounded-full", m.color)} style={{ width: `${m.value}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
           </Card>

           <Card className="premium-card p-6 bg-accent/30 border-dashed border-2 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-3xl flex items-center justify-center shadow-sm mb-4">
                 <AlertCircle className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-lg font-bold">نزاهة الفواتير</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">جميع المعاملات مشفرة ومدققة للامتثال المالي.</p>
           </Card>
        </div>
      </div>

      {/* MODALS */}

      {/* 1. VIEW DETAILS MODAL */}
      <AnimatePresence>
        {isViewModalOpen && selectedInvoice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md" 
              onClick={() => setIsViewModalOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2rem] shadow-2xl p-8 border sub-border max-h-[90vh] overflow-y-auto"
              dir="rtl"
            >
              <button 
                className="absolute left-6 top-6 p-2 rounded-full hover:bg-accent text-muted-foreground transition-colors"
                onClick={() => setIsViewModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
                  <Receipt size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">تفاصيل الفاتورة</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                    رقم الفاتورة: #{selectedInvoice.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Invoice body in the modal */}
              <div className="space-y-6 text-slate-800 dark:text-zinc-200">
                <div className="grid grid-cols-2 gap-4 p-4 bg-accent/30 rounded-2xl border sub-border text-sm">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">المريض</p>
                    <p className="font-bold text-base mt-1">{selectedInvoice.patient?.fullName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedInvoice.patient?.contactNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">الحالة</p>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border mt-1",
                      selectedInvoice.status === 'PAID' ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {selectedInvoice.status === 'PAID' ? 'تم الدفع' : 'قيد الانتظار'}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">بنود الخدمات المشمولة</h4>
                  <div className="border sub-border rounded-2xl overflow-hidden bg-accent/10">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-accent/40 border-b sub-border text-right">
                          <th className="p-3 font-black text-[10px] uppercase">الخدمة</th>
                          <th className="p-3 font-black text-[10px] uppercase text-center">الكمية</th>
                          <th className="p-3 font-black text-[10px] uppercase text-left">السعر المفرد</th>
                          <th className="p-3 font-black text-[10px] uppercase text-left">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y sub-border">
                        {selectedInvoice.items?.length > 0 ? (
                          selectedInvoice.items.map((item: any, idx: number) => (
                            <tr key={idx}>
                              <td className="p-3 font-bold">{item.service?.name || 'كشف طبي'}</td>
                              <td className="p-3 text-center font-bold">{item.quantity}</td>
                              <td className="p-3 text-left font-bold">{Number(item.unitPrice).toLocaleString()} ر.س</td>
                              <td className="p-3 text-left font-black">{ (item.quantity * Number(item.unitPrice)).toLocaleString() } ر.س</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="p-3 font-bold">كشف عام / زيارة سريرية</td>
                            <td className="p-3 text-center font-bold">1</td>
                            <td className="p-3 text-left font-bold">{Number(selectedInvoice.totalAmount).toLocaleString()} ر.س</td>
                            <td className="p-3 text-left font-black">{Number(selectedInvoice.totalAmount).toLocaleString()} ر.س</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end border-t sub-border pt-4">
                  <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between font-bold text-muted-foreground">
                      <span>المجموع الفرعي:</span>
                      <span>{Number(selectedInvoice.totalAmount).toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between font-bold text-muted-foreground">
                      <span>الضريبة ({vatPercentage}%):</span>
                      <span>شاملة للضريبة</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-black text-base text-foreground">
                      <span>المجموع الكلي:</span>
                      <span>{Number(selectedInvoice.totalAmount).toLocaleString()} ر.س</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="premium" 
                    className="flex-1 h-12 rounded-xl font-bold"
                    onClick={() => window.print()}
                  >
                    <Printer className="w-4 h-4 ml-2" /> طباعة الفاتورة
                  </Button>
                  
                  {selectedInvoice.status !== 'PAID' && (
                    <Button 
                      className="flex-1 h-12 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => collectMutation.mutate(selectedInvoice.id)}
                      disabled={collectMutation.isPending}
                    >
                      <CreditCard className="w-4 h-4 ml-2" />
                      {collectMutation.isPending ? 'جاري التحصيل...' : 'تحصيل المبلغ كاش'}
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    className="h-12 rounded-xl font-bold" 
                    onClick={() => setIsViewModalOpen(false)}
                  >
                    إغلاق
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden print element, triggers print styles in InvoicePrintView */}
      {selectedInvoice && (
        <InvoicePrintView invoice={selectedInvoice} />
      )}

      {/* 2. CREATE NEW INVOICE MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md" 
              onClick={() => setIsCreateModalOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 border sub-border max-h-[90vh] overflow-y-auto"
              dir="rtl"
            >
              <button 
                className="absolute left-6 top-6 p-2 rounded-full hover:bg-accent text-muted-foreground transition-colors"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">فاتورة جديدة</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">إنشاء فاتورة يدوية وإسنادها لمريض</p>
                </div>
              </div>

              <form onSubmit={handleCreateInvoiceSubmit} className="space-y-6">
                {/* Patient selection */}
                <div className="space-y-2 relative">
                  <Combobox 
                    label="المريض"
                    placeholder="ابحث عن مريض بالاسم أو الجوال..."
                    options={patientOptions}
                    value={newInvoicePatientId}
                    onChange={(val) => setNewInvoicePatientId(val)}
                  />
                </div>

                {/* Due Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">تاريخ الاستحقاق</label>
                    <input 
                      required
                      type="date"
                      className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-right"
                      value={newInvoiceDueDate}
                      onChange={(e) => setNewInvoiceDueDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Invoice Items Area */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-black text-primary uppercase tracking-wider">بنود الخدمات</h4>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs font-black"
                      onClick={handleAddInvoiceItem}
                    >
                      <Plus className="w-3.5 h-3.5 ml-1" /> إضافة بند
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                    {newInvoiceItems.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-end border-b sub-border pb-3">
                        {/* Service select */}
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-black text-muted-foreground mr-1">الخدمة</label>
                          <select 
                            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-right"
                            value={item.serviceId}
                            onChange={(e) => handleItemChange(idx, 'serviceId', e.target.value)}
                            required
                          >
                            <option value="">-- اختر خدمة --</option>
                            {(services || []).map((s: any) => (
                              <option key={s.id} value={s.id.toString()}>
                                {s.name} ({Number(s.basePrice).toLocaleString()} ر.س)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="w-20 space-y-1">
                          <label className="text-[10px] font-black text-muted-foreground mr-1">الكمية</label>
                          <input 
                            required
                            type="number"
                            min="1"
                            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 text-center"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="w-28 space-y-1">
                          <label className="text-[10px] font-black text-muted-foreground mr-1">سعر الوحدة</label>
                          <input 
                            required
                            type="number"
                            min="0"
                            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 text-left"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          />
                        </div>

                        {/* Delete item button */}
                        {newInvoiceItems.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:bg-destructive/10 h-10 w-10 flex items-center justify-center p-0"
                            onClick={() => handleRemoveInvoiceItem(idx)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="flex justify-end border-t sub-border pt-4">
                  <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between font-bold text-muted-foreground">
                      <span>المجموع الفرعي:</span>
                      <span>{subtotal.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between font-bold text-muted-foreground">
                      <span>الضريبة ({vatPercentage}%):</span>
                      <span>{vatAmount.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-black text-base text-foreground">
                      <span>المجموع الكلي:</span>
                      <span>{totalAmount.toLocaleString()} ر.s</span>
                    </div>
                  </div>
                </div>

                {/* Submit & Cancel */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 h-12 rounded-xl font-bold shadow-xl shadow-primary/10"
                    disabled={createInvoiceMutation.isPending}
                  >
                    {createInvoiceMutation.isPending ? 'جاري الحفظ...' : 'حفظ وإصدار الفاتورة'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="flex-1 h-12 rounded-xl font-bold" 
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    إلغاء
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
