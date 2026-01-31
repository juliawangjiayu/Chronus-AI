
import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Plus, User, Settings, LogOut, UserCircle2 } from 'lucide-react';
import { CalendarView } from '../types';

interface HeaderProps {
  currentDate: Date;
  view: CalendarView;
  setView: (view: CalendarView) => void;
  onAddEvent: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onToday: () => void;
}

const CalendarHeader: React.FC<HeaderProps> = ({ currentDate, view, setView, onAddEvent, onNavigate, onToday }) => {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="h-12 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 shrink-0 select-none z-50">
      <div className="flex items-center space-x-4">
        <div className="flex items-center bg-gray-100/60 rounded-lg p-0.5 border border-gray-200/50 shadow-sm">
          <button 
            onClick={onAddEvent}
            className="p-1 px-2 text-blue-600 hover:bg-white hover:shadow-sm rounded-md transition-all active:scale-95"
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="flex items-center bg-gray-100/60 rounded-lg p-1 border border-gray-200/40">
        {(['Day', 'Week', 'Month', 'Year'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-0.5 text-[11px] font-black tracking-tight rounded-md transition-all duration-200 ${
              view === v 
              ? 'bg-white shadow-sm text-gray-900 ring-1 ring-black/5' 
              : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center bg-gray-100/60 rounded-lg p-0.5 border border-gray-200/40">
          <button 
            onClick={() => onNavigate('prev')} 
            className="p-1 text-gray-400 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={onToday}
            className="px-3 py-0.5 text-[10px] font-black text-gray-700 border-x border-gray-200 uppercase tracking-widest hover:bg-white/50 transition-colors"
          >
            Today
          </button>
          <button 
            onClick={() => onNavigate('next')} 
            className="p-1 text-gray-400 hover:text-gray-800 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
            <input 
              type="text" 
              placeholder="Search" 
              className="pl-8 pr-3 py-1.5 bg-gray-100/60 border border-gray-200/40 rounded-lg text-[11px] font-medium w-40 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 focus:bg-white transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowProfile(!showProfile)}
              className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 border border-gray-300/50 shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
              <UserCircle2 size={24} className="text-gray-500" />
            </button>

            {showProfile && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowProfile(false)} 
                />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="text-[12px] font-black text-gray-900 truncate">Isha Chronos</p>
                    <p className="text-[10px] font-medium text-gray-500 truncate">isha.c1x@gmail.com</p>
                  </div>
                  <button className="w-full flex items-center px-4 py-2 text-[12px] text-gray-700 hover:bg-blue-600 hover:text-white transition-colors">
                    <User size={14} className="mr-3" /> Switch Account
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-[12px] text-gray-700 hover:bg-blue-600 hover:text-white transition-colors">
                    <Settings size={14} className="mr-3" /> Preferences...
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  <button className="w-full flex items-center px-4 py-2 text-[12px] text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                    <LogOut size={14} className="mr-3" /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default CalendarHeader;
