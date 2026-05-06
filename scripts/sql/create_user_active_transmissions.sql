-- ═══════════════════════════════════════════════════════
-- SQI: user_active_transmissions table
-- Run this ONCE in Lovable's Supabase SQL editor
-- ═══════════════════════════════════════════════════════

create table if not exists public.user_active_transmissions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  activations jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

-- One row per user
create unique index if not exists user_active_transmissions_user_idx
  on public.user_active_transmissions (user_id);

-- Row Level Security
alter table public.user_active_transmissions enable row level security;

-- Users can only see and update their own row
create policy "Users own their transmissions"
  on public.user_active_transmissions for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════
-- Done. The frontend code is already written to use this
-- table — it just silently failed because the table
-- didn't exist. After running this SQL, all three issues
-- (scan persistence, 24/7 sync, chat bridge) activate.
-- ═══════════════════════════════════════════════════════
