
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CalendarHeader from './components/CalendarHeader';
import CreationPopover from './components/CreationPopover';
import EventModal from './components/EventModal';
import WeekView from './components/WeekView';
import MonthView from './components/MonthView';
import YearView from './components/YearView';
import DayView from './components/DayView';
import { CalendarEvent, CalendarCategory, CalendarView, PopoverConfig, SelectionRange, AIMode, Todo } from './types';
import { DEFAULT_CATEGORIES, MOCK_EVENTS } from './constants';

import { todoService } from './services/todoService';

const App: React.FC = () => {
  // State
  const [categories, setCategories] = useState<CalendarCategory[]>(() => {
    const saved = localStorage.getItem('calendar_cats');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });
  
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('calendar_events');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((e: any) => ({
        ...e,
        startTime: new Date(e.startTime),
        endTime: new Date(e.endTime)
      }));
    }
    return MOCK_EVENTS;
  });

  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const data = await todoService.getAllTodos();
        setTodos(data);
      } catch (error) {
        console.error('Failed to fetch todos:', error);
      }
    };
    fetchTodos();
  }, []);

  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 31)); // Mock Start Date
  const [view, setView] = useState<CalendarView>('Week');
  const [isAIActive, setIsAIActive] = useState(false);
  const [popover, setPopover] = useState<PopoverConfig | null>(null);
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // AI State
  const [aiMode, setAiMode] = useState<AIMode>('Todo');

  useEffect(() => {
    localStorage.setItem('calendar_cats', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('calendar_events', JSON.stringify(events));
  }, [events]);

  const handleSelectTimeRange = (start: Date, end: Date, x?: number, y?: number, dayIndex?: number) => {
    setSelectionRange({ start, end, dayIndex });
    // If x/y provided (from click/drag), show popover
    if (x !== undefined && y !== undefined) {
      setPopover({ x, y, start, end, type: 'Event' });
    } else {
      // If just logical selection, open modal directly? Or just set range.
      setIsModalOpen(true);
    }
  };

  const handleAddEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: Date.now().toString(),
    };
    setEvents([...events, newEvent]);
    setPopover(null);
    setSelectionRange(null);
    setIsModalOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter(e => e.id !== id));
    }
  };

  const handleDeleteCalendar = (id: string) => {
    if (confirm('Are you sure you want to delete this calendar?')) {
      setCategories(categories.filter(c => c.id !== id));
      setEvents(events.filter(e => e.categoryId !== id));
    }
  };

  const handleAddCalendar = () => {
    const name = prompt('Enter calendar name:');
    if (name) {
      const newCat: CalendarCategory = {
        id: Date.now().toString(),
        name,
        color: '#8e8e93',
        checked: true,
        group: 'Other'
      };
      setCategories([...categories, newCat]);
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'Day') newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    if (view === 'Week') newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    if (view === 'Month') newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    if (view === 'Year') newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const handleAddTodo = async (todoData: { title: string; priority?: 'high' | 'medium' | 'low'; description?: string; scheduledDate?: Date }) => {
    try {
      const newTodo = await todoService.createTodo({
        title: todoData.title,
        description: todoData.description,
        priority: todoData.priority || 'medium',
        scheduledDate: todoData.scheduledDate,
        status: 'pending'
      });
      setTodos(prev => [newTodo, ...prev]);
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const handleToggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    // Optimistic update
    setTodos(todos.map(t => t.id === id ? { ...t, status: newStatus } : t));
    
    try {
      await todoService.updateTodo(id, { status: newStatus });
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      // Revert on error
      setTodos(todos.map(t => t.id === id ? { ...t, status: todo.status } : t));
    }
  };

  const handleDeleteTodo = async (id: string) => {
    const originalTodos = [...todos];
    setTodos(todos.filter(t => t.id !== id));
    
    try {
      await todoService.deleteTodo(id);
    } catch (error) {
      console.error('Failed to delete todo:', error);
      setTodos(originalTodos);
    }
  };

  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden">
      <Sidebar 
        categories={categories}
        onToggleCategory={id => setCategories(cats => cats.map(c => c.id === id ? { ...c, checked: !c.checked } : c))}
        onUpdateColor={(id, color) => setCategories(cats => cats.map(c => c.id === id ? { ...c, color } : c))}
        onOpenAI={() => setIsAIActive(!isAIActive)}
        isAIActive={isAIActive}
        onAddCalendar={handleAddCalendar}
        onDeleteCalendar={handleDeleteCalendar}
        onDateClick={setCurrentDate}
        events={events}
        aiMode={aiMode}
        setAiMode={setAiMode}
        onProposeEvents={(proposed) => proposed.forEach(p => handleAddEvent(p))}
        onCommitEvent={() => {}}
        currentDate={currentDate}
        todos={todos}
        onAddTodo={handleAddTodo}
        onToggleTodo={handleToggleTodo}
        onDeleteTodo={handleDeleteTodo}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        <CalendarHeader 
          currentDate={currentDate}
          view={view}
          setView={setView}
          onAddEvent={() => setIsModalOpen(true)}
          onNavigate={handleNavigate}
          onToday={() => setCurrentDate(new Date())}
        />

        <div className="flex-1 overflow-hidden relative z-0">
          {view === 'Week' && (
            <WeekView 
              events={events} 
              categories={categories} 
              currentDate={currentDate} 
              onSelectTimeRange={handleSelectTimeRange}
              onNavigate={handleNavigate}
              onToday={() => setCurrentDate(new Date())}
              selectionRange={selectionRange}
              onDeleteEvent={handleDeleteEvent}
            />
          )}
          {view === 'Day' && (
            <DayView 
              events={events} 
              categories={categories} 
              currentDate={currentDate} 
              onSelectTimeRange={handleSelectTimeRange}
              selectionRange={selectionRange}
              onDeleteEvent={handleDeleteEvent}
            />
          )}
          {view === 'Month' && (
            <MonthView 
              events={events} 
              categories={categories} 
              currentDate={currentDate} 
              onSelectTimeRange={handleSelectTimeRange}
              onDeleteEvent={handleDeleteEvent}
            />
          )}
          {view === 'Year' && (
            <YearView 
              events={events} 
              categories={categories} 
              currentDate={currentDate} 
            />
          )}
        </div>

        {/* Floating Components */}
        {popover && (
          <>
            <div className="fixed inset-0 z-[999]" onClick={() => { setPopover(null); setSelectionRange(null); }} />
            <CreationPopover 
              config={popover} 
              categories={categories}
              onClose={() => { setPopover(null); setSelectionRange(null); }}
              onSave={handleAddEvent}
            />
          </>
        )}

        <EventModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleAddEvent}
          categories={categories}
          initialRange={selectionRange ? { start: selectionRange.start, end: selectionRange.end } : null}
          initialDate={currentDate}
        />
      </div>
    </div>
  );
};

export default App;
