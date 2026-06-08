'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, UserPlus, Filter, Calendar, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { RegisterPatientModal } from '@/components/receptionist/RegisterPatientModal';

export default function PatientsListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [genderFilter, setGenderFilter] = useState('All');
  const [bloodFilter, setBloodFilter] = useState('All');

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await api.get('/patients');
      return response.data;
    }
  });

  const columns = [
    {
      header: 'Patient Name',
      accessorKey: 'fullName',
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            {item.fullName.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div>
            <p className="font-bold text-sm leading-none">{item.fullName}</p>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-black tracking-tighter">ID: {item.id.slice(0, 8)}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Gender',
      accessorKey: 'gender',
      cell: (item: any) => (
        <span className={cn(
          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
          item.gender === 'MALE' ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
        )}>
          {item.gender}
        </span>
      )
    },
    {
      header: 'Age',
      accessorKey: 'dateOfBirth',
      cell: (item: any) => {
        const age = new Date().getFullYear() - new Date(item.dateOfBirth).getFullYear();
        return <span className="font-medium">{age} Yrs</span>;
      }
    },
    {
      header: 'Contact',
      accessorKey: 'contactNumber',
    },
    {
      header: 'Last Visit',
      accessorKey: 'updatedAt',
      cell: (item: any) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{new Date(item.updatedAt).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      header: '',
      accessorKey: 'actions',
      cell: (item: any) => (
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push(`/admin/patients/${item.id}`)}
            className="hover:text-primary"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  // Filter patients list dynamically
  const filteredPatients = (patients || []).filter((p: any) => {
    const matchesSearch = p.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.contactNumber?.includes(searchQuery) ||
                          p.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === 'All' || p.gender === genderFilter;
    const matchesBlood = bloodFilter === 'All' || p.bloodGroup === bloodFilter;
    return matchesSearch && matchesGender && matchesBlood;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Patient Registry</h1>
            <p className="text-muted-foreground mt-1 font-medium italic">Manage and access comprehensive health records.</p>
          </div>
          <Button 
            className="font-bold shadow-lg shadow-primary/20" 
            onClick={() => setIsRegisterModalOpen(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" /> Register New Patient
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border sub-border shadow-sm">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, ID, or phone..." 
              className="pl-10 h-10 text-sm" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={genderFilter} 
              onChange={(e) => setGenderFilter(e.target.value)}
              className="h-10 px-3 bg-accent/40 border-none rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">All Genders</option>
              <option value="MALE">MALE</option>
              <option value="FEMALE">FEMALE</option>
            </select>
            <select 
              value={bloodFilter} 
              onChange={(e) => setBloodFilter(e.target.value)}
              className="h-10 px-3 bg-accent/40 border-none rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">All Blood Groups</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>
        </div>

        <div className="animate-in">
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center bg-white dark:bg-zinc-900 rounded-2xl border sub-border">
               <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Accessing Database...</p>
               </div>
            </div>
          ) : (
            <DataTable 
              data={filteredPatients} 
              columns={columns} 
              onRowClick={(item) => router.push(`/admin/patients/${item.id}`)}
            />
          )}
        </div>
      </div>

      <RegisterPatientModal 
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => {
          // Re-fetch handled automatically by react-query query invalidation in RegisterPatientModal
        }}
      />
    </DashboardLayout>
  );
}
