'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  details?: string;
}

interface ComboboxProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export const Combobox = ({
  options,
  value,
  onChange,
  placeholder = "اختر...",
  label,
  className
}: ComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    (opt.details && opt.details.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("w-full space-y-1.5 relative", className)} ref={containerRef}>
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
          {label}
        </label>
      )}
      
      <div 
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-4 py-2 text-sm cursor-pointer transition-all hover:border-primary/50",
          isOpen && "ring-2 ring-primary/20 border-primary"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-[110] w-full mt-2 bg-white dark:bg-zinc-900 rounded-xl border sub-border shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b sub-border relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                className="w-full h-10 bg-accent/30 rounded-lg pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all text-right"
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="max-h-[200px] overflow-y-auto p-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors hover:bg-accent",
                      value === opt.value && "bg-primary/5 text-primary font-bold"
                    )}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                  >
                    <div className="flex flex-col text-right">
                      <span>{opt.label}</span>
                      {opt.details && <span className="text-[10px] text-muted-foreground font-medium">{opt.details}</span>}
                    </div>
                    {value === opt.value && <Check className="h-4 w-4" />}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  لا توجد نتائج
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
