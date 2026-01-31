# Data Flow Diagrams

This document contains visual diagrams illustrating the system's data flows.

---

## A) Ingestion & Market Creation (SYSTEM ONLY)

```
[X API]
   │
   ▼
POST /ingest/x
   │   (no DB write)
   ▼
POST /ingest/normalize
   │   (filters + verification)
   ▼
POST /markets/create
   │
   └── INSERT → markets
```

**Note:** Nothing is public until it enters `markets`.

---

## B) Public Consumption (READ ONLY)

```
GET /markets
   └── SELECT → markets

GET /markets/:id
   └── SELECT → markets
                 resolution_rules

GET /markets/:id/snapshots
   └── SELECT → market_snapshots
```

**Note:** Zero critical logic, read-only.

---

## C) Prediction Flow (MOST IMPORTANT)

```
User
 │
 ▼
POST /predictions
 │
 │  1. SELECT → markets (status = open?)
 │
 │  2. POST → vudy.com/consume
 │       (idempotency_key)
 │
 │  3. INSERT → predictions
 │
 │  4. INSERT → token_ledger
 │
 │  5. INSERT → market_snapshots
 │
 └── COMMIT
```

**Notes:**
- Everything is atomic
- If anything fails → retry-safe

---

## D) Market Resolution (ADMIN / CRON)

```
POST /markets/:id/resolve
 │
 │  1. SELECT → resolution_rules
 │
 │  2. FETCH → external verification source
 │
 │  3. UPDATE → markets (status = resolved)
 │
 │  4. INSERT → reputation_points
 │
 └── DONE
```

**Notes:**
- Never tokens
- Only reputation

---

## E) Emergency Disable (ADMIN BACKUP)

```
POST /markets/:id/disable
 │
 └── UPDATE → markets (status = disabled)
```

**Notes:**
- Does not delete
- Preserves audit trail

---

## F) User Profile

```
GET /me
 │
 ├── SELECT → predictions (aggregate)
 └── SELECT → reputation_points
```

**Notes:**
- No tokens
- No raw ledger

---

## Reference Images

The following reference images are available in the `assets/` folder:

- `7a7748a6-db81-449b-a3ad-f7872d8be508.png` - System diagram
- `Simple-Data-Flow-Diagram-1.webp` - Simple data flow diagram
- `Flow-chart-of-the-steps-in-our-proposed-framework-for-stock-market-forecasting-using.png` - Forecasting framework flow chart

### External Reference Images

- [Simple Data Flow Diagram](https://knowhow.visual-paradigm.com/know-how_files/2018/07/Simple-Data-Flow-Diagram-1.png)
- [Stock Market Trading Signals Flowchart](https://www.researchgate.net/publication/347513511/figure/fig4/AS%3A970912430047239%401608494970606/Flowchart-of-model-for-predicting-the-stock-market-trading-signals.ppm)
- [Stock Market Forecasting Framework](https://www.researchgate.net/publication/339938321/figure/fig2/AS%3A1165249738747904%401654828595182/Flow-chart-of-the-steps-in-our-proposed-framework-for-stock-market-forecasting-using.png)
