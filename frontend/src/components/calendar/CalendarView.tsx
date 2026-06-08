'use client';

import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import arLocale from '@fullcalendar/core/locales/ar';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, User, Stethoscope, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  extendedProps?: {
    patientName: string;
    doctorName: string;
    status: string;
  };
}

interface CalendarViewProps {
  events: Event[];
  onEventClick?: (event: any) => void;
  onDateSelect?: (selectInfo: any) => void;
  onEventDrop?: (dropInfo: any) => void;
}

const CalendarView = ({ events, onEventClick, onDateSelect, onEventDrop }: CalendarViewProps) => {
  return (
    <div className="relative group">
      <style jsx global>{`
        .fc {
          --fc-border-color: transparent;
          --fc-today-bg-color: rgba(0, 102, 255, 0.05);
          --fc-button-bg-color: transparent;
          --fc-button-border-color: transparent;
          --fc-button-hover-bg-color: #f4f4f5;
          --fc-button-active-bg-color: #f4f4f5;
          font-family: inherit;
        }
        .fc .fc-toolbar {
          display: none; /* We use custom header */
        }
        .fc-theme-standard .fc-scrollgrid {
          border: none !important;
        }
        .fc-col-header-cell {
          padding: 12px 0 !important;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .fc-col-header-cell-cushion {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          text-decoration: none !important;
        }
        .fc-timegrid-slot {
          height: 3rem !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .fc-timegrid-slot-label-cushion {
          font-size: 0.7rem;
          font-weight: 600;
          color: #94a3b8;
        }
        .fc-v-event {
          border: none !important;
          border-left: 4px solid !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          border-radius: 8px !important;
          padding: 4px 8px !important;
        }
        .fc-event-main-frame {
          padding: 2px;
        }
        .fc-event-title {
          font-weight: 700 !important;
          font-size: 0.75rem !important;
        }
        .fc-event-time {
          font-size: 0.65rem !important;
          opacity: 0.8;
          font-weight: 600 !important;
        }
      `}</style>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={arLocale}
        direction="rtl"
        headerToolbar={false}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={events}
        allDaySlot={false}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        eventClick={onEventClick}
        select={onDateSelect}
        eventDrop={onEventDrop}
        height="750px"
        nowIndicator={true}
        eventContent={(eventInfo) => (
          <div className="flex flex-col h-full overflow-hidden">
             <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3 h-3" />
                <span className="fc-event-time">{eventInfo.timeText}</span>
             </div>
             <div className="font-bold text-[11px] truncate">
                {eventInfo.event.title}
             </div>
             {eventInfo.event.extendedProps.patientName && (
               <div className="flex items-center gap-1 mt-auto text-[9px] font-semibold opacity-70">
                  <User className="w-2.5 h-2.5" />
                  {eventInfo.event.extendedProps.patientName}
               </div>
             )}
          </div>
        )}
      />
    </div>
  );
};

export default CalendarView;
