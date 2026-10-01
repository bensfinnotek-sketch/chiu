create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  display_name text not null default '',
  avatar text,
  native_language text not null default 'vi',
  target_language text not null default 'zh-CN',
  level text not null default 'new',
  hsk_level integer not null default 1 check (hsk_level between 1 and 6),
  goals text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id text primary key,
  hsk_level integer,
  title text not null,
  description text,
  lesson_type text not null default 'mixed',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vocabulary (
  id text primary key,
  hanzi text not null,
  pinyin text not null,
  meaning_vi text not null,
  hsk_level integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grammar (
  id text primary key,
  pattern text not null,
  meaning text not null,
  explanation_vi text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null references public.lessons(id) on delete cascade,
  progress integer not null default 0 check (progress between 0 and 100),
  completed_sections text[] not null default '{}',
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

create table if not exists public.user_vocabulary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vocabulary_id text references public.vocabulary(id) on delete set null,
  hanzi text not null,
  pinyin text not null default '',
  meaning text not null default '',
  example_sentence text,
  source_conversation_id uuid,
  topic text,
  hsk_level integer,
  status text not null default 'new',
  review_count integer not null default 0,
  srs_repetitions integer not null default 0,
  srs_correct_count integer not null default 0,
  srs_incorrect_count integer not null default 0,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  auto_saved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, hanzi)
);

create table if not exists public.mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  original text not null,
  corrected text not null,
  explanation text not null,
  frequency integer not null default 1,
  mastery numeric not null default 0,
  related_vocabulary text[] not null default '{}',
  related_grammar text[] not null default '{}',
  related_pronunciation text[] not null default '{}',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved boolean not null default false,
  priority numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vocabulary_id uuid references public.user_vocabulary(id) on delete cascade,
  rating text not null,
  reviewed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  topic text,
  mode text,
  summary text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  chinese text not null,
  pinyin text not null default '',
  vietnamese text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_study_minutes integer not null default 0,
  speaking_practice integer not null default 0,
  listening_practice integer not null default 0,
  grammar_practice integer not null default 0,
  pronunciation_practice integer not null default 0,
  tone_practice integer not null default 0,
  reviews_completed integer not null default 0,
  vocabulary_learned integer not null default 0,
  lessons_completed integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null,
  title text not null,
  description text not null,
  unlocked_at timestamptz,
  unique(user_id, achievement_key)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text,
  plan text not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric text not null,
  amount integer not null default 0,
  period_start date not null,
  period_end date not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, metric, period_start)
);

create index if not exists idx_user_vocabulary_user_next_review on public.user_vocabulary(user_id, next_review_at);
create index if not exists idx_mistakes_user_priority on public.mistakes(user_id, priority desc, resolved);
create index if not exists idx_reviews_user_reviewed_at on public.reviews(user_id, reviewed_at desc);
create index if not exists idx_conversations_user_updated_at on public.conversations(user_id, updated_at desc);
create index if not exists idx_messages_conversation_created_at on public.conversation_messages(conversation_id, created_at);
create index if not exists idx_usage_user_period on public.usage(user_id, period_start, period_end);

alter table public.profiles enable row level security;
alter table public.user_lessons enable row level security;
alter table public.user_vocabulary enable row level security;
alter table public.mistakes enable row level security;
alter table public.reviews enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.progress enable row level security;
alter table public.streaks enable row level security;
alter table public.achievements enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage enable row level security;

create policy "profiles own row" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "user_lessons own rows" on public.user_lessons for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_vocabulary own rows" on public.user_vocabulary for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mistakes own rows" on public.mistakes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reviews own rows" on public.reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "conversations own rows" on public.conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "messages own rows" on public.conversation_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "progress own row" on public.progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "streaks own row" on public.streaks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "achievements own rows" on public.achievements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subscriptions own rows" on public.subscriptions for select using (auth.uid() = user_id);
create policy "usage own rows" on public.usage for select using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, ''), '@', 1)))
  on conflict (id) do update set email = excluded.email, updated_at = now();
  insert into public.progress(user_id) values(new.id) on conflict do nothing;
  insert into public.streaks(user_id) values(new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Server-side deletion helper. Never expose the service-role key to the browser.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
