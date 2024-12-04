"use client";

import { useEffect, useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { moodTags } from '../config/mood-tags';
import { supabase } from '../lib/supabase';
import type { MoodEntry, JournalViewType, MoodTag } from '../types/mood';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, List, Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger, } from "@/components/ui/popover";
import { Check } from "lucide-react";
import { useMood } from '../contexts/MoodContext';
import { AudioPlayer } from './AudioPlayer';
import { playfair } from '../lib/fonts';
import { cn } from '../lib/utils';

type MoodTagId = (typeof moodTags)[keyof typeof moodTags][number]['id'];

type FilterType = {
  date: Date | null;
  tags: MoodTagId[];
};

type MoodEntryWithTypedTags = Omit<MoodEntry, 'tags'> & {
  tags: MoodTagId[];
};

interface MoodJournalProps {
  hideExpandButton?: boolean;
}

export default function MoodJournal({ hideExpandButton }: MoodJournalProps) {
  const { entries: rawEntries, newEntryId } = useMood();
  const [isCalendarView, setIsCalendarView] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filters, setFilters] = useState<FilterType>({
    date: null,
    tags: []
  });

  const entries = useMemo(() => 
    rawEntries.map(entry => ({
      ...entry,
      tags: entry.tags.filter((tag): tag is MoodTagId => 
        Object.values(moodTags).flat().some(moodTag => moodTag.id === tag)
      )
    })) as MoodEntryWithTypedTags[],
    [rawEntries]
  );

  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    if (filters.date) {
      const filterDate = filters.date; // Create a stable reference
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return isSameDay(entryDate, filterDate);
      });
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter(entry =>
        entry.tags.some(tag => filters.tags.includes(tag))
      );
    }

    return filtered;
  }, [entries, filters]);

  const getTagDetails = (tagId: MoodTagId) => {
    return Object.values(moodTags).flat().find(tag => tag.id === tagId);
  };

  const formatDate = (dateString: string | undefined) => {
    try {
      if (!dateString) return 'No date';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return `${format(date, 'PP')} ${format(date, 'HH:mm')}`;
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  const handleDateClick = (date: Date) => {
    handleDateFilter(date);
    setIsCalendarView(false); // Close calendar view after date selection
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

  // Обработчики фильтров
  const handleDateFilter = (date: Date | null) => {
    const newFilters = { ...filters, date };
    setFilters(newFilters);
  };

  const handleTagFilter = (tagId: MoodTagId) => {
    const newTags = filters.tags.includes(tagId)
      ? filters.tags.filter(t => t !== tagId)
      : [...filters.tags, tagId];
    const newFilters = { ...filters, tags: newTags };
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    const newFilters = { date: null, tags: [] };
    setFilters(newFilters);
  };

  const renderFilters = () => (
    <div className="mb-4 flex gap-2 items-center flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={cn(
              playfair.className,
              "flex gap-2 items-center",
              filters.tags.length > 0 && "bg-accent"
            )}
          >
            Tags
            {filters.tags.length > 0 && (
              <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs">
                {filters.tags.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-2">
          <div className="space-y-2">
            {Object.entries(moodTags).flatMap(([category, tags]) => 
              tags.map(tag => (
                <div
                  key={tag.id}
                  className={cn(
                    "flex items-center space-x-2 p-1.5 rounded-md hover:bg-accent cursor-pointer",
                    filters.tags.includes(tag.id) && "bg-accent"
                  )}
                  onClick={() => handleTagFilter(tag.id)}
                >
                  <div className={cn(
                    "h-4 w-4 rounded-sm border flex items-center justify-center",
                    filters.tags.includes(tag.id) && "bg-primary border-primary"
                  )}>
                    {filters.tags.includes(tag.id) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <span className={cn(
                    "text-sm",
                    filters.tags.includes(tag.id) && "font-medium"
                  )}>
                    {tag.name}
                  </span>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsCalendarView(!isCalendarView)}
        className={cn(
          "p-2",
          isCalendarView && "bg-accent"
        )}
      >
        <Calendar className="h-4 w-4" />
      </Button>

      {filters.date && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDateFilter(null)}
          className={playfair.className}
        >
          {format(filters.date, 'PP')} ✕
        </Button>
      )}

      {(filters.tags.length > 0 || filters.date) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className={playfair.className}
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
            initial={newEntryId === entry.id ? { 
              opacity: 0,
              y: -20,
              scale: 0.8
            } : { opacity: 1 }}
            animate={{ 
              opacity: 1,
              y: 0,
              scale: 1
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              mass: 1,
              delay: newEntryId === entry.id ? 0.3 : 0
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
              {entry.audioUrl && entry.audioDuration && (
                <div className="mt-2">
                  <AudioPlayer url={entry.audioUrl} duration={entry.audioDuration} />
                </div>
              )}
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
                className={`relative aspect-square border rounded-lg cursor-pointer overflow-hidden
                  ${dayEntries.length > 0 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'}
                  ${isSameDay(day, filters.date || new Date()) ? 'ring-2 ring-blue-500' : ''}
                `}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "tween", duration: 0.15 }}
                onClick={() => handleDateClick(day)}
              >
                <div className="absolute inset-0 flex flex-col">
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-sm font-medium">
                      {format(day, 'd')}
                    </div>
                  </div>
                  <div className="h-7 px-2">
                    <div className="flex flex-wrap gap-1 items-center justify-center">
                      {dayEntries.slice(0, 3).map(entry => (
                        <div
                          key={entry.id}
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: entry.tags[0] 
                              ? getTagDetails(entry.tags[0])?.color.replace('bg-', '') 
                              : '#gray-300'
                          }}
                        />
                      ))}
                      {dayEntries.length > 3 && (
                        <div className="text-xs text-gray-500 flex-shrink-0">
                          +{dayEntries.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
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
      id="mood-journal"
    >
      <div className="p-4">
        {renderFilters()}

        <ScrollArea className="h-[calc(100vh-13rem)]">
          <AnimatePresence>
            {isCalendarView && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-4 overflow-hidden"
              >
                {renderCalendarView()}
              </motion.div>
            )}
          </AnimatePresence>
          {renderListView()}
        </ScrollArea>
      </div>
    </Card>
  );
}

// Export function to get journal position
export function getJournalPosition(): DOMRect | null {
  const journal = document.querySelector('.mood-journal');
  return journal?.getBoundingClientRect() || null;
}