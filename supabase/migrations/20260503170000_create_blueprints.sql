create table if not exists public.blueprints (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid references auth.users(id),
  email text not null,
  name text not null,
  slug text not null unique,
  status text not null default 'draft',
  prompt_version text not null,
  content jsonb not null default '{}',
  generated_at timestamptz,
  reviewed_at timestamptz,
  published_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blueprints_status_check check (status in ('draft', 'reviewed', 'published', 'sent'))
);

create index if not exists blueprints_session_id_idx on public.blueprints(session_id);
create unique index if not exists blueprints_session_id_unique_idx on public.blueprints(session_id);
create index if not exists blueprints_email_idx on public.blueprints(lower(email));
create index if not exists blueprints_status_created_at_idx on public.blueprints(status, created_at desc);

drop trigger if exists blueprints_set_updated_at on public.blueprints;
create trigger blueprints_set_updated_at
before update on public.blueprints
for each row
execute function public.set_updated_at();

alter table public.blueprints enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'blueprints'
      and policyname = 'Users can read own published blueprints'
  ) then
    create policy "Users can read own published blueprints"
    on public.blueprints
    for select
    to authenticated
    using (
      status in ('published', 'sent')
      and (
        auth.uid() = user_id
        or lower(coalesce(auth.jwt() ->> 'email', '')) = lower(email)
      )
    );
  end if;
end;
$$;

grant select on public.blueprints to authenticated;
