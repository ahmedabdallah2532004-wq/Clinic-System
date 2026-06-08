'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { 
  Users, 
  CalendarCheck, 
  DollarSign, 
  TrendingUp, 
  UserPlus, 
  Activity,
  ArrowUpRight,
  Receipt
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DashboardStatsSkeleton } from '@/components/shared/SkeletonLoaders';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/stats/admin');
      return response.data;
    }
  });

  const revenueTrends = stats?.revenueTrends || [];
  const departmentStats = stats?.departmentStats || [];
  const recentInvoices = stats?.recentInvoices || [];

  const handleExport = () => {
    if (!revenueTrends || revenueTrends.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "اليوم,القيمة\n" 
      + revenueTrends.map((e: any) => `${e.name},${e.value}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dashboard-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isStatsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8" dir="rtl">
           <div className="h-20 w-1/3 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-2xl" />
           <DashboardStatsSkeleton />
           <div className="h-[400px] w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-[2.5rem]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8" dir="rtl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800">القيادة التنفيذية</h1>
            <p className="text-muted-foreground mt-1 font-medium italic">رؤية شاملة للنمو السريري والصحة المالية للعيادة.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExport}
              className="px-6 py-3 bg-white dark:bg-zinc-900 border sub-border rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent transition-all shadow-sm"
            >
              تصدير البيانات
            </button>
            <button 
              onClick={() => router.push('/admin/settings')}
              className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              إعدادات متقدمة
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard 
            index={0}
            title="إجمالي المرضى" 
            value={isStatsLoading ? '...' : stats?.totalPatients} 
            icon={Users} 
            trend={{ value: `${stats?.patientsToday || 0} جديد اليوم`, isUp: true }} 
          />
          <StatsCard 
            index={1}
            title="مواعيد اليوم" 
            value={isStatsLoading ? '...' : stats?.appointmentsToday} 
            icon={CalendarCheck} 
            trend={{ value: 'نشط حالياً', isUp: true }} 
          />
          <StatsCard 
            index={2}
            title="إجمالي الدخل" 
            value={isStatsLoading ? '...' : `${Number(stats?.totalRevenue).toLocaleString()} ر.س`} 
            icon={DollarSign} 
            trend={{ value: 'نمو مستمر', isUp: true }} 
          />
          <StatsCard 
            index={3}
            title="نسبة النمو" 
            value={isStatsLoading ? '...' : `${stats?.growthRate}%`} 
            icon={TrendingUp} 
            trend={{ value: '4%', isUp: true }} 
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Area Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border sub-border shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-800">ديناميكية الإيرادات</h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">التدفق المالي لآخر 7 أيام</p>
              </div>
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                بيانات مباشرة <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="h-[340px] w-full">
              {mounted && (
                <ResponsiveContainer width="99%" height="100%">
                  <AreaChart data={revenueTrends}>
                    <defs>
                      <linearGradient id="colorValueAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0066FF" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                        fontSize: '12px',
                        fontWeight: '700',
                        textAlign: 'right'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#0066FF" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorValueAdmin)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Department Distribution Bar Chart */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border sub-border shadow-sm">
            <h2 className="text-xl font-black tracking-tight mb-1 text-slate-800">توزيع التخصصات</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-10">تحليل الأقسام حسب عبء العمل</p>
            <div className="h-[340px] w-full">
              {mounted && (
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={departmentStats} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 800, fill: '#1e293b' }} 
                      width={90}
                      orientation="right"
                    />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={[8, 0, 0, 8]} barSize={24}>
                      {departmentStats.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-6 space-y-4">
              {departmentStats.slice(0, 3).map((dept: any) => (
                <div key={dept.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: dept.color }} />
                    <span className="text-xs font-bold text-slate-700">{dept.name}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter bg-accent px-2 py-1 rounded-md">{dept.value} أطباء</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border sub-border shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
               <h2 className="text-xl font-black tracking-tight text-slate-800">أحدث النشاطات المالية</h2>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">مراقبة آخر الفواتير الصادرة</p>
            </div>
            <button className="px-4 py-2 bg-accent rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/70 transition-colors">سجل التدقيق</button>
          </div>
          
          {recentInvoices.length === 0 ? (
             <div className="py-12 text-center bg-accent/20 rounded-2xl border border-dashed border-accent">
                <p className="text-sm font-bold text-muted-foreground">لا توجد فواتير حديثة مسجلة.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentInvoices.map((inv: any) => (
                <div key={inv.id} className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-[1.5rem] border sub-border hover:border-primary/30 transition-all group cursor-pointer text-right">
                  <div className="flex items-center gap-4 mb-4 flex-row-reverse">
                    <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center border sub-border shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-800">{inv.patientName}</h4>
                      <p className="text-[10px] text-muted-foreground font-black uppercase mt-0.5 tracking-tight">#{inv.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t sub-border flex-row-reverse">
                    <p className="text-lg font-black text-slate-900">{Number(inv.amount).toLocaleString()} ر.س</p>
                    <span className={cn(
                       "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full",
                       inv.status === 'PAID' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                     )}>
                       {inv.status === 'PAID' ? 'تم السداد' : 'قيد الانتظار'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
