from supabase import create_client, Client

# Конфигурация Supabase
SUPABASE_URL = "your-project-url"
SUPABASE_KEY = "your-service-role-key"

# Инициализация клиента Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def setup_database():
    """Настройка базы данных и политик"""
    
    # Создание таблицы profiles
    supabase.table("profiles").create({
        "id": "uuid references auth.users on delete cascade primary key",
        "username": "text",
        "updated_at": "timestamp with time zone default timezone('utc'::text, now())"
    })

    # Создание таблицы mood_entries
    supabase.table("mood_entries").create({
        "id": "uuid default uuid_generate_v4() primary key",
        "user_id": "uuid references auth.users not null",
        "content": "text",
        "audio_url": "text",
        "tags": "text[]",
        "created_at": "timestamp with time zone default timezone('utc'::text, now())",
        "updated_at": "timestamp with time zone default timezone('utc'::text, now())"
    })

    # Создание хранилища для аудио файлов
    supabase.storage.create_bucket("audio_recordings", {
        "public": False,
        "file_size_limit": 52428800,  # 50MB
        "allowed_mime_types": ["audio/wav", "audio/mpeg", "audio/webm"]
    })

    # Настройка RLS политик

    # Политики для profiles
    profile_policies = [
        # Пользователи могут читать все профили
        """
        create policy "Profiles are viewable by everyone" on profiles
        for select using (true);
        """,
        
        # Пользователи могут обновлять только свой профиль
        """
        create policy "Users can update own profile" on profiles
        for update using (auth.uid() = id);
        """,

        # Автоматическое создание профиля при регистрации
        """
        create policy "Users can insert their own profile" on profiles
        for insert with check (auth.uid() = id);
        """
    ]

    # Политики для mood_entries
    mood_policies = [
        # Пользователи могут читать только свои записи
        """
        create policy "Users can view own entries" on mood_entries
        for select using (auth.uid() = user_id);
        """,
        
        # Пользователи могут создавать записи только для себя
        """
        create policy "Users can create own entries" on mood_entries
        for insert with check (auth.uid() = user_id);
        """,
        
        # Пользователи могут обновлять только свои записи
        """
        create policy "Users can update own entries" on mood_entries
        for update using (auth.uid() = user_id);
        """,
        
        # Пользователи могут удалять только свои записи
        """
        create policy "Users can delete own entries" on mood_entries
        for delete using (auth.uid() = user_id);
        """
    ]

    # Политики для хранилища аудио
    audio_policies = [
        # Пользователи могут загружать файлы
        """
        create policy "Users can upload audio files" on storage.objects
        for insert with check (bucket_id = 'audio_recordings' and auth.role() = 'authenticated');
        """,
        
        # Пользователи могут читать только свои файлы
        """
        create policy "Users can read own audio files" on storage.objects
        for select using (bucket_id = 'audio_recordings' and auth.uid()::text = (storage.foldername(name))[1]);
        """,
        
        # Пользователи могут удалять только свои файлы
        """
        create policy "Users can delete own audio files" on storage.objects
        for delete using (bucket_id = 'audio_recordings' and auth.uid()::text = (storage.foldername(name))[1]);
        """
    ]

    # Включение RLS для таблиц
    supabase.query("alter table profiles enable row level security;")
    supabase.query("alter table mood_entries enable row level security;")

    # Применение политик
    for policy in profile_policies:
        supabase.query(policy)
    
    for policy in mood_policies:
        supabase.query(policy)
    
    for policy in audio_policies:
        supabase.query(policy)

    # Создание триггера для автоматического создания профиля
    supabase.query("""
    create function public.handle_new_user()
    returns trigger as $$
    begin
        insert into public.profiles (id)
        values (new.id);
        return new;
    end;
    $$ language plpgsql security definer;
    """)

    supabase.query("""
    create trigger on_auth_user_created
        after insert on auth.users
        for each row execute procedure public.handle_new_user();
    """)

    print("Database setup completed successfully!")

if __name__ == "__main__":
    setup_database()
