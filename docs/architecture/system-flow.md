# System Flow Pipeline

This document describes the 9-step pipeline for processing prediction markets from X API ingestion to resolution.

---

```
┌──────────────────────-┐
│ X API (public posts)│
└──────────┬───────────-┘
           │
           ▼
┌────────────────────────────┐
│ 1. SIGNAL EXTRACTION       │
│ (engagement + authors)     │
│ - NO replies personales    │
│ - NO emojis / memes        │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ 2. SUBJECT CLASSIFICATION  │
│ subject_type =             │
│ - public_figure            │
│ - organization             │
│ - protocol                 │
│ - event                    │
│                            │
│ ❌ private person → DROP   │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ 3. SAFETY FILTER (HARD)    │
│                            │
│ ❌ pregnancy               │
│ ❌ sexual life             │
│ ❌ health (not official)   │
│ ❌ rumors / "dicen que"    │
│ ❌ speculation             │
│ ❌ emojis                  │
│                            │
│ > 90% DROP HERE            │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ 4. VERIFICATION GATE       │
│                            │
│ Is there an external       │
│ verifiable source?         │
│                            │
│ - court record             │
│ - official statement       │
│ - platform action          │
│ - reputable media          │
│                            │
│ ❌ NO → DROP               │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ 5. NORMALIZATION           │
│                            │
│ Text → binary question     │
│ + resolution date          │
│                            │
│ ❌ not binarizable → DROP  │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ 6. MARKET CREATION         │
│                            │
│ markets{                   │
│   question                 │
│   subject_type             │
│   resolves_at              │
│   verification_source_url  │
│   status=open              │
│ }                          │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ 7. USER PREDICTIONS        │
│                            │
│ placePrediction():         │
│ - verify session           │
│ - consume credits via      │
│   vudy.com                 │
│ - insert prediction        │
│ - snapshot aggregate       │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ 8. RESOLUTION              │
│                            │
│ resolveMarket():           │
│ - load resolution_rules    │
│ - check external source    │
│ - persist evidence         │
│ - award reputation points  │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ 9. SAFETY BACKUP           │
│                            │
│ status = disabled          │
│ (edge cases only)          │
└────────────────────────────┘
```

---

## Quick Mental Map

```
X API
  ↓
[ingest]
  ↓
[filters]
  ↓
[markets]
  ↓
[predictions] → vudy
  ↓
[snapshots]
  ↓
[resolution]
```
