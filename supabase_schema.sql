-- TubeIntel Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query → Run
-- Supabase Auth manages the auth.users table automatically — no need to create it.

-- ─── user_keys: per-user BYOK API keys ────────────────────────────────────────
create table if not exists public.user_keys (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  gemini_api_key   text,
  groq_api_key     text,
  notion_api_key   text,
  notion_database_id text,
  updated_at       timestamptz default now()
);

alter table public.user_keys enable row level security;

create policy "Users can read their own keys"
  on public.user_keys for select
  using (auth.uid() = user_id);

create policy "Users can insert their own keys"
  on public.user_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own keys"
  on public.user_keys for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─── modules: generated learning modules ──────────────────────────────────────
create table if not exists public.modules (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade,
  video_id         text not null,
  video_title      text,
  notion_page_url  text,
  notion_error     text,
  truncated        boolean default false,
  summary          jsonb not null,
  created_at       timestamptz default now()
);

alter table public.modules enable row level security;

create policy "Users can read their own modules"
  on public.modules for select
  using (auth.uid() = user_id);

create policy "Users can insert their own modules"
  on public.modules for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own modules"
  on public.modules for delete
  using (auth.uid() = user_id);


-- ─── Optional: index for fast per-user dashboard queries ──────────────────────
create index if not exists modules_user_id_created_at
  on public.modules (user_id, created_at desc);
