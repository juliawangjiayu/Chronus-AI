
export type ReminderOffset = 'at-time' | '5-min' | '10-min' | '30-min' | '1-hour' | '1-day' | 'none';
export type AIMode = 'Todo' | 'Study' | 'Final';
export type Mode = AIMode; // Alias for backward compatibility
export type AIView = 'Chat' | 'Insight' | 'Todo';

export interface Task {
  id: string;
  name: string;
  duration: number;
  mode: Mode;
  status: 'proposed' | 'committed' | 'completed';
  startTime?: Date;
  endTime?: Date;
  isGhost?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  categoryId: string;
  reminder: ReminderOffset;
  notes?: string;
  isGhost?: boolean;
  isReminder?: boolean;
}

export interface CalendarCategory {
  id: string;
  name: string;
  color: string;
  checked: boolean;
  group: 'Google' | 'iCloud' | 'Other';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedEvents?: Omit<CalendarEvent, 'id'>[];
}

export type CalendarView = 'Day' | 'Week' | 'Month' | 'Year';

export interface PopoverConfig {
  x: number;
  y: number;
  start: Date;
  end: Date;
  type: 'Event' | 'Reminder';
}

export interface SelectionRange {
  start: Date;
  end: Date;
  dayIndex?: number;
}

export interface AiSuggestion {
  name: string;
  duration: number;
  mode: AIMode;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  scheduledDate?: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  createdAt: Date;
  scheduledDate?: Date;
  priority?: 'high' | 'medium' | 'low';
}
