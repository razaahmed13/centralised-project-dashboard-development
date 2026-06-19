-- Dashboard private OAuth-style SSO schema

create table if not exists public.sso_clients (
  id uuid primary key default gen_random_uuid(),
  client_id text not null unique,
  name text not null,
  client_secret_hash text,
  allowed_redirect_uris text[] not null default '{}',
  fallback_login_uri text,
  allowed_origins text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sso_clients_client_id_nonempty check (length(trim(client_id)) > 0),
  constraint sso_clients_name_nonempty check (length(trim(name)) > 0)
);

create table if not exists public.sso_authorization_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  client_id text not null references public.sso_clients(client_id),
  redirect_uri text not null,
  user_email text,
  user_name text,
  provider text,
  code_challenge text not null,
  code_challenge_method text not null default 'S256',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint sso_authorization_codes_code_challenge_method_valid check (code_challenge_method = 'S256')
);

create index if not exists idx_sso_authorization_codes_client_id
  on public.sso_authorization_codes(client_id);

create index if not exists idx_sso_authorization_codes_expires_at
  on public.sso_authorization_codes(expires_at);

create index if not exists idx_sso_authorization_codes_unused
  on public.sso_authorization_codes(code_hash)
  where used_at is null;

drop trigger if exists set_sso_clients_updated_at on public.sso_clients;
create trigger set_sso_clients_updated_at
before update on public.sso_clients
for each row execute function public.set_updated_at();

alter table public.sso_clients enable row level security;
alter table public.sso_authorization_codes enable row level security;
