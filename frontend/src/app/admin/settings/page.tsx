'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Settings, Save, Building2, Phone, Mail, MapPin, Upload } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    clinicName: '',
    phone: '',
    email: '',
    address: '',
    clinicLogo: '',
    vatPercentage: 15
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    }
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        clinicName: settings.clinicName || '',
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || '',
        clinicLogo: settings.clinicLogo || '',
        vatPercentage: settings.vatPercentage || 15
      });
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/settings', { ...data, vatPercentage: Number(data.vatPercentage) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-settings'] });
      addToast('تم حفظ الإعدادات بنجاح!', 'success');
    },
    onError: () => {
      addToast('فشل في حفظ الإعدادات.', 'error');
    }
  });

  const logoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: (res) => {
      setFormData(prev => ({ ...prev, clinicLogo: res.data.url }));
      queryClient.invalidateQueries({ queryKey: ['clinic-settings'] });
      addToast('تم رفع الشعار بنجاح!', 'success');
    }
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) logoMutation.mutate(file);
  };

  const handleSave = () => {
    mutation.mutate(formData);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
           <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">إعدادات النظام</h1>
              <p className="text-muted-foreground mt-1 font-medium">تخصيص هوية العيادة وبيانات التواصل والضريبة.</p>
           </div>
           <Button 
             variant="premium" 
             className="font-bold gap-2 shadow-xl shadow-primary/20"
             onClick={handleSave}
             disabled={mutation.isPending}
           >
              <Save size={18} />
              {mutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
           </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {/* Logo Section */}
           <Card className="premium-card md:col-span-1">
              <CardHeader className="p-6 pb-2">
                 <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Building2 size={14} /> شعار العيادة
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center gap-6">
                 <div 
                   className="w-32 h-32 bg-accent/30 rounded-[2rem] border-2 border-dashed border-accent flex flex-col items-center justify-center gap-2 group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
                   onClick={() => document.getElementById('logo-upload')?.click()}
                 >
                    {logoMutation.isPending ? (
                       <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    ) : formData.clinicLogo ? (
                       <img src={formData.clinicLogo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                       <>
                          <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">تحميل شعار</p>
                       </>
                    )}
                    <input 
                      id="logo-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                 </div>
                 <p className="text-[10px] text-center text-muted-foreground font-medium">يفضل استخدام صورة مربعة بخلفية شفافة (PNG).</p>
              </CardContent>
           </Card>

           {/* General Settings */}
           <div className="md:col-span-2 space-y-6">
              <Card className="premium-card">
                 <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                       <Settings size={14} /> البيانات العامة والضريبة
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">اسم العيادة</label>
                          <Input 
                            placeholder="أدخل اسم العيادة..." 
                            value={formData.clinicName} 
                            onChange={(e) => setFormData({...formData, clinicName: e.target.value})}
                            className="h-12 bg-accent/20 border-none font-bold text-lg"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">نسبة الضريبة (%)</label>
                          <Input 
                            type="number"
                            placeholder="15" 
                            value={formData.vatPercentage} 
                            onChange={(e) => setFormData({...formData, vatPercentage: Number(e.target.value)})}
                            className="h-12 bg-primary/5 border-primary/20 font-black text-center text-primary"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">رقم الهاتف</label>
                          <div className="relative">
                             <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                             <Input 
                               placeholder="05xxxxxxxx" 
                               value={formData.phone} 
                               onChange={(e) => setFormData({...formData, phone: e.target.value})}
                               className="h-11 bg-accent/20 border-none font-bold pl-10"
                             />
                          </div>
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">البريد الإلكتروني</label>
                          <div className="relative">
                             <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                             <Input 
                               type="email"
                               placeholder="info@clinic.com" 
                               value={formData.email} 
                               onChange={(e) => setFormData({...formData, email: e.target.value})}
                               className="h-11 bg-accent/20 border-none font-bold pl-10"
                             />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">العنوان</label>
                       <div className="relative">
                          <MapPin size={14} className="absolute left-4 top-4 text-muted-foreground" />
                          <textarea 
                            rows={3}
                            placeholder="الرياض، حي الملز..." 
                            value={formData.address} 
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            className="w-full bg-accent/20 border-none rounded-2xl p-4 pl-10 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          />
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <Card className="premium-card bg-emerald-50 border-emerald-100">
                 <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0">
                       <Settings size={20} className="animate-spin-slow" />
                    </div>
                    <div>
                       <h4 className="text-sm font-black text-emerald-900">تطبيق الهوية تلقائياً</h4>
                       <p className="text-xs font-bold text-emerald-700/70 mt-1">سيتم تحديث اسم العيادة وشعارها في كافة الفواتير، الوصفات الطبية، والتقارير الصادرة من النظام فور الحفظ.</p>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
