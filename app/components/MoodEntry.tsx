"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mic, Send, Loader2, X } from "lucide-react";
import { moodTags } from '../config/mood-tags';
import { transcribeAudio, analyzeMoodText, getMoodEntries } from '../lib/api';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { MoodTag } from '../types/mood';
import { motion, AnimatePresence } from 'framer-motion';
import { useMood } from '../contexts/MoodContext';
import { cn } from '@/lib/utils';

export default function MoodEntry() {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [previewEntry, setPreviewEntry] = useState<{
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setIsProcessing(true);
        try {
          const transcription = await transcribeAudio(audioBlob);
          setText(transcription);
          toast.success('Speech transcribed successfully! Click Analyze to process the text.');
        } catch (error) {
          toast.error('Failed to transcribe audio');
          console.error(error);
        } finally {
          setIsProcessing(false);
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
    if (selectedTags.length === 0) {
      toast.error('Please select at least one tag');
      return;
    }

    try {
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

      console.log('Saving entry:', { text, tags: selectedTags });

      const { data, error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user.id,
          text,
          tags: selectedTags,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Entry saved:', data);

      const newEntry = {
        id: data.id,
        userId: data.user_id,
        text: data.text || '',
        tags: data.tags || [],
        createdAt: data.created_at
      };

      addEntry(newEntry);
      toast.success('Запись сохранена!');

      setText('');
      setSelectedTags([]);
    } catch (error) {
      console.error('Error saving mood entry:', error);
      toast.error('Не удалось сохранить запись. Попробуйте снова.');
    }
  };

  const handleTagClick = (tagId: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  const removeTag = (tagId: string) => {
    setSelectedTags(prev => prev.filter(id => id !== tagId));
  };

  const getTagById = (tagId: string) => {
    return Object.values(moodTags).flat().find(tag => tag.id === tagId);
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
    setIsProcessing(true);
    try {
      console.log('Starting text analysis...');
      const tags = await analyzeMoodText(text);
      console.log('Received tags:', tags);
      setSelectedTags(prev => Array.from(new Set([...prev, ...tags])));
      toast.success('Текст проанализирован! Выбраны подходящие теги.');
    } catch (error) {
      console.error('Failed to analyze text:', error);
      toast.error('Не удалось проанализировать текст');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="How are you feeling?"
          disabled={isProcessing}
        />
        {text && !isRecording && (
          <Button
            onClick={async () => {
              setIsProcessing(true);
              try {
                const tags = await analyzeMoodText(text);
                setSelectedTags(prev => Array.from(new Set([...prev, ...tags])));
                toast.success('Text analyzed successfully!');
              } catch (error) {
                toast.error('Failed to analyze text');
                console.error(error);
              } finally {
                setIsProcessing(false);
              }
            }}
            disabled={isProcessing}
            variant="outline"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        )}
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? "destructive" : "default"}
          className="relative"
        >
          <Mic className={cn(
            "h-4 w-4",
            !isRecording && "animate-pulse"
          )} />
          {!isRecording && (
            <span className="absolute -inset-1 animate-ping rounded-full bg-primary opacity-20" />
          )}
        </Button>
      </div>

      <div className="space-y-2">
        {Object.entries(moodTags).map(([category, tags]) => (
          <div key={category} className="space-y-1">
            <h3 className="text-sm font-medium text-gray-700 capitalize">{category}</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <motion.button
                  key={tag.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${tag.color} text-white px-3 py-1 rounded-full text-sm
                    hover:opacity-90 transition-opacity`}
                  onClick={() => handleTagClick(tag.id)}
                >
                  {tag.name}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedTags.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-gray-50 rounded-lg selected-tags-container">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Selected Moods:</span>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isProcessing || (!text.trim() && selectedTags.length === 0)}
                  size="sm"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <AnimatePresence>
                {previewEntry && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, x: 0 }}
                    animate={{ 
                      scale: previewEntry.isAnimating ? 1 : 0.8,
                      opacity: previewEntry.isAnimating ? 1 : 0,
                      x: previewEntry.isAnimating ? 0 : 500
                    }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 25,
                      duration: 0.3
                    }}
                    className="mb-4 p-4 border rounded-lg bg-white shadow-sm"
                  >
                    {previewEntry.text && (
                      <p className="mb-2">{previewEntry.text}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {previewEntry.tags.map((tagId) => {
                        const tag = getTagById(tagId);
                        return tag && (
                          <span
                            key={tag.id}
                            className={`${tag.color} text-white px-2 py-1 rounded-full text-sm`}
                          >
                            {tag.name}
                          </span>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {selectedTags.map((tagId) => {
                    const tag = getTagById(tagId);
                    return tag && !previewEntry && (
                      <motion.div
                        key={tag.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        layout
                        data-tag-id={tag.id}
                        className={`${tag.color} text-white px-2 py-1 rounded-full text-sm flex items-center gap-1`}
                      >
                        {tag.name}
                        <button
                          onClick={() => removeTag(tag.id)}
                          className="hover:bg-white/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}