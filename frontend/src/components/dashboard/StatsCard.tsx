'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isUp: boolean;
  };
  className?: string;
  index: number;
}

export const StatsCard = ({ title, value, icon: Icon, trend, className, index }: StatsCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn("premium-card p-6 flex items-start justify-between", className)}
    >
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold mt-2 tracking-tight">{value}</h3>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span className={cn(
              "text-xs font-bold px-1.5 py-0.5 rounded",
              trend.isUp ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {trend.isUp ? '+' : '-'}{trend.value}%
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">مقارنة بالشهر الماضي</span>
          </div>
        )}
      </div>
      <div className="p-3 bg-primary/10 rounded-xl">
        <Icon className="w-6 h-6 text-primary" />
      </div>
    </motion.div>
  );
};
