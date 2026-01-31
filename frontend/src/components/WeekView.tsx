
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CalendarEvent, CalendarCategory, SelectionRange } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekViewProps {
  events: CalendarEvent[];
  categories: CalendarCategory[];
  currentDate: Date;
  onSelectTimeRange: (start: Date, end: Date, x: number, y: number, dayIndex?: number) => void;
  onNavigate?: (dir: 'prev' | 'next') => void;
  onToday?: () => void;
  selectionRange: SelectionRange | null;
  onDeleteEvent: (id: string) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ 
  events, 
  categories, 
  currentDate, 
  onSelectTimeRange,
  onNavigate,
  onToday,
  selectionRange,
  onDeleteEvent
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const HOUR_HEIGHT = 65;
  const dragRef = useRef<{ day: number, start: number, current: number } | null>(null);
  const [drag, setDrag] = useState<{ day: number, start: number, current: number } | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 8 * HOUR_HEIGHT;
  }, []);

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const getDragInfoFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dayWidth = rect.width / 7;
    const dayIndex = Math.floor(x / dayWidth);
    const time = Math.floor((y / HOUR_HEIGHT) * 4) / 4;
    return { dayIndex: Math.max(0, Math.min(6, dayIndex)), time: Math.max(0, Math.min(23.75, time)) };
  }, [HOUR_HEIGHT]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    const info = getDragInfoFromEvent(e);
    if (info) {
      dragRef.current = { ...dragRef.current, current: info.time };
      setDrag({ ...dragRef.current });
    }
  }, [getDragInfoFromEvent]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    
    const { day, start: sPos, current: cPos } = dragRef.current;
    
    // Check if we ended on a different time (use last valid current)
    // Note: getDragInfoFromEvent(e) might return slightly different time if mouse moved, 
    // but using stored current is safer for consistency with visual feedback.
    // However, original code used finalInfo if available.
    // Let's stick to dragRef.current.current which tracks the latest move.
    
    const finalTime = cPos; 
    const date = weekDays[day];
    const start = new Date(date);
    const end = new Date(date);
    const sT = Math.min(sPos, finalTime);
    const eT = Math.max(sPos, finalTime) + 0.25;
    
    start.setHours(Math.floor(sT), (sT % 1) * 60);
    end.setHours(Math.floor(eT), (eT % 1) * 60);
    
    onSelectTimeRange(start, end, e.clientX, e.clientY, day);
    
    dragRef.current = null;
    setDrag(null);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [weekDays, onSelectTimeRange, handleMouseMove]);

  const handleEventContextMenu = (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteEvent(eventId);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const info = getDragInfoFromEvent(e);
    if (info) {
      dragRef.current = { day: info.dayIndex, start: info.time, current: info.time };
      setDrag(dragRef.current);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  };

  const visibleCats = categories.filter(c => c.checked).map(c => c.id);
  const weekEvents = events.filter(e => visibleCats.includes(e.categoryId) && weekDays.some(d => d.toDateString() === e.startTime.toDateString()));
  const allDayEvents = weekEvents.filter(e => e.allDay);
  const timedEvents = weekEvents.filter(e => !e.allDay);

  const renderSelection = () => {
    const range = drag ? { day: drag.day, start: Math.min(drag.start, drag.current), end: Math.max(drag.start, drag.current) + 0.25 } : null;
    const persistent = selectionRange;

    if (!range && !persistent) return null;

    const active = range || (persistent ? { 
      day: persistent.dayIndex ?? weekDays.findIndex(d => d.toDateString() === persistent.start.toDateString()), 
      start: persistent.start.getHours() + persistent.start.getMinutes()/60,
      end: persistent.end.getHours() + persistent.end.getMinutes()/60
    } : null);

    if (!active || active.day === -1) return null;

    return (
      <div 
        className="absolute bg-blue-500/40 border-2 border-blue-500 rounded-lg shadow-sm z-30 flex flex-col p-1 text-white transition-all pointer-events-none"
        style={{
          left: `calc(${(active.day / 7) * 100}% + 2px)`,
          width: `calc(${100/7}% - 4px)`,
          top: `${active.start * HOUR_HEIGHT}px`,
          height: `${(active.end - active.start) * HOUR_HEIGHT}px`
        }}
      >
        <div className="text-[10px] font-bold bg-blue-600 self-start px-1.5 py-0.5 rounded shadow-sm leading-none m-0.5">New Event</div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none font-sans overflow-hidden">
      <div className="px-6 py-6 flex items-center justify-between bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-baseline space-x-2">
          <h1 className="text-[32px] font-bold text-gray-800 tracking-tighter">
            {currentDate.toLocaleDateString('en-US', { month: 'long' })}
          </h1>
          <span className="text-[32px] font-normal text-gray-400 tracking-tighter">
            {currentDate.getFullYear()}
          </span>
        </div>
        
        <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <button onClick={() => onNavigate?.('prev')} className="p-1.5 hover:bg-gray-50 border-r border-gray-200 transition-colors"><ChevronLeft size={16} className="text-gray-500" /></button>
          <button onClick={() => onToday?.()} className="px-4 py-1.5 text-[12px] font-bold text-gray-700 hover:bg-gray-50 transition-colors uppercase tracking-tight">Today</button>
          <button onClick={() => onNavigate?.('next')} className="p-1.5 hover:bg-gray-50 border-l border-gray-200 transition-colors"><ChevronRight size={16} className="text-gray-500" /></button>
        </div>
      </div>

      <div className="flex border-b border-gray-100 bg-white/50 backdrop-blur-md">
        <div className="w-16 shrink-0 border-r border-gray-100" />
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map((d, i) => {
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <div key={i} className="py-2 text-center">
                <div className={`text-[10px] font-black uppercase tracking-tighter ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                  {d.toLocaleDateString('en-US', { weekday: 'short' })} {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex border-b border-gray-100 bg-gray-50/20 shrink-0">
        <div className="w-16 shrink-0 border-r border-gray-100 flex items-center justify-end pr-2 text-[9px] font-black text-gray-400 uppercase tracking-tighter">all-day</div>
        <div className="flex-1 grid grid-cols-7 min-h-[32px] relative">
          {weekDays.map((d, i) => (
            <div key={i} className="border-r border-gray-50/50 h-full p-1 space-y-0.5">
              {allDayEvents.filter(e => e.startTime.toDateString() === d.toDateString()).map(e => {
                const cat = categories.find(c => c.id === e.categoryId);
                return (
                  <div key={e.id} className="text-[10px] px-1.5 py-0.5 rounded text-white font-bold truncate shadow-sm" style={{ backgroundColor: cat?.color }}>
                    <span className="mr-1">★</span> {e.title}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="absolute left-0 w-16 h-full border-r border-gray-100 z-10 bg-white/30 pointer-events-none">
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="h-[65px] text-right pr-2 text-[9px] font-black text-gray-400 pt-1 uppercase tracking-tighter">
              {h === 0 ? '12 AM' : h === 12 ? 'Noon' : h > 12 ? `${h-12} PM` : `${h} AM`}
            </div>
          ))}
        </div>

        <div ref={containerRef} className="ml-16 relative min-h-full" onMouseDown={handleMouseDown}>
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="h-[65px] border-b border-gray-100 relative pointer-events-none">
              <div className="absolute top-1/2 w-full border-t border-gray-50/50 border-dashed" />
            </div>
          ))}

          <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
            {weekDays.map((_, i) => <div key={i} className="border-r border-gray-50 h-full last:border-r-0" />)}
          </div>

          {renderSelection()}

          <div className="absolute inset-0 pointer-events-none">
            {timedEvents.map(e => {
              const dIdx = weekDays.findIndex(d => d.toDateString() === e.startTime.toDateString());
              if (dIdx === -1) return null;
              const top = (e.startTime.getHours() + e.startTime.getMinutes() / 60) * HOUR_HEIGHT;
              const height = ((e.endTime.getTime() - e.startTime.getTime()) / 3600000) * HOUR_HEIGHT;
              const cat = categories.find(c => c.id === e.categoryId);
              return (
                <div 
                  key={e.id} 
                  className={`absolute p-1.5 rounded-lg border-l-4 shadow-sm overflow-hidden pointer-events-auto transition-all hover:scale-[1.02] cursor-pointer ${e.isGhost ? 'opacity-40 border-dashed' : ''}`}
                  style={{
                    left: `calc(${(dIdx / 7) * 100}% + 2px)`, width: `calc(${100/7}% - 4px)`, top, height: Math.max(height, 18),
                    backgroundColor: e.isReminder ? 'transparent' : `${cat?.color}15`, borderColor: cat?.color, color: cat?.color
                  }}
                  onContextMenu={(ev) => handleEventContextMenu(ev, e.id)}
                >
                  <div className={`text-[10px] font-black truncate ${e.isReminder ? 'text-gray-900' : 'text-gray-800'} leading-tight`}>
                    {e.isReminder ? '• ' : ''}{e.title}
                  </div>
                  {!e.isReminder && <div className="text-[8px] font-black opacity-70">{e.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekView;
