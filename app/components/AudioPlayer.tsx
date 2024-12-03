"use client";

import { useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { formatDuration } from '../lib/utils';

interface AudioPlayerProps {
  url: string;
  duration: number;
}

export function AudioPlayer({ url, duration }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={togglePlayback}
        className="p-1 rounded-full hover:bg-slate-100 transition-colors"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 fill-black" />
        ) : (
          <Play className="h-4 w-4 fill-black" />
        )}
      </button>
      <span className="text-xs text-muted-foreground">
        {formatDuration(currentTime)} / {formatDuration(duration)}
      </span>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
    </div>
  );
}