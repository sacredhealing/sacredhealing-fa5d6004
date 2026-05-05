-- Sovereign Abundance Network — affiliate schema (run in Supabase SQL Editor)

create extension if not exists "pgcrypto";

create table if not exists public.affiliate_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  affiliate_code text not null unique,
  total_earnings numeric not null default 0,
  pending_balance numeric not null default 0,
  paid_out numeric not null default 0,
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists affiliate_profiles_code_idx on public.affiliate_profiles (affiliate_code);

create table if not exists public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_user_id uuid not null references auth.users (id) on delete cascade,
  referred_user_id uuid references auth.users (id) on delete set null,
  stripe_session_id text not null unique,
  stripe_payment_intent_id text,
  gross_amount numeric not null,
  commission_amount numeric not null,
  commission_rate numeric not null,
  currency text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists affiliate_commissions_affiliate_user_id_idx
  on public.affiliate_commissions (affiliate_user_id);

create table if not exists public.affiliate_payout_requests (
  id uuid primary key default gen_random_uuid(),
  affiliate_user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null,
  currency text not null default 'EUR',
  bank_details jsonb not null default '{}'::jsonb,
  status text not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists affiliate_payout_affiliate_user_id_idx
  on public.affiliate_payout_requests (affiliate_user_id);

create or replace function public.generate_affiliate_code()
returns text language sql as $$
  select upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

create or replace function public.ensure_affiliate_profile_for_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare new_code text;
begin
  if exists (select 1 from public.affiliate_profiles p where p.user_id = new.id) then
    return new;
  end if;
  loop
    new_code := public.generate_affiliate_code();
    exit when not exists (select 1 from public.affiliate_profiles p where p.affiliate_code = new_code);
  end loop;
  insert into public.affiliate_profiles (user_id, affiliate_code) values (new.id, new_code);
  return new;
end;
$$;

drop trigger if exists trg_profiles_affiliate_backfill on public.profiles;
create trigger trg_profiles_affiliate_backfill
after insert on public.profiles
for each row execute function public.ensure_affiliate_profile_for_profile();

do $$
declare r record; new_code text;
begin
  for r in
    select p.id from public.profiles p
    where not exists (select 1 from public.affiliate_profiles ap where ap.user_id = p.id)
  loop
    loop
      new_code := public.generate_affiliate_code();
      exit when not exists (select 1 from public.affiliate_profiles x where x.affiliate_code = new_code);
    end loop;
    insert into public.affiliate_profiles (user_id, affiliate_code) values (r.id, new_code);
  end loop;
end $$;

alter table public.affiliate_profiles enable row level security;
alter table public.affiliate_commissions enable row level security;
alter table public.affiliate_payout_requests enable row level security;

drop policy if exists affiliate_profiles_select_own on public.affiliate_profiles;
create policy affiliate_profiles_select_own on public.affiliate_profiles for select using (auth.uid() = user_id);

drop policy if exists affiliate_profiles_select_public on public.affiliate_profiles;
create policy affiliate_profiles_select_public on public.affiliate_profiles for select to anon, authenticated using (true);

drop policy if exists affiliate_profiles_update_own on public.affiliate_profiles;
create policy affiliate_profiles_update_own on public.affiliate_profiles for update using (auth.uid() = user_id);

drop policy if exists affiliate_commissions_select_own on public.affiliate_commissions;
create policy affiliate_commissions_select_own on public.affiliate_commissions for select using (auth.uid() = affiliate_user_id);

drop policy if exists affiliate_payout_crud_own on public.affiliate_payout_requests;
create policy affiliate_payout_crud_own on public.affiliate_payout_requests for all
  using (auth.uid() = affiliate_user_id) with check (auth.uid() = affiliate_user_id);

-- Optional: enables PostgREST embed affiliate_profiles → profiles(full_name) on landing page.
-- alter table public.affiliate_profiles
--   add constraint affiliate_profiles_profile_id_fkey
--   foreign key (user_id) references public.profiles (id) on delete cascade;
