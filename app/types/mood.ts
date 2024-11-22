export type MoodTag = {
  id: string;
  name: string;
  category: 'emotion' | 'activity' | 'context';
  color: string;
};

export interface MoodEntry {
  id: string;
  userId: string;
  text: string;
  tags: string[];
  createdAt: string;
}

export interface MoodStats {
  mostFrequentMoods: Array<{
    tag: string;
    count: number;
  }>;
  moodTrends: Array<{
    date: string;
    mood: string;
    count: number;
  }>;
  totalEntries: number;
}