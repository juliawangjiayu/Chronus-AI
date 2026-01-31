import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Mode, Task } from '../types';
import { Send, ListTodo, GraduationCap, Flag, Plus, Loader2 } from 'lucide-react';
import { aiService } from '../services/aiService';
import clsx from 'clsx';

const modes: { id: Mode; label: string; icon: React.ElementType }[] = [
  { id: 'todo', label: 'Todo', icon: ListTodo },
  { id: 'study', label: 'Study', icon: GraduationCap },
  { id: 'final', label: 'Final', icon: Flag },
];

export const Sidebar: React.FC = () => {
  const { 
    currentMode, setMode, 
    messages, addMessage, 
    draftTasks, commitDraftTask, addDraftTask 
  } = useStore();
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input;
    setInput('');
    addMessage('user', userMsg);
    setIsLoading(true);

    try {
      // Call AI Service
      const { reply, suggestions } = await aiService.chat(userMsg, currentMode);
      addMessage('assistant', reply);
      suggestions.forEach(s => addDraftTask(s));
    } catch (error) {
      addMessage('assistant', 'Sorry, I encountered an error connecting to the server. Please ensure the backend is running.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = (task: Task) => {
    // Default to committing to the next available hour (simplified for now)
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    commitDraftTask(task.id, nextHour);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-80 shadow-sm">
      {/* Mode Switcher */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setMode(mode.id)}
              className={clsx(
                "flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all",
                currentMode === mode.id 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <mode.icon className="w-4 h-4 mr-2" />
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              "flex flex-col max-w-[85%] rounded-lg p-3 text-sm",
              msg.role === 'user' 
                ? "self-end bg-primary text-white ml-auto" 
                : "self-start bg-slate-100 text-slate-800"
            )}
          >
            <p>{msg.content}</p>
            <span className={clsx("text-xs mt-1 opacity-70", msg.role === 'user' ? "text-blue-100" : "text-slate-400")}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="self-start bg-slate-50 p-3 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary hover:bg-blue-50 rounded-full disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Draft Slot */}
      <div className="h-1/3 border-t border-slate-200 flex flex-col">
        <div className="p-3 bg-slate-50 border-b border-slate-100 font-medium text-xs text-slate-500 uppercase tracking-wider flex justify-between items-center">
          <span>Draft Suggestions</span>
          <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{draftTasks.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
          {draftTasks.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-8">
              No pending tasks.<br/>Ask AI to suggest a plan.
            </div>
          ) : (
            draftTasks.map((task) => (
              <div key={task.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-slate-800 text-sm">{task.name}</h4>
                  <span className={clsx(
                    "text-[10px] px-1.5 py-0.5 rounded border uppercase",
                    task.priority === 'high' ? "bg-red-50 text-red-600 border-red-100" :
                    task.priority === 'medium' ? "bg-orange-50 text-orange-600 border-orange-100" :
                    "bg-blue-50 text-blue-600 border-blue-100"
                  )}>{task.priority}</span>
                </div>
                <div className="flex items-center text-xs text-slate-500 mb-2 space-x-2">
                  <span>{task.duration} min</span>
                  <span>•</span>
                  <span className="capitalize">{task.mode}</span>
                </div>
                {task.reason && (
                  <p className="text-xs text-slate-500 mb-2 italic">"{task.reason}"</p>
                )}
                <button
                  onClick={() => handleCommit(task)}
                  className="w-full py-1.5 bg-slate-900 text-white text-xs rounded hover:bg-slate-800 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Commit to Calendar
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
