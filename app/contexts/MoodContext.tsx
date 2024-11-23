"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { MoodEntry } from '../types/mood';

interface MoodContextType {
  entries: MoodEntry[];
  addEntry: (entry: MoodEntry) => void;
  newEntryId: string | null;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [newEntryId, setNewEntryId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();

    const channel = supabase
      .channel('mood_entries')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mood_entries'
        },
        (payload) => {
          const newEntry = {
            id: payload.new.id,
            userId: payload.new.user_id,
            text: payload.new.text || '',
            tags: payload.new.tags || [],
            createdAt: payload.new.created_at
          };
          
          setEntries(prev => [newEntry, ...prev]);
          setNewEntryId(newEntry.id);
          setTimeout(() => setNewEntryId(null), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      const formattedEntries = data.map(entry => ({
        id: entry.id,
        userId: entry.user_id,
        text: entry.text || '',
        tags: entry.tags || [],
        createdAt: entry.created_at
      }));
      setEntries(formattedEntries);
    }
  };

  const addEntry = (entry: MoodEntry) => {
    setEntries(prev => [entry, ...prev]);
    setNewEntryId(entry.id);
    setTimeout(() => setNewEntryId(null), 1000);
  };

  return (
    <MoodContext.Provider value={{ entries, addEntry, newEntryId }}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  const context = useContext(MoodContext);
  if (context === undefined) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  return context;
} 