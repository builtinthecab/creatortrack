-- CreatorTrack Database Schema
-- Run this entire file in your Supabase project's SQL editor.

-- ──────────────────────────────────────────────────────────────
-- PROFILES  (extends auth.users)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                  uuid primary key references auth.users on delete cascade,
  name                text        not null,
  platforms           jsonb       not null default '{}',
  onboarded           boolean     not null default false,
  subscription_status text        not null default 'free',
  stripe_customer_id  text,
  created_at          timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Trigger: auto-create profile row on signup (runs as security definer, bypasses RLS)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, platforms, onboarded)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    '{}',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- STATS  (one row per user per day)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.stats (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users on delete cascade,
  date          date        not null,
  platform_data jsonb       not null default '{}',
  created_at    timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.stats enable row level security;

create policy "Users can manage own stats" on public.stats for all using (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- GOALS
-- ──────────────────────────────────────────────────────────────
create table if not exists public.goals (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users on delete cascade,
  label      text        not null,
  platform   text        not null,
  metric     text        not null,
  target     numeric     not null,
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "Users can manage own goals" on public.goals for all using (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- STREAKS
-- ──────────────────────────────────────────────────────────────
create table if not exists public.streaks (
  user_id     uuid    primary key references auth.users on delete cascade,
  current     integer not null default 0,
  longest     integer not null default 0,
  last_posted date,
  updated_at  timestamptz not null default now()
);

alter table public.streaks enable row level security;

create policy "Users can manage own streak" on public.streaks for all using (auth.uid() = user_id);
