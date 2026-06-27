-- ENUMS
create type public.app_role as enum ('admin', 'user');
create type public.car_status as enum ('en_venta', 'nuevo', 'vendido');
create type public.car_transmission as enum ('Automática', 'Manual', 'CVT');
create type public.car_fuel as enum ('Gasolina', 'Diésel', 'Híbrido');
create type public.car_body as enum ('Sedán', 'SUV', 'Hatchback', 'Pickup');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  city text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- USER ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Roles viewable by everyone" on public.user_roles for select using (true);
create policy "Only admins manage roles" on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- CARS
create table public.cars (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  brand text not null,
  model text not null,
  year int not null,
  km int not null default 0,
  price numeric not null,
  city text not null,
  status public.car_status not null default 'en_venta',
  description text,
  image text,
  gallery text[] not null default '{}',
  transmission public.car_transmission,
  fuel public.car_fuel,
  body public.car_body,
  color text,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cars enable row level security;
create policy "Cars viewable by everyone" on public.cars for select using (true);
create policy "Authenticated users can publish cars" on public.cars for insert with check (auth.uid() = owner_id);
create policy "Owners or admins can update cars" on public.cars for update
  using (auth.uid() = owner_id or public.has_role(auth.uid(), 'admin'));
create policy "Owners or admins can delete cars" on public.cars for delete
  using (auth.uid() = owner_id or public.has_role(auth.uid(), 'admin'));
create index cars_owner_idx on public.cars(owner_id);
create index cars_status_idx on public.cars(status);
create index idx_cars_featured on public.cars(featured) where featured = true;

-- CREDIT APPLICATIONS
create table public.credit_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null,
  monthly_income numeric not null,
  car_price numeric,
  down_payment numeric,
  term_months int,
  monthly_estimate numeric,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
alter table public.credit_applications enable row level security;
create policy "Anyone can submit credit application" on public.credit_applications for insert with check (
  char_length(full_name) between 2 and 120
  and char_length(email) between 5 and 255
  and char_length(phone) between 7 and 25
  and monthly_income > 0
);
create policy "Admins can view all credit applications" on public.credit_applications for select
  using (public.has_role(auth.uid(), 'admin'));
create policy "Users can view own applications" on public.credit_applications for select using (auth.uid() = user_id);
create policy "Admins can update credit applications" on public.credit_applications for update
  using (public.has_role(auth.uid(), 'admin'));

-- TIMESTAMP TRIGGER
create or replace function public.update_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at();
create trigger cars_updated_at before update on public.cars for each row execute function public.update_updated_at();

-- AUTO PROFILE + ROLE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, city) values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'city'
  );
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- STORAGE BUCKET
insert into storage.buckets (id, name, public) values ('car-images', 'car-images', true) on conflict (id) do nothing;
create policy "Authenticated users upload car images" on storage.objects for insert
  with check (bucket_id = 'car-images' and auth.role() = 'authenticated');
create policy "Users update own car images" on storage.objects for update
  using (bucket_id = 'car-images' and owner = auth.uid());
create policy "Users delete own car images" on storage.objects for delete
  using (bucket_id = 'car-images' and owner = auth.uid());

-- Revoke
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.update_updated_at() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- CAR REPORTS
create table public.car_reports (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  reporter_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.car_reports enable row level security;
create policy "Authenticated users can create reports" on public.car_reports for insert
  with check (auth.uid() = reporter_id and char_length(reason) between 3 and 200);
create policy "Reporters can view their own reports" on public.car_reports for select using (auth.uid() = reporter_id);
create policy "Admins can view all reports" on public.car_reports for select using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update reports" on public.car_reports for update using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete reports" on public.car_reports for delete using (public.has_role(auth.uid(), 'admin'));

-- SITE SETTINGS
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.site_settings enable row level security;
create policy "Anyone can read site settings" on public.site_settings for select using (true);
create policy "Admins can insert settings" on public.site_settings for insert with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update settings" on public.site_settings for update using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete settings" on public.site_settings for delete using (public.has_role(auth.uid(), 'admin'));
create trigger trg_site_settings_updated before update on public.site_settings for each row execute function public.update_updated_at();

insert into public.site_settings (key, value) values
  ('credit_rates', '{"interest_annual": 12.9, "min_term": 12, "max_term": 60, "min_down_pct": 10}'::jsonb),
  ('home_banner', '{"enabled": false, "title": "", "subtitle": "", "cta_label": "", "cta_url": ""}'::jsonb),
  ('cities', '["Monterrey","Ciudad de México","Guadalajara","Querétaro","Puebla","Tijuana"]'::jsonb)
on conflict (key) do nothing;

-- ADMIN FUNCTIONS
create or replace function public.admin_list_users()
returns table (id uuid, email text, full_name text, phone text, city text, created_at timestamptz, is_admin boolean)
language sql stable security definer set search_path = public as $$
  select u.id, u.email::text, p.full_name, p.phone, p.city, u.created_at, public.has_role(u.id, 'admin')
  from auth.users u left join public.profiles p on p.id = u.id
  where public.has_role(auth.uid(), 'admin')
  order by u.created_at desc;
$$;
revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

create or replace function public.admin_set_role(_user_id uuid, _make_admin boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'not authorized'; end if;
  if _make_admin then
    insert into public.user_roles (user_id, role) values (_user_id, 'admin') on conflict (user_id, role) do nothing;
  else
    delete from public.user_roles where user_id = _user_id and role = 'admin';
  end if;
end;
$$;
revoke all on function public.admin_set_role(uuid, boolean) from public;
grant execute on function public.admin_set_role(uuid, boolean) to authenticated;