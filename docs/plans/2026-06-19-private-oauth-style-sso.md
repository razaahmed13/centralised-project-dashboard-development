# Private OAuth-Style SSO Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Turn the Centralised Project Dashboard into a private Neodym auth authority so other internal tools can redirect users to the dashboard for login and then create their own local sessions after verifying a signed authorization result.

**Architecture:** The dashboard becomes a lightweight OAuth-style identity provider. Other tools become SSO clients: they redirect unauthenticated users to the dashboard `/auth/authorize` endpoint, receive a short-lived one-time authorization code on their callback URL, exchange that code with the dashboard `/auth/token` endpoint, verify the response, and then create their own app session.

**Tech Stack:** Next.js App Router, NextAuth for dashboard login, Supabase Postgres for app/client/code storage, Node `crypto` or `jose` for signed tokens, HTTPS-only cookies in each app.

---

## 1. Summary of the Approach

This is **not shared-domain cookie auth**.

Instead, it is a **private OAuth-style flow**:

1. User opens an internal app, e.g. Token Watcher.
2. Token Watcher checks its own local session cookie.
3. If missing, Token Watcher redirects to the dashboard authorization endpoint:

   ```text
   https://dashboard.neodym.ai/auth/authorize?client_id=token-watcher&redirect_uri=https%3A%2F%2Ftokenwatcher.neodym.ai%2Fauth%2Fcallback&state=<random>&code_challenge=<pkce_challenge>
   ```

4. Dashboard checks whether the user is logged in.
5. If not logged in, dashboard shows its normal login page.
6. After login, dashboard validates the requesting app/client.
7. Dashboard creates a **short-lived one-time authorization code**.
8. Dashboard redirects back to the internal app:

   ```text
   https://tokenwatcher.neodym.ai/auth/callback?code=<one_time_code>&state=<same_state>
   ```

9. Token Watcher verifies `state` and exchanges the code with dashboard backend:

   ```text
   POST https://dashboard.neodym.ai/auth/token
   ```

10. Dashboard validates the code, marks it used, and returns a signed identity payload or access token.
11. Token Watcher creates its own local session cookie.
12. User is logged into Token Watcher without entering credentials again.

---

## 2. Why This Is Better Than Trying to Share Browser Passwords

Browser password managers are intentionally origin-bound and cannot be reliably controlled by another app. This SSO flow avoids that problem entirely:

- the dashboard authenticates the user;
- the target app trusts the dashboard;
- no project password needs to be pasted or saved in the browser password manager;
- each internal app gets a real session for its own domain.

---

## 3. Roles

### Dashboard App

Acts as the **SSO provider / auth authority**.

Responsibilities:

- Authenticate users using existing dashboard login methods:
  - Google OAuth allowlist;
  - admin password login.
- Store registered internal apps/clients.
- Validate redirect URLs.
- Issue short-lived one-time auth codes.
- Exchange codes for signed identity payloads.
- Optionally expose a token verification/JWKS endpoint.
- Log SSO events in audit logs.

### Other Internal Apps / Tools

Act as **SSO clients / relying parties**.

Responsibilities:

- Redirect users to dashboard auth when local session is missing.
- Generate and store `state` and PKCE verifier temporarily.
- Implement `/auth/callback` route.
- Exchange authorization code with dashboard.
- Create their own secure local session cookie.
- Protect app routes with their own session middleware/guard.

---

## 4. Dashboard-Side Work

### 4.1 Add SSO Client Registry

Create a table to register apps that are allowed to use dashboard SSO.

Suggested table: `sso_clients`

```sql
create table if not exists sso_clients (
  id uuid primary key default gen_random_uuid(),
  client_id text not null unique,
  name text not null,
  client_secret_hash text,
  allowed_redirect_uris text[] not null default '{}',
  allowed_origins text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Example row:

```text
client_id: token-watcher
name: Token Watcher
allowed_redirect_uris:
  - https://tokenwatcher.neodym.ai/auth/callback
  - http://localhost:3001/auth/callback
allowed_origins:
  - https://tokenwatcher.neodym.ai
  - http://localhost:3001
is_active: true
```

Notes:

- Never allow arbitrary `redirect_uri` values.
- Match redirect URIs exactly.
- Keep localhost callback only for development.
- If using confidential clients, store only a hash of `client_secret`, never plaintext.

---

### 4.2 Add Authorization Code Storage

Create a table for short-lived one-time codes.

Suggested table: `sso_authorization_codes`

```sql
create table if not exists sso_authorization_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  client_id text not null references sso_clients(client_id),
  redirect_uri text not null,
  user_email text,
  user_name text,
  provider text,
  code_challenge text,
  code_challenge_method text not null default 'S256',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_sso_authorization_codes_client_id
  on sso_authorization_codes(client_id);

create index if not exists idx_sso_authorization_codes_expires_at
  on sso_authorization_codes(expires_at);
```

Security rules:

- Store only a hash of the authorization code.
- Expire codes quickly, e.g. 60-120 seconds.
- Mark codes as used immediately after exchange.
- Reject reused codes.
- Reject expired codes.
- Reject mismatched `client_id`, `redirect_uri`, or PKCE verifier.

---

### 4.3 Add Dashboard Environment Variables

Add to dashboard `.env.local` and Vercel environment variables:

```env
SSO_ISSUER_URL=https://centralised-project-dashboard-devel.vercel.app
SSO_CODE_TTL_SECONDS=120
SSO_TOKEN_TTL_SECONDS=900
SSO_SIGNING_SECRET=<long-random-secret>
```

For production custom domain later:

```env
SSO_ISSUER_URL=https://dashboard.neodym.ai
```

Important:

- `SSO_SIGNING_SECRET` must be separate from `NEXTAUTH_SECRET`.
- Never expose `SSO_SIGNING_SECRET` to frontend code.
- Generate with a strong random secret.

---

### 4.4 Add `/auth/authorize` Endpoint or Page

Create a dashboard route:

```text
GET /auth/authorize
```

Expected query params:

```text
client_id=token-watcher
redirect_uri=https://tokenwatcher.neodym.ai/auth/callback
state=<random_app_state>
code_challenge=<pkce_challenge>
code_challenge_method=S256
```

Behavior:

1. Validate required params.
2. Look up `client_id` in `sso_clients`.
3. Ensure client is active.
4. Ensure `redirect_uri` exactly matches one of the allowed redirect URIs.
5. Check dashboard session using NextAuth.
6. If not logged in, redirect to dashboard login with a callback back to the full authorize URL.
7. If logged in, create a one-time random code.
8. Hash and store the code in `sso_authorization_codes`.
9. Redirect back to `redirect_uri` with:

   ```text
   ?code=<raw_one_time_code>&state=<same_state>
   ```

Possible files:

```text
src/app/auth/authorize/route.ts
src/lib/sso/clients.ts
src/lib/sso/codes.ts
src/lib/sso/pkce.ts
```

Pseudo-code:

```ts
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get('client_id');
  const redirectUri = url.searchParams.get('redirect_uri');
  const state = url.searchParams.get('state');
  const codeChallenge = url.searchParams.get('code_challenge');

  validateAuthorizeParams({ clientId, redirectUri, state, codeChallenge });

  const client = await getActiveSsoClient(clientId);
  assertAllowedRedirectUri(client, redirectUri);

  const session = await getServerSession(authOptions);
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', `/auth/authorize${url.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const code = generateRandomCode();
  await storeAuthorizationCode({
    codeHash: hashCode(code),
    clientId,
    redirectUri,
    userEmail: session.user?.email,
    userName: session.user?.name,
    codeChallenge,
    expiresAt: addSeconds(new Date(), 120),
  });

  const callback = new URL(redirectUri);
  callback.searchParams.set('code', code);
  callback.searchParams.set('state', state);
  return NextResponse.redirect(callback);
}
```

---

### 4.5 Add `/auth/token` Endpoint

Create a dashboard route:

```text
POST /auth/token
```

Request body:

```json
{
  "grant_type": "authorization_code",
  "client_id": "token-watcher",
  "client_secret": "optional-if-confidential-client",
  "code": "raw-one-time-code",
  "redirect_uri": "https://tokenwatcher.neodym.ai/auth/callback",
  "code_verifier": "original-pkce-verifier"
}
```

Behavior:

1. Validate request shape.
2. Hash the received code.
3. Find matching code row.
4. Ensure not expired.
5. Ensure not used.
6. Ensure `client_id` and `redirect_uri` match stored values.
7. Validate PKCE code verifier against stored challenge.
8. Optionally validate `client_secret` if using confidential clients.
9. Mark code as used.
10. Return a signed token or identity payload.

Response:

```json
{
  "access_token": "signed-jwt-or-hmac-token",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "email": "hello@neodym.ai",
    "name": "Neodym Admin"
  }
}
```

Possible files:

```text
src/app/auth/token/route.ts
src/lib/sso/tokens.ts
src/lib/sso/pkce.ts
src/lib/sso/codes.ts
```

---

### 4.6 Decide Token Format

Recommended MVP: signed JWT using `jose`.

Install:

```bash
npm install jose
```

Token claims:

```json
{
  "iss": "https://dashboard.neodym.ai",
  "aud": "token-watcher",
  "sub": "hello@neodym.ai",
  "email": "hello@neodym.ai",
  "name": "Neodym Admin",
  "iat": 1780000000,
  "exp": 1780000900
}
```

Rules:

- `iss` must equal dashboard issuer URL.
- `aud` must equal the client app ID.
- `exp` should be short, e.g. 15 minutes.
- Other apps should verify signature, issuer, audience, and expiry.

For MVP simplicity, use symmetric signing with `SSO_SIGNING_SECRET`. Later, upgrade to asymmetric signing with JWKS:

```text
GET /.well-known/jwks.json
```

---

### 4.7 Add SSO Client Admin UI in Dashboard

Add a small dashboard admin section for SSO apps.

MVP fields:

- App name
- Client ID
- Allowed redirect URIs
- Allowed origins
- Active/inactive toggle

Optional later:

- Rotate client secret
- View recent SSO logins
- Disable app
- Per-app allowed users/accounts

Possible UI path:

```text
/sso-clients
```

Possible files:

```text
src/app/sso-clients/page.tsx
src/components/sso-client-form.tsx
src/components/sso-client-table.tsx
src/app/actions/sso-clients.ts
```

---

### 4.8 Add Audit Logging

Log these events:

- `sso_authorize_started`
- `sso_authorize_denied`
- `sso_code_issued`
- `sso_code_exchanged`
- `sso_code_rejected`
- `sso_client_created`
- `sso_client_updated`
- `sso_client_disabled`

Do not log raw authorization codes, tokens, secrets, passwords, or PKCE verifiers.

Safe audit fields:

```text
client_id
action
actor_email
redirect_uri
success/failure
failure_reason
created_at
```

---

## 5. Internal App / Tool-Side Work

Every internal tool that wants to use dashboard SSO needs the following pieces.

---

### 5.1 Add App Environment Variables

Example for Token Watcher:

```env
NEODYM_SSO_CLIENT_ID=token-watcher
NEODYM_SSO_CLIENT_SECRET=<optional-if-confidential-client>
NEODYM_SSO_ISSUER_URL=https://dashboard.neodym.ai
NEODYM_SSO_AUTHORIZE_URL=https://dashboard.neodym.ai/auth/authorize
NEODYM_SSO_TOKEN_URL=https://dashboard.neodym.ai/auth/token
NEODYM_SSO_REDIRECT_URI=https://tokenwatcher.neodym.ai/auth/callback
NEODYM_SSO_SIGNING_SECRET=<same-verification-secret-if-symmetric-jwt>
APP_SESSION_SECRET=<app-specific-secret>
```

Important:

- `APP_SESSION_SECRET` must be unique per app.
- If using symmetric JWT signing, every app needs the SSO verification secret. That is acceptable for MVP but less ideal long-term.
- Long-term: dashboard should use asymmetric keys so apps only need a public key/JWKS URL.

---

### 5.2 Add Login Redirect Route

Each internal app adds:

```text
GET /auth/login
```

Behavior:

1. Generate random `state`.
2. Generate PKCE `code_verifier`.
3. Generate `code_challenge` from verifier.
4. Store `state` and `code_verifier` in a short-lived secure cookie.
5. Redirect to dashboard `/auth/authorize`.

Example redirect:

```text
https://dashboard.neodym.ai/auth/authorize?client_id=token-watcher&redirect_uri=https%3A%2F%2Ftokenwatcher.neodym.ai%2Fauth%2Fcallback&state=<state>&code_challenge=<challenge>&code_challenge_method=S256
```

---

### 5.3 Add Callback Route

Each internal app adds:

```text
GET /auth/callback
```

Behavior:

1. Read `code` and `state` from query params.
2. Read expected `state` and `code_verifier` from secure temporary cookie.
3. Reject if state does not match.
4. POST to dashboard `/auth/token` with code exchange data.
5. Verify dashboard response/token.
6. Create app's own local session cookie.
7. Clear temporary SSO state cookie.
8. Redirect to the app home page.

---

### 5.4 Add Session Middleware/Guard in Each App

Each internal app should protect private pages using its own session.

Behavior:

- If local app session exists and is valid: allow request.
- If session missing/expired: redirect to `/auth/login`.

Do not call the dashboard on every request. The dashboard should be used for login/exchange, not every page load.

---

### 5.5 Add Logout Behavior

Each internal app needs one of two logout behaviors.

MVP simple logout:

1. Clear the app's local session cookie.
2. Redirect to app login.

Central logout later:

1. Clear the app's local session cookie.
2. Redirect to dashboard `/auth/logout?return_to=<app_url>`.
3. Dashboard clears its session.
4. User is logged out everywhere after sessions expire or apps check central logout state.

For MVP, simple local logout is enough.

---

## 6. Security Requirements

### Required for MVP

- HTTPS only in production.
- Exact redirect URI matching.
- Short-lived authorization codes.
- One-time code usage.
- Store only hashed codes.
- Use PKCE even for internal apps.
- Use `state` to prevent CSRF.
- Secure, HttpOnly, SameSite cookies.
- Separate secrets:
  - `NEXTAUTH_SECRET`
  - `SSO_SIGNING_SECRET`
  - each app's `APP_SESSION_SECRET`
- Audit logs for code issuance/exchange failures.

### Should Avoid

- Do not put tokens in localStorage.
- Do not log raw codes/tokens/secrets.
- Do not accept wildcard redirect URLs.
- Do not rely only on frontend checks.
- Do not reuse dashboard session cookies directly across unrelated domains.

### Recommended Cookie Settings

For temporary SSO cookies in client apps:

```text
HttpOnly=true
Secure=true
SameSite=Lax
Max-Age=300
Path=/
```

For app session cookies:

```text
HttpOnly=true
Secure=true
SameSite=Lax
Max-Age=8-12 hours
Path=/
```

---

## 7. MVP Scope

### In Scope

Dashboard:

- `sso_clients` table.
- `sso_authorization_codes` table.
- `/auth/authorize` route.
- `/auth/token` route.
- Signed JWT response.
- Manual seed/insert of first SSO client.
- Audit logs.
- Tests for valid/invalid flows.

Internal app:

- `/auth/login` route.
- `/auth/callback` route.
- local session cookie.
- route guard.
- logout.
- tests for state mismatch, token exchange failure, and successful session creation.

### Out of Scope for MVP

- Full OAuth 2.1 compliance certification.
- User roles/permissions per app.
- Central logout across all apps.
- Refresh tokens.
- JWKS/asymmetric key rotation.
- Consent screen.
- Multi-tenant client admin UI, unless needed immediately.

### Future Enhancements

- JWKS public-key verification.
- Per-app user allowlists.
- Per-app role mapping.
- Central logout/session revocation.
- SSO client admin UI.
- Token introspection endpoint.
- Refresh token support.

---

## 8. Example End-to-End Flow

### User Opens Token Watcher

```text
GET https://tokenwatcher.neodym.ai/
```

Token Watcher sees no local session.

Redirects to:

```text
GET https://dashboard.neodym.ai/auth/authorize?client_id=token-watcher&redirect_uri=https%3A%2F%2Ftokenwatcher.neodym.ai%2Fauth%2Fcallback&state=abc123&code_challenge=xyz789&code_challenge_method=S256
```

Dashboard sees user is not logged in.

Redirects to:

```text
GET https://dashboard.neodym.ai/login?callbackUrl=/auth/authorize...
```

User logs in.

Dashboard resumes authorize request and redirects back:

```text
GET https://tokenwatcher.neodym.ai/auth/callback?code=one-time-code&state=abc123
```

Token Watcher exchanges code:

```text
POST https://dashboard.neodym.ai/auth/token
```

Dashboard returns:

```json
{
  "access_token": "signed-token",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "email": "hello@neodym.ai",
    "name": "Neodym Admin"
  }
}
```

Token Watcher creates local session and redirects:

```text
GET https://tokenwatcher.neodym.ai/
```

User is now logged in.

---

## 9. Dashboard Implementation Tasks

### Task 1: Add SSO database migration

**Objective:** Create storage for registered apps and one-time authorization codes.

**Files:**

- Create/modify: `supabase/migrations/002_sso_private_auth.sql`

**Steps:**

1. Add `sso_clients` SQL.
2. Add `sso_authorization_codes` SQL.
3. Add indexes.
4. Add optional seed for first app in a separate seed file, not the migration.
5. Run migration locally/hosted Supabase.
6. Verify tables exist.

**Verification:**

```sql
select table_name
from information_schema.tables
where table_name in ('sso_clients', 'sso_authorization_codes');
```

---

### Task 2: Add SSO validation utilities

**Objective:** Validate authorize/token request payloads.

**Files:**

- Create: `src/lib/sso/validation.ts`
- Test: `src/lib/sso/validation.test.ts`

**Tests:**

- rejects missing `client_id`;
- rejects missing `redirect_uri`;
- rejects invalid redirect URI format;
- accepts valid authorize params;
- accepts valid token request;
- rejects unsupported `grant_type`.

---

### Task 3: Add PKCE utilities

**Objective:** Support `S256` PKCE challenge verification.

**Files:**

- Create: `src/lib/sso/pkce.ts`
- Test: `src/lib/sso/pkce.test.ts`

**Functions:**

```ts
export function createCodeChallenge(verifier: string): string
export function verifyCodeChallenge(verifier: string, challenge: string): boolean
```

**Tests:**

- verifier matches challenge;
- wrong verifier fails;
- empty verifier fails.

---

### Task 4: Add authorization code utilities

**Objective:** Generate and hash safe one-time codes.

**Files:**

- Create: `src/lib/sso/codes.ts`
- Test: `src/lib/sso/codes.test.ts`

**Functions:**

```ts
export function generateAuthorizationCode(): string
export function hashAuthorizationCode(code: string): string
```

**Tests:**

- generated code has sufficient length;
- two generated codes are different;
- hash is deterministic;
- hash does not equal raw code.

---

### Task 5: Add client lookup helper

**Objective:** Load and validate SSO clients from Supabase.

**Files:**

- Create: `src/lib/sso/clients.ts`
- Test: `src/lib/sso/clients.test.ts`

**Functions:**

```ts
export async function getActiveSsoClient(clientId: string): Promise<SsoClient>
export function assertRedirectUriAllowed(client: SsoClient, redirectUri: string): void
```

**Tests:**

- inactive client rejected;
- unknown client rejected;
- exact redirect URI accepted;
- similar but non-exact redirect URI rejected.

---

### Task 6: Add token signing utility

**Objective:** Create signed dashboard-issued identity tokens.

**Files:**

- Create: `src/lib/sso/tokens.ts`
- Test: `src/lib/sso/tokens.test.ts`

**Functions:**

```ts
export async function signSsoToken(input: {
  clientId: string;
  email?: string | null;
  name?: string | null;
}): Promise<string>

export async function verifySsoToken(token: string, clientId: string): Promise<SsoTokenClaims>
```

**Tests:**

- token verifies with correct audience;
- wrong audience fails;
- missing signing secret fails clearly;
- expired token fails.

---

### Task 7: Add `/auth/authorize` route

**Objective:** Issue short-lived authorization codes after dashboard login.

**Files:**

- Create: `src/app/auth/authorize/route.ts`
- Test: `src/app/auth/authorize/route.test.ts`

**Tests:**

- unauthenticated request redirects to `/login` with callback;
- invalid client returns error;
- invalid redirect URI returns error;
- authenticated request creates code and redirects to callback;
- raw code is not stored in DB.

---

### Task 8: Add `/auth/token` route

**Objective:** Exchange one-time codes for signed SSO tokens.

**Files:**

- Create: `src/app/auth/token/route.ts`
- Test: `src/app/auth/token/route.test.ts`

**Tests:**

- valid code exchange returns token;
- expired code rejected;
- reused code rejected;
- wrong redirect URI rejected;
- wrong PKCE verifier rejected;
- code is marked used after success.

---

### Task 9: Add dashboard audit logs for SSO events

**Objective:** Record safe SSO activity without storing secrets.

**Files:**

- Modify: `src/lib/audit.ts`
- Modify route files from Tasks 7-8.
- Test relevant route tests.

**Tests:**

- successful code issue logs safe event;
- failed exchange logs failure reason;
- audit payload does not include raw code/token/verifier.

---

## 10. Internal App Implementation Tasks

Use this checklist in each internal tool/app.

### Task A: Add SSO client config

**Objective:** Configure the app to know dashboard SSO endpoints.

**Files:**

- Create/modify: app-specific env schema/config file.

Required variables:

```env
NEODYM_SSO_CLIENT_ID=
NEODYM_SSO_ISSUER_URL=
NEODYM_SSO_AUTHORIZE_URL=
NEODYM_SSO_TOKEN_URL=
NEODYM_SSO_REDIRECT_URI=
APP_SESSION_SECRET=
```

Optional:

```env
NEODYM_SSO_CLIENT_SECRET=
NEODYM_SSO_SIGNING_SECRET=
```

---

### Task B: Add state and PKCE helpers

**Objective:** Generate state/verifier/challenge for secure login redirects.

**Functions:**

```ts
createSsoState(): string
createPkceVerifier(): string
createPkceChallenge(verifier: string): string
```

---

### Task C: Add `/auth/login` route

**Objective:** Redirect unauthenticated users to dashboard auth.

Behavior:

1. Generate `state`.
2. Generate PKCE verifier/challenge.
3. Store `state` and verifier in secure temporary cookie.
4. Redirect to dashboard `/auth/authorize`.

---

### Task D: Add `/auth/callback` route

**Objective:** Receive dashboard auth result and create local app session.

Behavior:

1. Validate returned `state`.
2. Exchange `code` at dashboard `/auth/token`.
3. Verify returned token.
4. Create local session cookie.
5. Clear temporary cookie.
6. Redirect to app home.

---

### Task E: Add app route guard

**Objective:** Protect private app pages.

Behavior:

- valid local session: allow;
- missing/invalid local session: redirect to `/auth/login`.

---

### Task F: Add logout

**Objective:** Let users end the app session.

MVP:

- clear local app session cookie;
- redirect to `/auth/login` or public landing page.

---

## 11. Testing Matrix

### Dashboard Tests

- Invalid client ID rejected.
- Inactive client rejected.
- Redirect URI exact-match required.
- Unauthenticated authorize request redirects to login.
- Authenticated authorize request issues code.
- Code expires.
- Code is one-time-use.
- Token route validates PKCE.
- Token route validates client and redirect URI.
- Token route returns signed token with correct issuer/audience.
- Audit logs do not expose raw secrets.

### Internal App Tests

- Missing local session redirects to `/auth/login`.
- Login route sets temporary `state`/PKCE cookie.
- Login route redirects to dashboard authorize endpoint.
- Callback rejects state mismatch.
- Callback rejects dashboard token failure.
- Callback creates local session on success.
- Protected route allows valid local session.
- Logout clears local session.

### Browser Smoke Tests

1. Clear cookies for dashboard and test app.
2. Open internal app.
3. Confirm redirect to dashboard login.
4. Login through dashboard.
5. Confirm redirect back to app.
6. Confirm app shows authenticated UI.
7. Refresh app page and confirm still logged in.
8. Logout from app and confirm session is gone.

---

## 12. Deployment Notes

### Dashboard Vercel Env Vars

Add:

```env
SSO_ISSUER_URL=https://centralised-project-dashboard-devel.vercel.app
SSO_CODE_TTL_SECONDS=120
SSO_TOKEN_TTL_SECONDS=900
SSO_SIGNING_SECRET=<secret>
```

Keep existing auth/Supabase variables:

```env
NEXTAUTH_URL=https://centralised-project-dashboard-devel.vercel.app
NEXTAUTH_SECRET=<secret>
SUPABASE_URL=<supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### Internal App Env Vars

Each app needs its own values:

```env
NEODYM_SSO_CLIENT_ID=token-watcher
NEODYM_SSO_ISSUER_URL=https://centralised-project-dashboard-devel.vercel.app
NEODYM_SSO_AUTHORIZE_URL=https://centralised-project-dashboard-devel.vercel.app/auth/authorize
NEODYM_SSO_TOKEN_URL=https://centralised-project-dashboard-devel.vercel.app/auth/token
NEODYM_SSO_REDIRECT_URI=https://tokenwatcher.neodym.ai/auth/callback
APP_SESSION_SECRET=<app-specific-secret>
```

---

## 13. Recommended First Pilot

Use one internal app first, preferably Token Watcher.

Pilot steps:

1. Add dashboard SSO tables.
2. Register `token-watcher` client.
3. Implement dashboard `/auth/authorize` and `/auth/token`.
4. Add Token Watcher `/auth/login` and `/auth/callback`.
5. Protect one Token Watcher page.
6. Smoke test full redirect flow.
7. Only after this works, generalize helpers into a reusable Neodym SSO package/snippet.

---

## 14. Acceptance Criteria

The implementation is complete when:

- Dashboard can register an internal app as an SSO client.
- Internal app redirects unauthenticated users to dashboard login.
- Dashboard login returns users to the internal app.
- Internal app creates its own session after validating dashboard-issued auth code/token.
- Authorization codes are short-lived and one-time-use.
- Redirect URIs are exact-match validated.
- Raw secrets/codes/tokens are never logged.
- Tests cover success and failure paths.
- Full browser smoke works in production deployment.
