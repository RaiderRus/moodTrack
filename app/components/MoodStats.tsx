"use client";

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { moodTags } from '../config/mood-tags';
import { supabase } from '../lib/supabase';
import type { MoodStats } from '../types/mood';

export default function MoodStatistics() {
  const [stats, setStats] = useState<MoodStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: entries } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user.id);

    if (!entries) return;

    // Calculate mood frequencies
    const tagCounts: Record<string, number> = {};
    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const mostFrequentMoods = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate mood trends (last 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const moodTrends = entries
      .filter(entry => new Date(entry.created_at) >= last7Days)
      .reduce((acc: any[], entry) => {
        const date = new Date(entry.created_at).toISOString().split('T')[0];
        entry.tags.forEach(tag => {
          acc.push({ date, mood: tag, count: 1 });
        });
        return acc;
      }, []);

    setStats({
      mostFrequentMoods,
      moodTrends,
      totalEntries: entries.length,
    });
  };

  const getTagName = (tagId: string) => {
    const tag = Object.values(moodTags).flat().find(t => t.id === tagId);
    return tag?.name || tagId;
  };

  if (!stats) return null;

  return (
    <Card className="p-4">
      <h2 className="text-2xl font-bold mb-4">Mood Statistics</h2>
      <Tabs defaultValue="frequent">
        <TabsList>
          <TabsTrigger value="frequent">Most Frequent</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        <TabsContent value="frequent">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.mostFrequentMoods}>
              <XAxis dataKey="tag" tickFormatter={getTagName} />
              <YAxis />
              <Tooltip
                labelFormatter={getTagName}
                formatter={(value: number) => [`${value} entries`]}
              />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
        <TabsContent value="trends">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.moodTrends}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
      <div className="mt-4 text-center">
        <p className="text-lg">Total Entries: {stats.totalEntries}</p>
      </div>
    </Card>
  );
}