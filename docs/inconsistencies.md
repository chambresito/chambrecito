# Inconsistencies Log

This document tracks discrepancies between documented requirements and implementation decisions.

---

## RLS-02: Markets SELECT Policy

**Date:** 2026-01-31

**Requirement (TASKS.md):**
> RLS-02: Create SELECT policy for `markets` (users can read open markets)

**Original Implementation (001_init.sql):**
```sql
create policy markets_read on markets
  for select to anon, authenticated
  using (true);
```

This allowed ALL markets to be read by any user, regardless of status.

**Resolution:**
Per user request, the policy was updated to restrict non-admin users to reading only open markets. Admins retain access to all markets (open, resolved, canceled).

**New Implementation (002_rls_markets_open_only.sql):**
```sql
drop policy if exists markets_read on markets;

create policy markets_read on markets
  for select to anon, authenticated
  using (status = 'open' or is_admin());
```

**Rationale:**
- Non-admin users should only see markets they can participate in (open status)
- Resolved/canceled markets may contain sensitive resolution data
- Admins need full visibility for management and auditing purposes
