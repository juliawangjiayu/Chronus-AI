
import { CalendarCategory, CalendarEvent } from './types';

export const DEFAULT_CATEGORIES: CalendarCategory[] = [
  { id: '1', name: 'aaa@gmail.com', color: '#54C1FB', checked: true, group: 'Google' },
  { id: '2', name: 'Calendar', color: '#FF2D55', checked: true, group: 'iCloud' },
  { id: '3', name: '日历', color: '#AF52DE', checked: true, group: 'iCloud' },
  { id: '4', name: 'Home', color: '#54C1FB', checked: true, group: 'iCloud' },
  { id: '5', name: '个人', color: '#5AC8FA', checked: true, group: 'iCloud' },
  { id: '6', name: 'Work', color: '#FF9500', checked: true, group: 'iCloud' },
  { id: '7', name: '工作', color: '#FFCC00', checked: true, group: 'iCloud' },
  { id: '8', name: '生活', color: '#A2845E', checked: true, group: 'iCloud' },
  { id: '9', name: '重要', color: '#FF2D55', checked: true, group: 'iCloud' },
  { id: '10', name: '学习', color: '#AF52DE', checked: true, group: 'iCloud' },
];

const today = new Date();
today.setHours(0, 0, 0, 0);

const getOffsetDate = (days: number, hours: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  d.setHours(Math.floor(hours), (hours % 1) * 60, 0, 0);
  return d;
};

export const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'IT5003 Laboratory',
    location: 'b112',
    startTime: getOffsetDate(1, 16),
    endTime: getOffsetDate(1, 18),
    categoryId: '10',
    allDay: false,
    reminder: 'none',
  },
  {
    id: 'e2',
    title: 'CS5344',
    location: 'COM1-0206',
    startTime: getOffsetDate(1, 18.5),
    endTime: getOffsetDate(1, 20.5),
    categoryId: '10',
    allDay: false,
    reminder: 'none',
  },
  {
    id: 'e3',
    title: 'IT5007 Lecture',
    location: 'LT16',
    startTime: getOffsetDate(2, 18.5),
    endTime: getOffsetDate(2, 21.5),
    categoryId: '10',
    allDay: false,
    reminder: 'none',
  },
  {
    id: 'e4',
    title: 'IT5003 Lecture',
    location: 'LT9',
    startTime: getOffsetDate(3, 18.5),
    endTime: getOffsetDate(3, 20.5),
    categoryId: '10',
    allDay: false,
    reminder: 'none',
  },
];
