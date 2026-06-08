'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Construction, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export const FeatureStub = ({ title, description }: { title: string; description: string }) => {
  const router = useRouter();

  return (
    <DashboardLayout>
      <div className="h-[70vh] flex flex-col items-center justify-center text-center max-w-lg mx-auto">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-8">
          <Construction className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">{title}</h1>
        <p className="text-muted-foreground leading-relaxed mb-10">
          {description || "We are currently perfecting this feature to ensure the highest quality experience for your clinical workflow. Check back soon!"}
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 w-4 h-4" /> Go Back
          </Button>
          <Button onClick={() => router.push('/admin')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};
