# Centralised Project Dashboard Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a protected Neodym internal dashboard that organizes internal/client projects, stores project links and encrypted access notes/credentials, and lets authenticated admins open a project in a new tab while copying its credentials to clipboard.

**Architecture:** Use a Next.js application deployed to Vercel, backed by hosted Supabase Postgres. Authentication protects the entire app using two allowed mechanisms: Google OAuth for `hello@neodym.ai` initially, and a custom admin password fallback. Future Neodym Google accounts can be allowed by adding them to an allowlist. Sensitive credentials/access notes are encrypted server-side before storage and decrypted only for authenticated admin actions.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Supabase Postgres, Prisma or Supabase client migrations, Auth.js/NextAuth for Google OAuth, server-side password hashing, Vercel hosting, Vitest/React Testing Library/Playwright.

---

## Product Decisions from Requirements

### In scope for MVP

- Protected dashboard only; no public or normal user mode.
- Login through either:
  - Google OAuth restricted to `hello@neodym.ai` initially.
  - Custom admin password stored securely through environment variables.
- Future support for other Neodym Google accounts through an email allowlist.
- Tree-like data model:
  - top-level categories: `internal` and `client`
  - clients/organizations under categories
  - projects under each client/organization
  - one or more links per project
- Admin CRUD:
  - add/edit/remove clients
  - add/edit/remove projects
  - add/edit/remove project links
  - add/edit/remove encrypted credentials/access notes
- Project action button: **Open & Copy Credentials**.
  - Opens project URL in a new tab.
  - Copies username/password/access notes to clipboard in the same click handler.
  - Shows success/error toast.
  - If clipboard copy fails, shows a secure fallback modal with manual copy buttons.
- Hosted Supabase Postgres for deployable persistent storage.
- Vercel deployment first; Railway only if Vercel is unavailable.
- Seed/demo data for local verification.

### Out of scope for MVP

- Full SSO across all Neodym tools.
- Browser extension for automatic credential autofill.
- Automatic cross-site password pasting into external login pages.
- Storing/reusing third-party session tokens.
- Multi-role permission model.
- Public portfolio mode.
- Team/member management UI beyond a simple allowed-email config.
- Heavy audit/compliance dashboard.

### Feasibility decisions

- True one-click authorization into arbitrary external tools is not reliable because browser security prevents one website from controlling another website's login fields or cookies.
- MVP will implement the practical version: open the project and copy credentials/access notes automatically on user click.
- For Neodym-owned tools, future improvement can add central dashboard auth verification or signed one-time login links.
- Credentials are sensitive. They must never be stored as plaintext. Store encrypted values in Supabase and decrypt only on authenticated server routes.

---

## Proposed Data Model

### `categories`

For MVP this can be fixed in code (`internal`, `client`) or stored in DB. Prefer DB if we want full tree extensibility.

Fields:

- `id` UUID primary key
- `key` text unique, e.g. `internal`, `client`
- `name` text, e.g. `Internal Projects`, `Client Projects`
- `sort_order` integer
- `created_at` timestamp
- `updated_at` timestamp

### `organizations`

Represents Neodym or a client such as Triangle IP.

Fields:

- `id` UUID primary key
- `category_id` UUID foreign key
- `name` text
- `description` text nullable
- `sort_order` integer
- `created_at` timestamp
- `updated_at` timestamp

### `projects`

Fields:

- `id` UUID primary key
- `organization_id` UUID foreign key
- `name` text
- `description` text nullable
- `status` enum/text: `active`, `inactive`, `archived`
- `sort_order` integer
- `created_at` timestamp
- `updated_at` timestamp

### `project_links`

Fields:

- `id` UUID primary key
- `project_id` UUID foreign key
- `label` text, e.g. `Dashboard`, `Admin Panel`, `GitHub Repo`, `Vercel`
- `url` text
- `kind` text nullable, e.g. `app`, `repo`, `admin`, `hosting`, `docs`
- `has_credentials` boolean
- `sort_order` integer
- `created_at` timestamp
- `updated_at` timestamp

### `project_credentials`

One credential record per project link, optional.

Fields:

- `id` UUID primary key
- `project_link_id` UUID foreign key unique
- `username_encrypted` text nullable
- `password_encrypted` text nullable
- `notes_encrypted` text nullable
- `credential_format` text default `username_password_notes`
- `updated_by` text nullable
- `created_at` timestamp
- `updated_at` timestamp

### `audit_logs` MVP-light

Fields:

- `id` UUID primary key
- `actor` text
- `action` text
- `entity_type` text
- `entity_id` UUID nullable
- `summary` text
- `created_at` timestamp

---

## Security Rules

- Store Supabase service role key only server-side. Never expose it to browser code.
- Store encryption secret as `CREDENTIAL_ENCRYPTION_KEY` in Vercel env vars.
- Encrypt credential fields before writing to Supabase.
- Decrypt credentials only in authenticated server actions/API routes.
- Never return all credentials during normal dashboard list loading.
- Fetch/decrypt credentials only when user clicks **Open & Copy Credentials** or opens credential edit modal.
- Mask passwords in UI by default.
- Add a short confirmation/visibility action before showing raw password in a modal.
- Avoid logging decrypted credentials.
- Add an audit log entry when credentials are created, updated, deleted, or copied.

---

## Environment Variables

```bash
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ALLOWED_GOOGLE_EMAILS=hello@neodym.ai
ADMIN_PASSWORD_HASH=...
CREDENTIAL_ENCRYPTION_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
DATABASE_URL=...
```

Notes:

- `ADMIN_PASSWORD_HASH` should be generated from the selected password using bcrypt/argon2.
- `CREDENTIAL_ENCRYPTION_KEY` should be a high-entropy key generated once and stored only in environment variables.
- If Prisma is used, `DATABASE_URL` points to Supabase Postgres.

---

## Implementation Tasks

### Task 1: Initialize Next.js project

**Objective:** Create the application skeleton in the existing repository.

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

**Steps:**

1. Initialize a Next.js TypeScript app in the current repo.
2. Install Tailwind CSS, testing dependencies, auth dependencies, Supabase client, and encryption/hash libraries.
3. Create a simple placeholder protected dashboard page.
4. Run `npm run lint` and `npm run build`.
5. Commit: `chore: initialize Next.js dashboard app`.

**Verification:**

- `npm run build` succeeds.
- `npm run dev` serves a page locally.

---

### Task 2: Add base UI theme and layout

**Objective:** Create a minimalist, elegant dashboard shell matching Neodym's clean internal-tool style.

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/app-shell.tsx`
- Create: `src/components/sidebar.tsx`
- Create: `src/components/topbar.tsx`

**Steps:**

1. Add dashboard shell with sidebar and topbar.
2. Add category navigation placeholders: Internal Projects, Client Projects.
3. Add responsive layout for desktop/mobile.
4. Add empty-state card for no projects.
5. Add basic visual polish: subdued background, clean cards, soft borders.
6. Add component tests for shell rendering.
7. Commit: `feat: add dashboard shell`.

**Verification:**

- UI renders in browser.
- Component test confirms category labels are visible.

---

### Task 3: Configure Supabase schema/migrations

**Objective:** Add database schema for categories, organizations, projects, links, credentials, and audit logs.

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql` or Prisma migration files
- Create: `src/lib/db.ts`
- Create: `docs/database-schema.md`

**Steps:**

1. Define DB tables and indexes.
2. Add cascade delete rules carefully:
   - deleting an organization deletes projects/links/credentials
   - deleting a link deletes its credential record
3. Add timestamp update triggers if using raw SQL.
4. Add seed values for categories: Internal Projects, Client Projects.
5. Document schema.
6. Run migration locally or against hosted Supabase test project.
7. Commit: `feat: add dashboard database schema`.

**Verification:**

- Migration runs successfully.
- Tables are visible in Supabase.
- Seed categories exist.

---

### Task 4: Add encryption utility for credentials

**Objective:** Ensure credentials are encrypted before storage and decrypted only server-side.

**Files:**
- Create: `src/lib/crypto.ts`
- Create: `src/lib/crypto.test.ts`

**Steps:**

1. Write tests for encrypt/decrypt roundtrip.
2. Write test that same plaintext produces different ciphertext due to random IV.
3. Implement AES-GCM or equivalent authenticated encryption.
4. Validate missing/invalid `CREDENTIAL_ENCRYPTION_KEY` fails safely.
5. Commit: `feat: add credential encryption utility`.

**Verification:**

- Crypto tests pass.
- No decrypted values are logged.

---

### Task 5: Implement authentication foundation

**Objective:** Protect the whole app with Google OAuth and custom admin password login.

**Files:**
- Create: `src/auth.ts` or `src/lib/auth.ts`
- Create: `src/app/login/page.tsx`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/middleware.ts`
- Create: `src/lib/password.ts`
- Create: `src/lib/password.test.ts`

**Steps:**

1. Add Auth.js/NextAuth Google provider.
2. Restrict Google sign-in to `ALLOWED_GOOGLE_EMAILS`, initially `hello@neodym.ai`.
3. Add custom admin password form.
4. Verify password against `ADMIN_PASSWORD_HASH`.
5. Create a session on successful custom password login.
6. Add middleware that redirects all unauthenticated routes to `/login`.
7. Exclude static assets and auth callback routes from middleware.
8. Add tests for email allowlist and password verification.
9. Commit: `feat: add protected admin authentication`.

**Verification:**

- Unauthenticated `/` redirects to `/login`.
- Allowed Google email can sign in.
- Non-allowed Google email is rejected.
- Correct admin password signs in.
- Wrong admin password fails.

---

### Task 6: Build read-only dashboard data view

**Objective:** Render categories, organizations, projects, and links from Supabase.

**Files:**
- Create: `src/lib/dashboard-data.ts`
- Modify: `src/app/page.tsx`
- Create: `src/components/project-tree.tsx`
- Create: `src/components/project-card.tsx`
- Create: `src/components/project-link-button.tsx`

**Steps:**

1. Implement server-side query for the full project tree excluding encrypted credential values.
2. Render categories and organizations.
3. Render project cards with link buttons.
4. Show badges for projects with stored credentials.
5. Add loading/error states.
6. Add tests for rendering project tree from fixture data.
7. Commit: `feat: render project dashboard tree`.

**Verification:**

- Dashboard displays seeded categories.
- No credentials appear in page source or client props.

---

### Task 7: Add CRUD server actions

**Objective:** Allow authenticated admins to manage categories/organizations/projects/links/credentials.

**Files:**
- Create: `src/app/actions/organizations.ts`
- Create: `src/app/actions/projects.ts`
- Create: `src/app/actions/project-links.ts`
- Create: `src/app/actions/credentials.ts`
- Create: `src/lib/validation.ts`
- Create: `src/lib/audit.ts`

**Steps:**

1. Add Zod schemas for all form inputs.
2. Add create/update/delete organization actions.
3. Add create/update/delete project actions.
4. Add create/update/delete project link actions.
5. Add create/update/delete credential actions using encryption utility.
6. Add audit log creation for mutations.
7. Add unit tests for validation and encryption-on-write behavior.
8. Commit: `feat: add dashboard admin CRUD actions`.

**Verification:**

- Invalid URLs are rejected.
- Empty project names are rejected.
- Credentials are stored encrypted, never plaintext.
- Audit log rows are created.

---

### Task 8: Build admin forms and modals

**Objective:** Provide UI to add/edit/remove all dashboard entities.

**Files:**
- Create: `src/components/forms/organization-form.tsx`
- Create: `src/components/forms/project-form.tsx`
- Create: `src/components/forms/project-link-form.tsx`
- Create: `src/components/forms/credential-form.tsx`
- Create: `src/components/confirm-delete-dialog.tsx`

**Steps:**

1. Add buttons for creating organizations under each category.
2. Add project create/edit forms.
3. Add project link create/edit forms.
4. Add credential create/edit form with masked password field.
5. Add delete confirmations.
6. Add optimistic or post-submit refresh behavior.
7. Add tests for form validation messages.
8. Commit: `feat: add admin management forms`.

**Verification:**

- Admin can create, edit, and delete an organization/project/link.
- Admin can add encrypted credentials to a link.
- UI refreshes after changes.

---

### Task 9: Implement Open & Copy Credentials flow

**Objective:** Make project link clicks open the project in a new tab and copy credentials/access notes to clipboard.

**Files:**
- Create: `src/app/api/project-links/[id]/credentials/route.ts`
- Modify: `src/components/project-link-button.tsx`
- Create: `src/components/credential-copy-fallback-modal.tsx`
- Create: `src/lib/format-credentials.ts`
- Create: `src/lib/format-credentials.test.ts`

**Steps:**

1. Add authenticated API route to fetch/decrypt credentials for one project link.
2. Add formatter that outputs credentials clearly, for example:

   ```text
   Project: Token Tracker
   URL: https://...
   Username: hello@neodym.ai
   Password: ********
   Notes: Use Google login if prompted.
   ```

3. In the click handler, call `window.open(url, '_blank', 'noopener,noreferrer')`.
4. Fetch credentials and use `navigator.clipboard.writeText(...)` during the user action flow.
5. Show toast on success: `Project opened. Credentials copied.`
6. If clipboard API fails, show fallback modal with manual copy buttons.
7. If no credentials exist, open link and show toast: `Project opened. No credentials stored.`
8. Add audit log event for credential copy.
9. Add unit tests for formatting and Playwright test for click behavior.
10. Commit: `feat: add open and copy credentials flow`.

**Verification:**

- On Chrome/Firefox/Edge/Safari-compatible browsers, click opens new tab and copies credentials when permission allows.
- On clipboard failure, manual fallback appears.
- Works the same on Ubuntu/Linux, macOS, and Windows because it uses browser APIs.

---

### Task 10: Add seed/import workflow for initial project data

**Objective:** Make it easy to load initial Neodym/client project links collected from Ibrahim, Asher, and Hamza.

**Files:**
- Create: `docs/project-link-intake-template.md`
- Create: `scripts/import-projects.ts`
- Create: `data/example-projects.json`

**Steps:**

1. Create an intake template with required fields:
   - category
   - organization/client
   - project name
   - project description
   - link label
   - URL
   - username
   - password
   - access notes
   - owner/team member source
2. Create JSON import format.
3. Implement script that validates and imports projects into Supabase.
4. Encrypt credentials during import.
5. Add dry-run mode.
6. Commit: `feat: add project data import workflow`.

**Verification:**

- Dry-run prints planned inserts without writing.
- Import creates categories/orgs/projects/links/credentials correctly.

---

### Task 11: Add audit log UI

**Objective:** Provide a simple admin view for recent changes and credential-copy events.

**Files:**
- Create: `src/app/audit/page.tsx`
- Create: `src/components/audit-log-table.tsx`

**Steps:**

1. Add `/audit` route protected by the same auth middleware.
2. Query recent audit events.
3. Display actor, action, entity, summary, timestamp.
4. Never display sensitive credential values.
5. Commit: `feat: add audit log view`.

**Verification:**

- Mutations appear in audit view.
- Credential values do not appear.

---

### Task 12: Add deployment configuration

**Objective:** Prepare the app for Vercel deployment.

**Files:**
- Create: `.env.example`
- Create: `README.md`
- Modify: `package.json`
- Optional: `vercel.json`

**Steps:**

1. Document all required environment variables.
2. Add setup instructions for Google OAuth credentials.
3. Add setup instructions for Supabase connection.
4. Add build/test scripts.
5. Add Vercel deploy notes.
6. Commit: `docs: add deployment setup instructions`.

**Verification:**

- New developer can follow README to run locally.
- `npm run build` works with required env vars.

---

### Task 13: End-to-end testing

**Objective:** Verify the full MVP flow in browser automation.

**Files:**
- Create: `e2e/auth.spec.ts`
- Create: `e2e/dashboard-crud.spec.ts`
- Create: `e2e/open-copy.spec.ts`
- Create: `playwright.config.ts`

**Steps:**

1. Add Playwright.
2. Mock or seed auth session for protected route tests.
3. Test login page renders.
4. Test dashboard tree renders seeded data.
5. Test create/edit/delete project flow.
6. Test open-and-copy fallback path.
7. Commit: `test: add dashboard e2e coverage`.

**Verification:**

- `npm run test:e2e` passes locally.

---

### Task 14: Production readiness pass

**Objective:** Confirm security, reliability, and UX before deployment.

**Files:**
- Create: `docs/security-checklist.md`
- Modify: any files found during review

**Steps:**

1. Verify no secrets are committed.
2. Verify encrypted credentials are never sent in list responses.
3. Verify all pages are protected except login/auth callbacks.
4. Verify clipboard fallback works.
5. Verify delete confirmations prevent accidental deletion.
6. Run full test suite and build.
7. Commit: `chore: complete production readiness pass`.

**Verification:**

- `npm run lint` passes.
- `npm test` passes.
- `npm run test:e2e` passes.
- `npm run build` passes.

---

### Task 15: Deploy to Vercel

**Objective:** Deploy MVP to Neodym's Vercel account.

**Files:**
- Modify: `README.md` with final production URL
- Optional: `docs/deployment-log.md`

**Steps:**

1. Create Vercel project from GitHub repo.
2. Add all production environment variables.
3. Configure Google OAuth callback URL for production domain.
4. Configure Supabase production DB connection.
5. Deploy.
6. Open production dashboard in browser.
7. Verify login works.
8. Verify dashboard loads data.
9. Verify Open & Copy Credentials works.
10. Commit docs update with deployed URL.

**Verification:**

- Production URL loads.
- Unauthenticated users are redirected to login.
- `hello@neodym.ai` can log in.
- Admin password login works.
- Project CRUD works.
- Open & Copy works.

---

## Future Improvement Track

### Central auth for Neodym-owned tools

Later, modify each Neodym-owned tool to trust dashboard authentication:

1. Tool checks for local session.
2. If missing, redirect to dashboard/auth service.
3. Dashboard validates user session.
4. Dashboard returns short-lived signed token to tool callback.
5. Tool verifies token and creates local session.
6. User enters tool without password.

This enables true one-click access for Neodym-controlled tools, even across different domains, without storing reusable session tokens in the dashboard DB.

### Browser extension/password-manager option

If external tools require smoother credential entry, consider:

- Bitwarden/1Password shared vault as operational solution.
- A Neodym browser extension only if the team accepts the security/maintenance cost.

---

## Acceptance Criteria

- App is private/protected; no dashboard page is accessible without authentication.
- Google OAuth allows `hello@neodym.ai` and rejects non-allowed emails.
- Custom admin password login works.
- Allowlist supports adding future Neodym team Google accounts through env/config.
- Dashboard displays Internal Projects and Client Projects.
- Admin can manage organizations, projects, links, and credentials.
- Credentials are encrypted at rest.
- Clicking **Open & Copy Credentials** opens the project in a new tab and copies credentials when browser permission allows.
- Clipboard failure has a clear manual fallback.
- App builds and deploys cleanly to Vercel.
- README documents local setup, Supabase setup, Google OAuth setup, and deployment.
