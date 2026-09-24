-- Run this once in Supabase Dashboard → SQL Editor → New query.
-- The backend's service-role key is kept only in Render's server environment.
create table if not exists public.quizly_state (
  id integer primary key check (id = 1),
  body jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.quizly_state enable row level security;
revoke all on table public.quizly_state from anon, authenticated;
grant all on table public.quizly_state to service_role;
