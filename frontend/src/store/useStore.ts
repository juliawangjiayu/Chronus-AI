import { create } from 'zustand';
import { Task, Mode, ChatMessage, AiSuggestion } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  currentMode: Mode;
  tasks: Task[];
  draftTasks: Task[]; // Tasks in the Draft Slot
  messages: ChatMessage[];
  
  setMode: (mode: Mode) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  
  addDraftTask: (suggestion: AiSuggestion) => void;
  commitDraftTask: (taskId: string, startTime: Date) => void;
  clearDraftTasks: () => void;
  
  addMessage: (role: 'user' | 'assistant', content: string) => void;
}

export const useStore = create<AppState>((set) => ({
  currentMode: 'Todo',
  tasks: [],
  draftTasks: [],
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I\'m Chronus AI. Switch modes or tell me what you need to plan.',
      timestamp: new Date(),
    }
  ],

  setMode: (mode) => set({ currentMode: mode }),

  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),

  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    draftTasks: state.draftTasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
  })),

  removeTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== taskId),
    draftTasks: state.draftTasks.filter((t) => t.id !== taskId),
  })),

  addDraftTask: (suggestion) => set((state) => ({
    draftTasks: [
      ...state.draftTasks,
      {
        id: uuidv4(),
        ...suggestion,
        status: 'proposed',
        isGhost: true,
      },
    ],
  })),

  commitDraftTask: (taskId, startTime) => set((state) => {
    const task = state.draftTasks.find((t) => t.id === taskId);
    if (!task) return {};

    const endTime = new Date(startTime.getTime() + task.duration * 60000);
    const committedTask: Task = {
      ...task,
      status: 'committed',
      isGhost: false,
      startTime,
      endTime,
    };

    return {
      draftTasks: state.draftTasks.filter((t) => t.id !== taskId),
      tasks: [...state.tasks, committedTask],
    };
  }),

  clearDraftTasks: () => set({ draftTasks: [] }),

  addMessage: (role, content) => set((state) => ({
    messages: [
      ...state.messages,
      {
        id: uuidv4(),
        role,
        content,
        timestamp: new Date(),
      },
    ],
  })),
}));
