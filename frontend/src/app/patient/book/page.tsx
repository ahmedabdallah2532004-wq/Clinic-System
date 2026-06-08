'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Stethoscope, 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export default function BookAppointment() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    doctorId: '',
    doctorName: '',
    date: '',
    time: '',
    notes: ''
  });

  // Fetch patient profile to get the real patientId
  const { data: patient } = useQuery({
    queryKey: ['patient-profile-me'],
    queryFn: async () => {
      const response = await api.get('/patients/me');
      return response.data;
    }
  });

  // Fetch doctors
  const { data: doctors, isLoading: isDoctorsLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const response = await api.get('/doctors');
      return response.data;
    }
  });

  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!patient?.id) throw new Error('Patient profile not found');
      
      const startDateTime = new Date(`${data.date}T${data.time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); 
      
      return api.post('/appointments', {
        doctorId: data.doctorId,
        patientId: patient.id, 
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: data.notes
      });
    },
    onSuccess: () => {
      setStep(4);
    }
  });

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const handleConfirm = () => {
    bookingMutation.mutate(bookingData);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8">
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Reserve Appointment</h1>
            <p className="text-muted-foreground mt-1 font-medium">Secure your slot with our specialist doctors.</p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={cn(
                  "h-1.5 w-8 rounded-full transition-all duration-500",
                  step >= s ? "bg-primary w-12" : "bg-muted"
                )} 
              />
            ))}
          </div>
        </div>

        {/* Step 1: Select Doctor */}
        {step === 1 && (
          <div className="space-y-6 animate-in">
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Step 1: Choose Specialist</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isDoctorsLoading ? (
                <div className="col-span-full py-20 flex justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
              ) : (
                doctors?.map((doc: any) => (
                  <Card 
                    key={doc.id} 
                    className={cn(
                      "group cursor-pointer border sub-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5",
                      bookingData.doctorId === doc.id ? "ring-2 ring-primary border-primary bg-primary/5" : "bg-white"
                    )}
                    onClick={() => setBookingData({ ...bookingData, doctorId: doc.id, doctorName: doc.fullName })}
                  >
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Stethoscope size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">{doc.fullName}</p>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
                          {doc.specialties?.[0]?.name || 'General Practitioner'}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <div className="flex justify-end pt-4">
              <Button 
                disabled={!bookingData.doctorId} 
                onClick={() => setStep(2)}
                className="px-8 font-bold"
              >
                Next Step <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="space-y-8 animate-in">
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Step 2: Date & Time</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <Card className="p-8 border sub-border">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-4">Select Date</label>
                  <input 
                    type="date" 
                    className="w-full h-12 bg-accent/50 border sub-border rounded-xl px-4 font-bold outline-none focus:ring-2 focus:ring-primary/20"
                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  />
                  <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
                     <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                     <p className="text-xs text-primary/80 leading-relaxed font-medium">
                        Standard consultation is 30 minutes. Please arrive 10 minutes before your scheduled time.
                     </p>
                  </div>
               </Card>

               <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block ml-1">Available Slots</label>
                  <div className="grid grid-cols-3 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setBookingData({ ...bookingData, time: slot })}
                        className={cn(
                          "py-3 rounded-xl border text-sm font-bold transition-all",
                          bookingData.time === slot 
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                            : "bg-white border-input text-muted-foreground hover:border-primary/50 hover:text-primary"
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            <div className="flex justify-between pt-8">
              <Button variant="ghost" onClick={() => setStep(1)} className="font-bold">
                <ChevronLeft className="mr-2 w-4 h-4" /> Go Back
              </Button>
              <Button 
                disabled={!bookingData.date || !bookingData.time} 
                onClick={() => setStep(3)}
                className="px-8 font-bold"
              >
                Review Booking <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="max-w-md mx-auto space-y-8 animate-in">
             <div className="text-center">
                <h3 className="text-2xl font-black tracking-tight">Confirm Booking</h3>
                <p className="text-muted-foreground mt-1 font-medium">Please review the appointment details.</p>
             </div>

             <Card className="premium-card p-8 border-2 border-primary/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-3 opacity-10"><User size={80} /></div>
                <div className="space-y-6 relative z-10">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Stethoscope size={20} /></div>
                      <div>
                         <p className="text-[10px] font-black uppercase text-primary/60">Doctor</p>
                         <p className="font-bold">{bookingData.doctorName}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><CalendarIcon size={20} /></div>
                      <div>
                         <p className="text-[10px] font-black uppercase text-primary/60">Date & Time</p>
                         <p className="font-bold">{bookingData.date} at {bookingData.time}</p>
                      </div>
                   </div>
                   <div className="pt-4">
                      <label className="text-[10px] font-black uppercase text-primary/60 block mb-2">Notes for Doctor (Optional)</label>
                      <textarea 
                        className="w-full bg-accent/50 rounded-xl p-4 text-sm outline-none border sub-border focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                        placeholder="Describe your symptoms..."
                        onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                      />
                   </div>
                </div>
             </Card>

             <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(2)} className="flex-1 font-bold">Back</Button>
                <Button 
                  onClick={handleConfirm} 
                  isLoading={bookingMutation.isPending}
                  className="flex-1 font-bold shadow-xl shadow-primary/20"
                >
                  Confirm & Pay
                </Button>
             </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="text-center py-20 animate-in">
             <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-200">
                <CheckCircle2 size={48} />
             </div>
             <h2 className="text-4xl font-black tracking-tight mb-4">All Set!</h2>
             <p className="text-muted-foreground text-lg font-medium max-w-sm mx-auto mb-10">
                Your appointment has been confirmed. We've sent the details to your email.
             </p>
             <div className="flex justify-center gap-4">
                <Button variant="premium" onClick={() => router.push('/patient')} className="font-bold">Go to Dashboard</Button>
                <Button onClick={() => setStep(1)} className="font-bold">Book Another</Button>
             </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
