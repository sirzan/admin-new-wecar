-- =============================================
-- Admin audit log
-- =============================================
-- Every meaningful action performed through the admin panel is recorded
-- here. Inserts happen exclusively from server-side code using the
-- service role key (bypassing RLS). Reads are restricted to admins.

create table if not exists admin.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  resource text not null,
  resource_id text,
  payload jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_actor_idx on admin.audit_log (actor_id);
create index if not exists audit_log_created_idx on admin.audit_log (created_at desc);
create index if not exists audit_log_resource_idx on admin.audit_log (resource, resource_id);
create index if not exists audit_log_action_idx on admin.audit_log (action);

alter table admin.audit_log enable row level security;

-- Only admins can read the log
create policy "Admins can read audit_log"
  on admin.audit_log for select
  to authenticated
  using (admin.is_admin(auth.uid()));

-- Writes are restricted: only server-side service role can insert
-- (RLS will deny inserts from regular authenticated users since no
-- policy grants them write access; service role bypasses RLS).
-- Explicitly deny for safety.
create policy "Deny inserts to audit_log for non-service-role"
  on admin.audit_log for insert
  to authenticated
  with check (false);

create policy "Deny updates to audit_log"
  on admin.audit_log for update
  to authenticated
  using (false);

create policy "Deny deletes to audit_log"
  on admin.audit_log for delete
  to authenticated
  using (false);

grant select on admin.audit_log to authenticated;
