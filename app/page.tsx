"use client";

import MoodEntry from './components/MoodEntry';
import Sidebar from './components/Sidebar';
import WelcomeScreen from './components/WelcomeScreen';
import { useState } from 'react';

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="relative min-h-screen">
      <Sidebar isCollapsed={isSidebarCollapsed} onCollapsedChange={setIsSidebarCollapsed} />
      <main 
        className={`transition-all duration-300 p-4 ${
          isSidebarCollapsed ? 'ml-[60px]' : 'ml-[300px]'
        }`}
      >
        {showWelcome && <WelcomeScreen onComplete={() => setShowWelcome(false)} />}
        <MoodEntry />
      </main>
    </div>
  );
}