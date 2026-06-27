-- Admin schema for admin panel authentication and authorization.
-- Must be applied on top of new-wecar's public schema (same Supabase project).

create schema if not exists admin;

-- app_role enum for admin roles
do $$ begin
  create type admin.app_role as enum ('superadmin', 'manager', 'viewer');
exception
  when duplicate_object then null;
end $$;

-- Admin users (profiles linked to auth.users)
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

create unique index if not exists idx_admin_users_email on admin.users(email);

-- Admin roles (one user can have multiple roles)
create table if not exists admin.user_roles (
  user_id uuid not null references admin.users(id) on delete cascade,
  role admin.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- Trigger: auto-create admin.users row when an auth user is created
-- (only if the user was created through admin-bootstrap or the admin panel)
create or replace function admin.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into admin.users (id, email, full_name, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    true
  )
  on conflict (id) do nothing;

  insert into admin.user_roles (user_id, role)
  values (new.id, 'viewer'::admin.app_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

-- Attach trigger to auth.users (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created_admin'
      and tgrelid = 'auth.users'::regclass
  ) then
    create trigger on_auth_user_created_admin
      after insert on auth.users
      for each row
      execute function admin.handle_new_auth_user();
  end if;
end;
$$;

-- Helper functions for route guards
create or replace function admin.is_admin(_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from admin.user_roles
    where user_id = _user_id
  );
$$;

create or replace function admin.is_superadmin(_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from admin.user_roles
    where user_id = _user_id
      and role = 'superadmin'::admin.app_role
  );
$$;

create or replace function admin.is_manager_or_above(_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from admin.user_roles
    where user_id = _user_id
      and role in ('superadmin'::admin.app_role, 'manager'::admin.app_role)
  );
$$;
