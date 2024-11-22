"use client";

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { moodTags } from '../config/mood-tags';
import { supabase } from '../lib/supabase';
import type { MoodEntry } from '../types/mood';

export default function MoodJournal() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      // Преобразуем данные для соответствия типу MoodEntry
      const formattedEntries = data.map(entry => ({
        id: entry.id,
        userId: entry.user_id,
        text: entry.text || '',
        tags: entry.tags || [],
        createdAt: entry.created_at // Supabase возвращает created_at
      }));
      setEntries(formattedEntries);
    }
  };

  const getTagDetails = (tagId: string) => {
    return Object.values(moodTags).flat().find(tag => tag.id === tagId);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPpp');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  return (
    <Card className="p-4">
      <h2 className="text-2xl font-bold mb-4">Mood Journal</h2>
      <ScrollArea className="h-[600px] pr-4">
        {entries.map((entry) => (
          <div key={entry.id} className="mb-4 p-4 border rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-gray-500">
                {formatDate(entry.createdAt)}
              </span>
            </div>
            {entry.text && (
              <p className="mb-2">{entry.text}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tagId) => {
                const tag = getTagDetails(tagId);
                return tag ? (
                  <span
                    key={tagId}
                    className={`${tag.color} text-white px-2 py-1 rounded-full text-sm`}
                  >
                    {tag.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        ))}
      </ScrollArea>
    </Card>
  );
}