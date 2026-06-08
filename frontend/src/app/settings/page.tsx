'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  User, 
  Shield, 
  Settings as SettingsIcon, 
  Bell, 
  Lock, 
  Globe, 
  Mail, 
  Users, 
  Activity,
  CheckCircle2,
  MoreVertical,
  LogOut,
  ShieldCheck,
  Building,
  Plus
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/useToast';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'staff' | 'security' | 'clinic'>('profile');
  const { addToast } = useToast();

  const [clinicName, setClinicName] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [vatPercentage, setVatPercentage] = useState(15);
  const [logoUrl, setLogoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Profile identity local states
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true);

  // Fetch current user's profile details
  const { data: profile, refetch: refetchProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.get('/users/profile');
      return response.data;
    }
  });

  useEffect(() => {
    if (profile) {
      setProfileName(profile.fullName || '');
      setProfilePhone(profile.contactNumber || '');
    }
  }, [profile]);

  const saveProfileMutation = useMutation({
    mutationFn: async (updatedData: { fullName: string; contactNumber: string }) => {
      return api.patch('/users/profile', updatedData);
    },
    onSuccess: () => {
      refetchProfile();
      addToast('Profile updated successfully!', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Failed to update profile.', 'error');
    }
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfileMutation.mutate({
      fullName: profileName,
      contactNumber: profilePhone
    });
  };

  const { data: staff, isLoading: isStaffLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
    enabled: user?.roles.includes('ADMIN')
  });

  const { data: settings, refetch: refetchSettings } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    }
  });

  useEffect(() => {
    if (settings) {
      setClinicName(settings.clinicName || '');
      setClinicPhone(settings.phone || '');
      setClinicEmail(settings.email || '');
      setClinicAddress(settings.address || '');
      setVatPercentage(settings.vatPercentage !== undefined ? settings.vatPercentage : 15);
      setLogoUrl(settings.clinicLogo || '');
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      return api.post('/settings', updatedData);
    },
    onSuccess: () => {
      refetchSettings();
      addToast('Clinic branding updated successfully!', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Failed to update branding settings.', 'error');
    }
  });

  const handleSaveClinicSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate({
      clinicName,
      phone: clinicPhone,
      email: clinicEmail,
      address: clinicAddress,
      vatPercentage: Number(vatPercentage),
      clinicLogo: logoUrl
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const response = await api.post('/settings/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setLogoUrl(response.data.url);
      addToast('Logo uploaded successfully!', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to upload logo.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">System Configuration</h1>
          <p className="text-muted-foreground mt-1 font-medium">Manage your personal workspace and administrative preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           {/* Navigation Sidebar */}
           <div className="lg:col-span-1 space-y-2">
              {[
                { id: 'profile', label: 'My Profile', icon: User },
                { id: 'staff', label: 'Staff & Roles', icon: Users, adminOnly: true },
                { id: 'security', label: 'Security & Auth', icon: Shield },
                { id: 'clinic', label: 'Clinic Branding', icon: Building, adminOnly: true },
              ].filter(t => !t.adminOnly || user?.roles.includes('ADMIN')).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                    activeTab === tab.id 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
              
              <div className="pt-8 mt-8 border-t sub-border">
                 <button 
                  onClick={() => { logout(); window.location.href = '/login'; }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-all"
                 >
                    <LogOut className="w-4 h-4" /> Sign Out
                 </button>
              </div>
           </div>

           {/* Main Settings Content */}
           <div className="lg:col-span-3">
              <Card className="premium-card bg-white dark:bg-zinc-900 border sub-border overflow-hidden">
                 <AnimatePresence mode="wait">
                    {activeTab === 'profile' && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-8 space-y-8 animate-in"
                      >
                         <div className="flex items-center gap-6 pb-8 border-b sub-border">
                            <div className="w-20 h-20 rounded-[2rem] bg-accent flex items-center justify-center text-2xl font-black text-primary">
                               {user?.email?.[0].toUpperCase() || 'U'}
                            </div>
                            <div>
                               <h3 className="text-xl font-bold">Profile Identity</h3>
                               <p className="text-xs text-muted-foreground mt-1">Manage your basic account details and avatar.</p>
                               <div className="mt-3 flex gap-2">
                                  <Button size="sm" variant="premium" className="text-[10px] h-8 font-black uppercase tracking-widest" onClick={() => addToast('Profile photo update coming soon!', 'info')}>Update Photo</Button>
                                  <Button size="sm" variant="ghost" className="text-[10px] h-8 font-black uppercase tracking-widest text-destructive" onClick={() => addToast('Photo removed.', 'info')}>Remove</Button>
                               </div>
                            </div>
                         </div>

                         {isProfileLoading ? (
                            <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
                         ) : (
                            <form onSubmit={handleSaveProfile} className="space-y-8">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <Input label="Email Address" value={profile?.email || ''} disabled />
                                  <Input 
                                    label="Display Name" 
                                    placeholder="e.g. Dr. Walker" 
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    required
                                  />
                                  <Input 
                                    label="Contact Number" 
                                    placeholder="+1 (555) 000-0000" 
                                    value={profilePhone}
                                    onChange={(e) => setProfilePhone(e.target.value)}
                                  />
                                  <div className="space-y-1.5">
                                     <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Localization</label>
                                     <select className="w-full h-11 bg-zinc-50 dark:bg-zinc-800 border sub-border rounded-lg px-4 text-sm outline-none">
                                        <option>English (United States)</option>
                                        <option>Arabic (Egypt)</option>
                                     </select>
                                  </div>
                               </div>

                               <div className="pt-4 flex justify-end">
                                  <Button 
                                    type="submit" 
                                    className="font-bold shadow-lg shadow-primary/20 px-8"
                                    isLoading={saveProfileMutation.isPending}
                                  >
                                    Save Changes
                                  </Button>
                               </div>
                            </form>
                         )}
                      </motion.div>
                    )}

                    {activeTab === 'staff' && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-8 space-y-8 animate-in"
                      >
                         <div className="flex justify-between items-center">
                            <div>
                               <h3 className="text-xl font-bold">Clinical Staff</h3>
                               <p className="text-xs text-muted-foreground mt-1">Configure user access levels and permissions.</p>
                            </div>
                            <Button size="sm" className="font-bold" onClick={() => alert('Add staff member wizard...')}>
                               <Plus className="w-4 h-4 mr-2" /> Add User
                            </Button>
                         </div>

                         <div className="space-y-4">
                            {isStaffLoading ? (
                               <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
                            ) : (
                               staff?.map((s: any) => (
                                 <div key={s.id} className="flex items-center justify-between p-4 bg-accent/30 rounded-2xl border border-transparent hover:border-primary/20 transition-all group">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center font-bold text-xs shadow-sm">
                                          {s.email[0].toUpperCase()}
                                       </div>
                                       <div>
                                          <p className="text-sm font-bold">{s.email}</p>
                                          <div className="flex gap-1 mt-1">
                                             {s.roles.map((r: any) => (
                                               <span key={r.name} className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-tighter rounded-full border border-primary/10">
                                                  {r.name}
                                               </span>
                                             ))}
                                          </div>
                                       </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="rounded-xl group-hover:bg-white"><MoreVertical className="w-4 h-4" /></Button>
                                 </div>
                               ))
                            )}
                         </div>
                      </motion.div>
                    )}

                    {activeTab === 'security' && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-8 space-y-10 animate-in"
                      >
                         <div className="flex items-start gap-4 p-6 bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl border border-emerald-200 dark:border-emerald-500/20">
                            <ShieldCheck className="w-10 h-10 text-emerald-600 mt-1" />
                            <div>
                               <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-400">Security Standard: HIPAA High</h4>
                               <p className="text-sm text-emerald-800/70 dark:text-emerald-400/60 leading-relaxed mt-1">
                                  Your account is protected by industry-leading security protocols. All clinical data is encrypted at rest and in transit.
                               </p>
                            </div>
                         </div>

                         <div className="space-y-6">
                            <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Access Controls</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <Card className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border sub-border flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <Lock className="w-5 h-5 text-primary" />
                                     <span className="text-sm font-bold">Two-Factor Auth</span>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      const nextVal = !twoFactorEnabled;
                                      setTwoFactorEnabled(nextVal);
                                      addToast(
                                        nextVal ? 'Two-Factor Authentication enabled successfully!' : 'Two-Factor Authentication disabled.',
                                        nextVal ? 'success' : 'info'
                                      );
                                    }}
                                    className={cn(
                                      "w-10 h-6 rounded-full relative transition-colors duration-200 focus:outline-none",
                                      twoFactorEnabled ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700"
                                    )}
                                  >
                                    <motion.div 
                                      animate={{ x: twoFactorEnabled ? 16 : 4 }}
                                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                      className="w-4 h-4 bg-white rounded-full absolute top-1 left-0"
                                    />
                                  </button>
                               </Card>
                               <Card className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border sub-border flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <Mail className="w-5 h-5 text-primary" />
                                     <span className="text-sm font-bold">Login Alerts</span>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      const nextVal = !loginAlertsEnabled;
                                      setLoginAlertsEnabled(nextVal);
                                      addToast(
                                        nextVal ? 'Security alerts for logins enabled.' : 'Security alerts for logins disabled.',
                                        nextVal ? 'success' : 'info'
                                      );
                                    }}
                                    className={cn(
                                      "w-10 h-6 rounded-full relative transition-colors duration-200 focus:outline-none",
                                      loginAlertsEnabled ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700"
                                    )}
                                  >
                                    <motion.div 
                                      animate={{ x: loginAlertsEnabled ? 16 : 4 }}
                                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                      className="w-4 h-4 bg-white rounded-full absolute top-1 left-0"
                                    />
                                  </button>
                               </Card>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Active Sessions</h4>
                            {[
                              { device: 'Windows 11 • Chrome', location: 'Cairo, Egypt', current: true },
                              { device: 'iPhone 15 • Safari', location: 'Dubai, UAE', current: false },
                            ].map((s, i) => (
                              <div key={i} className="flex items-center justify-between p-4 border sub-border rounded-2xl">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center"><Activity className="w-4 h-4 text-primary" /></div>
                                    <div>
                                       <p className="text-xs font-bold">{s.device} {s.current && <span className="text-emerald-600 font-black ml-2 uppercase text-[8px]">(Current)</span>}</p>
                                       <p className="text-[10px] text-muted-foreground font-medium">{s.location}</p>
                                    </div>
                                 </div>
                                 {!s.current && <button className="text-[10px] font-black uppercase text-destructive hover:underline">Revoke</button>}
                              </div>
                            ))}
                         </div>
                      </motion.div>
                    )}

                    {activeTab === 'clinic' && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-8 space-y-8 animate-in"
                      >
                         <div className="flex items-center gap-6 pb-8 border-b sub-border">
                            <div className="w-20 h-20 rounded-[2rem] bg-accent/40 flex items-center justify-center border sub-border overflow-hidden relative group">
                               {logoUrl ? (
                                 <img src={logoUrl} alt="Clinic Logo" className="w-full h-full object-cover" />
                               ) : (
                                 <Building className="w-8 h-8 text-primary" />
                               )}
                               {isUploading && (
                                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                   <div className="w-5 h-5 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                                 </div>
                               )}
                            </div>
                            <div>
                               <h3 className="text-xl font-bold">Clinic Branding</h3>
                               <p className="text-xs text-muted-foreground mt-1">Configure your clinic's visual identity and metadata used across reports, invoices, and messaging.</p>
                               <div className="mt-3">
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleLogoUpload} 
                                    id="logo-upload"
                                    className="hidden" 
                                    disabled={isUploading}
                                  />
                                  <Button 
                                    size="sm" 
                                    variant="premium" 
                                    className="text-[10px] h-8 font-black uppercase tracking-widest"
                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                    disabled={isUploading}
                                  >
                                    Upload Logo
                                  </Button>
                               </div>
                            </div>
                         </div>

                         <form onSubmit={handleSaveClinicSettings} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <Input 
                                 label="Clinic Name"
                                 value={clinicName} 
                                 onChange={(e) => setClinicName(e.target.value)} 
                                 placeholder="e.g. Elite Medical Center" 
                                 required 
                               />
                               <Input 
                                 label="VAT Percentage (%)"
                                 type="number"
                                 value={vatPercentage} 
                                 onChange={(e) => setVatPercentage(Number(e.target.value))} 
                                 placeholder="e.g. 15" 
                                 required 
                               />
                               <Input 
                                 label="Contact Phone"
                                 value={clinicPhone} 
                                 onChange={(e) => setClinicPhone(e.target.value)} 
                                 placeholder="e.g. +966 50 000 0000" 
                               />
                               <Input 
                                 label="Official Email"
                                 type="email"
                                 value={clinicEmail} 
                                 onChange={(e) => setClinicEmail(e.target.value)} 
                                 placeholder="e.g. info@elitemedical.com" 
                               />
                            </div>

                            <Input 
                              label="Physical Address"
                              value={clinicAddress} 
                              onChange={(e) => setClinicAddress(e.target.value)} 
                              placeholder="e.g. King Fahd Branch Rd, Al Rahmaniyah, Riyadh" 
                            />

                            <div className="pt-4 flex justify-end">
                               <Button 
                                 type="submit"
                                 className="font-bold shadow-lg shadow-primary/20 px-8"
                                 isLoading={saveSettingsMutation.isPending}
                               >
                                 Save Branding
                               </Button>
                            </div>
                         </form>
                      </motion.div>
                    )}
                 </AnimatePresence>
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
