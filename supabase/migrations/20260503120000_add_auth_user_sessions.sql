alter table public.sessions
add column if not exists user_id uuid references auth.users(id);

create index if not exists sessions_user_id_status_created_at_idx
on public.sessions(user_id, status, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'sessions'
      and policyname = 'Users can read own sessions'
  ) then
    create policy "Users can read own sessions"
    on public.sessions
    for select
    to authenticated
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'sessions'
      and policyname = 'Users can update own sessions'
  ) then
    create policy "Users can update own sessions"
    on public.sessions
    for update
    to authenticated
    using (auth.uid() = user_id);
  end if;
end;
$$;

grant select on public.sessions to authenticated;
