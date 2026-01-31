
import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, AlignLeft, Bell } from 'lucide-react';
import { CalendarEvent, CalendarCategory, ReminderOffset } from '../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  categories: CalendarCategory[];
  initialRange?: { start: Date; end: Date } | null;
  initialDate?: Date;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, categories, initialRange, initialDate }) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [allDay, setAllDay] = useState(false);
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [reminder, setReminder] = useState<ReminderOffset>('none');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialRange) {
        setStartTime(new Date(initialRange.start));
        setEndTime(new Date(initialRange.end));
      } else {
        const baseDate = initialDate || new Date();
        const start = new Date(baseDate);
        if (!initialDate) start.setMinutes(0, 0, 0); // Round to hour if current time
        setStartTime(start);
        setEndTime(new Date(start.getTime() + 60 * 60 * 1000));
      }
      setCategoryId(categories[0]?.id || '');
    }
  }, [isOpen, initialRange, initialDate, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title || 'New Event',
      location,
      startTime,
      endTime,
      allDay,
      categoryId,
      reminder,
      notes
    });
    onClose();
    // Reset form
    setTitle('');
    setLocation('');
    setNotes('');
  };

  // Helper to format Date for input[type="datetime-local"]
  const formatDateForInput = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-[420px] overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest">New Event</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <input
              autoFocus
              className="w-full text-2xl font-bold border-none focus:ring-0 placeholder-gray-200 p-0 text-gray-800"
              placeholder="Event Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />

            <div className="flex items-center space-x-4 text-gray-400">
              <div className="bg-gray-50 p-2 rounded-lg"><MapPin size={18} /></div>
              <input
                className="flex-1 text-[13px] font-medium border-none focus:ring-0 placeholder-gray-300 p-0 bg-transparent"
                placeholder="Add Location"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-gray-500">
                  <div className="bg-gray-50 p-2 rounded-lg"><Clock size={18} /></div>
                  <span className="text-[13px] font-bold">All-day</span>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allDay}
                    onChange={e => setAllDay(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
              </div>

              {!allDay && (
                <div className="pl-12 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Starts</span>
                    <input
                      type="datetime-local"
                      className="text-[12px] font-bold border-gray-100 rounded-lg py-1.5 px-3 bg-gray-50/50 hover:bg-gray-100 transition-colors cursor-pointer"
                      value={formatDateForInput(startTime)}
                      onChange={e => setStartTime(new Date(e.target.value))}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Ends</span>
                    <input
                      type="datetime-local"
                      className="text-[12px] font-bold border-gray-100 rounded-lg py-1.5 px-3 bg-gray-50/50 hover:bg-gray-100 transition-colors cursor-pointer"
                      value={formatDateForInput(endTime)}
                      onChange={e => setEndTime(new Date(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
               <div className="bg-gray-50 p-2 rounded-lg flex items-center justify-center">
                 <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: categories.find(c => c.id === categoryId)?.color }} />
               </div>
              <select
                className="flex-1 text-[13px] font-bold border-none focus:ring-0 p-0 text-gray-700 bg-transparent cursor-pointer"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-4 text-gray-500">
              <div className="bg-gray-50 p-2 rounded-lg"><Bell size={18} /></div>
              <select
                className="flex-1 text-[13px] font-bold border-none focus:ring-0 p-0 text-gray-700 bg-transparent cursor-pointer"
                value={reminder}
                onChange={e => setReminder(e.target.value as ReminderOffset)}
              >
                <option value="none">No Reminder</option>
                <option value="at-time">At time of event</option>
                <option value="5-min">5 minutes before</option>
                <option value="10-min">10 minutes before</option>
                <option value="30-min">30 minutes before</option>
                <option value="1-hour">1 hour before</option>
                <option value="1-day">1 day before</option>
              </select>
            </div>

            <div className="flex items-start space-x-4 text-gray-400">
              <div className="bg-gray-50 p-2 rounded-lg mt-1"><AlignLeft size={18} /></div>
              <textarea
                className="flex-1 text-[13px] font-medium border-none focus:ring-0 placeholder-gray-300 p-0 pt-2 resize-none min-h-[80px] bg-transparent"
                placeholder="Add Notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50/30">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              Save Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
