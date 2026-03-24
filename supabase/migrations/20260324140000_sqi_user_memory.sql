-- SQI user memory (chat continuity across sessions).

create table if not exists public.sqi_user_memory (
  user_id uuid primary key references auth.users (id) on delete cascade,
  memory_text text not null default '',
  updated_at timestamptz not null default now()
);

comment on table public.sqi_user_memory is 'Optional long-term memory blob for Siddha-Quantum Intelligence (SQI) chat.';

create index if not exists sqi_user_memory_updated_at_idx on public.sqi_user_memory (updated_at desc);

alter table public.sqi_user_memory enable row level security;

create policy "sqi_user_memory_select_own"
  on public.sqi_user_memory for select
  using (auth.uid() = user_id);

create policy "sqi_user_memory_insert_own"
  on public.sqi_user_memory for insert
  with check (auth.uid() = user_id);

create policy "sqi_user_memory_update_own"
  on public.sqi_user_memory for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sqi_user_memory_delete_own"
  on public.sqi_user_memory for delete
  using (auth.uid() = user_id);
