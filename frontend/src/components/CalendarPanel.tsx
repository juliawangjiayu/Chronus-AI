import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Task } from '../types';
import clsx from 'clsx';
import { format, addMinutes, startOfDay, differenceInMinutes } from 'date-fns';
import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';

// Constants
const HOUR_HEIGHT = 60; // 1 pixel per minute
const START_HOUR = 6; // Start day at 6 AM
const END_HOUR = 24; // End day at midnight

const DraggableTaskBlock = ({ task }: { task: Task }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined;

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
        "absolute left-2 right-2 rounded-md p-2 text-xs text-white overflow-hidden shadow-sm cursor-move border transition-colors",
        task.isGhost 
          ? `${ghostColors[task.mode]} border-dashed text-slate-700` 
          : `${bgColors[task.mode]} border-transparent`
      )}
    >
      <div className="font-semibold truncate">{task.name}</div>
      <div className="opacity-90 truncate">
        {task.startTime && format(task.startTime, 'HH:mm')} - {task.endTime && format(task.endTime, 'HH:mm')}
      </div>
    </div>
  );
};

export const CalendarPanel: React.FC = () => {
  const { tasks, updateTask } = useStore();
  
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

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
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
              <DraggableTaskBlock key={task.id} task={task} />
            ))}
          </div>
        </DndContext>
      </div>
    </div>
  );
};
