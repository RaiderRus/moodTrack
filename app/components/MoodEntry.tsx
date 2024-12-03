"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mic, Send, Loader2, X, Calendar, Clock } from "lucide-react";
import { moodTags } from '../config/mood-tags';
import { transcribeAudio, analyzeMoodText, getMoodEntries, saveAudioRecording } from '../lib/api';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { MoodTag } from '../types/mood';
import { motion, AnimatePresence } from 'framer-motion';
import { useMood } from '../contexts/MoodContext';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { TimePickerDemo } from "../components/ui/time-picker";

export default function MoodEntry() {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [previewEntry, setPreviewEntry] = useState<{
    text: string;
    tags: string[];
    isAnimating: boolean;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [animatingEntry, setAnimatingEntry] = useState<{
    text: string;
    tags: string[];
    isAnimating: boolean;
  } | null>(null);
  const router = useRouter();
  const { addEntry } = useMood();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (animatingEntry?.isAnimating) {
      const timer = setTimeout(() => {
        setAnimatingEntry(null);
      }, 1000); // Длительность анимации

      return () => clearTimeout(timer);
    }
  }, [animatingEntry?.isAnimating]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setIsTranscribing(true);
        try {
          const transcription = await transcribeAudio(blob);
          await handleTranscribedText(transcription);
        } catch (error) {
          toast.error('Failed to transcribe audio');
          console.error(error);
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      toast.error('Failed to start recording');
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const saveMoodEntry = async () => {
    if (isSaving) return; // Предотвращаем повторные запросы
    setIsSaving(true);

    // Запускаем анимацию
    setAnimatingEntry({
      text,
      tags: selectedTags,
      isAnimating: true
    });

    if (selectedTags.length === 0) {
      toast.error('Please select at least one tag');
      setIsSaving(false);
      return;
    }

    try {
      setIsProcessing(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        toast.error('Please sign in to save entries');
        return;
      }

      const { data: moodData, error: moodError } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user.id,
          text,
          tags: selectedTags,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (moodError) throw moodError;

      let audioUrl, audioDuration;
      if (audioBlob) {
        try {
          const maxRetries = 3;
          let retryCount = 0;
          let success = false;

          while (retryCount < maxRetries && !success) {
            try {
              const audioData = await saveAudioRecording(audioBlob, moodData.id);
              audioUrl = audioData.url;
              audioDuration = audioData.duration;
              success = true;
            } catch (error) {
              retryCount++;
              if (retryCount === maxRetries) throw error;
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
        } catch (audioError) {
          console.error('Error saving audio recording:', audioError);
          toast.error('Failed to save audio, but mood entry was saved');
        }
      }

      const newEntry = {
        id: moodData.id,
        userId: moodData.user_id,
        text: moodData.text || '',
        tags: moodData.tags || [],
        createdAt: moodData.created_at,
        audioUrl,
        audioDuration
      };

      addEntry(newEntry);
      toast.success('Entry saved!');

      setText('');
      setSelectedTags([]);
      setAudioBlob(null);
    } catch (error) {
      console.error('Error saving mood entry:', error);
      toast.error('Failed to save entry. Please try again.');
    } finally {
      setIsProcessing(false);
      setIsSaving(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    // Находим тег в любой категории
    type MoodTagType = typeof moodTags[keyof typeof moodTags][number];
    let foundTag: MoodTagType | undefined;
    
    for (const category of Object.values(moodTags)) {
      const tag = category.find(t => t.id === tagId);
      if (tag) {
        foundTag = tag;
        break;
      }
    }
    
    if (tagId === 'other' && !selectedTags.includes(tagId)) return;

    setSelectedTags(prev => {
      const newTags = new Set(prev);
      if (newTags.has(tagId)) {
        newTags.delete(tagId);
      } else {
        newTags.add(tagId);
      }
      return Array.from(newTags);
    });
  };

  const getTagById = (tagId: string): MoodTag | undefined => {
    for (const category of Object.values(moodTags)) {
      const tag = category.find(t => t.id === tagId);
      if (tag) return tag;
    }
    return undefined;
  };

  const handleSubmit = async () => {
    if (!text.trim() && selectedTags.length === 0) return;
    setIsProcessing(true);
    
    try {
      const journalElement = document.getElementById('mood-journal');
      const journalRect = journalElement?.getBoundingClientRect();
      
      if (journalRect) {
        const tagAnimations = selectedTags.map((tagId) => {
          return new Promise<void>((resolve) => {
            const tagElement = document.querySelector(`[data-tag-id="${tagId}"]`);
            const tagRect = tagElement?.getBoundingClientRect();
            const tag = getTagById(tagId);
            
            if (tagRect && tag) {
              const clone = document.createElement('div');
              clone.className = `fixed ${tag.color} text-white px-2 py-1 rounded-full text-sm z-50`;
              clone.style.left = `${tagRect.left}px`;
              clone.style.top = `${tagRect.top}px`;
              clone.style.width = `${tagRect.width}px`;
              clone.style.height = `${tagRect.height}px`;
              clone.textContent = tag.name;
              document.body.appendChild(clone);

              requestAnimationFrame(() => {
                clone.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                clone.style.transform = `translate(
                  ${journalRect.left - tagRect.left + 20}px,
                  ${journalRect.top - tagRect.top + 20}px
                ) scale(0.8)`;
                clone.style.opacity = '0';

                setTimeout(() => {
                  document.body.removeChild(clone);
                  resolve();
                }, 500);
              });
            } else {
              resolve();
            }
          });
        });

        await Promise.all(tagAnimations);
      }

      await saveMoodEntry();
      setText('');
      setSelectedTags([]);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save entry');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranscribedText = async (text: string) => {
    setIsTranscribing(true);
    try {
      console.log('Starting text analysis...');
      setText(text); // Set the transcribed text first
      const tags = await analyzeMoodText(text);
      console.log('Received tags:', tags);
      if (tags.length === 0) {
        // Если нет тегов, добавляем 'other'
        setSelectedTags(['other']);
      } else {
        setSelectedTags(tags);
      }
      toast.success('Voice recording analyzed! Relevant tags have been selected.');
    } catch (error) {
      console.error('Failed to analyze text:', error);
      toast.error('Failed to analyze the recording.');
      // В случае ошибки тоже добавляем тег 'other'
      setSelectedTags(['other']);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="p-4 space-y-4 w-full max-w-2xl bg-transparent border-0 shadow-none">
        <div className="relative flex items-start gap-4">
          <div className="flex-grow space-y-4">
            <div className="space-y-4">
              {Object.entries(moodTags).map(([category, tags]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground first-letter:uppercase">
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags
                      .filter(tag => tag.id !== 'other')
                      .map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => handleTagToggle(tag.id)}
                          className={cn(
                            'px-3 py-1 rounded-full text-sm transition-all',
                            tag.color,
                            'text-white',
                            selectedTags.includes(tag.id) 
                              ? 'ring-2 ring-white/20 shadow-lg scale-105' 
                              : 'hover:opacity-90 hover:scale-102'
                          )}
                        >
                          {tag.name}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                'absolute right-0 top-[50%] -translate-y-[50%] w-16 h-16 rounded-full flex items-center justify-center transition-colors',
                isRecording 
                  ? 'bg-red-400 hover:bg-red-500 text-white' 
                  : 'bg-slate-400 hover:bg-slate-500 text-slate-100'
              )}
              disabled={isTranscribing}
            >
              {isTranscribing ? (
                <motion.div 
                  className="w-8 h-8 border-2 border-white rounded-full border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <svg 
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 300 300"
                  className="h-8 w-8"
                  fill="currentColor"
                >
                  <g transform="translate(0,300) scale(0.1,-0.1)">
                    <path d="M1357 2799c-160-38-298-177-342-344-22-87-22-973 0-1060 45-172 194-313 364-345 69-13 173-13 242 0 178 33 336 191 369 369 6 31 10 248 10 515 0 508-2 525-62 638-56 105-181 200-299 227-53 13-229 12-282 0z" />
                    <path d="M594 1700c-36-14-64-59-64-101 0-68 21-192 47-274 108-341 394-596 743-662l90-17 0-133 0-133-87 0c-49-1-128-2-177-4-86-3-91-4-118-35-38-42-37-83 1-122l29-29 442 0 442 0 29 29c39 39 39 80 0 123l-29 33-154 3c-84 1-163 2-175 2-23 0-23 2-23 133l0 133 90 17c406 77 722 410 779 821 16 114 14 149-10 180-30 38-64 49-106 35-44-14-59-46-66-144-24-314-230-579-527-680-374-127-786 48-954 405-45 95-65 173-73 279-5 72-10 88-32 112-29 32-65 43-97 29z" />
                  </g>
                </svg>
              )}
            </button>
            
            {isTranscribing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-20 top-[50%] -translate-y-[50%] bg-white/90 backdrop-blur-sm shadow-lg rounded-lg px-4 py-2 flex items-center gap-2"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Processing</span>
                  <span className="text-xs text-muted-foreground">
                    {audioBlob ? "Transcribing audio..." : "Analyzing text..."}
                  </span>
                </div>
                <motion.div 
                  className="flex gap-1"
                  initial="start"
                  animate="end"
                  variants={{
                    start: { transition: { staggerChildren: 0.2 } },
                    end: { transition: { staggerChildren: 0.2 } }
                  }}
                >
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-blue-500"
                    variants={{
                      start: { y: 0 },
                      end: { y: [-2, 0], transition: { duration: 0.6, repeat: Infinity } }
                    }}
                  />
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-blue-500"
                    variants={{
                      start: { y: 0 },
                      end: { y: [-2, 0], transition: { duration: 0.6, repeat: Infinity, delay: 0.2 } }
                    }}
                  />
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-blue-500"
                    variants={{
                      start: { y: 0 },
                      end: { y: [-2, 0], transition: { duration: 0.6, repeat: Infinity, delay: 0.4 } }
                    }}
                  />
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedTags.map(tagId => {
              const tag = getTagById(tagId);
              if (!tag) return null;
              return (
                <div
                  key={tag.id}
                  className={cn(
                    'px-2 py-1 text-sm rounded-full text-white flex items-center gap-1',
                    tag.color
                  )}
                >
                  {tag.name}
                  <button
                    onClick={() => handleTagToggle(tag.id)}
                    className="ml-1 hover:opacity-80 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Text Input */}
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="How are you feeling?"
            disabled={isTranscribing}
          />
        </div>

        {/* Save Button */}
        {(text || selectedTags.length > 0) && (
          <div className="flex justify-center mt-4">
            <Button
              onClick={saveMoodEntry}
              disabled={isTranscribing || (!text && selectedTags.length === 0) || isSaving}
              className={cn(
                "px-8",
                isSaving && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSaving ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        )}
      </Card>
      {/* Анимированная запись */}
      {animatingEntry && (
        <motion.div
          initial={{ 
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 50,
            opacity: 1,
            scale: 1
          }}
          animate={{ 
            top: '0%',
            left: '0%',
            opacity: 0,
            scale: 0.5,
            rotate: -5
          }}
          transition={{ 
            duration: 0.7,
            ease: [0.32, 0, 0.67, 0], 
            rotate: {
              duration: 0.4,
              ease: "easeOut"
            }
          }}
          className="pointer-events-none"
        >
          <div className="bg-white rounded-lg shadow-lg p-4 min-w-[200px]">
            <p className="text-sm truncate">{animatingEntry.text}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {animatingEntry.tags.map(tagId => {
                const tag = getTagById(tagId);
                if (!tag) return null;
                return (
                  <span
                    key={tag.id}
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-full text-white',
                      tag.color
                    )}
                  >
                    {tag.name}
                  </span>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}