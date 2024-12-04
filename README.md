# Mindsetr - Mood Tracking Application

Mindsetr - это современное веб-приложение для отслеживания настроения, построенное на Next.js и Supabase. Приложение позволяет пользователям вести дневник настроения с поддержкой текстовых и аудио записей, автоматическим анализом эмоций и удобной системой фильтрации.

## Технологический стек

- Frontend: Next.js 15.0+, React, TypeScript
- Стилизация: Tailwind CSS, Shadcn/ui
- Backend: Supabase (PostgreSQL, Auth, Storage)
- Деплой: Vercel

## Предварительные требования

- Node.js 18.0 или выше
- Python 3.8 или выше (для настройки Supabase)
- Git
- Аккаунты на GitHub, Vercel и Supabase

## Развертывание проекта

### 1. Настройка Supabase

1. Создайте новый проект на [Supabase](https://supabase.com)
2. Установите Python зависимости:
   ```bash
   pip install supabase
   ```
3. В файле `supabase_setup.py` укажите URL и ключ вашего проекта:
   ```python
   SUPABASE_URL = "your-project-url"
   SUPABASE_KEY = "your-service-role-key"
   ```
4. Запустите скрипт настройки базы данных:
   ```bash
   python supabase_setup.py
   ```

### 2. Настройка аутентификации в Supabase

1. В панели управления Supabase перейдите в Authentication → Providers
2. Включите Email provider:
   - Включите "Enable Email Signup"
   - Включите "Enable Email Confirmations"
   - Сохраните изменения
3. (Опционально) Настройте другие провайдеры (Google, GitHub)
4. В разделе Email Templates настройте шаблоны писем:
   - Confirmation Email
   - Magic Link Email
   - Reset Password Email
5. В разделе URL Configuration добавьте:
   - Site URL: https://your-vercel-domain.com
   - Redirect URLs: 
     - https://your-vercel-domain.com/auth/callback
     - http://localhost:3000/auth/callback (для разработки)

### 3. Форк и клонирование репозитория

1. Форкните этот репозиторий через GitHub UI
2. Клонируйте ваш форк:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mindsetr.git
   cd mindsetr
   ```

### 4. Установка зависимостей

```bash
npm install
```

### 5. Настройка переменных окружения

1. Скопируйте `.env.example` в `.env.local`
2. Заполните следующие переменные:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 6. Деплой на Vercel

1. Создайте новый проект на [Vercel](https://vercel.com)
2. Свяжите его с вашим GitHub репозиторием
3. Добавьте переменные окружения в настройках проекта:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Нажмите "Deploy"

## Структура базы данных

### Таблицы

1. `profiles` - Профили пользователей
   - `id` (uuid, PK) - ID пользователя
   - `username` (text) - Имя пользователя
   - `updated_at` (timestamp)

2. `mood_entries` - Записи настроения
   - `id` (uuid, PK) - ID записи
   - `user_id` (uuid, FK) - ID пользователя
   - `content` (text) - Текст записи
   - `audio_url` (text) - URL аудио записи
   - `tags` (text[]) - Теги настроения
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

### Хранилища

1. `audio_recordings` - Хранилище аудио записей
   - Максимальный размер файла: 50MB
   - Разрешенные типы: audio/wav, audio/mpeg, audio/webm

## Локальная разработка

1. Запустите сервер разработки:
   ```bash
   npm run dev
   ```
2. Откройте [http://localhost:3000](http://localhost:3000)

## Лицензия

MIT
