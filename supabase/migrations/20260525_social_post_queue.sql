-- SQI Social Post Queue Table
create table if not exists public.social_post_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  caption text,
  platforms text[],
  media_type text,
  media_url text,
  scheduled_for timestamptz,
  profile text default 'kritagya',
  results jsonb,
  status text default 'published',
  created_at timestamptz default now()
);

alter table public.social_post_queue enable row level security;

create policy "Admin full access" on public.social_post_queue
  using (auth.uid() = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17'::uuid);

create policy "User own posts" on public.social_post_queue
  using (auth.uid() = user_id);
