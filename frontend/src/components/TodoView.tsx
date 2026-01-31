import React, { useState } from 'react';
import { Todo } from '../types';
import { Check, Trash2, Plus, Calendar as CalendarIcon, PieChart, X, ChevronDown, ChevronUp, AlertCircle, AlignLeft } from 'lucide-react';
import { format } from 'date-fns';

interface TodoViewProps {
  todos: Todo[];
  onAddTodo: (todoData: { title: string; priority?: 'high' | 'medium' | 'low'; description?: string; scheduledDate?: Date }) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
}

const TodoView: React.FC<TodoViewProps> = ({ todos, onAddTodo, onToggleTodo, onDeleteTodo }) => {
  const [newTodo, setNewTodo] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [showStats, setShowStats] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      onAddTodo({
        title: newTodo.trim(),
        description: description.trim() || undefined,
        priority,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined
      });
      setNewTodo('');
      setDescription('');
      setPriority('medium');
      setScheduledDate('');
      setIsExpanded(false);
    }
  };

  const sortedTodos = [...todos].sort((a, b) => {
    // First by status (pending first)
    if (a.status !== b.status) {
      return a.status === 'completed' ? 1 : -1;
    }
    // Then by priority (high > medium > low)
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    const pA = priorityWeight[a.priority || 'medium'];
    const pB = priorityWeight[b.priority || 'medium'];
    if (pA !== pB) {
      return pB - pA;
    }
    // Then by date
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Stats calculation
  const total = todos.length;
  const completed = todos.filter(t => t.status === 'completed').length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const priorityColors = {
    high: 'text-red-500 bg-red-50 border-red-200',
    medium: 'text-orange-500 bg-orange-50 border-orange-200',
    low: 'text-blue-500 bg-blue-50 border-blue-200'
  };

  const priorityDot = {
    high: 'bg-red-500',
    medium: 'bg-orange-500',
    low: 'bg-blue-500'
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-500" />
            Tasks
          </h2>
          <button 
            onClick={() => setShowStats(!showStats)}
            className={`p-1.5 rounded-lg transition-colors ${showStats ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <PieChart className="w-4 h-4" />
          </button>
        </div>

        {showStats && (
          <div className="mb-4 p-3 bg-white border border-gray-100 rounded-xl shadow-sm animate-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progress</span>
              <span className="text-xs font-bold text-indigo-600">{completionRate}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <div className="text-lg font-black text-gray-800">{total}</div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">Total</div>
              </div>
              <div className="bg-orange-50 p-2 rounded-lg text-center">
                <div className="text-lg font-black text-orange-600">{pending}</div>
                <div className="text-[10px] text-orange-400 uppercase font-bold">Pending</div>
              </div>
              <div className="bg-green-50 p-2 rounded-lg text-center">
                <div className="text-lg font-black text-green-600">{completed}</div>
                <div className="text-[10px] text-green-400 uppercase font-bold">Done</div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <div className={`transition-all duration-200 ${isExpanded ? 'bg-white shadow-lg ring-1 ring-gray-200 rounded-xl p-3 absolute z-10 w-full top-0' : ''}`}>
            <div className="relative">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                placeholder="Add a new task..."
                className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm ${isExpanded ? 'pr-4 mb-3' : 'pr-10'}`}
              />
              {!isExpanded && (
                <button
                  type="submit"
                  disabled={!newTodo.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {isExpanded && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 resize-none"
                />

                <div className="flex items-center space-x-2">
                   <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 text-gray-600"
                   />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {(['low', 'medium', 'high'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase border transition-all ${
                          priority === p 
                            ? priorityColors[p] 
                            : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsExpanded(false)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newTodo.trim()}
                      className="px-3 py-1.5 bg-indigo-500 text-white text-xs font-bold rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                    >
                      Add Task
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {isExpanded && <div className="h-10" />} {/* Spacer for layout shift */}
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sortedTodos.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            No tasks yet. Add one above!
          </div>
        ) : (
          sortedTodos.map((todo) => (
            <div
              key={todo.id}
              className={`group flex flex-col gap-2 p-3 bg-white rounded-xl border transition-all hover:shadow-sm ${
                todo.status === 'completed' 
                  ? 'border-gray-100 bg-gray-50/50' 
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onToggleTodo(todo.id)}
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    todo.status === 'completed'
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 text-transparent hover:border-indigo-400'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span 
                      className={`text-sm transition-colors break-words font-medium ${
                        todo.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-700'
                      }`}
                    >
                      {todo.title}
                    </span>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${priorityDot[todo.priority || 'medium']}`} title={`Priority: ${todo.priority}`} />
                  </div>
                  
                  {todo.description && (
                    <p className={`text-xs mt-1 ${todo.status === 'completed' ? 'text-gray-300' : 'text-gray-500'}`}>
                      {todo.description}
                    </p>
                  )}
                  
                  <div className="flex items-center mt-2 space-x-2">
                     {todo.scheduledDate && (
                        <span className="text-[10px] text-gray-400 flex items-center bg-gray-50 px-1.5 py-0.5 rounded">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {format(new Date(todo.scheduledDate), 'MMM d, HH:mm')}
                        </span>
                     )}
                  </div>
                </div>

                <button
                  onClick={() => onDeleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all self-start"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TodoView;