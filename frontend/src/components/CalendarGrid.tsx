
import React, { useEffect, useRef, useState } from 'react';
import { CalendarEvent, CalendarCategory, CalendarView } from '../types';
// Import Sparkles icon as it's used in the tooltip
import { Sparkles } from 'lucide-react';

interface CalendarGridProps {
  events: CalendarEvent[];
  categories: CalendarCategory[];
  onSelectTimeRange: (start: Date, end: Date) => void;
  viewMode: 'Day' | 'Week';
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ events, categories, onSelectTimeRange, viewMode }) => {
  const days = viewMode === 'Week' 
    ? ['Sun 25', 'Mon 26', 'Tue 27', 'Wed 28', 'Thu 29', 'Fri 30', 'Sat 31']
    : ['Sat 31']; // Mock current day for Day view
  
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dragStart, setDragStart] = useState<{ dayIndex: number; time: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ dayIndex: number; time: number } | null>(null);

  const HOUR_HEIGHT = 60;
  const numCols = viewMode === 'Week' ? 7 : 1;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    if (gridScrollRef.current) {
      // Auto scroll to current time or 8am
      const now = new Date();
      const scrollPos = Math.max(0, (now.getHours() - 2) * HOUR_HEIGHT);
      gridScrollRef.current.scrollTop = scrollPos || 480;
    }
    return () => clearInterval(timer);
  }, []);

  const visibleCategories = categories.filter(c => c.checked).map(c => c.id);
  
  // Filter events for the displayed days
  const displayedDateStrs = days.map(d => {
    const dayNum = parseInt(d.split(' ')[1]);
    return new Date(2026, 0, dayNum).toDateString();
  });

  const filteredEvents = events.filter(e => 
    visibleCategories.includes(e.categoryId) && 
    displayedDateStrs.includes(e.startTime.toDateString())
  );

  const getMousePositionInfo = (e: React.MouseEvent) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top + (gridScrollRef.current?.scrollTop || 0);
    
    const dayWidth = rect.width / numCols;
    const dayIndex = Math.floor(x / dayWidth);
    const rawTime = y / HOUR_HEIGHT;
    const time = Math.floor(rawTime * 4) / 4; // Snap to 15 mins
    
    return { dayIndex: Math.max(0, Math.min(numCols - 1, dayIndex)), time: Math.max(0, Math.min(23.75, time)) };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const info = getMousePositionInfo(e);
    if (info) {
      setDragStart(info);
      setDragCurrent(info);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStart) {
      const info = getMousePositionInfo(e);
      if (info) setDragCurrent(info);
    }
  };

  const handleMouseUp = () => {
    if (dragStart && dragCurrent) {
      const startTime = Math.min(dragStart.time, dragCurrent.time);
      const endTime = Math.max(dragStart.time, dragCurrent.time) + 0.25;
      
      const dayOffset = viewMode === 'Week' ? dragStart.dayIndex : 6; // Saturday 31 is index 6 in the week
      const date = new Date(2026, 0, 25 + dayOffset);
      
      const start = new Date(date);
      start.setHours(Math.floor(startTime), (startTime % 1) * 60);
      
      const end = new Date(date);
      end.setHours(Math.floor(endTime), (endTime % 1) * 60);
      
      onSelectTimeRange(start, end);
    }
    setDragStart(null);
    setDragCurrent(null);
  };

  const getEventStyle = (event: CalendarEvent) => {
    const startHour = event.startTime.getHours() + event.startTime.getMinutes() / 60;
    const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60);
    
    // In Week view, index by Day. In Day view, always 0.
    const dayIndex = viewMode === 'Week' ? event.startTime.getDay() : 0;
    
    return {
      top: `${startHour * HOUR_HEIGHT}px`,
      height: `${Math.max(duration * HOUR_HEIGHT, 22)}px`,
      left: `calc(${(dayIndex / numCols) * 100}% + 4px)`,
      width: `calc(${(1 / numCols) * 100}% - 8px)`,
    };
  };

  const indicatorTop = (currentTime.getHours() * 60) + currentTime.getMinutes();
  const showIndicator = viewMode === 'Day' || currentTime.getDay() === 6; // Show if Saturday (Today in mock)

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden relative select-none font-sans">
      {/* Date Header */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md z-40 border-b border-gray-200">
        <div className="p-4 py-6 flex items-baseline space-x-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">January</h1>
          <span className="text-3xl font-normal text-gray-400">2026</span>
        </div>
        <div className="flex">
          <div className="w-16 shrink-0 border-r border-gray-100" />
          <div className={`flex-1 grid ${viewMode === 'Week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
            {days.map((day, i) => {
              const isToday = (viewMode === 'Week' && i === 6) || (viewMode === 'Day');
              return (
                <div key={day} className="py-2 text-center border-l border-gray-100 first:border-l-0">
                  <div className={`text-[11px] font-bold uppercase tracking-widest ${isToday ? 'text-red-500' : 'text-gray-400'}`}>
                    {day.split(' ')[0]}
                  </div>
                  <div className={`mt-1 text-lg font-bold inline-flex items-center justify-center w-9 h-9 rounded-full transition-all ${isToday ? 'bg-red-500 text-white shadow-md' : 'text-gray-900'}`}>
                    {day.split(' ')[1]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid Area */}
      <div 
        ref={gridScrollRef} 
        className="flex-1 overflow-y-auto relative scroll-smooth custom-scrollbar"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Time Labels */}
        <div className="absolute left-0 w-16 h-full pointer-events-none z-20 border-r border-gray-100 bg-white/40">
          {hours.map(hour => (
            <div key={hour} className="h-[60px] flex justify-end pr-2.5 pt-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                {hour === 0 ? '' : hour > 12 ? `${hour - 12} PM` : hour === 12 ? 'NOON' : `${hour} AM`}
              </span>
            </div>
          ))}
        </div>

        {/* Grid Lines */}
        <div ref={containerRef} className="absolute left-16 right-0 h-full">
          {hours.map(hour => (
            <div key={hour} className="h-[60px] border-b border-gray-100 relative">
               {/* 30-min dashed line */}
               <div className="absolute top-1/2 left-0 right-0 border-t border-gray-50 border-dashed w-full h-px" />
            </div>
          ))}
          <div className="absolute inset-0 flex pointer-events-none">
            {Array.from({length: numCols}).map((_, i) => (
              <div key={i} className={`flex-1 border-r border-gray-100 last:border-r-0 ${viewMode === 'Week' && i === 6 ? 'bg-yellow-50/15' : ''}`} />
            ))}
          </div>

          {/* New Event Drag Placeholder */}
          {dragStart && dragCurrent && (
            <div 
              className="absolute bg-blue-500/20 border-2 border-blue-500/40 rounded-lg pointer-events-none z-10 transition-all shadow-sm"
              style={{
                top: `${Math.min(dragStart.time, dragCurrent.time) * HOUR_HEIGHT}px`,
                height: `${(Math.abs(dragStart.time - dragCurrent.time) + 0.25) * HOUR_HEIGHT}px`,
                left: `${(dragStart.dayIndex / numCols) * 100}%`,
                width: `${(1 / numCols) * 100}%`,
              }}
            >
              <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 absolute -top-6 left-1 rounded-md shadow-md animate-bounce">
                New Event
              </div>
            </div>
          )}

          {/* Current Time Indicator */}
          {showIndicator && (
            <div className="absolute left-0 right-0 z-30 pointer-events-none" style={{ top: `${indicatorTop}px` }}>
              <div className="flex items-center -ml-16">
                 <div className="w-16 flex justify-end pr-2.5">
                   <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-lg">
                     {currentTime.getHours()}:{currentTime.getMinutes().toString().padStart(2, '0')}
                   </span>
                 </div>
                 <div className="flex-1 relative flex items-center">
                   <div className="w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white absolute -left-1.5 shadow-xl" />
                   <div className="w-full h-[2px] bg-red-500" />
                 </div>
              </div>
            </div>
          )}

          {/* Event Cards */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {filteredEvents.map(event => {
              const style = getEventStyle(event);
              const category = categories.find(c => c.id === event.categoryId);
              return (
                <div
                  key={event.id}
                  className="event-card absolute p-2.5 rounded-xl border-l-[5px] overflow-hidden pointer-events-auto cursor-pointer hover:shadow-lg transition-all"
                  style={{
                    ...style,
                    backgroundColor: `${category?.color}15`,
                    borderColor: category?.color,
                    color: category?.color,
                  }}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[12px] font-bold leading-none truncate text-gray-800">{event.title}</span>
                      <i className="fa-solid fa-arrows-rotate text-[9px] opacity-40"></i>
                    </div>
                    {event.location && (
                      <span className="text-[10px] truncate opacity-70 font-semibold mb-1 flex items-center text-gray-600">
                        <i className="fa-solid fa-location-dot mr-1.5 text-[10px]"></i>{event.location}
                      </span>
                    )}
                    <span className="text-[10px] mt-auto font-black opacity-80 flex items-center text-gray-600">
                      <i className="fa-regular fa-clock mr-1.5 text-[10px]"></i>
                      {event.startTime.getHours()}:{event.startTime.getMinutes().toString().padStart(2, '0')} – {event.endTime.getHours()}:{event.endTime.getMinutes().toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* UI Interaction Tooltip */}
      <div className="absolute bottom-6 right-6 pointer-events-none">
         <div className="bg-white/90 backdrop-blur-xl border border-gray-200 px-4 py-2 rounded-2xl shadow-2xl text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center transition-all hover:scale-105">
            <Sparkles size={14} className="mr-2 text-indigo-500" />
            Drag grid to create
         </div>
      </div>
    </div>
  );
};

export default CalendarGrid;
