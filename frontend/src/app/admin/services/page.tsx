'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Tag, DollarSign, Edit, Trash2, LayoutGrid, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    category: 'GENERAL'
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ['medical-services'],
    queryFn: async () => {
      const response = await api.get('/medical-services');
      return response.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingService) {
        return api.patch(`/medical-services/${editingService.id}`, data);
      }
      return api.post('/medical-services', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-services'] });
      addToast(editingService ? 'تم تحديث الخدمة بنجاح' : 'تم إضافة الخدمة بنجاح', 'success');
      handleClose();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/medical-services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-services'] });
      addToast('تم حذف الخدمة بنجاح', 'success');
    }
  });

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      basePrice: service.basePrice.toString(),
      category: service.category
    });
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setFormData({ name: '', description: '', basePrice: '', category: 'GENERAL' });
  };

  const columns = [
    {
      header: 'الخدمة',
      accessorKey: 'name',
      cell: (item: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800">{item.name}</span>
          <span className="text-[10px] text-muted-foreground font-medium">{item.description || 'لا يوجد وصف'}</span>
        </div>
      )
    },
    {
      header: 'التصنيف',
      accessorKey: 'category',
      cell: (item: any) => (
        <span className="px-2 py-1 bg-accent/50 text-[10px] font-black uppercase tracking-widest rounded-lg border sub-border">
          {item.category}
        </span>
      )
    },
    {
      header: 'السعر الأساسي',
      accessorKey: 'basePrice',
      cell: (item: any) => (
        <span className="font-black text-primary">{Number(item.basePrice).toLocaleString()} ر.س</span>
      )
    },
    {
      header: '',
      accessorKey: 'actions',
      cell: (item: any) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => {
            if(confirm('هل أنت متأكد من حذف هذه الخدمة؟')) deleteMutation.mutate(item.id);
          }}><Trash2 className="w-4 h-4" /></Button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">إدارة الخدمات والأسعار</h1>
            <p className="text-muted-foreground mt-1 font-medium italic">تخصيص قائمة الأسعار، الخدمات الطبية، والتحليلات.</p>
          </div>
          <Button 
            variant="premium" 
            className="font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 ml-2" /> إضافة خدمة جديدة
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="premium-card bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                 <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">إجمالي الخدمات</p>
                    <LayoutGrid className="w-4 h-4 text-primary" />
                 </div>
                 <h2 className="text-4xl font-black text-primary">{services?.length || 0}</h2>
              </CardContent>
           </Card>

           <Card className="premium-card">
              <CardContent className="p-6">
                 <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">متوسط الأسعار</p>
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                 </div>
                 <h2 className="text-4xl font-black text-slate-800">
                    {services?.length > 0 
                      ? Math.round(services.reduce((acc: any, curr: any) => acc + Number(curr.basePrice), 0) / services.length)
                      : 0
                    } ر.س
                 </h2>
              </CardContent>
           </Card>

           <Card className="premium-card bg-amber-50 border-amber-200">
              <CardContent className="p-6 flex items-center gap-4">
                 <AlertCircle className="w-8 h-8 text-amber-600" />
                 <div>
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest">تنبيه المزامنة</h4>
                    <p className="text-[10px] font-bold text-amber-700/70 mt-0.5">تحديث الأسعار سيؤثر على جميع الفواتير الجديدة الصادرة من النظام.</p>
                 </div>
              </CardContent>
           </Card>
        </div>

        <div className="animate-in">
           {isLoading ? (
             <div className="h-[400px] flex items-center justify-center bg-white dark:bg-zinc-900 rounded-[2.5rem] border sub-border">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
             </div>
           ) : (
             <DataTable 
               data={services || []} 
               columns={columns} 
               className="bg-white dark:bg-zinc-900"
             />
           )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md" onClick={handleClose} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 border sub-border">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
                     <Tag size={24} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black tracking-tight">{editingService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</h3>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">تحديد مسمى الخدمة والتسعيرة</p>
                  </div>
               </div>

               <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({...formData, basePrice: Number(formData.basePrice)}); }} className="space-y-6">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">اسم الخدمة</label>
                     <input 
                       required
                       className="w-full h-12 bg-accent/30 rounded-xl px-4 text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none"
                       placeholder="مثلاً: كشف طبي عام..."
                       value={formData.name}
                       onChange={(e) => setFormData({...formData, name: e.target.value})}
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">السعر (ر.س)</label>
                        <input 
                          required
                          type="number"
                          className="w-full h-12 bg-accent/30 rounded-xl px-4 text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none"
                          placeholder="0.00"
                          value={formData.basePrice}
                          onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">التصنيف</label>
                        <select 
                          className="w-full h-12 bg-accent/30 rounded-xl px-4 text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                        >
                           <option value="GENERAL">عام</option>
                           <option value="LAB">تحاليل</option>
                           <option value="XRAY">أشعة</option>
                           <option value="SURGERY">جراحة</option>
                        </select>
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">الوصف</label>
                     <textarea 
                       rows={3}
                       className="w-full bg-accent/30 rounded-2xl p-4 text-sm font-medium border-none focus:ring-2 focus:ring-primary/20 outline-none"
                       placeholder="وصف مختصر للخدمة..."
                       value={formData.description}
                       onChange={(e) => setFormData({...formData, description: e.target.value})}
                     />
                  </div>

                  <div className="flex gap-3 pt-4">
                     <Button type="button" variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={handleClose}>إلغاء</Button>
                     <Button type="submit" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20" isLoading={mutation.isPending}>
                        <CheckCircle2 className="w-4 h-4 ml-2" /> {editingService ? 'تحديث' : 'حفظ الخدمة'}
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
