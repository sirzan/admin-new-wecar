-- =============================================
-- Advertisements table (admin-managed marketing blocks)
-- =============================================

create table if not exists public.advertisements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  image_url text,
  cta_label text,
  cta_url text,
  placement text not null default 'home_hero',
  status text not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  impressions int not null default 0,
  clicks int not null default 0,
  sort_order int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint advertisements_status_check check (
    status in ('draft','active','paused','archived')
  ),
  constraint advertisements_placement_check check (
    placement in ('home_hero','home_inline','search_inline','detail_sidebar','global_top')
  )
);

create index if not exists advertisements_status_idx on public.advertisements (status);
create index if not exists advertisements_placement_idx on public.advertisements (placement);
create index if not exists advertisements_starts_at_idx on public.advertisements (starts_at);

create trigger advertisements_updated_at
  before update on public.advertisements
  for each row execute function public.update_updated_at();

alter table public.advertisements enable row level security;

-- Public can read active ads that are within their date window
create policy "Anyone can read active advertisements"
  on public.advertisements for select
  using (
    status = 'active'
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

-- Admins can do everything
create policy "Admins can read all advertisements"
  on public.advertisements for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert advertisements"
  on public.advertisements for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update advertisements"
  on public.advertisements for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete advertisements"
  on public.advertisements for delete
  using (public.has_role(auth.uid(), 'admin'));

grant select on public.advertisements to anon, authenticated;
grant insert, update, delete on public.advertisements to authenticated;
