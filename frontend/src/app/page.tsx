'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Stethoscope, ArrowRight, ShieldCheck, Zap, HeartPulse, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Navigation */}
      <nav className="h-20 flex items-center justify-between px-8 md:px-16 border-b sub-border bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <Stethoscope className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Antigravity</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</Link>
          <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About</Link>
          <div className="h-4 w-px bg-border" />
          <Link href="/login">
            <Button variant="ghost" className="font-bold">Log In</Button>
          </Link>
          <Link href="/register">
            <Button className="font-bold">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-8 md:px-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-3xl -ml-48 -mb-48" />

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Now in Public Beta</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-tight mb-8">
              Healthcare Management <br />
              <span className="text-primary italic">Reimagined.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-10 max-w-lg">
              Streamline your clinical operations with the most intuitive, secure, and powerful platform ever built for healthcare providers.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto font-bold h-14 px-10">
                  Start Building <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto font-bold h-14 px-10">
                  View Demo
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex items-center gap-6">
               <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-zinc-200" />
                  ))}
               </div>
               <p className="text-sm font-medium text-muted-foreground">
                 <span className="font-bold text-foreground">500+</span> clinicians joined this week
               </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
             <div className="bg-zinc-900 rounded-3xl p-4 shadow-2xl shadow-primary/20 aspect-video relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
                <div className="h-full w-full bg-zinc-800 rounded-2xl flex items-center justify-center">
                   <Zap className="w-16 h-16 text-primary animate-pulse" />
                </div>
                {/* Floating UI Elements */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute top-8 -right-4 bg-white p-4 rounded-xl shadow-xl sub-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs font-bold">Appointment Booked</span>
                  </div>
                </motion.div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Features Preview */}
      <section id="features" className="py-32 px-8 md:px-16 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold mb-4">Built for Excellence</h2>
            <p className="text-muted-foreground">Everything you need to run a high-performance clinic.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: "HIPAA Compliant", desc: "Military-grade encryption for all patient data and communication." },
              { icon: Zap, title: "Lightning Fast", desc: "Optimized workflows that save your staff hours of manual work every week." },
              { icon: HeartPulse, title: "Patient Centric", desc: "Intuitive portals that improve patient engagement and outcomes." }
            ].map((f, i) => (
              <div key={i} className="premium-card p-8 bg-white dark:bg-zinc-900">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-8 md:px-16 border-t sub-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Stethoscope className="text-white w-4 h-4" />
            </div>
            <span className="font-bold tracking-tight">Antigravity Health</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Antigravity Systems Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
