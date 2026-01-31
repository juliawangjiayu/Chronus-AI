import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { CalendarPanel } from '../components/CalendarPanel';

export default function Home() {
  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900">
      <Sidebar />
      <CalendarPanel />
    </div>
  );
}