alter table public.sessions
add column if not exists completion_notified_at timestamptz;
