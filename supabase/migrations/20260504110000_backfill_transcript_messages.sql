alter table public.sessions add column if not exists conversations jsonb not null default '{}';
alter table public.sessions add column if not exists current_section integer default 1;
alter table public.sessions add column if not exists answered_question_ids integer[] not null default '{}';
alter table public.sessions add column if not exists meditation_completed boolean not null default false;

with extracted_messages as (
  select
    sessions.id as session_id,
    conversation.question_id::integer as card_id,
    message.value as message,
    message.ordinality as message_index,
    case
      when message.value ->> 'timestamp' ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}'
        then (message.value ->> 'timestamp')::timestamptz
      else sessions.created_at
    end as message_created_at
  from public.sessions
  cross join lateral jsonb_each(
    case
      when jsonb_typeof(sessions.conversations) = 'object' then sessions.conversations
      else '{}'::jsonb
    end
  ) as conversation(question_id, messages)
  cross join lateral jsonb_array_elements(
    case
      when jsonb_typeof(conversation.messages) = 'array' then conversation.messages
      else '[]'::jsonb
    end
  ) with ordinality as message(value, ordinality)
  where conversation.question_id ~ '^\d+$'
    and (message.value ->> 'role') in ('guide', 'user')
    and jsonb_typeof(message.value -> 'text') = 'string'
    and not exists (
      select 1
      from public.transcript_messages
      where transcript_messages.session_id = sessions.id
    )
),
sequenced_messages as (
  select
    session_id,
    card_id,
    message,
    message_created_at,
    (row_number() over (
      partition by session_id
      order by message_created_at asc, card_id asc, message_index asc
    ) - 1)::integer as sequence
  from extracted_messages
)
insert into public.transcript_messages (
  session_id,
  card_id,
  role,
  content,
  sequence,
  metadata,
  created_at
)
select
  session_id,
  card_id,
  message ->> 'role',
  message ->> 'text',
  sequence,
  jsonb_build_object(
    'source', 'sessions.conversations',
    'original_timestamp', message ->> 'timestamp'
  ),
  message_created_at
from sequenced_messages;
