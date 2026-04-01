-- Platform OAuth connections
create table if not exists public.platform_connections (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users on delete cascade,
  platform         text        not null,  -- 'gumroad' | 'youtube'
  access_token     text        not null,
  refresh_token    text,
  token_expires_at timestamptz,
  platform_user_id text,
  platform_username text,
  last_synced_at   timestamptz,
  sync_error       text,
  created_at       timestamptz not null default now(),
  unique (user_id, platform)
);

alter table public.platform_connections enable row level security;

-- Client can see connection status but never tokens
create policy "Users can view own connections"
  on public.platform_connections for select
  using (auth.uid() = user_id);

create policy "Users can delete own connections"
  on public.platform_connections for delete
  using (auth.uid() = user_id);

-- Inserts/updates go through server-side API routes (service role bypasses RLS)
