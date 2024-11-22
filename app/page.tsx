import MoodEntry from './components/MoodEntry';
import MoodJournal from './components/MoodJournal';
import MoodStats from './components/MoodStats';

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Mood Tracker</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <MoodEntry />
          <MoodStats />
        </div>
        <MoodJournal />
      </div>
    </main>
  );
}