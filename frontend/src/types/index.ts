export type Mode = 'todo' | 'study' | 'final';

export type TaskStatus = 'proposed' | 'committed' | 'executing' | 'completed' | 'failed' | 'rescheduled';

export interface Task {
  id: string;
  name: string;
  duration: number; // in minutes
  mode: Mode;
  priority: 'high' | 'medium' | 'low';
  reason?: string;
  status: TaskStatus;
  startTime?: Date;
  endTime?: Date;
  isGhost?: boolean; // True if it's an AI suggestion not yet committed
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AiSuggestion {
  name: string;
  duration: number;
  mode: Mode;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}
