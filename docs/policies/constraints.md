# System Constraints & Technical Requirements

This document defines the hard constraints, tech stack, and implementation requirements for the chambresito.com platform.

---

## Product Definition

**Token-based prediction platform.**

| Aspect        | Rule                                                    |
| ------------- | ------------------------------------------------------- |
| Money         | ❌ NO money                                             |
| Gambling      | ❌ NO gambling                                          |
| Cash-out      | ❌ NO cash-out                                          |
| Tokens        | Service credits, NOT assets                             |
| Balances      | Handled externally by vudy.com (source of truth)        |
| Local storage | Supabase stores only an internal immutable mirror (ledger) |
| Topics        | Auto-ingested from X (Twitter) API                      |
| User creation | ❌ Users cannot create prediction topics                |

---

## Tech Stack (Fixed)

| Component       | Technology                                    |
| --------------- | --------------------------------------------- |
| Backend         | Supabase (Postgres, RLS, Edge Functions, Cron)|
| Frontend        | Next.js 14 + Tailwind + shadcn               |
| Wallet API      | vudy.com                                      |
| External data   | X API                                         |
| Auth            | Supabase Auth (JWT with role claims)          |

---

## Hard Constraints (DO NOT VIOLATE)

These constraints are non-negotiable:

1. ❌ Do NOT introduce money or value transfer
2. ❌ Do NOT allow cash-out or redemption
3. ❌ Do NOT allow user-created markets
4. ❌ Do NOT expose admin actions to the frontend
5. ❌ Do NOT store token balances locally
6. ✅ All token operations MUST be idempotent
7. ✅ `vudy_tx_id` MUST be unique
8. ✅ Reputation points MUST NOT reuse token logic
9. ❌ Do NOT add features beyond what is explicitly requested

---

## Database Requirements

### Required Tables

| Table              | Purpose                           |
| ------------------ | --------------------------------- |
| `markets`          | Prediction markets                |
| `predictions`      | User predictions                  |
| `token_ledger`     | Append-only, immutable token log  |
| `resolution_rules` | Deterministic resolution logic    |
| `market_snapshots` | Time-series insight               |
| `user_roles`       | Admin vs user distinction         |
| `reputation_points`| SEPARATE from tokens              |

### Required Constraints

- Primary & foreign keys
- Indexes
- CHECK constraints
- UNIQUE constraints
- Comments explaining intent

---

## Row Level Security (Mandatory)

### User Permissions

| Action  | Allowed                                      |
| ------- | -------------------------------------------- |
| READ    | Markets and snapshots                        |
| INSERT  | Predictions ONLY if market is open           |
| UPDATE  | ❌ Cannot update any records                 |
| DELETE  | ❌ Cannot delete any records                 |

### Admin Permissions

| Action           | Allowed |
| ---------------- | ------- |
| Ingest markets   | ✅      |
| Resolve markets  | ✅      |

### Role Determination

- Role is determined ONLY via JWT claims
- Edge Functions use `service_role` and bypass RLS

---

## Edge Functions Requirements

### A) placePrediction()

1. Verifies user session
2. Verifies market is open
3. Generates `idempotency_key = hash(user_id + market_id + action_type)`
4. Calls vudy `POST /consume` using idempotency_key
5. Inserts prediction
6. Inserts token_ledger entry
7. Inserts market_snapshot
8. **Fully atomic and retry-safe**

### B) resolveMarket()

1. Loads deterministic resolution_rules
2. Fetches data from declared source (mock X API allowed)
3. Evaluates outcome deterministically
4. Stores resolution result + evidence
5. Awards reputation points (NO tokens, NO refunds)

### C) ingestMarketsFromX()

1. Supabase Cron compatible
2. Pulls trending topics from X API
3. Normalizes into safe, binary, time-bounded markets
4. Filters unsafe categories
5. Inserts markets ONLY if they do not already exist

---

## Frontend Requirements (Minimal, Legal-Safe)

### Required Pages

- Market list
- Market detail with prediction modal

### Language Rules

| Do                              | Don't                        |
| ------------------------------- | ---------------------------- |
| ✅ "participation credits"      | ❌ "tokens" or "bets"        |
| ✅ Neutral language             | ❌ Gambling terminology      |
| ✅ User-facing UI only          | ❌ Admin UI                  |
| ✅ Simple participation         | ❌ Odds, ROI calculations    |

---

## Security & Quality Requirements

| Requirement                     | Status |
| ------------------------------- | ------ |
| No secrets in client code       | ✅     |
| Environment variables used      | ✅     |
| Defensive error handling        | ✅     |
| Clear comments for non-obvious  | ✅     |
| Simple, production-ready        | ✅     |
| No overengineering              | ✅     |

---

## Verdict

This system must be:

- ✅ Coherent
- ✅ Implementable
- ✅ Auditable
- ✅ Defendable
- ✅ Senior-level quality
