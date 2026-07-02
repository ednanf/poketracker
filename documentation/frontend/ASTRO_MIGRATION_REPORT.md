# Astro Migration Report

> Generated: 2026-06-29
> Covers: Backend changes required to support a new Astro-based frontend

---

## Summary

The backend is a standalone Express.js REST API that communicates over HTTP JSON. It is **fully framework-agnostic** — it has no coupling to React, Vite, or any frontend technology. The migration from React to Astro requires **minimal backend changes**.

**Backend compatibility with Astro: ✅  95% — no architectural changes needed.**

The following sections document the specific areas that need attention.

---

## 1. Required Changes

### 1.1 CORS Configuration — `apps/backend/src/config/cors.config.ts`

**Current state:** Hardcoded list of origins pointing to Vite's dev/preview servers.

```ts
const allowedOrigins = [
    'http://localhost:5173',          // Vite React dev server
    'http://localhost:4173',          // Vite React preview server
    'http://10.0.0.102:4173',        // Network access (old frontend)
    'http://10.0.0.102:5173',        // Network access (old frontend)
];
```

**Required change:** Add Astro's default dev server port and any future production domain.

Astro's default dev server runs on:
- `http://localhost:4321` (dev)
- `http://localhost:4321` (preview — same port as dev)

Update the list to:

```ts
const allowedOrigins = [
    'http://localhost:4321',          // Astro dev/preview server
    'http://10.0.0.102:4321',        // Network access
];
```

> **Recommendation:** Instead of hardcoding, consider reading from the `FRONTEND_URL` env var (already defined in `.env` but unused). This would eliminate the need to update this file across environments.

### 1.2 Environment Variables — `.env`

**Current state:** The `.env` file at `apps/backend/.env` has:

```
FRONTEND_URL=http://localhost:5173
```

**Required change:** Update `FRONTEND_URL` to reflect the new Astro frontend URL:

```
FRONTEND_URL=http://localhost:4321
```

Note: `FRONTEND_URL` is currently **not used anywhere** in the backend code. If you plan to use it (e.g., for dynamic CORS, redirect URLs, or server-side rendering), now would be the time to wire it up.

### 1.3 Auth Flow

**No changes required.** The auth system works as follows:

| Mechanism | How it works | Astro compatibility |
|---|---|---|
| **Access token** | Returned in JSON body → stored in memory by the client (e.g., Zustand/Pinia/vanilla JS) | ✅ Astro islands can store it in memory or browser storage |
| **Refresh token** | httpOnly cookie set by the server → automatically sent with every request | ✅ Works identically across all frameworks |
| **Logout** | Clears the cookie + deletes the token from MongoDB | ✅ No changes needed |

The auth flow is entirely HTTP-driven and has zero dependency on React-specific constructs.

### 1.4 API Client Considerations

The old React frontend used:
- **Axios** as the HTTP client
- **@tanstack/react-query** for server state management
- **Zustand** for auth state (access token storage)

For Astro you have several options:

| Option | Recommendation |
|---|---|
| Use native `fetch()` in Astro components/pages | ✅ Simplest, no extra dependency |
| Use Astro's built-in fetch during SSR | ✅ Works natively in `.astro` frontmatter |
| Use `axios` or `ky` in client-side islands | ✅ Any HTTP client works |
| Use `@tanstack/react-query` with React islands | ✅ Works if you keep React islands |

**No backend changes needed regardless of choice.**

### 1.5 Cookie Authentication

The refresh token cookie uses:
- `httpOnly: true` — JS cannot access it
- `sameSite: 'lax'` — works across same-site navigation
- `secure: true` in production (HTTPS required)

Since Astro runs on `localhost:4321` (same machine, same domain `localhost`), the `sameSite: 'lax'` policy will work correctly. **No changes needed.**

---

## 2. Optional Improvements

### 2.1 Dynamic CORS from `FRONTEND_URL`

**File:** `apps/backend/src/config/cors.config.ts`

Currently CORS origins are hardcoded. Consider reading from the `FRONTEND_URL` env var (already validated by Zod in `env.config.ts` but not consumed anywhere):

```ts
import { envConfig } from './env.config.js';

const corsOptions = {
    origin: [envConfig.FRONTEND_URL, 'http://localhost:4321'], // fallback for dev
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    optionsSuccessStatus: 200,
};
```

This would require adding `FRONTEND_URL` to the env schema (`env.config.ts`) if it isn't already there (it's in the `.env` file but not in the Zod schema — the schema only validates known vars, unknown ones are ignored).

### 2.2 Remove Unused Environment Variables

The `.env` file contains:

```
RESEND_API_KEY=re_Qpkv...
EMAIL_FROM_ADDRESS=noreply@tracker.frizzera.dev
```

These are **not used anywhere** in the backend code. No email utility, no email endpoints, no email middleware exists. These can be removed unless you plan to implement email features (e.g., email verification, password reset) in the future.

### 2.3 Remove Unused Dependencies

The backend `package.json` includes:

| Package | Status |
|---|---|
| `ms` | Listed but **not imported anywhere** |
| `validator` | Listed but **not imported directly** (email validation is handled by Zod + Mongoose regex) |

These can be safely removed to reduce dependency footprint.

---

## 3. Frontend Cleanup

### 3.1 Remove `apps/frontend/` Directory

On the current branch (`astro-frontend`), the directory exists on disk but contains **no source code** — only `node_modules/`, `.env.development`, `.env.production`, and `tsconfig.tsbuildinfo`. The actual React source is on the `frontend` branch.

To clean up for the Astro project:

1. **Delete the directory:**
   ```bash
   rm -rf apps/frontend/
   ```

2. **Remove from workspace in root `package.json`:**
   The root `package.json` uses wildcard workspaces (`"apps/*"`) which automatically picks up any directory under `apps/`. Once `apps/frontend/` is deleted, it will no longer be included.

3. **Remove frontend lint-staged entries** from root `package.json`:
   ```json
   // Remove these lines:
   "apps/frontend/src/**/*.{ts,tsx}": [
       "yarn workspace frontend lint",
       "yarn workspace frontend vitest related --run"
   ]
   ```

4. **Update `README.md`** — Remove or replace the "Frontend" section references to React/Vite.

### 3.2 Frontend Files on the `frontend` Branch

The React frontend source code lives on the `frontend` Git branch. If you want to preserve it for reference before deletion, consider tagging or archiving it:

```bash
git checkout frontend
# archive or note what to keep
git checkout astro-frontend
```

To fully remove from history would require `git filter-branch` or `git rebase`, which is outside the scope of this report.

---

## 4. Backend Changes Checklist

| # | Change | File | Priority | Status |
|---|---|---|---|---|
| 1 | Update CORS origins for Astro port 4321 | `apps/backend/src/config/cors.config.ts` | **Required** | Pending |
| 2 | Remove `apps/frontend/` directory | Filesystem | **Required** | Pending |
| 3 | Remove frontend lint-staged entries | Root `package.json` | **Required** | Pending |
| 4 | Update README frontend references | Root `README.md` | **Required** | Pending |
| 5 | Update `FRONTEND_URL` in `.env` | `apps/backend/.env` | Recommended | Pending |
| 6 | Make CORS dynamic via `FRONTEND_URL` env var | `apps/backend/src/config/cors.config.ts` | Optional | — |
| 7 | Remove unused deps (`ms`, `validator`) | `apps/backend/package.json` | Optional | — |
| 8 | Remove unused env vars (`RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`) | `apps/backend/.env` | Optional | — |

---

## 5. API Contract

The following endpoints are available and unchanged. Astro will consume them exactly as React did.

### Auth Endpoints

| Method | Endpoint | Auth | Body |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | `{ email, username, password }` |
| POST | `/api/v1/auth/login` | Public | `{ email, password }` |
| POST | `/api/v1/auth/logout` | Cookie | (empty) |
| POST | `/api/v1/auth/refresh-token` | Cookie | (empty) |

### Account Endpoints

| Method | Endpoint | Auth | Body |
|---|---|---|---|
| GET | `/api/v1/account/` | Bearer Token | — |
| PATCH | `/api/v1/account/` | Bearer Token | `{ email?, username?, password? }` |
| DELETE | `/api/v1/account/` | Bearer Token | — |

### Save File Endpoints

| Method | Endpoint | Auth | Body |
|---|---|---|---|
| GET | `/api/v1/save-file/` | Bearer Token | — |
| POST | `/api/v1/save-file/` | Bearer Token | `{ name, type, gameVersion }` |
| GET | `/api/v1/save-file/:id` | Bearer Token | — |
| PATCH | `/api/v1/save-file/:id` | Bearer Token | `{ name? }` |
| DELETE | `/api/v1/save-file/:id` | Bearer Token | — |
| PATCH | `/api/v1/save-file/:id/sync` | Bearer Token | `{ actions: [{ action, pokemonId }] }` |

All responses follow the shape:

```typescript
// Success
{ status: 'success', data: { ... } }

// Error
{ status: 'error', data: { message: string, errorId?: string } }
```

---

## 6. Migration Steps (Recommended Order)

1. **Update CORS** to add Astro's port (`apps/backend/src/config/cors.config.ts`)
2. **Remove `apps/frontend/`** directory
3. **Update root `package.json`** — remove frontend lint-staged entries
4. **Update README.md** — reflect new tech stack
5. **Update `.env`** `FRONTEND_URL` if desired
6. **Install Astro** in a new or repurposed `apps/frontend/` directory
7. **Build and test** the full stack end-to-end
