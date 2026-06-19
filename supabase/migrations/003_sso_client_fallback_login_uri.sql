-- Store each SSO client's own login/fallback URL for silent SSO failures.

alter table public.sso_clients
  add column if not exists fallback_login_uri text;
