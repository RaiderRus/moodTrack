"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mic, Send, Loader2, X } from "lucide-react";
import { moodTags } from '../config/mood-tags';
import { transcribeAudio, analyzeMoodText } from '../lib/api';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { MoodTag } from '../types/mood';
import { motion, AnimatePresence } from 'framer-motion';

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
          const tags = await analyzeMoodText(transcription);
          setSelectedTags(tags);
          toast.success('Audio processed successfully!');
        } catch (error) {
          toast.error('Failed to process audio');
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

      const newEntry = {
        user_id: user.id,
        text,
        tags: selectedTags,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('mood_entries')
        .insert(newEntry)
        .select()
        .single();

      if (error) throw error;

      // Вызываем событие обновления
      const event = new CustomEvent('moodEntryAdded');
      window.dispatchEvent(event);

      toast.success('Mood entry saved!');
    } catch (error) {
      console.error('Error saving mood entry:', error);
      toast.error('Failed to save entry. Please try again.');
      throw error;
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
    
    // Создаем предварительный просмотр записи
    setPreviewEntry({
      text,
      tags: selectedTags,
      isAnimating: true
    });

    // Уменьшаем задержку появления до 200мс
    await new Promise(resolve => setTimeout(resolve, 200));

    setIsProcessing(true);
    
    try {
      if (text.trim()) {
        const tags = await analyzeMoodText(text);
        setSelectedTags(prev => Array.from(new Set([...prev, ...tags])));
      }

      // Запускаем анимацию перемещения
      setPreviewEntry(prev => prev ? { ...prev, isAnimating: false } : null);

      // Уменьшаем задержку перемещения до 300мс
      await new Promise(resolve => setTimeout(resolve, 300));

      await saveMoodEntry();
      setText('');
      setSelectedTags([]);
      setPreviewEntry(null);
    } catch (error) {
      toast.error('Failed to save entry');
      console.error(error);
      setPreviewEntry(null);
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
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? "destructive" : "default"}
        >
          <Mic className="h-4 w-4" />
        </Button>
      </div>

      {/* Доступные теги */}
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

      {/* Зона выбранных тегов */}
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
              
              {/* Предварительный просмотр записи */}
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

              {/* Выбранные теги */}
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