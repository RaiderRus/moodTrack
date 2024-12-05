# Mindsetr

## Overview
Mindsetr is a modern web application for mood tracking, built with Next.js and Supabase. The application allows users to maintain a mood journal with support for text and audio entries, automatic emotion analysis, and a convenient filtering system.

## Tech Stack
- Frontend: Next.js 15.0+, React, TypeScript
- Styling: Tailwind CSS, Shadcn/ui
- Backend: FastAPI, Supabase (PostgreSQL, Auth, Storage)
- Deployment: Vercel

## Prerequisites
- Node.js 18.0 or higher
- Python 3.10 or higher
- Git
- GitHub, Vercel and Supabase accounts

## Project Setup

### 1. Fork and Clone Repository
1. Fork this repository through GitHub UI
2. Clone your fork:
```bash
git clone https://github.com/RaiderRus/moodTrack.git
cd moodTrack
```

### 2. Install Dependencies
```bash
npm install
pip install -r requirements.txt
```

### 3. Supabase Setup
1. Create a new project on [Supabase](https://supabase.com)
2. Go to Project settings -> API and copy the API key and project URL to `.env.local`
3. Go to Storage and Create a storage bucket named "audio-recordings" and make it public
4. Go to SQL Editor, paste the code from [schema.sql](https://github.com/RaiderRus/moodTrack/blob/main/schema.sql) file and click RUN

### 4. Environment Variables Setup
1. Copy `.env.example` to `.env.local`
2. Fill in the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```
3. Fill in OPENAI_API_KEY in `.env` in the `backend` folder   
```
OPENAI_API_KEY=your-openai-api-key
```

### 5. Deploy to Vercel
1. Create a new project on [Vercel](https://vercel.com)
2. Link it to your GitHub repository
3. Add environment variables in project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL`
   - `OPENAI_API_KEY`
4. Click "Deploy"

### 6. Supabase Authentication Setup
1. In the Supabase dashboard, go to Authentication → Providers
2. Enable Email provider:
   - Enable "Enable Email Signup"
   - Enable "Enable Email Confirmations"
   - Save changes
3. (Optional) Configure other providers (Google, GitHub)
4. In Email Templates section, configure email templates:
   - Confirmation Email
   - Magic Link Email
   - Reset Password Email
5. In URL Configuration section add:
   - Site URL: https://your-vercel-domain.com
   - Redirect URLs: 
     - https://your-vercel-domain.com/auth/callback
     - http://localhost:3000/auth/callback (for development)

## Database Structure

### Tables

1. `profiles` - User profiles
   - `id` (uuid, primary key) - User ID
   - `username` (text) - Username
   - `updated_at` (timestamp)

2. `mood_entries` - User mood entries
   - `id` (uuid, primary key) - Entry ID
   - `user_id` (uuid, foreign key) - User ID
   - `content` (text) - Entry content
   - `audio_url` (text) - Audio URL
   - `tags` (text[]) - Mood tags
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

### Storage

1. `audio_recordings` - Audio recordings for mood entries
   - Maximum file size: 50MB
   - Allowed file types: audio/wav, audio/mpeg, audio/webm

## Local Development

1. Start the development server:
   ```bash
   Frontend:
   npm run dev
   
   Backend:
   cd backend
   uvicorn main:app --reload
   ```
2. Open [http://localhost:3000](http://localhost:3000)
