import { supabase } from '@/app/lib/supabaseClient';

const isDevelopment = process.env.NODE_ENV === 'development';
const API_URL = isDevelopment 
  ? 'http://localhost:8000'
  : process.env.NEXT_PUBLIC_API_URL;

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    console.log('Sending request to:', `${API_URL}/api/transcribe`);
    const formData = new FormData();
    formData.append('file', audioBlob);

    const response = await fetch(`${API_URL}/api/transcribe`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        // Don't set Content-Type as it's automatically set for FormData
      },
      credentials: 'include', // Add cookie support
      mode: 'cors', // Explicitly specify CORS mode
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
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

  console.log('Fetched entries:', data); // Debug log
  return data;
}

export async function saveAudioRecording(audioBlob: Blob, moodEntryId: string): Promise<{ url: string; duration: number }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let uploadBlob = audioBlob;
    const blobType = audioBlob.type || 'audio/webm';
    console.log('Original audio blob type:', blobType);
    
    if (!blobType.includes('webm')) {
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        uploadBlob = new Blob([arrayBuffer], { type: 'audio/webm' });
        console.log('Converted blob to webm format');
      } catch (convError) {
        console.error('Error converting blob:', convError);
      }
    }

    // Get file size in bytes and estimated duration
    const fileSizeInBytes = uploadBlob.size;
    // WebM Opus uses approximately 24 KB/s (24576 bytes/s)
    const bytesPerSecond = 24576;
    const estimatedDuration = Math.ceil(fileSizeInBytes / bytesPerSecond * 1.5); // Apply correction factor
    console.log('File size:', fileSizeInBytes, 'bytes');
    console.log('Estimated duration from file size:', estimatedDuration, 'seconds');

    const fileName = `${user.id}/${moodEntryId}/${Date.now()}.webm`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-recordings')
      .upload(fileName, uploadBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'audio/webm',
      });

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('audio-recordings')
      .getPublicUrl(fileName);

    // Use estimated duration, ensuring it's within reasonable limits
    const finalDuration = Math.min(Math.max(1, estimatedDuration), 300); // Not more than 5 minutes
    console.log('Final duration:', finalDuration, 'seconds');

    const { error: dbError } = await supabase
      .from('audio_recordings')
      .insert({
        user_id: user.id,
        mood_entry_id: moodEntryId,
        audio_url: publicUrl,
        duration: finalDuration
      });

    if (dbError) {
      console.error('Database error details:', dbError);
      throw dbError;
    }

    return { url: publicUrl, duration: finalDuration };
  } catch (error: any) {
    console.error('Error saving audio recording:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}