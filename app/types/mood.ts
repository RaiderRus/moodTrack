export type MoodTag = {
  id: string;
  name: string;
  category: 'emotion' | 'activity' | 'context';
  color: string;
};

export type MoodEntry = {
  id: string;
  userId: string;
  text: string;
  audioUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type MoodStats = {
  mostFrequentMoods: { tag: string; count: number }[];
  moodTrends: { date: string; mood: string; count: number }[];
  totalEntries: number;
};