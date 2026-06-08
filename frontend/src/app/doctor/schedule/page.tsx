'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CalendarView from '@/components/calendar/CalendarView';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, MoreVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';

export default function DoctorSchedule() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [blockDate, setBlockDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ['doctor-schedule', user?.id],
    queryFn: async () => {
      const response = await api.get(`/appointments/doctor/${user?.id}`);
      return response.data;
    },
    enabled: !!user?.id
  });

  const blockMutation = useMutation({
    mutationFn: async (data: { startTime: string; endTime: string; reason: string }) => {
      return api.post('/appointments/block-time', {
        doctorId: user?.id,
        startTime: data.startTime,
        endTime: data.endTime,
        reason: data.reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedule'] });
      addToast('Time slot blocked successfully!', 'success');
      setIsBlockOpen(false);
      setBlockDate('');
      setBlockStartTime('');
      setBlockEndTime('');
      setBlockReason('');
      refetch();
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Failed to block time slot.', 'error');
    }
  });

  const handleBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate || !blockStartTime || !blockEndTime) return;
    const startDateTime = new Date(`${blockDate}T${blockStartTime}:00`);
    const endDateTime = new Date(`${blockDate}T${blockEndTime}:00`);

    if (startDateTime >= endDateTime) {
      addToast('End time must be after start time.', 'error');
      return;
    }

    blockMutation.mutate({
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      reason: blockReason || 'Blocked Time'
    });
  };

  const calendarEvents = appointments?.map((appt: any) => ({
    id: appt.id,
    title: `${appt.patient?.fullName} - ${appt.notes || 'Checkup'}`,
    start: appt.startTime,
    end: appt.endTime,
    backgroundColor: appt.status === 'COMPLETED' ? '#10b981' : appt.status === 'IN_PROGRESS' ? '#0066FF' : '#f59e0b',
    extendedProps: {
      patientName: appt.patient?.fullName,
      status: appt.status
    }
  })) || [];

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Clinical Calendar</h1>
          <p className="text-muted-foreground mt-1 font-medium">Manage your personal availability and review upcoming slots.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="premium" className="font-black uppercase tracking-widest text-xs h-12 px-6 shadow-xl shadow-primary/20" onClick={() => setIsBlockOpen(true)}>
             <Plus className="w-4 h-4 mr-2" /> Block Time
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3">
           <Card className="p-4 bg-white dark:bg-zinc-900 border sub-border rounded-[2rem] shadow-sm">
              {isLoading ? (
                <div className="h-[600px] flex items-center justify-center">
                   <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              ) : (
                <CalendarView events={calendarEvents} />
              )}
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="premium-card p-6 bg-zinc-50 dark:bg-zinc-800/50 border sub-border rounded-[2rem]">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6">Schedule Statistics</h3>
              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">Today's Load</span>
                    <span className="px-3 py-1 bg-primary text-white rounded-full text-[10px] font-black">{appointments?.length || 0} Cases</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">Week Utilization</span>
                    <span className="text-lg font-black text-primary">82%</span>
                 </div>
                 <div className="pt-4 border-t sub-border">
                    <p className="text-[10px] font-bold text-muted-foreground leading-relaxed italic">
                       "Your schedule is optimized based on average session times of 25 minutes per patient."
                    </p>
                 </div>
              </div>
           </Card>

           <div className="p-8 bg-primary rounded-[2rem] text-white shadow-2xl shadow-primary/20">
              <h4 className="font-black text-lg mb-4 flex items-center gap-2">
                 <Clock size={20} />
                 Shift Notice
              </h4>
              <p className="text-xs text-primary-foreground/80 leading-relaxed font-medium">
                 Next week includes a public holiday on Thursday. All non-emergency appointments have been rescheduled.
              </p>
           </div>
        </div>
      </div>

      {/* Block Time Modal */}
      {isBlockOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md animate-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md p-8 shadow-2xl border sub-border">
            <h3 className="text-2xl font-bold tracking-tight mb-2">Block Time Slot</h3>
            <p className="text-sm text-muted-foreground mb-8">Select a date and time range to block from appointments.</p>
            
            <form onSubmit={handleBlockSubmit} className="space-y-4">
              <Input 
                label="Date" 
                type="date" 
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Start Time" 
                  type="time" 
                  value={blockStartTime}
                  onChange={(e) => setBlockStartTime(e.target.value)}
                  required
                />
                <Input 
                  label="End Time" 
                  type="time" 
                  value={blockEndTime}
                  onChange={(e) => setBlockEndTime(e.target.value)}
                  required
                />
              </div>
              <Input 
                label="Reason / Notes" 
                placeholder="e.g. Lunch Break, Seminar"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />

              <div className="flex gap-3 mt-10">
                <Button 
                  type="button"
                  variant="ghost"
                  className="flex-1 font-bold"
                  onClick={() => setIsBlockOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 font-bold shadow-lg shadow-primary/20"
                  isLoading={blockMutation.isPending}
                >
                  Block Slot
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
