"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mic, Send, Loader2 } from "lucide-react";
import { moodTags } from '../config/mood-tags';
import { transcribeAudio, analyzeMoodText } from '../lib/api';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function MoodEntry() {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
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
          await saveMoodEntry(transcription, tags);
          toast.success('Mood entry saved!');
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

  const saveMoodEntry = async (text: string, tags: string[]) => {
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

      const { error } = await supabase.from('mood_entries').insert({
        user_id: user.id,
        text,
        tags,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving mood entry:', error);
      toast.error('Failed to save entry. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const tags = await analyzeMoodText(text);
      await saveMoodEntry(text, tags);
      setText('');
      toast.success('Mood entry saved!');
    } catch (error) {
      toast.error('Failed to save entry');
      console.error(error);
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
        <Button onClick={handleSubmit} disabled={isProcessing || !text.trim()}>
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.values(moodTags).flat().map((tag) => (
          <Button
            key={tag.id}
            variant="outline"
            size="sm"
            className={`${tag.color} text-white`}
            onClick={() => saveMoodEntry("", [tag.id])}
          >
            {tag.name}
          </Button>
        ))}
      </div>
    </Card>
  );
}