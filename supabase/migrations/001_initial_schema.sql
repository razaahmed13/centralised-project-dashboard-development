-- Centralised Project Dashboard initial Supabase schema

create extension if not exists "pgcrypto";

create table if not exists public.client_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  niche text,
  description text,
  is_internal boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_groups_name_nonempty check (length(trim(name)) > 0),
  constraint client_groups_slug_nonempty check (length(trim(slug)) > 0)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_group_id uuid not null references public.client_groups(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_name_nonempty check (length(trim(name)) > 0),
  constraint projects_status_valid check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.project_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null default 'Project',
  url text not null,
  kind text,
  has_credentials boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_links_label_nonempty check (length(trim(label)) > 0),
  constraint project_links_url_http check (url ~* '^https?://')
);

create table if not exists public.project_credentials (
  id uuid primary key default gen_random_uuid(),
  project_link_id uuid not null unique references public.project_links(id) on delete cascade,
  username_encrypted text,
  password_encrypted text,
  notes_encrypted text,
  credential_format text not null default 'username_password_notes',
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_client_groups_updated_at on public.client_groups;
create trigger set_client_groups_updated_at
before update on public.client_groups
for each row execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_project_links_updated_at on public.project_links;
create trigger set_project_links_updated_at
before update on public.project_links
for each row execute function public.set_updated_at();

drop trigger if exists set_project_credentials_updated_at on public.project_credentials;
create trigger set_project_credentials_updated_at
before update on public.project_credentials
for each row execute function public.set_updated_at();

create or replace function public.prevent_internal_client_group_delete()
returns trigger as $$
begin
  if old.is_internal then
    raise exception 'Internal Projects client group cannot be deleted';
  end if;
  return old;
end;
$$ language plpgsql;

drop trigger if exists prevent_internal_client_group_delete on public.client_groups;
create trigger prevent_internal_client_group_delete
before delete on public.client_groups
for each row execute function public.prevent_internal_client_group_delete();

insert into public.client_groups (name, slug, niche, description, is_internal, sort_order)
values ('Internal Projects', 'internal-projects', 'Internal Operations', 'Neodym-owned internal tools and dashboards.', true, 0)
on conflict (slug) do nothing;

alter table public.client_groups enable row level security;
alter table public.projects enable row level security;
alter table public.project_links enable row level security;
alter table public.project_credentials enable row level security;
alter table public.audit_logs enable row level security;
