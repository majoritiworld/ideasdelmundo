alter table public.sessions
add column if not exists seen_pause_hint boolean not null default false;

alter table public.sessions
add column if not exists core_answered integer[] not null default '{}';
