"use client";

import MoodEntry from './components/MoodEntry';
import Sidebar from './components/Sidebar';
import WelcomeScreen from './components/WelcomeScreen';
import { useState } from 'react';

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
  };

  const handleStartAnimation = () => {
    // Открываем сайдбар через 2 секунды после нажатия кнопки
    setTimeout(() => {
      setIsSidebarCollapsed(false);
    }, 2000);
  };

  return (
    <div className="relative min-h-screen">
      <Sidebar isCollapsed={isSidebarCollapsed} onCollapsedChange={setIsSidebarCollapsed} />
      <main 
        className={`transition-all duration-300 p-4 ${
          isSidebarCollapsed ? 'ml-[60px]' : 'ml-[300px]'
        }`}
      >
        {showWelcome && (
          <WelcomeScreen 
            onComplete={handleWelcomeComplete} 
            onStartAnimation={handleStartAnimation}
          />
        )}
        <MoodEntry />
      </main>
    </div>
  );
}