'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  UserSquare2, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Settings, 
  LogOut,
  Stethoscope,
  ClipboardList,
  LayoutGrid
} from 'lucide-react';
import { useAuthStore, UserRole } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

export const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const userRole = user?.roles[0];

  const { data: settings } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    }
  });

  const navItems: NavItem[] = [
    { title: 'لوحة التحكم', href: '/admin', icon: LayoutDashboard, roles: ['ADMIN'] },
    { title: 'لوحة التحكم', href: '/receptionist', icon: LayoutDashboard, roles: ['RECEPTIONIST'] },
    { title: 'لوحة التحكم', href: '/doctor', icon: LayoutDashboard, roles: ['DOCTOR'] },
    { title: 'لوحة التحكم', href: '/patient', icon: LayoutDashboard, roles: ['PATIENT'] },
    { title: 'المواعيد', href: '/admin/appointments', icon: Calendar, roles: ['ADMIN', 'RECEPTIONIST'] },
    { title: 'الأطباء', href: '/admin/doctors', icon: Stethoscope, roles: ['ADMIN'] },
    { title: 'المرضى', href: '/admin/patients', icon: Users, roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
    { title: 'الفواتير', href: '/admin/billing', icon: CreditCard, roles: ['ADMIN', 'RECEPTIONIST'] },
    { title: 'الخدمات', href: '/admin/services', icon: LayoutGrid, roles: ['ADMIN'] },
    { title: 'التقارير', href: '/admin/reports', icon: BarChart3, roles: ['ADMIN'] },
    
    // Doctor Specific
    { title: 'جدول مواعيدي', href: '/doctor/schedule', icon: Calendar, roles: ['DOCTOR'] },
    { title: 'قائمة المرضى', href: '/doctor/queue', icon: ClipboardList, roles: ['DOCTOR'] },
    
    // Patient Specific
    { title: 'حجز موعد', href: '/patient/book', icon: Calendar, roles: ['PATIENT'] },
    { title: 'السجل الطبي', href: '/patient/history', icon: FileText, roles: ['PATIENT'] },
    
    { title: 'الإعدادات', href: userRole === 'ADMIN' ? '/admin/settings' : '/settings', icon: Settings, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
  ];

  const filteredItems = navItems.filter(item => userRole && item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "w-64 h-screen glass border-l sub-border flex flex-col fixed inset-y-0 right-0 z-50 transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
            {settings?.clinicLogo ? (
               <img src={settings.clinicLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
               <Stethoscope className="text-white w-6 h-6" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{settings?.clinicName || 'جاري التحميل...'}</h1>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">إدارة العيادات</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative",
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}>
                {isActive && (
                  <motion.div 
                    layoutId="active-nav"
                    className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className="text-sm font-medium">{item.title}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t sub-border">
        <button 
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-bold">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
    </>
  );
};
