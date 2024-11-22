const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioBlob);

  const response = await fetch(`${API_URL}/api/transcribe`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return data.text;
}

export async function analyzeMoodText(text: string): Promise<string[]> {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();
  return data.tags;
}