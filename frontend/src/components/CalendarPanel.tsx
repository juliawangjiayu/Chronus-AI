import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { Task } from '../types';
import clsx from 'clsx';
import { format, addMinutes } from 'date-fns';
import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { Trash2, Edit2, X } from 'lucide-react';

// Constants
const HOUR_HEIGHT = 60; // 1 pixel per minute
const START_HOUR = 6; // Start day at 6 AM
const END_HOUR = 24; // End day at midnight

const DraggableTaskBlock = ({ 
  task, 
  onEdit, 
  onDelete 
}: { 
  task: Task; 
  onEdit: (task: Task) => void; 
  onDelete: (taskId: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined;

  // Calculate dynamic time during drag
  const { displayStart, displayEnd } = useMemo(() => {
    if (!task.startTime) return { displayStart: null, displayEnd: null };
    
    if (isDragging && transform) {
      const minutesMoved = Math.round(transform.y / 15) * 15;
      const newStart = addMinutes(task.startTime, minutesMoved);
      const newEnd = addMinutes(newStart, task.duration);
      return { displayStart: newStart, displayEnd: newEnd };
    }
    
    return { displayStart: task.startTime, displayEnd: task.endTime };
  }, [task.startTime, task.endTime, task.duration, isDragging, transform]);

  const startMinutes = task.startTime ? task.startTime.getHours() * 60 + task.startTime.getMinutes() : 0;
  const top = (startMinutes - START_HOUR * 60); // pixels if 1px = 1min
  const height = task.duration;

  // Colors based on mode
  const bgColors = {
    todo: 'bg-blue-500',
    study: 'bg-indigo-500',
    final: 'bg-red-500',
  };
  
  const ghostColors = {
    todo: 'bg-blue-500/20 border-blue-500',
    study: 'bg-indigo-500/20 border-indigo-500',
    final: 'bg-red-500/20 border-red-500',
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        ...style,
      }}
      {...listeners}
      {...attributes}
      className={clsx(
        "absolute left-2 right-2 rounded-md p-2 text-xs text-white overflow-hidden shadow-sm cursor-move border transition-colors group",
        task.isGhost 
          ? `${ghostColors[task.mode]} border-dashed text-slate-700` 
          : `${bgColors[task.mode]} border-transparent`
      )}
    >
      <div className="flex justify-between items-start">
        <div className="font-semibold truncate flex-1 mr-2">{task.name}</div>
        {!isDragging && !task.isGhost && (
          <div className="hidden group-hover:flex space-x-1 bg-black/10 rounded p-0.5 backdrop-blur-sm" onPointerDown={(e) => e.stopPropagation()}>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              className="p-1 hover:bg-white/20 rounded"
            >
              <Edit2 className="w-3 h-3 text-white" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="p-1 hover:bg-red-500/50 rounded"
            >
              <Trash2 className="w-3 h-3 text-white" />
            </button>
          </div>
        )}
      </div>
      <div className="opacity-90 truncate">
        {displayStart && format(displayStart, 'HH:mm')} - {displayEnd && format(displayEnd, 'HH:mm')}
      </div>
    </div>
  );
};

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, name: string) => void;
}

const EditTaskModal = ({ task, isOpen, onClose, onSave }: EditTaskModalProps) => {
  const [name, setName] = useState(task?.name || '');

  React.useEffect(() => {
    if (task) setName(task.name);
  }, [task]);

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-4 w-80 border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800">Edit Task</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Task Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(task.id, name);
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CalendarPanel: React.FC = () => {
  const { tasks, updateTask, removeTask } = useStore();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Filter tasks for today (mocking 'today' as the date of the tasks for demo)
  // In real app, filter by selected date.
  const displayTasks = useMemo(() => tasks.filter(t => t.status !== 'completed' && t.startTime), [tasks]);

  const { setNodeRef } = useDroppable({
    id: 'calendar-droppable',
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const task = active.data.current?.task as Task;
    
    if (task && task.startTime) {
      // Calculate new time
      // Delta.y is pixels. 1px = 1min
      const minutesMoved = Math.round(delta.y / 15) * 15; // Snap to 15 mins
      if (minutesMoved === 0) return;

      const newStartTime = addMinutes(task.startTime, minutesMoved);
      const newEndTime = addMinutes(newStartTime, task.duration);
      
      updateTask(task.id, {
        startTime: newStartTime,
        endTime: newEndTime,
      });
    }
  };
  
  const handleEditSave = (taskId: string, name: string) => {
    updateTask(taskId, { name });
    setEditingTask(null);
  };

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden relative">
      <EditTaskModal 
        task={editingTask} 
        isOpen={!!editingTask} 
        onClose={() => setEditingTask(null)} 
        onSave={handleEditSave}
      />
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white shadow-sm flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">
          {format(new Date(), 'EEEE, MMMM d')}
        </h2>
        <div className="flex space-x-2">
           <span className="flex items-center text-xs text-slate-500"><div className="w-3 h-3 bg-blue-500 rounded mr-1"></div> Todo</span>
           <span className="flex items-center text-xs text-slate-500"><div className="w-3 h-3 bg-indigo-500 rounded mr-1"></div> Study</span>
           <span className="flex items-center text-xs text-slate-500"><div className="w-3 h-3 bg-red-500 rounded mr-1"></div> Final</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto relative">
        <DndContext onDragEnd={handleDragEnd}>
          <div 
            ref={setNodeRef}
            className="relative min-h-full bg-white mx-4 my-4 rounded-lg shadow-sm border border-slate-200"
            style={{ height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px` }}
          >
            {/* Grid Lines */}
            {hours.map((hour) => (
              <div 
                key={hour} 
                className="absolute w-full border-t border-slate-100 flex items-center"
                style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              >
                <span className="absolute -left-12 text-xs text-slate-400 w-10 text-right">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </span>
              </div>
            ))}

            {/* Current Time Indicator (Mock) */}
            <div 
              className="absolute w-full border-t-2 border-red-400 z-10 pointer-events-none"
              style={{ top: `${(new Date().getHours() * 60 + new Date().getMinutes() - START_HOUR * 60)}px` }}
            >
              <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-400 rounded-full"></div>
            </div>

            {/* Tasks */}
            {displayTasks.map((task) => (
              <DraggableTaskBlock 
                key={task.id} 
                task={task} 
                onEdit={setEditingTask}
                onDelete={removeTask}
              />
            ))}
          </div>
        </DndContext>
      </div>
    </div>
  );
};
