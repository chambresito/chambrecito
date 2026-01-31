# Safety Filters & Public Figure Policies

This document defines the filtering rules and safety policies for market creation.

---

## Legal Safety Statement

> "Markets involving public figures are limited strictly to already-public, verifiable events. The platform does not publish or incentivize rumors or private personal speculation."

---

## Subject Types (Mandatory)

Every market MUST have a `subject_type`:

| Type            | Description                                      |
| --------------- | ------------------------------------------------ |
| `public_figure` | Verified accounts, celebrities, public officials |
| `organization`  | Companies, institutions, groups                  |
| `protocol`      | Technical protocols, blockchain projects         |
| `event`         | Public events, conferences, announcements        |

---

## Public Figure Rules

When `subject_type == public_figure`, ALL of the following must pass:

### 1. Identity Verification

The public figure MUST be:
- ✅ Verified account, OR
- ✅ Widely known creator / celebrity / public official
- ❌ NOT a private individual

### 2. Event Requirements

The event MUST be:
- ✅ Already public OR part of a public process
- ✅ Verifiable via external source
- ❌ NOT speculative personal behavior

### 3. Hard Disallowed Topics (Auto-Reject)

The following topics are **automatically rejected**:

| Topic                    | Reason                          |
| ------------------------ | ------------------------------- |
| Pregnancy                | Private health information      |
| Sexual life              | Private personal information    |
| Health (unless official) | Private unless publicly stated  |
| Rumors / "allegedly"     | Unverifiable speculation        |
| Emojis-only / meme posts | Not substantive content         |
| "People say" / "dicen que" / "tal vez" | Speculation markers |

### 4. Allowed Public Figure Events (Examples)

| Event Type               | Requirement                       |
| ------------------------ | --------------------------------- |
| Arrest, lawsuit, conviction | Officially reported only       |
| Account suspension / ban | Platform action documented        |
| Public apology / statement | Verified public statement       |
| Event attendance / cancellation | Publicly announced          |
| Platform actions (TikTok ban, YouTube strike) | Platform record |

### 5. External Verification Rule

If the event cannot be resolved via one of the following, the market **MUST NOT** be created:

- ✅ Official statement
- ✅ Court record
- ✅ Platform action
- ✅ Reputable news source

---

## Signal Extraction Rules

During the initial signal extraction phase:

- ❌ NO personal replies
- ❌ NO emoji-only content
- ❌ NO meme-style posts

---

## Safety Filter Statistics

By design, the safety filter should reject **>90%** of candidate topics.

```
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
└────────────────────────────┘
```

---

## Implementation Notes

- Add `subject_type` to markets table
- Add `verification_required = true`
- Add `verification_source_url` field
- In `IngestMarketsFromX()`:
  - Use X only as signal source
  - Require external verification before insert
  - Reject >90% of candidate topics by design

---

## X API Usage Note

> "X is used only as an idea generator, not a source of truth."

The platform uses X (Twitter) API to discover trending topics and signals, but all markets require external verification before creation.

---

## Final Rule

**If there is ANY doubt, DO NOT create the market.**

It is always safer to discard.
