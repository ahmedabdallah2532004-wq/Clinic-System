'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, UserPlus, Filter, MoreVertical, Stethoscope, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { OnboardDoctorModal } from '@/components/admin/OnboardDoctorModal';

export default function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const response = await api.get('/doctors');
      return response.data;
    }
  });

  const { data: specialties } = useQuery({
    queryKey: ['specialties'],
    queryFn: async () => {
      const response = await api.get('/doctors/specialties');
      return response.data;
    }
  });

  const filteredDoctors = (doctors || []).filter((doc: any) => {
    const q = searchQuery.toLowerCase();
    
    const matchesSearch = 
      doc.fullName.toLowerCase().includes(q) ||
      doc.licenseNumber.toLowerCase().includes(q) ||
      (doc.bio && doc.bio.toLowerCase().includes(q)) ||
      doc.specialties?.some((s: any) => s.name.toLowerCase().includes(q));

    const matchesSpecialty = 
      selectedSpecialty === 'All' ||
      doc.specialties?.some((s: any) => s.name === selectedSpecialty);

    return matchesSearch && matchesSpecialty;
  });

  const columns = [
    {
      header: 'Specialist',
      accessorKey: 'fullName',
      cell: (item: any) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.25rem] bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/5">
             <Stethoscope size={24} />
          </div>
          <div>
            <p className="font-black text-slate-800 dark:text-zinc-200 text-sm">{item.fullName}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">
              {item.specialties?.map((s: any) => s.name).join(', ') || 'General'}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'License ID',
      accessorKey: 'licenseNumber',
      cell: (item: any) => (
        <span className="font-mono text-xs font-bold text-slate-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
          {item.licenseNumber}
        </span>
      )
    },
    {
      header: 'Contact',
      accessorKey: 'user',
      cell: (item: any) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Mail className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">{item.user?.email || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Availability',
      accessorKey: 'status',
      cell: (item: any) => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/25">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           Active
        </span>
      )
    },
    {
      header: '',
      accessorKey: 'actions',
      cell: (item: any) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="rounded-xl hover:bg-accent transition-all">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">Medical Staff Registry</h1>
            <p className="text-muted-foreground mt-1 font-medium italic">Manage credentials and department assignments for all specialists.</p>
          </div>
          <Button 
            onClick={() => setIsOnboardOpen(true)}
            className="font-black h-12 px-8 rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-widest text-xs"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Onboard Specialist
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-zinc-900 p-5 rounded-[2rem] border sub-border shadow-sm">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search specialists by name, specialty, or license..." 
              className="pl-12 h-12 text-sm rounded-xl border-none bg-accent/30 focus:ring-2 ring-primary/20" 
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="h-12 px-4 rounded-xl border-none bg-accent/30 text-sm font-bold outline-none focus:ring-2 ring-primary/20 min-w-[180px] cursor-pointer text-slate-700 dark:text-zinc-300 dark:bg-zinc-800"
            >
              <option value="All">All Specialties</option>
              {specialties?.map((spec: any) => (
                <option key={spec.id} value={spec.name}>
                  {spec.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="animate-in">
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center bg-white dark:bg-zinc-900 rounded-[2.5rem] border sub-border">
               <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Consulting Registry...</p>
               </div>
            </div>
          ) : (
            <DataTable 
              data={filteredDoctors} 
              columns={columns} 
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden"
            />
          )}
        </div>
      </div>

      <OnboardDoctorModal 
        isOpen={isOnboardOpen} 
        onClose={() => setIsOnboardOpen(false)} 
      />
    </DashboardLayout>
  );
}
