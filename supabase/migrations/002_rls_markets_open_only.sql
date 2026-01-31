-- Migration: Restrict markets SELECT to open markets only
-- Admins can still see all markets via is_admin() check.

drop policy if exists markets_read on markets;

create policy markets_read on markets
  for select
  to anon, authenticated
  using (status = 'open' or is_admin());
