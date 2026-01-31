
import React, { useEffect, useRef, useState } from 'react';
import { CalendarCategory, CalendarEvent, PopoverConfig, ReminderOffset } from '../types';
import { MapPin, Video, Users, Paperclip, ChevronDown } from 'lucide-react';

interface CreationPopoverProps {
  config: PopoverConfig;
  categories: CalendarCategory[];
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
}

const CreationPopover: React.FC<CreationPopoverProps> = ({ config, categories, onClose, onSave }) => {
  const [type, setType] = useState<'Event' | 'Reminder'>(config.type);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [notes, setNotes] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Define handleSubmit so it can be called from the click-outside handler
  const handleSubmit = () => {
    onSave({
      title: title.trim() || 'New Event',
      location,
      startTime: config.start,
      endTime: config.end,
      allDay: false,
      categoryId,
      reminder: 'none',
      notes,
      isReminder: type === 'Reminder'
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        // If the user clicks outside, we treat it as "Done" with default values
        handleSubmit();
      }
    };
    
    // Use mousedown to catch the click before other grid interactions might happen
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [title, location, categoryId, notes, type, config]); // Re-bind when state changes to ensure handleSubmit has latest values

  const selectedCat = categories.find(c => c.id === categoryId);

  // Position logic - aim to place to the right of the click if space permits, or adjust
  // The 'config.x' is the click position. We want the arrow to point there.
  // So the popover left should be x + arrow_width
  const arrowWidth = 12;
  const popoverWidth = 360;
  
  let left = config.x + arrowWidth;
  let top = config.y - 60; // Center arrow roughly or align top?
  
  // Adjust if goes off screen
  if (left + popoverWidth > window.innerWidth) {
     left = config.x - popoverWidth - arrowWidth; // Place to left if no space
  }
  
  top = Math.max(10, Math.min(top, window.innerHeight - 450));

  return (
    <div 
      ref={popoverRef}
      className="fixed z-[1000] w-[360px] bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 animate-in fade-in zoom-in-95 duration-150 font-sans"
      style={{ top: `${top}px`, left: `${left}px` }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Popover Arrow */}
      <div 
        className="absolute w-4 h-4 bg-white/95 border-l border-b border-gray-200/50 transform rotate-45"
        style={{ 
          top: '68px', // Align with the title area roughly
          left: left > config.x ? '-9px' : 'auto', 
          right: left < config.x ? '-9px' : 'auto',
          backgroundColor: 'inherit'
        }} 
      />

      {/* Segmented Control */}
      <div className="p-3 pb-2 flex justify-center">
        <div className="bg-gray-200/50 p-0.5 rounded-lg flex w-full">
          <button 
            onClick={() => setType('Event')}
            className={`flex-1 py-0.5 text-[13px] font-medium rounded-md transition-all ${type === 'Event' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Event
          </button>
          <button 
            onClick={() => setType('Reminder')}
            className={`flex-1 py-0.5 text-[13px] font-medium rounded-md transition-all ${type === 'Reminder' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Reminder
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-0">
        {/* Title & Category Dot */}
        <div className="flex items-start space-x-3 pt-2 pb-3">
          <div className="flex-1">
             <input 
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="New Event"
              className="w-full text-[19px] font-semibold text-gray-700 border-none focus:ring-0 placeholder-gray-400/80 p-0 bg-transparent leading-tight"
            />
            <div className="flex items-center mt-1 text-gray-400 group cursor-text">
                <input 
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Add Location or Video Call"
                    className="flex-1 text-[13px] border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400/80"
                />
                <Video size={14} className="ml-2 text-gray-400" />
            </div>
          </div>
          
          <div className="shrink-0 pt-1">
             <div 
              className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-gray-100/50 border border-gray-200/50 cursor-pointer hover:bg-gray-100 transition-colors"
            >
               <div 
                 className="w-3 h-3 rounded-[2px]" 
                 style={{ backgroundColor: selectedCat?.color || '#3b82f6' }}
               />
               <div className="flex flex-col -space-y-1">
                 <ChevronDown size={10} className="rotate-180 text-gray-500" />
                 <ChevronDown size={10} className="text-gray-500" />
               </div>
             </div>
          </div>
        </div>

        <div className="h-px bg-gray-200/50 w-full" />

        {/* Date / Time Info */}
        <div className="py-2 space-y-0.5">
          <div className="text-[13px] text-gray-800 font-medium">
            {config.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            <span className="mx-2 text-gray-300">|</span>
            {config.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} to {config.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </div>
          <input 
            placeholder="Add Alert, Repeat, or Travel Time"
            className="w-full text-[13px] text-gray-500 border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400/80"
            readOnly
          />
        </div>

        <div className="h-px bg-gray-200/50 w-full" />

        {/* Invitees */}
        <div className="py-2">
           <input 
            placeholder="Add Invitees"
            className="w-full text-[13px] text-gray-500 border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400/80"
            readOnly
          />
        </div>

        <div className="h-px bg-gray-200/50 w-full" />

        {/* Notes / URL / Attachments */}
        <div className="pt-2">
          <textarea 
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add Notes, URL, or Attachments"
            className="w-full text-[13px] text-gray-600 border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400/80 resize-none min-h-[24px] overflow-hidden"
            rows={1}
          />
        </div>
      </div>
    </div>
  );
};

export default CreationPopover;
