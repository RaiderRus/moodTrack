export const moodTags = {
  emotions: [
    { id: 'happy', name: 'Happy', category: 'emotion', color: 'bg-yellow-400' },
    { id: 'excited', name: 'Excited', category: 'emotion', color: 'bg-orange-400' },
    { id: 'calm', name: 'Calm', category: 'emotion', color: 'bg-blue-400' },
    { id: 'anxious', name: 'Anxious', category: 'emotion', color: 'bg-purple-400' },
    { id: 'sad', name: 'Sad', category: 'emotion', color: 'bg-gray-400' },
    { id: 'angry', name: 'Angry', category: 'emotion', color: 'bg-red-400' },
  ],
  activities: [
    { id: 'work_activity', name: 'Work', category: 'activity', color: 'bg-blue-500' },
    { id: 'exercise', name: 'Exercise', category: 'activity', color: 'bg-green-500' },
    { id: 'social', name: 'Social', category: 'activity', color: 'bg-pink-500' },
    { id: 'rest', name: 'Rest', category: 'activity', color: 'bg-purple-500' },
  ],
  contexts: [
    { id: 'home', name: 'At Home', category: 'context', color: 'bg-indigo-400' },
    { id: 'work_location', name: 'At Work', category: 'context', color: 'bg-blue-400' },
    { id: 'outside', name: 'Outside', category: 'context', color: 'bg-green-400' },
  ],
} as const;