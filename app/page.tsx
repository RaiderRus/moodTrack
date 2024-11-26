"use client";

import MoodEntry from '@/app/components/MoodEntry';
import TabsContainer from '@/app/components/TabsContainer';
import WelcomeScreen from '@/app/components/WelcomeScreen';
import { useState } from 'react';

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <>
      {showWelcome && <WelcomeScreen onComplete={() => setShowWelcome(false)} />}
      <main className="container mx-auto p-4 space-y-4">
        <div className="max-w-[600px] mx-auto">
          <MoodEntry />
        </div>
        <TabsContainer />
      </main>
    </>
  );
}