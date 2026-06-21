-- Extension API tokens for browser extension authentication

create table if not exists public.extension_api_tokens (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  token_hash text not null unique,
  token_prefix text not null,
  created_by text not null,
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint extension_api_tokens_label_nonempty check (length(trim(label)) > 0),
  constraint extension_api_tokens_token_hash_nonempty check (length(trim(token_hash)) > 0)
);

create index if not exists idx_extension_api_tokens_token_hash
  on public.extension_api_tokens(token_hash);

alter table public.extension_api_tokens enable row level security;