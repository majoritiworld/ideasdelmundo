create extension if not exists pgcrypto;

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'started',
  current_screen text,
  name text,
  email text,
  source text,
  user_agent text,
  referrer text,
  visited_card_ids integer[] not null default '{}',
  cards_explored_count integer not null default 0,
  intake_completed_at timestamptz,
  first_card_opened_at timestamptz,
  completed_at timestamptz,
  report_status text not null default 'pending',
  draft_report text,
  report_generated_at timestamptz,
  report_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_status_check check (status in ('started', 'in_progress', 'completed', 'abandoned')),
  constraint sessions_report_status_check check (report_status in ('pending', 'drafted', 'reviewed', 'sent'))
);

alter table public.sessions add column if not exists status text not null default 'started';
alter table public.sessions add column if not exists current_screen text;
alter table public.sessions add column if not exists name text;
alter table public.sessions add column if not exists email text;
alter table public.sessions add column if not exists source text;
alter table public.sessions add column if not exists user_agent text;
alter table public.sessions add column if not exists referrer text;
alter table public.sessions add column if not exists visited_card_ids integer[] not null default '{}';
alter table public.sessions add column if not exists cards_explored_count integer not null default 0;
alter table public.sessions add column if not exists intake_completed_at timestamptz;
alter table public.sessions add column if not exists first_card_opened_at timestamptz;
alter table public.sessions add column if not exists completed_at timestamptz;
alter table public.sessions add column if not exists report_status text not null default 'pending';
alter table public.sessions add column if not exists draft_report text;
alter table public.sessions add column if not exists report_generated_at timestamptz;
alter table public.sessions add column if not exists report_sent_at timestamptz;
alter table public.sessions add column if not exists created_at timestamptz not null default now();
alter table public.sessions add column if not exists updated_at timestamptz not null default now();

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.transcript_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  card_id integer,
  role text not null,
  content text not null,
  sequence integer not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint transcript_messages_role_check check (role in ('guide', 'user'))
);

create index if not exists sessions_status_created_at_idx on public.sessions(status, created_at desc);
create index if not exists sessions_email_idx on public.sessions(email);
create index if not exists events_session_id_created_at_idx on public.events(session_id, created_at);
create index if not exists transcript_messages_session_id_sequence_idx on public.transcript_messages(session_id, sequence);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
before update on public.sessions
for each row
execute function public.set_updated_at();

alter table public.sessions enable row level security;
alter table public.events enable row level security;
alter table public.transcript_messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sessions' and policyname = 'anon can create sessions'
  ) then
    create policy "anon can create sessions"
    on public.sessions
    for insert
    to anon
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sessions' and policyname = 'anon can update sessions'
  ) then
    create policy "anon can update sessions"
    on public.sessions
    for update
    to anon
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'events' and policyname = 'anon can create events'
  ) then
    create policy "anon can create events"
    on public.events
    for insert
    to anon
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'transcript_messages' and policyname = 'anon can create transcript messages'
  ) then
    create policy "anon can create transcript messages"
    on public.transcript_messages
    for insert
    to anon
    with check (true);
  end if;
end;
$$;

grant usage on schema public to anon, authenticated;
grant insert, update on public.sessions to anon, authenticated;
grant insert on public.events to anon, authenticated;
grant insert on public.transcript_messages to anon, authenticated;
