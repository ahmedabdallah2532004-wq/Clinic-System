'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Activity, 
  Download, 
  Filter, 
  ChevronRight,
  Stethoscope,
  Clock,
  ThumbsUp
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

import { RoleGuard } from '@/components/auth/RoleGuard';

export default function ReportsAnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const response = await api.get('/reports/analytics');
      return response.data;
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!analytics) return;

    let csvContent = "";

    // 1. KPIs Section
    csvContent += "Executive KPIs\n";
    csvContent += "Metric,Value\n";
    csvContent += `Total Encounters,${analytics.kpis.totalEncounters}\n`;
    csvContent += `Average Wait Time,${analytics.kpis.averageWaitTime}\n`;
    csvContent += `Patient Satisfaction,${analytics.kpis.patientSatisfaction}\n`;
    csvContent += `No-Show Rate,${analytics.kpis.noShowRate}\n\n`;

    // 2. Revenue Growth Section
    csvContent += "Revenue Growth\n";
    csvContent += "Month,Revenue (SAR)\n";
    analytics.revenueGrowth.forEach((row: any) => {
      csvContent += `"${row.name}",${row.value}\n`;
    });
    csvContent += "\n";

    // 3. Department Stats Section
    csvContent += "Department Stats\n";
    csvContent += "Specialty,Value (%)\n";
    analytics.departmentStats.forEach((row: any) => {
      csvContent += `"${row.name}",${row.value}\n`;
    });
    csvContent += "\n";

    // 4. Doctor Performance Section
    csvContent += "Doctor Performance\n";
    csvContent += "Doctor Name,Patients Seen,Revenue (SAR)\n";
    analytics.doctorPerformance.forEach((row: any) => {
      csvContent += `"${row.name}",${row.patients},${row.revenue}\n`;
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `executive_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return (
    <DashboardLayout>
       <div className="h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
       </div>
    </DashboardLayout>
  );

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
    <DashboardLayout>
      <div className="space-y-8" dir="rtl">
        {/* Executive Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800">الذكاء التنفيذي</h1>
            <p className="text-muted-foreground mt-1 font-medium">تجميع متقدم للبيانات السريرية وتتبع الأداء المؤسسي.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="premium" className="font-bold" onClick={handlePrint}>
                <Download className="w-4 h-4 ml-2" /> طباعة تقرير الأداء
             </Button>
             <Button className="font-bold shadow-lg shadow-primary/20" onClick={handleExportCSV}>
                <Download className="w-4 h-4 ml-2" /> تصدير مجموعة البيانات
             </Button>
          </div>
        </div>

        {/* Intelligence KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: 'إجمالي الكشوفات', value: analytics?.kpis.totalEncounters, icon: Activity, trend: '+4% مقارنة بالعام الماضي', color: 'text-primary' },
             { label: 'متوسط وقت الانتظار', value: analytics?.kpis.averageWaitTime, icon: Clock, trend: 'تحسن بـ 2 دقيقة', color: 'text-emerald-500' },
             { label: 'رضا المرضى', value: analytics?.kpis.patientSatisfaction, icon: ThumbsUp, trend: 'المئوية 98', color: 'text-amber-500' },
             { label: 'معدل التغيب', value: analytics?.kpis.noShowRate, icon: Users, trend: 'المستهدف: < 3%', color: 'text-rose-500' }
           ].map((kpi, i) => (
             <Card key={i} className="premium-card p-6">
                <div className="flex justify-between items-start mb-4">
                   <div className={cn("p-2 rounded-xl bg-accent/50", kpi.color)}>
                      <kpi.icon className="w-5 h-5" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{kpi.trend}</span>
                </div>
                <h3 className="text-2xl font-black text-slate-800">{kpi.value}</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{kpi.label}</p>
             </Card>
           ))}
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Revenue Trend Area Chart */}
           <Card className="lg:col-span-2 p-8 premium-card">
              <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-lg font-black text-slate-800">مسار النمو</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">أداء صافي الإيرادات خلال العام المالي الحالي</p>
                 </div>
                 <div className="h-2 w-24 bg-primary/20 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-primary" />
                 </div>
              </CardHeader>
              <div className="h-[350px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.revenueGrowth}>
                       <defs>
                         <linearGradient id="colorValueReports" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#0066FF" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                       <Tooltip 
                         contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', textAlign: 'right' }}
                       />
                       <Area type="monotone" dataKey="value" stroke="#0066FF" strokeWidth={4} fillOpacity={1} fill="url(#colorValueReports)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </Card>

           {/* Department Pie Chart */}
           <Card className="p-8 premium-card flex flex-col">
              <CardHeader className="p-0 mb-8">
                 <CardTitle className="text-lg font-black text-slate-800">حصة التخصصات</CardTitle>
                 <p className="text-xs text-muted-foreground mt-1">توزيع الكشوفات حسب القسم الطبي</p>
              </CardHeader>
              <div className="h-[250px] relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                         data={analytics?.departmentStats}
                         innerRadius={60}
                         outerRadius={80}
                         paddingAngle={8}
                         dataKey="value"
                       >
                         {analytics?.departmentStats.map((entry: any, index: number) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                       </Pie>
                       <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-800">100%</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">سريري</span>
                 </div>
              </div>
              <div className="mt-8 space-y-3">
                 {analytics?.departmentStats.map((dept: any, i: number) => (
                   <div key={i} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.color }} />
                         <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">{dept.name}</span>
                      </div>
                      <span className="text-xs font-black">{dept.value}%</span>
                   </div>
                 ))}
              </div>
           </Card>
        </div>

        {/* Doctor Performance Table / Bar Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Card className="p-8 premium-card">
              <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-lg font-black text-slate-800">أداء الأطباء</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">مقاييس الكفاءة حسب الطبيب المعالج</p>
                 </div>
                 <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase">الجدول الكامل</Button>
              </CardHeader>
              <div className="space-y-6">
                 {analytics?.doctorPerformance.map((doc: any, i: number) => (
                   <div key={i} className="group">
                      <div className="flex justify-between items-center mb-2">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[10px] font-black">
                               {doc.name.split('. ').length > 1 ? doc.name.split('. ')[1][0] : doc.name[0]}
                            </div>
                            <span className="text-sm font-bold">{doc.name}</span>
                         </div>
                         <span className="text-xs font-black text-primary">{doc.revenue.toLocaleString()} ر.س</span>
                      </div>
                      <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${Math.min((doc.revenue / 22000) * 100, 100)}%` }}
                           transition={{ duration: 1, delay: i * 0.1 }}
                           className="h-full bg-primary rounded-full"
                         />
                      </div>
                      <div className="flex justify-between mt-1.5">
                         <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{doc.patients} مريض تمت رؤيته</span>
                         <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">أداء عالي</span>
                      </div>
                   </div>
                 ))}
              </div>
           </Card>

           <Card className="p-8 premium-card bg-zinc-900 text-white border-none overflow-hidden relative">
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                 <div>
                    <h4 className="text-xl font-black mb-2 flex items-center gap-2">
                       <TrendingUp className="w-5 h-5 text-primary" /> رؤى استباقية
                    </h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                       بناءً على الاتجاهات الحالية، من المتوقع زيادة حجم المرضى بنسبة <span className="text-white font-black underline decoration-primary decoration-4 underline-offset-4">18%</span> في الربع القادم.
                    </p>
                 </div>
                 
                 <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                       </div>
                       <h5 className="font-bold">تحسين الكادر الوظيفي</h5>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                       نوصي بإضافة موظف استقبال إضافي خلال ساعات الذروة (10:00 ص - 02:00 م) لتقليل أوقات الانتظار بمقدار <span className="text-white font-bold">5 دقائق</span> تقريباً.
                    </p>
                    <Button className="w-full font-black text-xs h-12">ذكاء قابل للتنفيذ</Button>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </DashboardLayout>
    </RoleGuard>
  );
}
