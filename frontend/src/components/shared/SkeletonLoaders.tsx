'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

export const PatientCardSkeleton = () => {
  return (
    <Card className="p-6 border sub-border rounded-[2rem] relative overflow-hidden animate-pulse">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-3 flex-1">
          <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-1/3" />
          <div className="h-3 bg-zinc-100 dark:bg-zinc-900 rounded-full w-1/2" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="h-10 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl" />
        <div className="h-10 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl" />
      </div>
    </Card>
  );
};

export const DashboardStatsSkeleton = () => {
   return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white dark:bg-zinc-900 border sub-border rounded-[2rem] animate-pulse p-6">
               <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                  <div className="w-12 h-4 rounded-full bg-zinc-100 dark:bg-zinc-800" />
               </div>
               <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full w-2/3" />
            </div>
         ))}
      </div>
   );
};
