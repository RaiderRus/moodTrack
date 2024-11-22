import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioBlob);
  formData.append('model', 'whisper-1');

  const response = await openai.audio.transcriptions.create({
    file: audioBlob as any,
    model: 'whisper-1',
  });

  return response.text;
}

export async function analyzeMoodText(text: string) {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a mood analysis expert. Analyze the given text and return relevant mood tags from the following categories:
          Emotions: happy, excited, calm, anxious, sad, angry
          Activities: work, exercise, social, rest
          Contexts: home, work, outside
          Return only the tag IDs in a JSON array.`,
      },
      {
        role: 'user',
        content: text,
      },
    ],
    model: 'gpt-3.5-turbo',
  });

  return JSON.parse(completion.choices[0].message.content || '[]') as string[];
}