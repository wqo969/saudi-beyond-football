-- JEDDAH MORNING — initial schema (P5, NOT applied yet).
-- Apply only after approval, on a DEDICATED Supabase project. Never reuse another project's database.
-- Note (P0 finding): the owner's Supabase org already has 2 active free projects; a third active free
-- project requires pausing one, a separate free account, or staying local (see DECISIONS.md D-007).
-- Security model: RLS on every table; the browser never receives the service-role key.

create extension if not exists "pgcrypto";

create type jm_edition as enum ('morning', 'evening', 'special');
create type jm_issue_status as enum ('draft', 'editorial-review', 'fact-check', 'design-review', 'approved', 'scheduled', 'published', 'archived');
create type jm_role as enum ('reader', 'admin');

create table public.jm_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role jm_role not null default 'reader',
  created_at timestamptz not null default now()
);

create table public.jm_issues (
  slug text primary key check (slug ~ '^\d{4}-\d{2}-\d{2}-(morning|evening|special)(-[a-z0-9-]+)?$'),
  issue_date date not null,
  edition jm_edition not null,
  special text,
  number integer not null check (number > 0),
  title text not null,
  cover_headline text not null,
  cover_dek text,
  cover_story text,
  cover_section text,
  persona text,
  status jm_issue_status not null default 'draft',
  publish_at timestamptz,
  is_demo boolean not null default false,
  editors_letter jsonb,
  surprise jsonb,
  closing_line text,
  design jsonb not null default '{"lockOrder": false}'::jsonb,   -- overrides + frozen plan
  pdf_path text,                                                -- object path in private bucket "jm-pdfs"
  corrections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scheduled_needs_time check (status <> 'scheduled' or publish_at is not null),
  constraint special_needs_kind check (edition <> 'special' or special is not null)
);
create index jm_issues_date_idx on public.jm_issues (issue_date desc, edition);

create table public.jm_articles (
  issue_slug text not null references public.jm_issues (slug) on delete cascade,
  id text not null check (id ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  position integer not null,
  section text not null,
  kind text not null default 'feature',
  layout text,
  follow_up boolean not null default false,
  kicker text,
  title text not null,
  dek text,
  author text,
  reading_minutes integer,
  is_demo boolean not null default false,
  sources jsonb not null default '[]'::jsonb,
  memory jsonb not null default '[]'::jsonb,
  body jsonb not null,               -- validated by the app's zod schema before insert
  primary key (issue_slug, id)
);

-- Editorial memory index (denormalised from articles.memory for fast anti-repetition lookups)
create table public.jm_memory (
  kind text not null,
  key_norm text not null,
  issue_slug text not null references public.jm_issues (slug) on delete cascade,
  article_id text not null,
  issue_date date not null,
  primary key (kind, key_norm, issue_slug, article_id)
);
create index jm_memory_lookup on public.jm_memory (kind, key_norm, issue_date desc);

-- Automation: one row per publication attempt; unique success per issue prevents double publishing.
create table public.jm_publish_log (
  id uuid primary key default gen_random_uuid(),
  issue_slug text not null references public.jm_issues (slug) on delete cascade,
  action text not null,                 -- publish | notify | revalidate
  outcome text not null,                -- success | failure | skipped
  attempt integer not null default 1,
  detail text,                          -- never secrets or personal data
  created_at timestamptz not null default now()
);
create unique index jm_publish_once on public.jm_publish_log (issue_slug, action) where outcome = 'success';

create table public.jm_audit_log (
  id bigint generated always as identity primary key,
  actor uuid,
  action text not null,
  target text,
  created_at timestamptz not null default now()
);

-- Personal data (only if the owner opts in to sync; device-local by default)
create table public.jm_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  issue_slug text not null,
  article_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, issue_slug, article_id)
);

create table public.jm_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Visibility rule mirrors src/lib/publishing.ts
create or replace function public.jm_is_visible(s jm_issue_status, p timestamptz)
returns boolean language sql stable as $$
  select s in ('published', 'archived') or (s = 'scheduled' and p is not null and p <= now());
$$;

create or replace function public.jm_role_of(uid uuid)
returns jm_role language sql stable security definer set search_path = public as $$
  select role from public.jm_members where user_id = uid;
$$;

alter table public.jm_members enable row level security;
alter table public.jm_issues enable row level security;
alter table public.jm_articles enable row level security;
alter table public.jm_memory enable row level security;
alter table public.jm_publish_log enable row level security;
alter table public.jm_audit_log enable row level security;
alter table public.jm_favorites enable row level security;
alter table public.jm_push_subscriptions enable row level security;

create policy "members read self" on public.jm_members for select using (user_id = auth.uid());

create policy "issues read" on public.jm_issues for select using (
  public.jm_role_of(auth.uid()) = 'admin'
  or (public.jm_role_of(auth.uid()) is not null and public.jm_is_visible(status, publish_at))
);
create policy "issues admin write" on public.jm_issues for all using (public.jm_role_of(auth.uid()) = 'admin') with check (public.jm_role_of(auth.uid()) = 'admin');

create policy "articles read" on public.jm_articles for select using (
  exists (select 1 from public.jm_issues i where i.slug = issue_slug and (
    public.jm_role_of(auth.uid()) = 'admin'
    or (public.jm_role_of(auth.uid()) is not null and public.jm_is_visible(i.status, i.publish_at))
  ))
);
create policy "articles admin write" on public.jm_articles for all using (public.jm_role_of(auth.uid()) = 'admin') with check (public.jm_role_of(auth.uid()) = 'admin');

create policy "memory admin" on public.jm_memory for all using (public.jm_role_of(auth.uid()) = 'admin') with check (public.jm_role_of(auth.uid()) = 'admin');
create policy "publish log admin read" on public.jm_publish_log for select using (public.jm_role_of(auth.uid()) = 'admin');
create policy "audit admin read" on public.jm_audit_log for select using (public.jm_role_of(auth.uid()) = 'admin');
create policy "favorites own" on public.jm_favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "push own" on public.jm_push_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public) values ('jm-pdfs', 'jm-pdfs', false) on conflict (id) do nothing;
