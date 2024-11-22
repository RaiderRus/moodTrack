"use client";

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { moodTags } from '../config/mood-tags';
import { supabase } from '../lib/supabase';
import type { MoodEntry, JournalViewType, MoodTag } from '../types/mood';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, List, Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MoodTagCategory = keyof typeof moodTags;
type MoodTagId = (typeof moodTags)[MoodTagCategory][number]['id'];

type FilterType = {
  date: Date | null;
  tags: MoodTagId[];
  category: MoodTagCategory | null;
};

type MoodEntryWithTypedTags = Omit<MoodEntry, 'tags'> & {
  tags: MoodTagId[];
};

export default function MoodJournal() {
  const [entries, setEntries] = useState<MoodEntryWithTypedTags[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [newEntryId, setNewEntryId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<JournalViewType>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filters, setFilters] = useState<FilterType>({
    date: null,
    tags: [],
    category: null
  });
  const [filteredEntries, setFilteredEntries] = useState<MoodEntryWithTypedTags[]>([]);

  useEffect(() => {
    fetchEntries();
    
    // Create and subscribe to channel
    const channel = supabase
      .channel('mood_entries')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mood_entries',
          filter: `user_id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`
        },
        (payload) => {
          console.log('New entry:', payload); // for debugging
          const newEntry = {
            id: payload.new.id,
            userId: payload.new.user_id,
            text: payload.new.text || '',
            tags: payload.new.tags || [],
            createdAt: payload.new.created_at
          };
          
          // Add new entry to the beginning of the list
          setEntries(prev => [newEntry, ...prev]);
          setNewEntryId(newEntry.id);
          
          // Reset newEntryId after one second
          setTimeout(() => setNewEntryId(null), 1000);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status); // for debugging
      });

    // Unsubscribe on unmount
    return () => {
      channel.unsubscribe();
    };
  }, []); // Empty dependencies array

  useEffect(() => {
    const handleNewEntry = () => {
      fetchEntries();
    };

    window.addEventListener('moodEntryAdded', handleNewEntry);
    return () => {
      window.removeEventListener('moodEntryAdded', handleNewEntry);
    };
  }, []);

  useEffect(() => {
    let filtered = [...entries];

    if (filters.date) {
      filtered = filtered.filter(entry => 
        isSameDay(new Date(entry.createdAt), filters.date!)
      );
    }

    if (filters.category) {
      const categoryTags = moodTags[filters.category]
        .map(tag => tag.id);
      filtered = filtered.filter(entry =>
        entry.tags.some(tag => categoryTags.includes(tag))
      );
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter(entry =>
        entry.tags.some(tag => filters.tags.includes(tag))
      );
    }

    setFilteredEntries(filtered);
    
    console.log('Filters:', filters);
    console.log('Filtered entries:', filtered);
  }, [entries, filters]);

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
        tags: (entry.tags || []) as MoodTagId[],
        createdAt: entry.created_at
      }));
      setEntries(formattedEntries);
      setFilteredEntries(formattedEntries);
    }
  };

  const getTagDetails = (tagId: MoodTagId) => {
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

  const handleDateClick = (date: Date) => {
    setFilters(prev => ({ ...prev, date }));
    setViewType('list');
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentMonth(newDate);
  };

  const renderFilters = () => (
    <div className="mb-4 flex gap-2 flex-wrap">
      <Select
        value={filters.category || 'all'}
        onValueChange={(value: string) => 
          setFilters(prev => ({ 
            ...prev, 
            category: value === 'all' ? null : value as MoodTagCategory 
          }))
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {(Object.keys(moodTags) as MoodTagCategory[]).map(category => (
            <SelectItem key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.tags.length > 0 ? filters.tags[0] : 'all'}
        onValueChange={(value: string) => 
          setFilters(prev => ({ 
            ...prev, 
            tags: value === 'all' ? [] : [value as MoodTagId]
          }))
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by tag" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All tags</SelectItem>
          {Object.values(moodTags).flat().map(tag => (
            <SelectItem key={tag.id} value={tag.id}>
              {tag.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filters.date && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilters(prev => ({ ...prev, date: null }))}
        >
          {format(filters.date, 'PP')} ✕
        </Button>
      )}

      {(filters.category || filters.tags.length > 0 || filters.date) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFilters({ date: null, tags: [], category: null })}
        >
          Clear filters
        </Button>
      )}
    </div>
  );

  const renderListView = () => (
    <ScrollArea className="h-[600px] pr-4">
      <AnimatePresence initial={false}>
        {filteredEntries.map((entry) => (
          <motion.div
            key={entry.id}
            layout
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              mass: 1,
            }}
            className="mb-4"
          >
            <motion.div
              initial={newEntryId === entry.id ? { scale: 0.8 } : { scale: 1 }}
              animate={{ scale: 1 }}
              className="p-4 border rounded-lg bg-white shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-gray-500">
                  {formatDate(entry.createdAt)}
                </span>
              </div>
              {entry.text && (
                <p className="mb-2">{entry.text}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {entry.tags.map((tagId) => {
                    const tag = getTagDetails(tagId);
                    return tag ? (
                      <motion.span
                        key={`${entry.id}-${tagId}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={`${tag.color} text-white px-2 py-1 rounded-full text-sm`}
                      >
                        {tag.name}
                      </motion.span>
                    ) : null;
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </ScrollArea>
  );

  const renderCalendarView = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => handleMonthChange('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <Button variant="ghost" size="sm" onClick={() => handleMonthChange('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-medium text-sm py-2">
              {day}
            </div>
          ))}
          {days.map(day => {
            const dayEntries = filteredEntries.filter(entry => 
              isSameDay(new Date(entry.createdAt), day)
            );
            
            return (
              <motion.div
                key={day.toISOString()}
                className={`aspect-square p-2 border rounded-lg cursor-pointer
                  ${dayEntries.length > 0 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'}
                  ${isSameDay(day, filters.date || new Date()) ? 'ring-2 ring-blue-500' : ''}
                `}
                whileHover={{ scale: 1.05 }}
                onClick={() => handleDateClick(day)}
              >
                <div className="text-sm font-medium mb-1">
                  {format(day, 'd')}
                </div>
                <div className="flex flex-wrap gap-1">
                  {dayEntries.slice(0, 3).map(entry => (
                    <div
                      key={entry.id}
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: entry.tags[0] 
                          ? getTagDetails(entry.tags[0])?.color.replace('bg-', '') 
                          : '#gray-300'
                      }}
                    />
                  ))}
                  {dayEntries.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayEntries.length - 3}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card 
      className="relative transition-all duration-300"
      style={{ height: isExpanded ? 'auto' : '60px' }}
      id="mood-journal"
    >
      <div className="absolute right-4 top-4 z-10 flex gap-2">
        <Tabs
          value={viewType}
          onValueChange={(value) => setViewType(value as JournalViewType)}
          className="bg-white rounded-lg shadow-sm"
        >
          <TabsList>
            <TabsTrigger value="list">
              <List className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </div>

      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : '60px',
          overflow: isExpanded ? 'visible' : 'hidden'
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Mood Journal</h2>
          
          {isExpanded && renderFilters()}
          
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.div
                key={viewType}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {viewType === 'list' ? renderListView() : renderCalendarView()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </Card>
  );
}

// Export function to get journal position
export function getJournalPosition(): DOMRect | null {
  const journal = document.querySelector('.mood-journal');
  return journal?.getBoundingClientRect() || null;
}