-- Creating mood_entries table
create table public.mood_entries (
  id uuid not null default gen_random_uuid(),
  user_id uuid null,
  text text null,
  tags text[] null default '{}'::text[],
  created_at timestamp with time zone null default timezone('utc'::text, now()),
  constraint mood_entries_pkey primary key (id),
  constraint mood_entries_user_id_fkey foreign key (user_id) references auth.users(id)
);

-- Creating audio_recordings table
create table public.audio_recordings (
  id uuid not null default extensions.uuid_generate_v4(),
  user_id uuid not null,
  mood_entry_id uuid not null,
  audio_url text not null,
  duration integer not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint audio_recordings_pkey primary key (id),
  constraint audio_recordings_mood_entry_id_fkey foreign key (mood_entry_id) references public.mood_entries(id),
  constraint audio_recordings_user_id_fkey foreign key (user_id) references auth.users(id)
);

-- Creating profiles table
create table public.profiles (
  id uuid not null,
  avatar_url text null,
  updated_at timestamp with time zone null,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade
);

-- Enable RLS for mood_entries table
alter table public.mood_entries enable row level security;

-- Policies for mood_entries
drop policy if exists "Users can view their own entries" on public.mood_entries;
create policy "Users can view their own entries" on public.mood_entries for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own entries" on public.mood_entries;
create policy "Users can create their own entries" on public.mood_entries for insert
  with check (auth.uid() = user_id);

-- Enable RLS for audio_recordings table
alter table public.audio_recordings enable row level security;

-- Policies for audio_recordings
drop policy if exists "Users can view their own audio recordings" on public.audio_recordings;
create policy "Users can view their own audio recordings" on public.audio_recordings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own audio recordings" on public.audio_recordings;
create policy "Users can create their own audio recordings" on public.audio_recordings for insert
  with check (auth.uid() = user_id);

-- Enable RLS for profiles table
alter table public.profiles enable row level security;

-- Policies for profiles
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update
  with check (auth.uid() = id);

-- Policies for storage bucket audio-recordings
create policy "Users can upload their own audio files" on storage.objects for insert
  with check (auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read their own audio files" on storage.objects for select
  using (auth.uid()::text = (storage.foldername(name))[1]);