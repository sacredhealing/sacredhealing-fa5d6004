create table if not exists public.soul_scans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  session_id uuid not null,
  scan_type text check (scan_type in ('before', 'after')),
  heart_rate integer,
  hrv_rmssd float,
  stress_index float,
  coherence_score float,
  prana_level float,
  voice_coherence float,
  nervous_system_state text,
  dosha_vata float,
  dosha_pitta float,
  dosha_kapha float,
  anahata_resonance float,
  vitality_index float,
  felt_heart_openness integer,
  felt_mental_clarity integer,
  felt_body_lightness integer,
  felt_prana_shakti integer,
  felt_inner_peace integer,
  created_at timestamptz default now()
);

create index if not exists soul_scans_user_id_idx on soul_scans(user_id, created_at desc);
create index if not exists soul_scans_session_idx on soul_scans(session_id);

alter table public.soul_scans enable row level security;

create policy "Users see own scans" on public.soul_scans
  for select using (auth.uid() = user_id);

create policy "Users insert own scans" on public.soul_scans
  for insert with check (auth.uid() = user_id);