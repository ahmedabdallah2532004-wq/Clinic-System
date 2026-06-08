'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessorKey: keyof T | string;
    cell?: (item: T) => React.ReactNode;
  }[];
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T>({ data, columns, onRowClick, className }: DataTableProps<T>) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border sub-border", className)}>
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-accent/50 text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-6 py-4 border-b sub-border">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y sub-border">
          {data.length > 0 ? (
            data.map((item, rowIdx) => (
              <tr 
                key={rowIdx} 
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "hover:bg-accent/30 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 text-foreground font-medium">
                    {col.cell ? col.cell(item) : (item[col.accessorKey as keyof T] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-20 text-center text-muted-foreground font-medium italic">
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
