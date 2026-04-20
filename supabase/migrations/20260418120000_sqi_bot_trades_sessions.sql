-- SQI Sovereign Bot: paper trade ledger + session runs (admin UI + optional Railway worker)

create table if not exists public.bot_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  trades_count int not null default 0,
  wins int not null default 0,
  losses int not null default 0,
  final_portfolio_value numeric,
  seed_balance numeric not null default 10,
  created_at timestamptz not null default now()
);

create table if not exists public.bot_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid references public.bot_sessions (id) on delete set null,
  action text not null,
  entry_price numeric not null,
  exit_price numeric,
  size_usd numeric not null,
  btc_amount numeric,
  fee_usd numeric,
  status text not null default 'open',
  strategy text,
  seed_balance numeric not null default 10,
  pnl_usd numeric,
  pnl_pct numeric,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_bot_sessions_user on public.bot_sessions (user_id);
create index if not exists idx_bot_trades_user on public.bot_trades (user_id);
create index if not exists idx_bot_trades_session on public.bot_trades (session_id);
create index if not exists idx_bot_trades_user_created on public.bot_trades (user_id, created_at desc);

alter table public.bot_sessions enable row level security;
alter table public.bot_trades enable row level security;

create policy "bot_sessions_select_own"
  on public.bot_sessions for select
  using (auth.uid() = user_id);

create policy "bot_sessions_insert_own"
  on public.bot_sessions for insert
  with check (auth.uid() = user_id);

create policy "bot_sessions_update_own"
  on public.bot_sessions for update
  using (auth.uid() = user_id);

create policy "bot_trades_select_own"
  on public.bot_trades for select
  using (auth.uid() = user_id);

create policy "bot_trades_insert_own"
  on public.bot_trades for insert
  with check (auth.uid() = user_id);

create policy "bot_trades_update_own"
  on public.bot_trades for update
  using (auth.uid() = user_id);
