import { supabase } from '@/app/lib/supabaseClient';

const isDevelopment = process.env.NODE_ENV === 'development';
const API_URL = isDevelopment 
  ? 'http://localhost:8000'
  : process.env.NEXT_PUBLIC_API_URL || 'https://mood-track-orpin.vercel.app';

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    console.log('Sending request to:', `${API_URL}/api/transcribe`);
    const formData = new FormData();
    formData.append('file', audioBlob);

    const response = await fetch(`${API_URL}/api/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    throw error;
  }
}

export async function analyzeMoodText(text: string): Promise<string[]> {
  try {
    console.log('Sending request to:', `${API_URL}/api/analyze`);
    const response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.tags;
  } catch (error) {
    console.error('Error in analyzeMoodText:', error);
    throw error;
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    console.log('Checking backend health at:', API_URL);
    const response = await fetch(`${API_URL}/api/health`);
    console.log('Health check response:', response.status);
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

export async function getMoodEntries() {
  const { data, error } = await supabase
    .from('mood_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching entries:', error);
    return [];
  }

  console.log('Fetched entries:', data); // Отладочный лог
  return data;
}

export async function saveAudioRecording(audioBlob: Blob, moodEntryId: string): Promise<{ url: string; duration: number }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Создаем уникальное имя файла
    const fileName = `${user.id}/${moodEntryId}/${Date.now()}.webm`;
    
    // Загружаем файл в storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-recordings')
      .upload(fileName, audioBlob);

    if (uploadError) throw uploadError;

    // Получаем публичный URL
    const { data: { publicUrl } } = supabase.storage
      .from('audio-recordings')
      .getPublicUrl(fileName);

    // Получаем длительность аудио
    const audioElement = new Audio();
    audioElement.src = URL.createObjectURL(audioBlob);
    
    const duration = await new Promise<number>((resolve) => {
      audioElement.addEventListener('loadedmetadata', () => {
        resolve(audioElement.duration);
      });
    });

    // Сохраняем информацию в базу данных
    const { error: dbError } = await supabase
      .from('audio_recordings')
      .insert({
        user_id: user.id,
        mood_entry_id: moodEntryId,
        audio_url: publicUrl,
        duration: Math.round(duration)
      });

    if (dbError) throw dbError;

    return { url: publicUrl, duration };
  } catch (error) {
    console.error('Error saving audio recording:', error);
    throw error;
  }
}