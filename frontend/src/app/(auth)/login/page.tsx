'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Stethoscope, ArrowRight, Lock, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data;
      
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (user && accessToken) {
        setAuth(user, accessToken, refreshToken);
        const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0] : 'patient';
        router.push(`/${primaryRole.toLowerCase()}`);
      } else {
        setError('استجابة غير صالحة من الخادم. يرجى المحاولة مرة أخرى.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'بيانات الاعتماد غير صالحة. يرجى المحاولة مرة أخرى.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-zinc-950 overflow-hidden" dir="rtl">
      {/* Left Side: Branding & Info (Visible on Large Screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center p-12 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -ml-48 -mt-48 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-foreground/10 rounded-full -mr-48 -mb-48 blur-3xl" />
        
        <div className="relative z-10 max-w-lg text-white text-right">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-8 justify-end"
          >
            <h1 className="text-2xl font-bold tracking-tight">عيادة نُخبة الطبي</h1>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
              <Stethoscope className="text-primary w-7 h-7" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-5xl font-bold leading-tight mb-6">
              رعاية دقيقة <br /> 
              <span className="text-blue-200">مدعومة بالذكاء.</span>
            </h2>
            <p className="text-lg text-blue-100/80 mb-10">
              الجيل القادم من إدارة العيادات. آمن، فعال، ومصمم للمهنيين الصحيين العصريين.
            </p>
          </motion.div>

          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {[
              "متوافق تماماً مع معايير أمن البيانات الطبية",
              "تحليلات لحظية ورؤى شاملة للمرضى",
              "جدولة مواعيد سلسة وذكية"
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-3 justify-end">
                <span className="text-sm font-medium text-blue-50">{text}</span>
                <div className="bg-white/20 p-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-blue-200" />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
        
        <div className="absolute bottom-8 left-8 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-widest">النظام يعمل بكفاءة</span>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[420px]"
        >
          <div className="mb-10 lg:hidden">
             <div className="flex items-center gap-3 justify-center mb-2">
                <h1 className="text-xl font-bold tracking-tight">عيادة نُخبة</h1>
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Stethoscope className="text-white w-6 h-6" />
                </div>
              </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">مرحباً بك مجدداً</h1>
            <p className="text-muted-foreground mt-2 font-medium">أدخل بياناتك للوصول إلى لوحة التحكم</p>
          </div>

          <Card className="border sub-border shadow-2xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-900/80 backdrop-blur-sm">
            <CardContent className="pt-8">
              <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold rounded-lg flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div className="relative">
                    <Input 
                      label="البريد الإلكتروني"
                      type="email" 
                      placeholder="name@clinic.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Mail className="absolute left-3 bottom-3 w-4 h-4 text-muted-foreground/50" />
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        كلمة المرور
                      </label>
                      <Link href="/forgot-password" title="Recover password" className="text-xs font-bold text-primary hover:underline">
                        نسيت كلمة المرور؟
                      </Link>
                    </div>
                    <Input 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10"
                    />
                    <Lock className="absolute left-3 bottom-3 w-4 h-4 text-muted-foreground/50" />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full font-bold h-12" 
                  isLoading={isLoading}
                >
                  تسجيل الدخول <ArrowRight className="mr-2 w-4 h-4 rotate-180" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-8 font-medium">
            ليس لديك حساب؟ {' '}
            <Link href="/register" className="text-primary font-bold hover:underline">
              انضم إلينا الآن
            </Link>
          </p>
          
          <div className="mt-12 flex items-center justify-center gap-6 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">موثوق من قبل</p>
            <div className="h-4 w-px bg-border" />
            <div className="flex gap-4">
               <div className="w-20 h-5 bg-zinc-300 rounded-sm" />
               <div className="w-20 h-5 bg-zinc-300 rounded-sm" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

