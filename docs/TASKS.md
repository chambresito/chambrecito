# Actionable Tasks

This document contains all actionable implementation tasks extracted from the documentation.

---

## Overview

| Category        | Tasks | Priority |
| --------------- | ----- | -------- |
| Database        | 12    | High     |
| Row Level Security | 6  | High     |
| Edge Functions  | 3     | High     |
| API Endpoints   | 10    | Medium   |
| Frontend        | 4     | Medium   |
| Configuration   | 5     | High     |

---

## 1. Database (Postgres)

### 1.1 Create Tables

- [ ] **DB-01**: Create `markets` table
  - Fields: `id`, `question`, `subject_type`, `resolves_at`, `verification_source_url`, `status`, `created_at`
  - Status ENUM: `open`, `resolved`, `disabled`
  - Subject type ENUM: `public_figure`, `organization`, `protocol`, `event`

- [ ] **DB-02**: Create `predictions` table
  - Fields: `id`, `user_id`, `market_id`, `side`, `tokens_used`, `created_at`
  - Foreign key to `markets`
  - Foreign key to auth.users

- [ ] **DB-03**: Create `token_ledger` table (append-only, immutable)
  - Fields: `id`, `user_id`, `vudy_tx_id`, `action`, `amount`, `related_prediction_id`, `created_at`
  - UNIQUE constraint on `vudy_tx_id`
  - Action ENUM: `consume`
  - No UPDATE or DELETE allowed

- [ ] **DB-04**: Create `resolution_rules` table
  - Fields: `id`, `market_id`, `rule_type`, `source_url`, `expected_outcome`, `created_at`
  - Deterministic resolution logic storage

- [ ] **DB-05**: Create `market_snapshots` table
  - Fields: `id`, `market_id`, `yes_tokens`, `no_tokens`, `participants`, `taken_at`
  - Time-series data for aggregate consensus

- [ ] **DB-06**: Create `user_roles` table
  - Fields: `id`, `user_id`, `role`, `created_at`
  - Role ENUM: `user`, `admin`

- [ ] **DB-07**: Create `reputation_points` table (separate from tokens)
  - Fields: `id`, `user_id`, `market_id`, `points`, `created_at`
  - No reuse of token logic

### 1.2 Constraints & Indexes

- [ ] **DB-08**: Add primary keys to all tables
- [ ] **DB-09**: Add foreign key constraints
- [ ] **DB-10**: Add CHECK constraints (status values, positive amounts, etc.)
- [ ] **DB-11**: Add indexes for common queries (market_id, user_id, status)
- [ ] **DB-12**: Add comments explaining table/column intent

---

## 2. Row Level Security (RLS)

### 2.1 User Policies

- [ ] **RLS-01**: Enable RLS on all tables
- [ ] **RLS-02**: Create SELECT policy for `markets` (users can read open markets)
- [ ] **RLS-03**: Create SELECT policy for `market_snapshots` (users can read)
- [ ] **RLS-04**: Create INSERT policy for `predictions` (only if market is open)
- [ ] **RLS-05**: Block UPDATE/DELETE for users on all tables

### 2.2 Admin Policies

- [ ] **RLS-06**: Create admin policies based on JWT role claims
  - Admin can insert markets
  - Admin can update market status (resolve/disable)

---

## 3. Edge Functions

### 3.1 placePrediction()

- [ ] **EF-01**: Create `placePrediction` Edge Function
  - Verify user session (JWT)
  - Verify market status is `open`
  - Generate idempotency_key: `hash(user_id + market_id + action_type)`
  - Call Vudy API `POST /consume` with idempotency_key
  - Insert into `predictions` table
  - Insert into `token_ledger` table
  - Insert/update `market_snapshots`
  - Wrap in transaction (atomic, retry-safe)

### 3.2 resolveMarket()

- [ ] **EF-02**: Create `resolveMarket` Edge Function
  - Load `resolution_rules` for market
  - Fetch data from declared verification source
  - Evaluate outcome deterministically
  - Store resolution result + evidence
  - Update market status to `resolved`
  - Award reputation points (NO tokens, NO refunds)

### 3.3 ingestMarketsFromX()

- [ ] **EF-03**: Create `ingestMarketsFromX` Edge Function
  - Supabase Cron compatible
  - Pull trending topics from X API
  - Apply safety filters (reject >90%)
  - Classify subject_type
  - Validate external verification source exists
  - Normalize to binary question + resolution date
  - Insert market only if not exists

---

## 4. API Endpoints

### 4.1 Ingestion (Backend Only)

- [ ] **API-01**: `POST /ingest/x` - Pull posts from X API (cron)
- [ ] **API-02**: `POST /ingest/normalize` - Apply filters and normalize
- [ ] **API-03**: `POST /markets/create` - Insert validated market (admin only)

### 4.2 Public (Read-Only)

- [ ] **API-04**: `GET /markets` - List open markets
- [ ] **API-05**: `GET /markets/:id` - Get market detail with rules
- [ ] **API-06**: `GET /markets/:id/snapshots` - Get aggregate consensus

### 4.3 Core

- [ ] **API-07**: `POST /predictions` - Place prediction (calls placePrediction Edge Function)

### 4.4 Resolution

- [ ] **API-08**: `POST /markets/:id/resolve` - Resolve market (admin/cron)
- [ ] **API-09**: `POST /markets/:id/disable` - Disable market (admin)

### 4.5 User

- [ ] **API-10**: `GET /me` - Get user profile, reputation, history

---

## 5. Frontend (Next.js 14)

### 5.1 Pages

- [ ] **FE-01**: Create market list page (`/markets`)
  - Display open markets
  - Use neutral language ("participation credits")
  - No gambling terminology

- [ ] **FE-02**: Create market detail page (`/markets/[id]`)
  - Show question, resolution date, verification source
  - Display aggregate snapshots
  - No individual predictions shown

### 5.2 Components

- [ ] **FE-03**: Create prediction modal
  - Select YES/NO
  - Confirm credits to use
  - Submit prediction

- [ ] **FE-04**: Integrate Supabase Auth
  - Login/logout
  - Session management
  - JWT handling

---

## 6. Configuration

### 6.1 Environment Variables

- [ ] **CFG-01**: Set up Supabase environment variables
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **CFG-02**: Set up Vudy API environment variables
  - `VUDY_API_URL`
  - `VUDY_API_KEY`

- [ ] **CFG-03**: Set up X API environment variables
  - `X_API_KEY`
  - `X_API_SECRET`

### 6.2 Supabase Setup

- [ ] **CFG-04**: Configure Supabase Auth with JWT role claims
- [ ] **CFG-05**: Set up Supabase Cron for `ingestMarketsFromX`

---

## 7. Safety & Compliance Checklist

### Pre-Launch

- [ ] **SAFE-01**: Verify no secrets in client code
- [ ] **SAFE-02**: Verify all token operations are idempotent
- [ ] **SAFE-03**: Verify `vudy_tx_id` uniqueness is enforced
- [ ] **SAFE-04**: Verify no admin actions exposed to frontend
- [ ] **SAFE-05**: Verify no token balances stored locally
- [ ] **SAFE-06**: Verify safety filters reject >90% of candidates
- [ ] **SAFE-07**: Verify neutral language used (no gambling terms)
- [ ] **SAFE-08**: Verify reputation points separate from token logic

---

## Task Dependencies

```
CFG-01/02/03
     │
     ▼
DB-01 → DB-07
     │
     ▼
RLS-01 → RLS-06
     │
     ▼
EF-01 → EF-03
     │
     ▼
API-01 → API-10
     │
     ▼
FE-01 → FE-04
     │
     ▼
SAFE-01 → SAFE-08
```

---

## Priority Order

1. **Phase 1 (Foundation)**: CFG-*, DB-*, RLS-*
2. **Phase 2 (Core Logic)**: EF-01, EF-02, API-07, API-04, API-05
3. **Phase 3 (Frontend)**: FE-01, FE-02, FE-03, FE-04
4. **Phase 4 (Ingestion)**: EF-03, API-01, API-02, API-03
5. **Phase 5 (Resolution)**: API-08, API-09, API-10
6. **Phase 6 (Validation)**: SAFE-*
