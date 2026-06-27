-- Audit log for admin actions
create table if not exists admin.audit_log (
  id uuid not null default gen_random_uuid() primary key,
  actor_id uuid references admin.users(id) on delete set null,
  actor_email text,
  action text not null,
  resource text not null,
  resource_id text,
  payload jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_actor on admin.audit_log(actor_id);
create index if not exists idx_audit_log_created on admin.audit_log(created_at desc);
