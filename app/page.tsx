import MoodEntry from '@/app/components/MoodEntry';
import TabsContainer from '@/app/components/TabsContainer';
import UserProfile from '@/app/components/UserProfile';

export default function Home() {
  return (
    <main className="container mx-auto p-4 space-y-4 relative">
      <UserProfile />
      <div className="max-w-[600px] mx-auto">
        <MoodEntry />
      </div>
      <TabsContainer />
    </main>
  );
}