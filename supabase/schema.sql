-- Database Migration Schema for Solana Private Sale Launchpad
-- Table: participants

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  token_slug text not null,
  email text not null,
  telegram_id text not null,
  wallet_address text not null,
  full_name text not null,
  commit_amount numeric not null,
  commit_currency text not null,
  sol_balance numeric not null,
  eligible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migration for existing databases: add new columns if missing
alter table participants add column if not exists full_name text;
alter table participants add column if not exists commit_amount numeric;
alter table participants add column if not exists commit_currency text;

-- Unique index to prevent duplicate wallet per token private sale
create unique index if not exists participants_token_wallet_unique
on participants(token_slug, wallet_address);

-- Unique index to prevent duplicate email per token private sale
create unique index if not exists participants_token_email_unique
on participants(token_slug, email);

-- Lookup indexes for queries
create index if not exists participants_email_idx
on participants(email);

create index if not exists participants_telegram_idx
on participants(telegram_id);

-- Enable RLS (Row Level Security) - browser client disabled from direct write
alter table participants enable row level security;

-- Only service role (Edge Function) can insert/read
create policy "Service role access only" on participants
for all using (false);
