'use client';

import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
      <main className="lg:pr-64 pt-16 min-h-screen">
        <div className="p-4 md:p-8 animate-in max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
