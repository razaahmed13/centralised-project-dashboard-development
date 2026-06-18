# Database Schema

The MVP uses hosted Supabase Postgres as the source of truth.

## Tables

### `client_groups`

Sidebar groups. `Internal Projects` is seeded as the built-in default group and has `is_internal=true`.

Fields include: `id`, `name`, `slug`, `niche`, `description`, `is_internal`, `sort_order`, `created_at`, `updated_at`.

### `projects`

Projects belong to one `client_group`.

Fields include: `id`, `client_group_id`, `name`, `description`, `status`, `sort_order`, `created_at`, `updated_at`.

### `project_links`

Links belong to one project. A project can have multiple links.

Fields include: `id`, `project_id`, `label`, `url`, `kind`, `has_credentials`, `sort_order`, `created_at`, `updated_at`.

### `project_credentials`

Optional encrypted credentials for one project link.

Fields include: `id`, `project_link_id`, `username_encrypted`, `password_encrypted`, `notes_encrypted`, `credential_format`, `updated_by`, `created_at`, `updated_at`.

### `audit_logs`

Tracks admin mutations and credential-copy events without storing raw credential values.

Fields include: `id`, `actor`, `action`, `entity_type`, `entity_id`, `summary`, `created_at`.

## Security notes

- Credentials are encrypted in application code before writes.
- Decryption only happens in authenticated server routes/actions.
- Supabase service role key is server-only.
- RLS is enabled on all tables; app server uses privileged server-side access for MVP admin operations.
