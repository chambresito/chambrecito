# Database Mapping: Endpoints → Tables

This document maps each API endpoint to the database tables it reads from and writes to.

---

## Mapping Table

| Endpoint                  | Tables READ                | Tables WRITE                          |
| ------------------------- | -------------------------- | ------------------------------------- |
| `/ingest/x`               | —                          | —                                     |
| `/ingest/normalize`       | —                          | —                                     |
| `/markets/create`         | —                          | markets                               |
| `/markets`                | markets                    | —                                     |
| `/markets/:id`            | markets, resolution_rules  | —                                     |
| `/markets/:id/snapshots`  | market_snapshots           | —                                     |
| `/predictions`            | markets                    | predictions, token_ledger, snapshots  |
| `vudy.com/consume`        | —                          | —                                     |
| `/markets/:id/resolve`    | resolution_rules           | markets, reputation_points            |
| `/markets/:id/disable`    | —                          | markets                               |
| `/me`                     | predictions, reputation    | —                                     |

---

## Detailed Endpoint → Database Actions

### 1. POST /ingest/x

**Type:** Edge Function (cron / system)

**Tables:** ❌ None (NO persistence yet)

**Actions:**
- Reads posts from X API
- Generates candidates in memory
- Passes output to `/ingest/normalize`

**Rule:** Never writes to DB

---

### 2. POST /ingest/normalize

**Type:** Edge Function (system)

**Tables:** ❌ None (still)

**Actions:**
- Classifies `subject_type`
- Applies filters (private / public / rumor)
- Validates external verifiability
- Normalizes question + date

**Output:** `ValidatedMarketCandidate` (internal object)

**Rule:** If fails → discard → no DB

---

### 3. POST /markets/create

**Type:** Edge Function (admin/system only)

**Tables:** ✅ `markets`

**Inserts:**
```sql
markets (
  id,
  question,
  subject_type,
  resolves_at,
  verification_source_url,
  status = 'open',
  created_at
)
```

**Note:** First point where something becomes public

---

### 4. GET /markets

**Type:** Public (read-only)

**Tables:** ✅ `markets`

**Reads:**
```sql
SELECT * FROM markets
WHERE status = 'open'
```

- ❌ No sensitive joins
- ❌ No critical logic

---

### 5. GET /markets/:id

**Type:** Public

**Tables:** ✅ `markets`, ✅ `resolution_rules` (read-only)

**Reads:**
- Question
- Resolution date
- External source
- Rules (for explainability)

---

### 6. GET /markets/:id/snapshots

**Type:** Public

**Tables:** ✅ `market_snapshots`

**Reads:**
```sql
SELECT
  yes_tokens,
  no_tokens,
  participants,
  taken_at
FROM market_snapshots
WHERE market_id = :id
ORDER BY taken_at ASC
```

- ❌ Never individual predictions

---

### 7. POST /predictions

**Type:** Edge Function (user auth)

**Tables:** ✅ `predictions`, ✅ `token_ledger`, ✅ `market_snapshots`

**Flow:**
1. Verifies market is open (`markets`)
2. Calls vudy `/consume`
3. Inserts prediction
4. Inserts ledger (append-only)
5. Generates aggregate snapshot

**Writes:**
```sql
predictions (
  id,
  user_id,
  market_id,
  side,
  tokens_used,
  created_at
)

token_ledger (
  id,
  user_id,
  vudy_tx_id UNIQUE,
  action = 'consume',
  amount,
  related_prediction_id
)

market_snapshots (
  market_id,
  yes_tokens,
  no_tokens,
  participants,
  taken_at
)
```

**Note:** Most critical endpoint in the system

---

### 8. POST vudy.com/consume

**Type:** External API

**Tables:** ❌ None directly

**Returns:**
- `vudy_tx_id`
- `OK` / `AlreadyProcessed`

**Note:** Reflected later in `token_ledger`

---

### 9. POST /markets/:id/resolve

**Type:** Edge Function (admin / cron)

**Tables:** ✅ `resolution_rules`, ✅ `markets`, ✅ `reputation_points`

**Reads:**
- Deterministic rules
- External source

**Writes:**
```sql
UPDATE markets SET status = 'resolved'

INSERT reputation_points (
  user_id,
  market_id,
  points
)
```

- ❌ NO tokens
- ❌ NO refunds

---

### 10. POST /markets/:id/disable

**Type:** Edge Function (admin)

**Tables:** ✅ `markets`

**Writes:**
```sql
UPDATE markets
SET status = 'disabled'
```

**Note:** Does not delete, preserves audit trail

---

### 11. GET /me

**Type:** Public (user auth)

**Tables:** ✅ `reputation_points`, ✅ `predictions`

**Reads (aggregated):**
- Total reputation
- Accuracy %
- Participation count

- ❌ No token balance
- ❌ No raw ledger
