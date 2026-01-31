
import React from 'react';
import { CalendarEvent, CalendarCategory } from '../types';

interface MonthViewProps {
  events: CalendarEvent[];
  categories: CalendarCategory[];
  currentDate: Date;
  onSelectTimeRange: (start: Date, end: Date, x: number, y: number) => void;
  onDeleteEvent: (id: string) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ events, categories, currentDate, onSelectTimeRange, onDeleteEvent }) => {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
  const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => prevMonthLastDay - firstDayOfMonth + i + 1);
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalCells = 42;
  const nextMonthDays = Array.from({ length: totalCells - prevMonthDays.length - currentMonthDays.length }, (_, i) => i + 1);

  const visibleCategories = categories.filter(c => c.checked).map(c => c.id);

  const getEventsForDay = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return [];
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
    return events.filter(e => visibleCategories.includes(e.categoryId) && e.startTime.toDateString() === dateStr);
  };

  const handleDoubleClick = (e: React.MouseEvent, day: number) => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 9, 0);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 10, 0);
    onSelectTimeRange(start, end, e.clientX, e.clientY);
  };

  const handleEventContextMenu = (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    onDeleteEvent(eventId);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none">
       <div className="px-6 py-6 border-b border-gray-100 bg-white">
        <h1 className="text-[32px] font-bold text-gray-800 tracking-tight">
          {currentDate.toLocaleDateString('en-US', { month: 'long' })} <span className="text-gray-400 font-normal">{currentDate.getFullYear()}</span>
        </h1>
      </div>
      
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/20">
        {weekDays.map(day => (
          <div key={day} className="py-1 text-center text-[10px] font-black text-gray-400 tracking-widest">{day}</div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {prevMonthDays.map(d => (
          <div key={`p-${d}`} className="border-r border-b border-gray-50 p-1 text-gray-300 text-[11px] text-right pr-2">
            {d}
          </div>
        ))}
        {currentMonthDays.map(d => {
          const dayEvents = getEventsForDay(d, true);
          const isToday = d === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();
          return (
            <div 
              key={`c-${d}`} 
              onDoubleClick={(e) => handleDoubleClick(e, d)}
              className="border-r border-b border-gray-50 p-1 overflow-hidden group hover:bg-gray-50/50 transition-colors cursor-default"
            >
              <div className={`text-[11px] text-right pr-2 font-bold mb-1 ${isToday ? 'text-red-500' : 'text-gray-500 group-hover:text-gray-900'}`}>
                {isToday ? <span className="bg-red-500 text-white rounded-full px-1.5 py-0.5 shadow-sm inline-block">{d}</span> : d}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 4).map(e => {
                  const cat = categories.find(c => c.id === e.categoryId);
                  return (
                    <div 
                      key={e.id} 
                      className="text-[9px] px-1.5 py-0.5 rounded flex items-center space-x-1 truncate font-bold text-white shadow-sm cursor-pointer"
                      style={{ backgroundColor: cat?.color }}
                      onContextMenu={(ev) => handleEventContextMenu(ev, e.id)}
                    >
                      <span>{e.isReminder ? '•' : ''}</span>
                      <span className="truncate">{e.title}</span>
                    </div>
                  );
                })}
                {dayEvents.length > 4 && <div className="text-[9px] font-bold text-gray-400 pl-1">+{dayEvents.length - 4} more</div>}
              </div>
            </div>
          );
        })}
        {nextMonthDays.map(d => (
          <div key={`n-${d}`} className="border-r border-b border-gray-50 p-1 text-gray-200 text-[11px] text-right pr-2">
            {d}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthView;
