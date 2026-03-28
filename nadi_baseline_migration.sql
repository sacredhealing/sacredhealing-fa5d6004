-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Nadi Baseline Table                                            ║
-- ║  Run once in Supabase SQL Editor                               ║
-- ║  Stores each user's permanent Nadi scan results                ║
-- ╚══════════════════════════════════════════════════════════════════╝

create table if not exists public.nadi_baselines (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  active_nadis     integer not null default 0,
  active_sub_nadis integer not null default 0,
  blockage_pct     integer not null default 0,
  dominant_dosha   text    not null default 'Vata',
  primary_blockage text    not null default 'Heart/Anahata Nadi',
  planetary_align  text    not null default '',
  herb_of_today    text    not null default '',
  bio_reading      text    not null default '',
  remedies         jsonb   not null default '[]',
  scanned_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Only one baseline per user (upsert by user_id)
create unique index if not exists nadi_baselines_user_id_idx
  on public.nadi_baselines (user_id);

-- RLS: users can only see/update their own baseline
alter table public.nadi_baselines enable row level security;

drop policy if exists "Users can read own baseline"   on public.nadi_baselines;
drop policy if exists "Users can upsert own baseline" on public.nadi_baselines;

create policy "Users can read own baseline"
  on public.nadi_baselines for select
  using (auth.uid() = user_id);

create policy "Users can upsert own baseline"
  on public.nadi_baselines for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
