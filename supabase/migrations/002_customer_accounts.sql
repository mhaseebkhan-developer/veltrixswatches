-- VELTRIXS WATCHES customer accounts (additive migration, run ONCE in SQL Editor).
-- Preserves existing orders, stock, auth.users, admin privileges and COD functions.
begin;
create table if not exists public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name)<=100),
  phone text not null default '' check (char_length(phone)<=40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home' check (char_length(label) between 1 and 40),
  recipient_name text not null default '' check (char_length(recipient_name)<=100),
  phone text not null default '' check (char_length(phone)<=40),
  address_line text not null check (char_length(address_line) between 5 and 240),
  city text not null check (char_length(city) between 2 and 100),
  province text not null default '' check (char_length(province)<=100),
  postal_code text not null default '' check (char_length(postal_code)<=30),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_addresses_user_idx on public.customer_addresses(user_id);
-- Only one default shipping address per user.
create unique index if not exists customer_addresses_one_default_idx on public.customer_addresses(user_id) where is_default;
alter table public.customer_profiles enable row level security;
alter table public.customer_addresses enable row level security;
revoke all on public.customer_profiles, public.customer_addresses from anon, authenticated;
grant select, insert, update on public.customer_profiles to authenticated;
grant select, insert, update, delete on public.customer_addresses to authenticated;
drop policy if exists "Customer profile select self" on public.customer_profiles;
create policy "Customer profile select self" on public.customer_profiles for select to authenticated
  using (id=(select auth.uid()));
drop policy if exists "Customer profile insert self" on public.customer_profiles;
create policy "Customer profile insert self" on public.customer_profiles for insert to authenticated
  with check (id=(select auth.uid()));
drop policy if exists "Customer profile update self" on public.customer_profiles;
create policy "Customer profile update self" on public.customer_profiles for update to authenticated
  using (id=(select auth.uid())) with check (id=(select auth.uid()));
drop policy if exists "Customer address select self" on public.customer_addresses;
create policy "Customer address select self" on public.customer_addresses for select to authenticated
  using (user_id=(select auth.uid()));
drop policy if exists "Customer address insert self" on public.customer_addresses;
create policy "Customer address insert self" on public.customer_addresses for insert to authenticated
  with check (user_id=(select auth.uid()));
drop policy if exists "Customer address update self" on public.customer_addresses;
create policy "Customer address update self" on public.customer_addresses for update to authenticated
  using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
drop policy if exists "Customer address delete self" on public.customer_addresses;
create policy "Customer address delete self" on public.customer_addresses for delete to authenticated
  using (user_id=(select auth.uid()));
-- Tracking is explicitly entered by staff; no fabricated courier data.
alter table public.orders add column if not exists tracking_carrier text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_url text;
-- Existing owner-or-admin SELECT policy governs order tracking visibility.
-- Keep order UPDATE admin-only: customers cannot change status/tracking.
commit;
