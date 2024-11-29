export type MoodTag = {
  id: string;
  name: string;
  category: 'emotion' | 'activity' | 'place';
  color: string;
};

export interface MoodEntry {
  id: string;
  userId: string;
  text: string;
  tags: string[];
  createdAt: string;
  audioUrl?: string;
  audioDuration?: number;
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

export type JournalViewType = 'list' | 'calendar';