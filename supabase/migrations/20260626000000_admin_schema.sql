-- =============================================
-- Admin Panel Schema (separate from public wecar)
-- =============================================
-- This schema holds authentication-linked admin profiles, roles,
-- audit log and any cache the admin-panel needs locally.
-- It is intentionally isolated from the public wecar schema so the
-- admin project can be deployed independently.

create schema if not exists admin;

-- Role enum for the admin panel
do $$ begin
  create type admin.app_role as enum ('superadmin', 'manager', 'viewer');
exception when duplicate_object then null;
end $$;

-- Generic updated_at trigger function (admin-scoped)
create or replace function admin.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================
-- admin.users : profile of any auth user that is allowed in the panel
-- =============================================
create table if not exists admin.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admin_users_email_uidx on admin.users (lower(email));

create trigger trg_admin_users_updated_at
  before update on admin.users
  for each row execute function admin.update_updated_at();

-- =============================================
-- admin.user_roles : one user can hold multiple roles
-- =============================================
create table if not exists admin.user_roles (
  user_id uuid not null references admin.users(id) on delete cascade,
  role admin.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create index if not exists admin_user_roles_role_idx on admin.user_roles (role);

-- =============================================
-- Helpers
-- =============================================
create or replace function admin.is_admin(_user_id uuid)
returns boolean
language sql stable security definer set search_path = admin, public as $$
  select exists (
    select 1
    from admin.user_roles ur
    join admin.users u on u.id = ur.user_id
    where ur.user_id = _user_id
      and u.is_active = true
      and ur.role in ('superadmin', 'manager', 'viewer')
  );
$$;

create or replace function admin.is_superadmin(_user_id uuid)
returns boolean
language sql stable security definer set search_path = admin, public as $$
  select exists (
    select 1
    from admin.user_roles ur
    join admin.users u on u.id = ur.user_id
    where ur.user_id = _user_id
      and u.is_active = true
      and ur.role = 'superadmin'
  );
$$;

create or replace function admin.is_manager_or_above(_user_id uuid)
returns boolean
language sql stable security definer set search_path = admin, public as $$
  select exists (
    select 1
    from admin.user_roles ur
    join admin.users u on u.id = ur.user_id
    where ur.user_id = _user_id
      and u.is_active = true
      and ur.role in ('superadmin', 'manager')
  );
$$;

revoke execute on function admin.is_admin(uuid) from public, anon;
revoke execute on function admin.is_superadmin(uuid) from public, anon;
revoke execute on function admin.is_manager_or_above(uuid) from public, anon;
grant execute on function admin.is_admin(uuid) to authenticated;
grant execute on function admin.is_superadmin(uuid) to authenticated;
grant execute on function admin.is_manager_or_above(uuid) to authenticated;

-- =============================================
-- Auto-link new auth users to admin.users + default viewer role
-- (only fires if the user is explicitly added via the bootstrap function;
--  enable_signup = false in config.toml blocks public signups)
-- =============================================
create or replace function admin.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = admin, public as $$
begin
  insert into admin.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger only attached if not already present
do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created_admin'
  ) then
    create trigger on_auth_user_created_admin
      after insert on auth.users
      for each row execute function admin.handle_new_auth_user();
  end if;
end $$;

-- =============================================
-- RLS
-- =============================================
alter table admin.users enable row level security;
alter table admin.user_roles enable row level security;

-- Anyone authenticated that is an admin can read admin.users
create policy "Admins can read admin.users"
  on admin.users for select
  to authenticated
  using (admin.is_admin(auth.uid()));

-- Only superadmins can create/update/disable users
create policy "Superadmins can insert admin.users"
  on admin.users for insert
  to authenticated
  with check (admin.is_superadmin(auth.uid()));

create policy "Superadmins can update admin.users"
  on admin.users for update
  to authenticated
  using (admin.is_superadmin(auth.uid()))
  with check (admin.is_superadmin(auth.uid()));

create policy "Superadmins can delete admin.users"
  on admin.users for delete
  to authenticated
  using (admin.is_superadmin(auth.uid()));

-- user_roles policies
create policy "Admins can read admin.user_roles"
  on admin.user_roles for select
  to authenticated
  using (admin.is_admin(auth.uid()));

create policy "Superadmins can write admin.user_roles"
  on admin.user_roles for all
  to authenticated
  using (admin.is_superadmin(auth.uid()))
  with check (admin.is_superadmin(auth.uid()));

-- =============================================
-- Grants
-- =============================================
grant usage on schema admin to authenticated;
grant select, insert, update, delete on admin.users to authenticated;
grant select, insert, update, delete on admin.user_roles to authenticated;
