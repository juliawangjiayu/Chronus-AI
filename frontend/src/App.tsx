import React from 'react';
import { Sidebar } from './components/Sidebar';
import { CalendarPanel } from './components/CalendarPanel';

function App() {
  return (
    <div className="flex h-screen w-screen bg-slate-100 overflow-hidden">
      <Sidebar />
      <CalendarPanel />
    </div>
  );
}

export default App;
