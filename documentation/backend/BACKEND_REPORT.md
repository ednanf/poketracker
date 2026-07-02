# Backend Architecture Report

> Generated: 2026-06-29
> Source: `apps/backend/`

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Configuration Layer](#2-configuration-layer)
3. [Global Middleware Pipeline](#3-global-middleware-pipeline)
4. [Error Handling System](#4-error-handling-system)
5. [Routes & Endpoints](#5-routes--endpoints)
6. [Controllers (Request Handlers)](#6-controllers-request-handlers)
7. [Data Models (Mongoose)](#7-data-models-mongoose)
8. [Utilities](#8-utilities)
9. [Data Flow Diagrams](#9-data-flow-diagrams)
10. [Dependencies](#10-dependencies)

---

## 1. Project Structure

```
apps/backend/
├── .env
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── scripts/
│   └── generate-catalog.ts          # Standalone script: fetches PokéAPI, generates dex-catalog.json
└── src/
    ├── app.ts                       # Express app setup (middleware + route registration)
    ├── server.ts                    # Entry point (DB connect → listen)
    ├── config/
    │   ├── cors.config.ts           # CORS allowed origins
    │   ├── env.config.ts            # Zod-validated env vars
    │   └── rateLimit.config.ts      # Rate limiting options
    ├── controllers/
    │   ├── auth.controller.ts       # register, login, logout, refreshToken
    │   ├── account.controller.ts    # whoAmI, patchUser, deleteUser
    │   └── saveFiles.controller.ts  # CRUD + sync for save files
    ├── errors/
    │   ├── index.ts                 # Barrel export
    │   ├── CustomError.ts           # Base class (statusCode = 500)
    │   ├── HttpError.ts             # Extends CustomError, takes statusCode
    │   ├── BadRequestError.ts       # 400
    │   ├── UnauthenticatedError.ts  # 401
    │   ├── UnauthorizedError.ts     # 401
    │   ├── ForbiddenError.ts        # 403
    │   ├── NotFoundError.ts         # 404
    │   ├── ConflictError.ts         # 409
    │   ├── InternalServerError.ts   # 500
    │   ├── EnvVarsMissingError.ts   # 500 (startup)
    │   ├── DatabaseError.ts         # 500 (DB connection)
    │   ├── JWTConfigurationError.ts # 500 (startup)
    │   └── MongoDuplicateError.ts   # 409 (not used in src, only in dist)
    ├── middleware/
    │   ├── auth.middleware.ts       # requireAuth: JWT Bearer token verification
    │   ├── errorHandler.middleware.ts # Global error handler (6 error types)
    │   ├── notFound.middleware.ts   # 404 catch-all
    │   └── validate.middleware.ts   # Zod schema validation factory
    ├── models/
    │   ├── User.model.ts            # User schema + password hashing
    │   ├── RefreshToken.model.ts    # Refresh token storage + TTL index
    │   └── SaveFile.model.ts        # Pokédex save file schema
    ├── types/
    │   └── express.d.ts             # Global Express.Request augmentation (req.userId)
    └── utils/
        ├── checkEnvVars.util.ts     # Startup env var validation
        ├── comparePasswords.util.ts # bcrypt comparison
        ├── dbConnect.util.ts        # Mongoose connection wrapper
        ├── hashPassword.util.ts     # bcrypt hashing (12 rounds)
        └── jwt.util.ts              # Token generation + cookie attachment
```

### Dependencies map (internal)

```
app.ts
 ├── config/cors.config.ts
 ├── config/rateLimit.config.ts
 ├── routes/auth.route.ts
 │    ├── middleware/validate.middleware.ts  ← uses @poketracker/shared (Zod schemas)
 │    └── controllers/auth.controller.ts
 │         ├── models/User.model.ts
 │         │    ├── utils/hashPassword.util.ts
 │         │    └── utils/comparePasswords.util.ts
 │         ├── models/RefreshToken.model.ts
 │         ├── utils/jwt.util.ts
 │         └── errors/*
 ├── routes/account.route.ts
 │    ├── middleware/auth.middleware.ts
 │    ├── middleware/validate.middleware.ts
 │    └── controllers/account.controller.ts
 │         ├── models/User.model.ts
 │         ├── models/RefreshToken.model.ts
 │         ├── models/SaveFile.model.ts
 │         └── errors/*
 ├── routes/saveFiles.route.ts
 │    ├── middleware/auth.middleware.ts
 │    ├── middleware/validate.middleware.ts
 │    └── controllers/saveFiles.controller.ts
 │         ├── models/SaveFile.model.ts
 │         └── errors/*
 ├── middleware/errorHandler.middleware.ts  (catches everything)
 └── middleware/notFound.middleware.ts     (last resort)
```

---

## 2. Configuration Layer

### 2.1 Environment Variables (`src/config/env.config.ts`)

Validated with Zod at import time. If validation fails, logs an error table and throws.

| Variable | Type | Default | Constraints |
|---|---|---|---|
| `NODE_VERSION` | `string?` | — | Optional |
| `NODE_ENV` | enum | `'development'` | `development \| test \| production` |
| `PORT` | `number` | `9000` | Transformed from string |
| `MONGODB_URI` | `string` | `'EMPTY'` | — |
| `MONGODB_LOCAL_URI` | `string` | `'mongodb://localhost:27017/poketracker'` | Must be valid URL |
| `JWT_ACCESS_SECRET` | `string` | — | min 32 chars |
| `JWT_REFRESH_SECRET` | `string` | — | min 32 chars |
| `JWT_LIFETIME` | `string` | `'30d'` | — |

**Actual `.env` values (dev):**

```
NODE_VERSION=24.12.0
NODE_ENV=development
PORT=9000
MONGODB_URI=EMPTY
MONGODB_LOCAL_URI=mongodb://localhost:27017/poketracker
JWT_ACCESS_SECRET=e3b0c44...
JWT_REFRESH_SECRET=cd372fb...
RESEND_API_KEY=re_Qpkv...       # Defined but NOT used in backend code
EMAIL_FROM_ADDRESS=noreply@...  # Defined but NOT used in backend code
FRONTEND_URL=http://localhost:5173  # Defined but NOT used in backend code
```

### 2.2 CORS (`src/config/cors.config.ts`)

```ts
const allowedOrigins = [
    'http://localhost:5173',          // Vite React dev server
    'http://localhost:4173',          // Vite React preview server
    'http://10.0.0.102:4173',        // Network access
    'http://10.0.0.102:5173',        // Network access
];
// Methods: GET, POST, PATCH, DELETE
```

### 2.3 Rate Limiting (`src/config/rateLimit.config.ts`)

- Window: 15 minutes
- Limit: 300 requests per IP per window
- Response on exceed: `{ status: 429, error: 'Too many requests, please try again later.' }`

---

## 3. Global Middleware Pipeline

Ordered as defined in `src/app.ts`:

```
1. rateLimit(300 req / 15 min)
2. cors(allowedOrigins)
3. express.json()
4. cookieParser()                 → populates req.cookies
5. helmet()                       → security headers
6. xss()                          → sanitize request body/params/query
7. morgan('tiny')                 → HTTP request logging
8. Routes: /api/v1/auth/*
           /api/v1/account/*
           /api/v1/save-file/*
9. errorHandlerMiddleware         → catches all errors
10. notFoundMiddleware            → 404 catch-all
```

### 3.1 `requireAuth` Middleware

**File:** `src/middleware/auth.middleware.ts`

- Reads `Authorization: Bearer <token>` header
- Verifies JWT with `JWT_ACCESS_SECRET`
- On success: sets `req.userId` (type: `string`)
- On failure: throws `UnauthenticatedError` (401)

### 3.2 `validate(schema)` Middleware Factory

**File:** `src/middleware/validate.middleware.ts`

- Takes a Zod schema (usually from `@poketracker/shared`)
- Validates `{ body, query, params }` against the schema
- On failure: returns 400 with `{ error: 'Validation Failed', details: [...] }`
- Non-Zod errors are forwarded to the global error handler

### 3.3 `errorHandler` Middleware

**File:** `src/middleware/errorHandler.middleware.ts`

Catches errors in this priority order:

| # | Error Type | Status | Behavior |
|---|---|---|---|
| 1 | `CustomError` (or any error with `statusCode`) | as defined | Returns `{ status: 'error', data: { message } }` |
| 2 | MongoDB `MongoServerError` code 11000 (duplicate key) | 409 | Returns `{ status: 'error', data: { message: '<Key> already exists.' } }` |
| 3 | Mongoose `ValidationError` | 400 | Collects all error messages |
| 4 | Mongoose `CastError` (invalid ObjectId) | 400 | Returns `Invalid <path>: <value>.` |
| 5 | JWT `JsonWebTokenError` / `TokenExpiredError` | 401 | Returns `Not authorized. Invalid or expired token.` |
| 6 | Fallback (unknown) | 500 | Generates `errorId` (UUID), logs error + stack. In production, message is generic. In dev, leaks `err.message`. |

### 3.4 `notFound` Middleware

**File:** `src/middleware/notFound.middleware.ts`

Creates `NotFoundError('404 - Not Found')` and forwards it to the error handler.

---

## 4. Error Handling System

**File:** `src/errors/`

Class hierarchy:

```
Error
 └── CustomError (statusCode = 500)
      ├── HttpError (statusCode: number)
      │     ├── BadRequestError (400)
      │     ├── UnauthenticatedError (401)
      │     ├── UnauthorizedError (401)
      │     ├── ForbiddenError (403)
      │     ├── NotFoundError (404)
      │     ├── ConflictError (409)
      │     ├── InternalServerError (500)
      │     └── EnvVarsMissingError (500)
      ├── DatabaseError (500)
      └── JWTConfigurationError (500)
```

Response format for all errors:

```json
{
    "status": "error",
    "data": {
        "message": "Human-readable error message",
        "errorId": "uuid"  // Only on fallback 500
    }
}
```

---

## 5. Routes & Endpoints

### 5.1 Auth Routes — `/api/v1/auth`

| Method | Path | Middleware | Handler | Description |
|---|---|---|---|---|
| POST | `/register` | `validate(RegisterSchema)` | `registerUser` | Create account, return tokens |
| POST | `/login` | `validate(LoginSchema)` | `loginUser` | Authenticate, return tokens |
| POST | `/logout` | — | `logoutUser` | Clear refresh token from DB + cookie |
| POST | `/refresh-token` | — | `refreshToken` | Mint new access token via refresh token cookie |

### 5.2 Account Routes — `/api/v1/account`

All guarded by `requireAuth` (applied via `router.use`).

| Method | Path | Middleware | Handler | Description |
|---|---|---|---|---|
| GET | `/` | `requireAuth` | `whoAmI` | Get current user profile |
| PATCH | `/` | `requireAuth`, `validate(UpdateAccountSchema)` | `patchUser` | Update email/username/password |
| DELETE | `/` | `requireAuth` | `deleteUser` | Delete account + cascade all data |

### 5.3 Save File Routes — `/api/v1/save-file`

All guarded by `requireAuth` (applied via `router.use`).

| Method | Path | Middleware | Handler | Description |
|---|---|---|---|---|
| GET | `/` | `requireAuth` | `getAllSaveFiles` | List all user save files (metadata only, no `caughtIds`) |
| POST | `/` | `requireAuth`, `validate(CreateSaveFileSchema)` | `createSaveFile` | Create new save file |
| GET | `/:id` | `requireAuth`, `validate(SaveFileIdSchema)` | `getSaveFileById` | Get full save file with `caughtIds` |
| PATCH | `/:id` | `requireAuth`, `validate(UpdateSaveFileSchema)` | `updateSaveFile` | Update save file name |
| DELETE | `/:id` | `requireAuth`, `validate(SaveFileIdSchema)` | `deleteSaveFile` | Delete save file |
| PATCH | `/:id/sync` | `requireAuth`, `validate(SyncPayloadSchema)` | `syncSaveFile` | Batch ADD/REMOVE pokemon from caughtIds |

---

## 6. Controllers (Request Handlers)

### 6.1 Auth Controller (`src/controllers/auth.controller.ts`)

#### `registerUser`
1. Receives `{ email, username, password }` (validated)
2. Creates `User` document (pre-save hook hashes password)
3. Generates access token (JWT, 15m) + refresh token (JWT, 7d)
4. Saves refresh token to MongoDB (for revocation)
5. Sets httpOnly cookie with refresh token
6. Returns 201: `{ status: 'success', data: { message, accessToken, user: { id, username, email } } }`

#### `loginUser`
1. Receives `{ email, password }` (validated)
2. Queries `User.findOne({ email }).select('+passwordHash')` — explicitly includes hidden field
3. Compares password via `user.comparePassword()`
4. Same token generation flow as register
5. Returns 200: same shape as register

#### `refreshToken`
1. Reads `req.cookies.refreshToken`
2. Verifies JWT, then checks MongoDB for token existence (revocation check)
3. Mints new access token
4. Returns 200: `{ status: 'success', data: { message, accessToken } }`

#### `logoutUser`
1. Reads `req.cookies.refreshToken`
2. If present, deletes from MongoDB
3. Clears the cookie
4. Returns 200: `{ status: 'success', data: { message } }`

### 6.2 Account Controller (`src/controllers/account.controller.ts`)

#### `whoAmI`
1. `User.findById(req.userId)` (set by `requireAuth`)
2. Returns 200: `{ status: 'success', data: { message, user: { id, username, email } } }`

#### `patchUser`
1. `User.findById(req.userId)` — if missing, 401
2. Dynamically applies `email`, `username`, `password` to document
3. `user.save()` triggers pre-save hook + schema validations
4. Returns 200: updated user profile

#### `deleteUser`
1. `User.findById(req.userId)` — if missing, 401
2. **Cascade delete:** `Promise.all([RefreshToken.deleteMany, SaveFile.deleteMany, user.deleteOne()])`
3. Clears cookie
4. Returns 200: success message

### 6.3 Save File Controller (`src/controllers/saveFiles.controller.ts`)

#### `getAllSaveFiles`
1. Uses MongoDB **aggregation pipeline**:
   - `$match`: filter by userId
   - `$project`: name, type, gameVersion, timestamps, `caughtCount: { $size: '$caughtIds' }`
2. Returns metadata payloads (no `caughtIds` array, just count)

#### `getSaveFileById`
1. `SaveFile.findById(id)` — 404 if missing
2. Ownership check: `saveFile.userId.toString() !== userId` → 403
3. Returns full payload with `caughtIds`

#### `createSaveFile`
1. `SaveFile.create({ userId, name, type, gameVersion, caughtIds: [] })`
2. Returns 201 with full save file

#### `updateSaveFile`
1. Fetch + ownership check
2. Updates `name` only (Zod schema enforces this)
3. Returns full payload

#### `deleteSaveFile`
1. Fetch + ownership check
2. `saveFile.deleteOne()`
3. Returns 200 with message

#### `syncSaveFile`
1. Fetch with `.select('userId')` (minimal projection for ownership check)
2. Ownership check
3. Maps `ADD`/`REMOVE` actions to `AnyBulkWriteOperation[]`
   - `ADD` → `$addToSet { caughtIds: pokemonId }`
   - `REMOVE` → `$pull { caughtIds: pokemonId }`
4. Executes `SaveFile.bulkWrite(bulkOperations)`
5. Re-fetches document `.select('caughtIds')` for absolute truth
6. Returns updated `caughtIds` array

---

## 7. Data Models (Mongoose)

### 7.1 User (`src/models/User.model.ts`)

| Field | Type | Constraints |
|---|---|---|
| `_id` | `ObjectId` | Auto |
| `email` | `String` | Required, unique, lowercase, trim, minlength(5), regex validated |
| `username` | `String` | Required, unique, trim, minlength(3), maxlength(30) |
| `passwordHash` | `String` | Required, trim, minlength(6), **`select: false`** |
| `verified` | `Boolean` | Required, default: `false` |
| `createdAt` | `Date` | Auto (timestamps) |
| `updatedAt` | `Date` | Auto (timestamps) |

**Hooks:**
- `pre('save')`: If `passwordHash` was modified, hash with bcrypt (12 rounds)

**Methods:**
- `comparePassword(candidatePassword)`: bcrypt compare. Throws if `passwordHash` not selected.

### 7.2 RefreshToken (`src/models/RefreshToken.model.ts`)

| Field | Type | Constraints |
|---|---|---|
| `_id` | `ObjectId` | Auto |
| `token` | `String` | Required, unique, trim |
| `userId` | `ObjectId` | Required, ref: 'User', indexed |
| `expiresAt` | `Date` | Required |
| `createdAt` | `Date` | Auto (timestamps) |
| `updatedAt` | `Date` | Auto (timestamps) |

**Indexes:**
- `{ expiresAt: 1 }` — TTL index (`expireAfterSeconds: 0`), auto-deletes expired docs

**Methods:**
- `isExpired()`: synchronous check against `expiresAt`

### 7.3 SaveFile (`src/models/SaveFile.model.ts`)

| Field | Type | Constraints |
|---|---|---|
| `_id` | `ObjectId` | Auto |
| `userId` | `ObjectId` | Required, ref: 'User', indexed |
| `name` | `String` | Required, trim, maxlength(50) |
| `type` | `String` | Required, enum: `['NATIONAL', 'REGIONAL']` |
| `gameVersion` | `String` | Required, trim |
| `caughtIds` | `String[]` | Each element must match `^\d{3,4}-[a-z]+$` |
| `documentVersion` | `Number` | Default: 1 |
| `createdAt` | `Date` | Auto (timestamps) |
| `updatedAt` | `Date` | Auto (timestamps) |

**Indexes:**
- `{ userId: 1, gameVersion: 1 }` — query optimization
- `{ _id: 1, userId: 1 }` — ownership verification

**Methods:**
- `clearDex()`: resets `caughtIds = []`, increments `documentVersion`

---

## 8. Utilities

### 8.1 JWT (`src/utils/jwt.util.ts`)

- `generateAccessToken(userId)`: signs JWT with `JWT_ACCESS_SECRET`, expiresIn `'15m'`
- `generateRefreshToken(userId)`: signs JWT with `JWT_REFRESH_SECRET`, expiresIn `'7d'`
- `attachCookiesToResponse(res, refreshToken)`: sets httpOnly cookie named `refreshToken`, secure in production, sameSite `'lax'`, expires in 7 days

### 8.2 Password Hashing (`src/utils/hashPassword.util.ts`)

- `hashPassword(password)`: `bcrypt.hash(password, 12)` — 12 salt rounds

### 8.3 Password Comparison (`src/utils/comparePasswords.util.ts`)

- `comparePasswords(candidate, hashed)`: `bcrypt.compare(candidate, hashed)`

### 8.4 Database Connection (`src/utils/dbConnect.util.ts`)

- `dbConnectUtil(uri)`: calls `mongoose.connect(uri)`, throws `DatabaseError` on failure

### 8.5 Env Var Check (`src/utils/checkEnvVars.util.ts`)

- `checkEnvVarsUtil(requiredVars)`: throws `EnvVarsMissingError` if any var is missing. **Not currently used** (env validation is done via Zod in `env.config.ts`).

---

## 9. Data Flow Diagrams

### 9.1 Registration / Login Flow

```
Client                    Backend                          MongoDB
  │                          │                                │
  │── POST /api/v1/auth/register ──► validate(RegisterSchema) │
  │                          │                                │
  │                          │──► User.create({...}) ────────►│ (pre-save hashes pw)
  │                          │◄── user document ──────────────┤
  │                          │                                │
  │                          │──► generateAccessToken()       │
  │                          │──► generateRefreshToken()     │
  │                          │──► RefreshToken.create() ────►│
  │◄── 201 { status, data: { accessToken, user } }           │
  │    Set-Cookie: refreshToken (httpOnly)                    │
```

### 9.2 Authenticated Request Flow

```
Client                    Backend                          MongoDB
  │                          │                                │
  │── GET /api/v1/account/ ──► rateLimit → cors → helmet →   │
  │    Authorization: Bearer  xss → morgan                    │
  │                          │                                │
  │                          ├──► requireAuth                 │
  │                          │    ├── jwt.verify(token)        │
  │                          │    └── req.userId = payload    │
  │                          │                                │
  │                          ├──► whoAmI controller           │
  │                          │    └── User.findById(id) ─────►│
  │◄── 200 { status, data: { user } }                        │
```

### 9.3 Save File Sync Flow

```
Client                    Backend                          MongoDB
  │                          │                                │
  │── PATCH /api/v1/save-file/:id/sync                       │
  │    { actions: [{ action: "ADD", pokemonId: "001-base" }] }│
  │                          │                                │
  │                          ├──► requireAuth                 │
  │                          ├──► validate(SyncPayloadSchema) │
  │                          │                                │
  │                          ├──► syncSaveFile controller     │
  │                          │    ├── SaveFile.findById(id)   │
  │                          │    │   .select('userId') ─────►│
  │                          │    ├── ownership check         │
  │                          │    ├── SaveFile.bulkWrite() ──►│
  │                          │    ├── SaveFile.findById(id)   │
  │                          │    │   .select('caughtIds') ──►│
  │◄── 200 { status, data: { caughtIds: [...] } }            │
```

---

## 10. Dependencies

### Production

| Package | Purpose |
|---|---|
| `@poketracker/shared` | Zod schemas + TypeScript types (monorepo) |
| `bcryptjs` | Password hashing |
| `cookie-parser` | Parse cookies from headers |
| `cors` | CORS headers |
| `express` | Web framework |
| `express-rate-limit` | Rate limiting |
| `express-xss-sanitizer` | XSS prevention |
| `helmet` | Security headers |
| `http-status-codes` | Symbolic HTTP status codes |
| `jsonwebtoken` | JWT signing & verification |
| `mongoose` | MongoDB ODM |
| `morgan` | HTTP request logging |
| `ms` | **Not used** in source |
| `validator` | **Not used** directly in source |
| `zod` | Runtime schema validation |

### Dev Dependencies

| Package | Purpose |
|---|---|
| `@types/*` | TypeScript type definitions |
| `@vitest/coverage-v8` | Test coverage |
| `rimraf` | Clean build artifacts |
| `supertest` | HTTP test assertions |
| `tsx` | TypeScript execution for dev |
| `vite` | Vitest peer dependency |
| `vitest` | Test runner |

---

## Shared Package: `@poketracker/shared`

**Path:** `packages/shared/src/`

### Zod Schemas (all exported)

| Schema | Validates |
|---|---|
| `RegisterSchema` | `body: { email, username, password }` |
| `LoginSchema` | `body: { email, password }` |
| `UpdateAccountSchema` | `body: { email?, username?, password? }` — rejects empty body |
| `CreateSaveFileSchema` | `body: { name, type, gameVersion }` |
| `SaveFileIdSchema` | `params: { id: 24-char hex }` |
| `UpdateSaveFileSchema` | `params: { id }`, `body: { name? }` |
| `SyncPayloadSchema` | `params: { id }`, `body: { actions: [...] }` (1-100 actions) |

### TypeScript Interfaces

| Interface | Purpose |
|---|---|
| `ApiResponse<T>` | Generic wrapper: `{ status, data: T }` |
| `ApiError` | `{ message, errorId? }` |
| `AuthSuccessPayload` | `{ message, accessToken, user }` — login/register response |
| `UserProfilePayload` | `{ message, user }` — account response |
| `SaveFilePayload` | Full save file with `caughtIds` |
| `SaveFileMetadataPayload` | Lightweight (has `caughtCount`, no `caughtIds`) |
| `CreateSaveFileSuccessPayload` | Wraps `SaveFilePayload` |
| `GetAllSaveFilesSuccessPayload` | Wraps `SaveFileMetadataPayload[]` |
| `GetSaveFileSuccessPayload` | Wraps `SaveFilePayload` |
| `UpdateSaveFileSuccessPayload` | Wraps `SaveFilePayload` |
| `DeleteSaveFileSuccessPayload` | Just `{ message }` |
| `SyncAction` | `{ action: 'ADD' \| 'REMOVE', pokemonId: string }` |
| `SyncSaveFileInput` | `{ actions: SyncAction[] }` |

---

## Server Entry Point (`src/server.ts`)

```
1. Determine connection string:
   envConfig.MONGODB_URI (if != 'EMPTY') → envConfig.MONGODB_LOCAL_URI (fallback)
2. dbConnectUtil(connectionString)
3. server.listen(envConfig.PORT)
4. On error → console.error + process.exit(1)
```

## Standalone Script: `scripts/generate-catalog.ts`

- Not part of the server runtime
- Fetches `https://pokeapi.co/api/v2/pokedex/1`
- Transforms entries to `{ id: "001-base", name: "bulbasaur" }[]`
- Writes compressed JSON to `packages/shared/data/dex-catalog.json`
