'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, Download, Eye, Calendar, User, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import { useToast } from '@/hooks/useToast';

export default function PatientHistory() {
  const { addToast } = useToast();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient-profile-me'],
    queryFn: async () => {
      const response = await api.get('/patients/me');
      return response.data;
    }
  });

  const encounters = patient?.encounters || [];
  const prescriptions = patient?.prescriptions || [];

  // Combine and sort by date
  const combinedRecords = [
    ...encounters.map((e: any) => ({ 
      id: e.id, 
      date: e.createdAt, 
      doctor: e.doctor?.fullName, 
      type: 'Clinical Encounter', 
      title: e.chiefComplaint || 'Consultation',
      data: e 
    })),
    ...prescriptions.map((p: any) => ({ 
      id: p.id, 
      date: p.issuedAt, 
      doctor: p.doctor?.fullName, 
      type: 'Prescription', 
      title: p.items?.[0]?.medicationName ? `${p.items[0].medicationName} & others` : 'Medical Prescription',
      data: p 
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Full Medical Archive</h1>
        <p className="text-muted-foreground mt-1 font-medium">A chronological history of all your interactions with our medical staff.</p>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
        ) : combinedRecords.length === 0 ? (
          <div className="py-20 text-center bg-accent/20 rounded-[2rem] border-2 border-dashed border-accent">
             <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
             <p className="text-lg font-bold text-muted-foreground">No historical records found in your archive.</p>
          </div>
        ) : (
          combinedRecords.map((record) => (
            <Card key={`${record.type}-${record.id}`} className="sub-border rounded-[2rem] group hover:border-primary/50 transition-all overflow-hidden shadow-sm">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center gap-8 p-8">
                  <div className={cn(
                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                    record.type === 'Prescription' ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-primary text-white shadow-primary-200"
                  )}>
                    {record.type === 'Prescription' ? <FileText size={28} /> : <ClipboardList size={28} />}
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-2">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                        record.type === 'Prescription' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-primary/5 text-primary border-primary/10"
                      )}>
                        {record.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-black uppercase tracking-tighter">
                        <Calendar size={12} className="text-primary" /> {format(new Date(record.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-800">{record.title}</h3>
                    <p className="text-sm text-muted-foreground font-bold mt-1 flex items-center justify-center md:justify-start gap-1.5">
                      <User size={14} className="text-zinc-400" /> Issued by {record.doctor}
                    </p>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto">
                    <Button 
                      variant="ghost" 
                      className="flex-1 md:flex-none font-black uppercase tracking-widest text-[10px] h-12 px-6 rounded-xl border sub-border hover:bg-accent"
                      onClick={() => addToast('Viewing record details...', 'info')}
                    >
                      <Eye size={18} className="mr-2" /> Details
                    </Button>
                    <Button 
                      variant="premium" 
                      className="flex-1 md:flex-none font-black uppercase tracking-widest text-[10px] h-12 px-6 rounded-xl shadow-xl shadow-primary/20"
                      onClick={() => addToast('Generating PDF report...', 'info')}
                    >
                      <Download size={18} className="mr-2" /> Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}

import { cn } from '@/lib/utils';
