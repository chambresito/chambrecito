# API Endpoints

This document describes all system endpoints organized by category.

---

## Endpoint Summary

### Ingestion (Backend Only)
- `POST /ingest/x`
- `POST /ingest/normalize`
- `POST /markets/create`

### Public (Read-Only)
- `GET /markets`
- `GET /markets/:id`
- `GET /markets/:id/snapshots`

### Core
- `POST /predictions`
- `POST vudy.com/consume` (external)

### Resolution
- `POST /markets/:id/resolve`
- `POST /markets/:id/disable`

### User
- `GET /me`

---

## Ingestion & Moderation (Backend Only)

### 1. POST /ingest/x

**Type:** Supabase Edge Function + Cron
**Caller:** System (not users)

**Responsibilities:**
- Read public posts from X
- Extract signals (engagement, authors)
- Generate raw candidates

**Output:**
- ❌ Does NOT create markets
- ✅ Only internal candidates

---

### 2. POST /ingest/normalize

**Type:** Edge Function (private)

**Responsibilities:**
- Classify `subject_type`
- Apply safety filters
- Validate public figures
- Verify external source
- Normalize to binary question

**Key Rule:** If anything fails → discard, nothing public exists

---

### 3. POST /markets/create

**Type:** Edge Function (admin / system only)

**Responsibilities:**
- Insert already-filtered market
- Store:
  - `question`
  - `subject_type`
  - `resolves_at`
  - `verification_source_url`

**Restrictions:**
- ❌ Never from frontend
- ❌ Never by users

---

## Public Consumption (Read-Only)

### 4. GET /markets

**Type:** API / Supabase client
**Caller:** Users

**Responsibilities:**
- List open markets
- Read-only
- No sensitive logic

---

### 5. GET /markets/:id

**Type:** API
**Caller:** Users

**Responsibilities:**
- View market detail
- Rules
- Verifiable source
- Status

---

### 6. GET /markets/:id/snapshots

**Type:** API
**Caller:** Users

**Responsibilities:**
- Show aggregate consensus
- ❌ Do NOT show individual predictions
- ❌ No financial calculations

---

## Prediction (Critical)

### 7. POST /predictions

**Type:** Edge Function
**Caller:** Authenticated user

**Responsibilities:**
1. Verify session
2. Verify market is open
3. Generate `idempotency_key`
4. Call vudy `/consume`
5. Insert prediction
6. Insert `token_ledger`
7. Create snapshot

**Note:** This is the most important endpoint in the system.

---

## Wallet / Tokens (External)

### 8. POST vudy.com/consume

**Type:** External API
**Caller:** Backend

**Responsibilities:**
- Consume service credits
- Return `vudy_tx_id`
- Guarantee idempotence

**Restriction:** ❌ Frontend NEVER touches this

> For detailed Vudy API documentation, see [vudy-api-5.1.0.md](../vudy-api-5.1.0.md)

---

## Resolution

### 9. POST /markets/:id/resolve

**Type:** Edge Function (admin / cron)

**Responsibilities:**
- Load `resolution_rules`
- Verify external event
- Store evidence
- Change status → `resolved`
- Assign reputation points

---

### 10. POST /markets/:id/disable

**Type:** Edge Function (admin)

**Responsibilities:**
- Deactivate market for edge cases
- Maintain audit trail
- ❌ Do NOT delete anything

---

## User / Profile (Light)

### 11. GET /me

**Type:** API

**Responsibilities:**
- Basic profile
- Reputation score
- Aggregate history

---

## Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details (optional)"
  }
}
```
