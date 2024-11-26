import MoodEntry from '@/app/components/MoodEntry';
import TabsContainer from '@/app/components/TabsContainer';

export default function Home() {
  return (
    <main className="container mx-auto p-4 space-y-4">
      <div className="max-w-[600px] mx-auto">
        <MoodEntry />
      </div>
      <TabsContainer />
    </main>
  );
}