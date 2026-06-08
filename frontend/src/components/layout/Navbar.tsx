'use client';

import React from 'react';
import { Search, Bell, User as UserIcon, ChevronDown, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export const Navbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { user } = useAuthStore();

  return (
    <header className="h-16 glass border-b sub-border fixed top-0 left-0 right-0 lg:right-64 z-40 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-accent rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="relative group max-w-xl w-full hidden md:block">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="البحث عن المرضى، المواعيد، أو التقارير..." 
            className="w-full pr-10 pl-4 py-2 bg-accent/50 rounded-lg text-sm border border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-black outline-none transition-all font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-accent transition-colors relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-2 left-2 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-black" />
        </button>

        <div className="h-8 w-px bg-border mx-2" />

        <div className="flex items-center gap-3 pr-2 cursor-pointer group">
          <div className="text-left hidden sm:block">
            <p className="text-sm font-bold leading-none">{user?.email.split('@')[0]}</p>
            <p className="text-[10px] text-muted-foreground font-black mt-1 uppercase tracking-widest">
              {user?.roles[0] === 'ADMIN' ? 'المدير' : user?.roles[0] === 'DOCTOR' ? 'طبيب' : user?.roles[0] === 'RECEPTIONIST' ? 'استقبال' : 'مريض'}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:border-primary/40 transition-colors">
            <UserIcon className="w-5 h-5 text-primary" />
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </header>
  );
};
