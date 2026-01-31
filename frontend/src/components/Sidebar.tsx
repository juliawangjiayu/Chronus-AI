
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CalendarCategory, CalendarEvent, AIMode, ChatMessage, AIView, AiSuggestion, Todo } from '../types';
import { ChevronDown, Plus, Sparkles, Inbox, Calendar as CalendarIcon, Info, Share, Trash2, Send, Zap, MessageSquare, AlertCircle, Clock, Loader2, LayoutDashboard, CheckSquare } from 'lucide-react';
import { aiService } from '../services/aiService';
import TodoView from './TodoView';

interface SidebarProps {
  categories: CalendarCategory[];
  onToggleCategory: (id: string) => void;
  onUpdateColor: (id: string, color: string) => void;
  onOpenAI: () => void;
  isAIActive: boolean;
  onAddCalendar: () => void;
  onDeleteCalendar: (id: string) => void;
  onDateClick: (date: Date) => void;
  // Agent props
  events: CalendarEvent[];
  aiMode: AIMode;
  setAiMode: (m: AIMode) => void;
  onProposeEvents: (e: Omit<CalendarEvent, 'id'>[]) => void;
  onCommitEvent: (id: string) => void;
  currentDate: Date;
  // Todo props
  todos?: Todo[];
  onAddTodo?: (todoData: { title: string; priority?: 'high' | 'medium' | 'low'; description?: string; scheduledDate?: Date }) => void;
  onToggleTodo?: (id: string) => void;
  onDeleteTodo?: (id: string) => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  catId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  categories, 
  onToggleCategory, 
  onUpdateColor,
  onOpenAI, 
  isAIActive, 
  onAddCalendar,
  onDeleteCalendar,
  onDateClick,
  events,
  aiMode,
  setAiMode,
  onProposeEvents,
  onCommitEvent,
  currentDate,
  todos = [],
  onAddTodo = () => {},
  onToggleTodo = () => {},
  onDeleteTodo = () => {}
}) => {
  const groups = ['Google', 'iCloud', 'Other'] as const;
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ x: 0, y: 0, catId: null });
  const [aiView, setAiView] = useState<AIView>('Chat');
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chronus-chat-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert string timestamps back to Date objects
        const hydrated = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(hydrated);
      }
    } catch (e) {
      console.error('Failed to load chat history', e);
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chronus-chat-history', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages, isLoading, aiView]);

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, catId: id });
  };

  const closeContextMenu = () => setContextMenu({ x: 0, y: 0, catId: null });

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleSend = async (text?: string) => {
    const prompt = text || input;
    if (!prompt.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: prompt, timestamp: new Date(), id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      // Call the AI Service which now calls the backend
      const { reply, suggestions } = await aiService.generateScheduleResponse(prompt, events, history, aiMode);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: reply, 
        timestamp: new Date(),
        id: (Date.now() + 1).toString()
      }]);

      // If there are suggestions, convert them to CalendarEvent format and propose
          if (suggestions && suggestions.length > 0) {
            const today = new Date();
            const proposedEvents = suggestions.map(s => {
              // Simplistic scheduling logic: find next available slot or just place it at a default time
              // For now, we'll place them at the next hour, or just ask the user to drag them (if we implemented that)
              // Since the suggestion doesn't strictly have a start/end time from the backend (it has duration),
              // we might need to rely on the backend's "reply" to know when it was scheduled, 
              // OR we can default to "tomorrow 9am" + offset.
              // However, the backend model `AiSuggestion` has duration.
              // Let's mock a start time for now or use the current date + 1 hour.
              
              let start = new Date();
              if (s.scheduledDate) {
                  start = new Date(s.scheduledDate);
              } else {
                  start.setHours(start.getHours() + 1, 0, 0, 0);
              }

              const end = new Date(start.getTime() + s.duration * 60000);
              
              return {
                title: s.name,
                startTime: start, // Ideally the AI should suggest a time, but the current backend model is limited.
                endTime: end,
            allDay: false,
            categoryId: categories[0].id,
            reminder: 'none',
            notes: s.reason,
            isGhost: true
          } as Omit<CalendarEvent, 'id'>;
        });
        
        onProposeEvents(proposedEvents);
      }

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Failed to connect to agent. Please ensure the backend is running.", 
        timestamp: new Date(),
        id: (Date.now() + 1).toString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    return events
      .filter(e => e.startTime >= now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, 5);
  }, [events]);

  const COLORS = ['#FF2D55', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#AF52DE', '#A2845E'];

  return (
    <aside className="w-64 mac-sidebar flex flex-col h-full overflow-hidden select-none border-r border-gray-200">
      <div className="h-12 border-b border-gray-200 flex items-center px-4 space-x-1 shrink-0 bg-white/60">
        <button 
          onClick={() => isAIActive && onOpenAI()}
          className={`p-1.5 rounded-lg transition-all ${!isAIActive ? 'bg-gray-200 shadow-sm text-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}
        >
          <CalendarIcon size={16} />
        </button>
        <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-all">
          <Inbox size={16} />
        </button>
        <button 
          onClick={onOpenAI}
          className={`p-1.5 rounded-lg transition-all ${isAIActive ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-700/50' : 'text-gray-400 hover:bg-gray-100'}`}
        >
          <Sparkles size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {isAIActive ? (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="p-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">AI</span>
                <div className="h-3 w-px bg-gray-200" />
                <div className="flex bg-gray-200/50 p-0.5 rounded-md">
                   <button 
                    onClick={() => setAiView('Chat')}
                    className={`p-1 rounded transition-all ${aiView === 'Chat' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                   >
                     <MessageSquare size={10} />
                   </button>
                   <button 
                    onClick={() => setAiView('Insight')}
                    className={`p-1 rounded transition-all ${aiView === 'Insight' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                   >
                     <LayoutDashboard size={10} />
                   </button>
                   <button 
                    onClick={() => setAiView('Todo')}
                    className={`p-1 rounded transition-all ${aiView === 'Todo' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                   >
                     <CheckSquare size={10} />
                   </button>
                </div>
              </div>
              <div className="flex space-x-1">
                {(['Todo', 'Study', 'Final'] as AIMode[]).map(m => (
                  <button 
                    key={m}
                    onClick={() => {
                      setAiMode(m);
                      if (m === 'Todo') setAiView('Todo');
                    }}
                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all ${aiMode === m ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            
            {aiView === 'Chat' ? (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/20">
                  {messages.length === 0 && (
                    <div className="text-center py-10 opacity-30 flex flex-col items-center">
                      <Sparkles size={32} className="mb-2 text-blue-500" />
                      <p className="text-[11px] font-bold uppercase tracking-widest">Ask me to schedule tasks...</p>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-2.5 rounded-2xl text-[12px] shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white font-medium' : 'bg-white border border-gray-200 text-gray-800'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center space-x-2 text-gray-400 animate-pulse">
                      <Loader2 size={12} className="animate-spin" />
                      <span className="text-[10px] font-bold">Thinking...</span>
                    </div>
                  )}
                </div>

              </div>
            ) : aiView === 'Todo' ? (
              <div className="flex-1 flex flex-col overflow-hidden bg-white">
                <TodoView 
                  todos={todos}
                  onAddTodo={onAddTodo}
                  onToggleTodo={onToggleTodo}
                  onDeleteTodo={onDeleteTodo}
                />
              </div>
            ) : (
              /* AI Insight View - DDL / Daily Report */
              <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/30 custom-scrollbar">
                <section>
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertCircle size={14} className="text-red-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Upcoming Deadlines</h3>
                  </div>
                  <div className="space-y-2">
                    {upcomingDeadlines.length > 0 ? upcomingDeadlines.map(e => (
                      <div key={e.id} className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-3">
                        <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: categories.find(c => c.id === e.categoryId)?.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-gray-800 truncate">{e.title}</p>
                          <p className="text-[9px] font-medium text-gray-400">{e.startTime.toLocaleDateString()} {e.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-[10px] text-gray-400 italic">No upcoming deadlines detected.</p>
                    )}
                  </div>
                </section>

                <section>
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock size={14} className="text-blue-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">AI Daily Report</h3>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                    <p className="text-[11px] leading-relaxed text-gray-600 font-medium">
                      Good morning! Based on your schedule for today, you have <span className="text-blue-600 font-bold">{events.filter(e => e.startTime.toDateString() === new Date().toDateString()).length}</span> commitments.
                    </p>
                    <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100/50">
                      <p className="text-[10px] font-bold text-blue-700 mb-1 flex items-center">
                        <Zap size={10} className="mr-1" /> Productivity Insight
                      </p>
                      <p className="text-[10px] text-blue-600/80 leading-normal">
                        You have a large gap between 2 PM and 4 PM. In <span className="font-bold">{aiMode}</span> mode, I recommend starting your deep work early.
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-400 italic">Report generated at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </section>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-2 pt-4 space-y-8 scroll-smooth pb-4 animate-in fade-in duration-200">
            {groups.map(group => {
              const groupCats = categories.filter(c => c.group === group);
              if (groupCats.length === 0 && group !== 'iCloud') return null;
              
              return (
                <div key={group}>
                  <div className="flex items-center justify-between px-3 mb-2 group/header cursor-default">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">{group}</span>
                    {group === 'iCloud' && (
                      <button onClick={onAddCalendar} className="text-gray-400 hover:text-blue-500 transition-colors">
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                  <ul className="space-y-[2px]">
                    {groupCats.map(cat => (
                      <li 
                        key={cat.id} 
                        onContextMenu={(e) => handleContextMenu(e, cat.id)}
                        className="flex items-center px-3 py-1.5 hover:bg-gray-200/60 rounded-lg group cursor-pointer transition-colors"
                      >
                        <div 
                          className="relative flex items-center justify-center mr-3" 
                          onClick={() => onToggleCategory(cat.id)}
                        >
                          <div 
                            className={`w-3.5 h-3.5 border rounded-[3px] transition-all flex items-center justify-center`}
                            style={{ 
                              backgroundColor: cat.checked ? cat.color : 'transparent', 
                              borderColor: cat.checked ? cat.color : '#D1D5DB' 
                            }}
                          >
                            {cat.checked && <span className="text-white text-[9px] font-bold">✓</span>}
                          </div>
                        </div>
                        <span 
                          className="text-[13px] text-gray-700 font-medium truncate flex-1"
                          onClick={() => onToggleCategory(cat.id)}
                        >
                          {cat.name}
                        </span>
                        <button className="p-0.5 hover:bg-gray-300 rounded opacity-0 group-hover:opacity-100 transition-all">
                          <ChevronDown size={12} className="text-gray-400" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {contextMenu.catId && (
        <div 
          className="fixed z-[100] bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl shadow-2xl py-1 w-48 animate-in fade-in zoom-in-95 duration-75"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="w-full flex items-center px-3 py-1.5 text-[13px] text-gray-700 hover:bg-blue-600 hover:text-white transition-colors">
            <Info size={14} className="mr-2" /> Get Info
          </button>
          <button className="w-full flex items-center px-3 py-1.5 text-[13px] text-gray-700 hover:bg-blue-600 hover:text-white transition-colors">
            <Share size={14} className="mr-2" /> Share Calendar...
          </button>
          <div className="h-px bg-gray-100 my-1" />
          <button 
            onClick={() => { onDeleteCalendar(contextMenu.catId!); closeContextMenu(); }}
            className="w-full flex items-center px-3 py-1.5 text-[13px] text-red-500 hover:bg-red-500 hover:text-white transition-colors"
          >
            <Trash2 size={14} className="mr-2" /> Delete
          </button>
          <div className="h-px bg-gray-100 my-1" />
          <div className="px-3 py-2 flex justify-between">
            {COLORS.map(c => (
              <button 
                key={c}
                onClick={() => { onUpdateColor(contextMenu.catId!, c); closeContextMenu(); }}
                className="w-4 h-4 rounded-full shadow-sm hover:scale-125 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}

      {isAIActive && aiView === 'Chat' && (
        <div className="p-3 border-t border-gray-200 bg-white shrink-0">
          <div className="relative">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={`Plan in ${aiMode}...`}
              className="w-full bg-gray-100/60 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-30 transition-all shadow-md shadow-blue-500/20"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="p-4 bg-gray-50/80 border-t border-gray-200 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black text-gray-800 tracking-tight uppercase">January 2026</span>
        </div>
        <div className="grid grid-cols-7 gap-y-2 text-center text-[9px] font-bold tracking-tighter">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <span key={i} className="text-gray-400">{d}</span>
          ))}
          {Array.from({length: 31}).map((_, i) => {
            const dateValue = i + 1;
            const isToday = dateValue === 31;
            const isSelected = currentDate.getDate() === dateValue && currentDate.getMonth() === 0;
            
            return (
              <button 
                key={i} 
                onClick={() => onDateClick(new Date(2026, 0, dateValue))}
                className={`py-1 w-6 h-6 flex items-center justify-center mx-auto rounded-full transition-all active:scale-90 ${
                  isToday 
                  ? (isSelected ? 'bg-red-500 text-white font-black ring-2 ring-red-200' : 'bg-red-500 text-white font-black shadow-sm')
                  : isSelected
                    ? 'bg-blue-600 text-white font-black shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                }`}
              >
                {dateValue}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
