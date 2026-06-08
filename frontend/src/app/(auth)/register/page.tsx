'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Stethoscope, ArrowRight, Lock, Mail, User, ShieldCheck, BriefcaseMedical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuthStore, UserRole } from '@/store/authStore';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'PATIENT' as UserRole
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { addToast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      
      // Navigate to the correct dashboard
      const dashboard = user.roles[0]?.toLowerCase() || 'patient';
      router.push(`/${dashboard}`);
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Right Side: Branding (Mirrored for variety) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 items-center justify-center p-12 overflow-hidden order-2">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full -mr-48 -mt-48 blur-3xl" />
        
        <div className="relative z-10 max-w-lg text-white">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl">
              <Stethoscope className="text-white w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">HealthCore Pro</h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-5xl font-bold leading-tight mb-6 text-white">
              Elevate Your <br /> 
              <span className="text-primary">Clinical Workflow.</span>
            </h2>
            <p className="text-lg text-zinc-400 mb-10">
              Join thousands of healthcare providers delivering exceptional patient care with our unified management ecosystem.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
             {[
               { icon: ShieldCheck, title: "Secure", desc: "Encryption & Privacy" },
               { icon: BriefcaseMedical, title: "Unified", desc: "All-in-one Suite" }
             ].map((item, idx) => (
               <Card key={idx} className="bg-white/5 border-white/10 p-6 backdrop-blur-sm">
                  <item.icon className="w-8 h-8 text-primary mb-3" />
                  <h4 className="font-bold text-sm text-white">{item.title}</h4>
                  <p className="text-xs text-zinc-500 mt-1">{item.desc}</p>
               </Card>
             ))}
          </div>
        </div>
      </div>

      {/* Left Side: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900/50 order-1">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[440px]"
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
            <p className="text-muted-foreground mt-2 font-medium">Join the next generation of healthcare</p>
          </div>

          <Card className="border sub-border shadow-2xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-900/80 backdrop-blur-sm">
            <CardContent className="pt-8">
              <form onSubmit={handleRegister} className="space-y-6">
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold rounded-lg flex items-center gap-2">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <Input 
                    label="Email Address"
                    type="email" 
                    placeholder="name@clinic.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Password"
                      type="password" 
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                    <Input 
                      label="Confirm"
                      type="password" 
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                      Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['PATIENT', 'DOCTOR'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFormData({...formData, role: r as UserRole})}
                          className={cn(
                            "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-semibold transition-all",
                            formData.role === r 
                              ? "bg-primary/5 border-primary text-primary shadow-sm" 
                              : "bg-white dark:bg-zinc-800 border-input text-muted-foreground hover:bg-zinc-50"
                          )}
                        >
                          {r === 'DOCTOR' ? <Stethoscope className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full font-bold h-12" 
                  isLoading={isLoading}
                >
                  Create Workspace <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-8 font-medium">
            Already have an account? {' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
