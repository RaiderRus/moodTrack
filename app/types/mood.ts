export type MoodTagCategory = 'emotion' | 'activity' | 'place';

export type MoodTag = {
  id: string;
  name: string;
  category: MoodTagCategory;
  color: string;
  hidden?: boolean;
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