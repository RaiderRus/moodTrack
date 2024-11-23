import { supabase } from '@/app/lib/supabaseClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    console.log('Sending audio to:', `${API_URL}/api/transcribe`);
    const formData = new FormData();
    formData.append('file', audioBlob);

    const response = await fetch(`${API_URL}/api/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('Transcribe error response:', response.status, await response.text());
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
    console.log('Sending text for analysis:', text);
    const response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.error('Analyze error response:', response.status, await response.text());
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