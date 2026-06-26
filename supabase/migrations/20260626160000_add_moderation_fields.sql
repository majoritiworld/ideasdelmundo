alter table public.sessions
add column if not exists moderation_strikes integer not null default 0;

alter table public.sessions
add column if not exists termination_reason text;

alter table public.sessions drop constraint if exists sessions_status_check;
alter table public.sessions add constraint sessions_status_check
  check (status in ('started', 'in_progress', 'completed', 'abandoned', 'terminated'));

-- Atomic strike increment. Never increments a terminated session.
-- Returns the new strike count (or the existing count if already terminated).
create or replace function public.increment_session_strike(p_session_id uuid)
returns integer
language plpgsql
as $$
declare
  new_strikes integer;
begin
  update public.sessions
  set moderation_strikes = moderation_strikes + 1
  where id = p_session_id
    and status <> 'terminated'
  returning moderation_strikes into new_strikes;

  if new_strikes is null then
    select moderation_strikes into new_strikes
    from public.sessions
    where id = p_session_id;
  end if;

  return new_strikes;
end;
$$;

grant execute on function public.increment_session_strike(uuid) to anon, authenticated, service_role;
