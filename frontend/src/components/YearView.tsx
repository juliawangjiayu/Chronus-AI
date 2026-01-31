
import React, { useState } from 'react';
import { CalendarEvent, CalendarCategory } from '../types';

interface YearViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  categories: CalendarCategory[];
}

const YearView: React.FC<YearViewProps> = ({ currentDate, events, categories }) => {
  const [hoveredDate, setHoveredDate] = useState<{ date: Date, x: number, y: number } | null>(null);
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleMouseEnter = (e: React.MouseEvent, date: Date) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setHoveredDate({ date, x: rect.left + rect.width / 2, y: rect.top });
  };

  const renderMonth = (monthIdx: number) => {
    const daysInMonth = new Date(currentDate.getFullYear(), monthIdx + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), monthIdx, 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);

    return (
      <div key={months[monthIdx]} className="p-2">
        <h4 className="text-sm font-bold text-red-500 mb-2">{months[monthIdx]}</h4>
        <div className="grid grid-cols-7 text-[8px] font-black text-gray-400 text-center mb-1 uppercase tracking-tighter">
          {['S','M','T','W','T','F','S'].map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 text-[10px] text-center gap-y-1">
          {blanks.map(b => <div key={`b-${b}`} />)}
          {days.map(d => {
            const dateObj = new Date(currentDate.getFullYear(), monthIdx, d);
            const isToday = dateObj.toDateString() === new Date().toDateString();
            const hasEvents = events.some(e => e.startTime.toDateString() === dateObj.toDateString());
            
            return (
              <div 
                key={d} 
                onMouseEnter={(e) => hasEvents && handleMouseEnter(e, dateObj)}
                onMouseLeave={() => setHoveredDate(null)}
                className={`relative flex items-center justify-center h-5 w-5 mx-auto rounded-full cursor-default transition-all ${
                  isToday 
                  ? 'bg-red-500 text-white font-bold shadow-sm' 
                  : hasEvents ? 'font-bold text-gray-900 bg-gray-100 hover:bg-gray-200' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {d}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getEventsForHovered = () => {
    if (!hoveredDate) return [];
    return events.filter(e => e.startTime.toDateString() === hoveredDate.date.toDateString());
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white p-8 relative custom-scrollbar select-none">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-800 tracking-tighter">{currentDate.getFullYear()}</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12 pb-20">
        {months.map((_, i) => renderMonth(i))}
      </div>

      {/* Year Tooltip (Image 4 style) */}
      {hoveredDate && (
        <div 
          className="fixed z-[500] bg-white/90 backdrop-blur-xl border border-gray-200 rounded-xl shadow-2xl p-3 w-[200px] -translate-x-1/2 -translate-y-[calc(100%+12px)] pointer-events-none animate-in fade-in zoom-in-95 duration-75"
          style={{ top: hoveredDate.y, left: hoveredDate.x }}
        >
          <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 pb-1 border-b border-gray-100">
            {hoveredDate.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div className="space-y-2">
            {getEventsForHovered().map(e => {
              const cat = categories.find(c => c.id === e.categoryId);
              return (
                <div key={e.id} className="flex items-start space-x-2">
                  <div className="w-1 h-6 shrink-0 rounded-full" style={{ backgroundColor: cat?.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-gray-800 truncate">{e.title}</div>
                    <div className="text-[9px] font-medium text-gray-400">
                      {e.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-gray-200" />
        </div>
      )}
    </div>
  );
};

export default YearView;
