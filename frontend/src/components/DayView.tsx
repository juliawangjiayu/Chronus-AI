
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CalendarEvent, CalendarCategory, SelectionRange } from '../types';

interface DayViewProps {
  events: CalendarEvent[];
  categories: CalendarCategory[];
  currentDate: Date;
  onSelectTimeRange: (start: Date, end: Date, x: number, y: number, dayIndex?: number) => void;
  selectionRange: SelectionRange | null;
  onDeleteEvent: (id: string) => void;
}

const DayView: React.FC<DayViewProps> = ({ events, categories, currentDate, onSelectTimeRange, selectionRange, onDeleteEvent }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ start: number, current: number } | null>(null);
  const [drag, setDrag] = useState<{ start: number, current: number } | null>(null);
  const HOUR_HEIGHT = 80;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 8 * HOUR_HEIGHT;
  }, []);

  const getPos = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    return Math.max(0, Math.min(23.75, Math.floor((y / HOUR_HEIGHT) * 4) / 4));
  }, [HOUR_HEIGHT]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    const current = getPos(e);
    dragRef.current = { ...dragRef.current, current };
    setDrag({ ...dragRef.current });
  }, [getPos]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    const { start: sPos, current: cPos } = dragRef.current;
    
    const sT = Math.min(sPos, cPos);
    const eT = Math.max(sPos, cPos) + 0.25;
    
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    start.setHours(Math.floor(sT), (sT % 1) * 60);
    end.setHours(Math.floor(eT), (eT % 1) * 60);
    
    onSelectTimeRange(start, end, e.clientX, e.clientY, 0);
    
    dragRef.current = null;
    setDrag(null);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [currentDate, onSelectTimeRange, handleMouseMove]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const pos = getPos(e);
    dragRef.current = { start: pos, current: pos };
    setDrag(dragRef.current);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const pos = getPos(e);
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    const sT = Math.floor(pos);
    const eT = sT + 1; // Default 1 hour duration
    
    start.setHours(sT, (pos % 1) * 60);
    end.setHours(eT, (pos % 1) * 60);
    
    onSelectTimeRange(start, end, e.clientX, e.clientY, 0);
  };

  const handleEventContextMenu = (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    onDeleteEvent(eventId);
  };

  const visibleCategories = categories.filter(c => c.checked).map(c => c.id);
  const dayEvents = events.filter(e => visibleCategories.includes(e.categoryId) && e.startTime.toDateString() === currentDate.toDateString());

  const renderSelection = () => {
    const active = drag ? { start: Math.min(drag.start, drag.current), end: Math.max(drag.start, drag.current) + 0.25 } : 
                  (selectionRange && selectionRange.start.toDateString() === currentDate.toDateString() ? {
                    start: selectionRange.start.getHours() + selectionRange.start.getMinutes()/60,
                    end: selectionRange.end.getHours() + selectionRange.end.getMinutes()/60
                  } : null);

    if (!active) return null;

    return (
      <div 
        className="absolute left-0 right-4 bg-blue-500/40 border-2 border-blue-500 rounded-lg shadow-sm z-30 flex flex-col p-1 text-white pointer-events-none transition-all"
        style={{
          top: `${active.start * HOUR_HEIGHT}px`,
          height: `${(active.end - active.start) * HOUR_HEIGHT}px`
        }}
      >
        <div className="text-[11px] font-bold bg-blue-600 self-start px-2 py-0.5 rounded shadow-sm leading-none m-0.5">New Event</div>
        <div className="text-[10px] font-medium mt-1 leading-none opacity-90 ml-1">
          {Math.floor(active.start)}:{(active.start % 1 * 60).toString().padStart(2, '0')} - {Math.floor(active.end)}:{(active.end % 1 * 60).toString().padStart(2, '0')}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden font-sans">
      <div className="px-6 py-8 border-b border-gray-100 shrink-0 bg-white">
        <h1 className="text-[32px] font-bold text-gray-800 tracking-tight leading-none">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h1>
        <div className="text-gray-400 font-medium text-lg mt-1">{currentDate.getFullYear()}</div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto relative custom-scrollbar select-none">
        <div className="absolute left-0 w-16 h-full border-r border-gray-100 z-10 bg-white/50 pointer-events-none">
          {hours.map(h => (
            <div key={h} className="h-[80px] text-right pr-2 text-[10px] font-black text-gray-400 pt-1 uppercase tracking-tighter">
              {h === 0 ? '12 AM' : h === 12 ? 'Noon' : h > 12 ? `${h-12} PM` : `${h} AM`}
            </div>
          ))}
        </div>

        <div ref={containerRef} className="ml-16 relative min-h-full" onMouseDown={handleMouseDown} onDoubleClick={handleDoubleClick}>
          {hours.map(h => (
            <div key={h} className="h-[80px] border-b border-gray-100 relative pointer-events-none">
              <div className="absolute top-1/2 w-full border-t border-gray-50/50 border-dashed" />
            </div>
          ))}

          {renderSelection()}

          <div className="absolute inset-0 pointer-events-none">
            {dayEvents.map(e => {
              const cat = categories.find(c => c.id === e.categoryId);
              const top = (e.startTime.getHours() + e.startTime.getMinutes() / 60) * HOUR_HEIGHT;
              const height = ((e.endTime.getTime() - e.startTime.getTime()) / 3600000) * HOUR_HEIGHT;
              return (
                <div 
                  key={e.id}
                  className={`absolute left-0 right-4 p-3 rounded-xl border-l-[6px] shadow-sm transition-all hover:shadow-md cursor-pointer pointer-events-auto ${e.isGhost ? 'opacity-40 border-dashed' : ''}`}
                  style={{ top, height: Math.max(height, 24), backgroundColor: e.isReminder ? 'transparent' : `${cat?.color}15`, borderColor: cat?.color, color: cat?.color }}
                  onContextMenu={(ev) => handleEventContextMenu(ev, e.id)}
                >
                  <div className={`text-xs font-bold truncate ${e.isReminder ? 'text-gray-900' : 'text-gray-800'}`}>
                    {e.isReminder ? '• ' : ''}{e.title}
                  </div>
                  {!e.isReminder && <div className="text-[10px] opacity-70 font-bold">{e.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayView;
