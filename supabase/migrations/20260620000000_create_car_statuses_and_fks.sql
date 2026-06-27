-- 1. Create car_statuses catalog table
create table if not exists public.car_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.car_statuses enable row level security;

create policy "Anyone can read car statuses" on public.car_statuses for select using (true);

-- 2. Seed the 4 statuses
insert into public.car_statuses (name, label, sort_order) values
  ('pendiente',  'Pendiente',  1),
  ('en_venta',   'En Venta',   2),
  ('cancelado',  'Cancelado',  3),
  ('promocion',  'Promoción',  4)
on conflict (name) do nothing;

-- 3. Add FK columns to cars table
alter table public.cars add column if not exists status_id uuid references public.car_statuses(id);
alter table public.cars add column if not exists brand_id uuid references public.car_brands(id);
alter table public.cars add column if not exists model_id uuid references public.car_models(id);
alter table public.cars add column if not exists version_id uuid references public.car_versions(id);

-- 4. Migrate existing cars: set status_id based on current status text
do $$
declare
  v_id uuid;
begin
  -- Map 'en_venta' -> en_venta
  select id into v_id from public.car_statuses where name = 'en_venta';
  update public.cars set status_id = v_id where status = 'en_venta' and status_id is null;

  -- Map 'nuevo' -> en_venta (nuevo is not a status in the new system, treat as en_venta)
  update public.cars set status_id = v_id where status = 'nuevo' and status_id is null;

  -- Map 'pending' -> pendiente
  select id into v_id from public.car_statuses where name = 'pendiente';
  update public.cars set status_id = v_id where status = 'pending' and status_id is null;

  -- Map 'vendido' -> cancelado (vendido is not a status in the new system, treat as cancelado)
  select id into v_id from public.car_statuses where name = 'cancelado';
  update public.cars set status_id = v_id where status = 'vendido' and status_id is null;
end;
$$;

-- 5. Try to match existing brand/model text to catalog entries
do $$
declare
  r record;
begin
  for r in select c.id, c.brand, c.model from public.cars c where c.brand_id is null loop
    begin
      update public.cars
      set brand_id = (select cb.id from public.car_brands cb where lower(cb.name) = lower(r.brand) limit 1)
      where id = r.id and brand_id is null;
    exception when others then end;
  end loop;

  for r in select c.id, c.brand, c.model from public.cars c where c.model_id is null loop
    begin
      update public.cars
      set model_id = (
        select cm.id from public.car_models cm
        join public.car_brands cb on cb.id = cm.brand_id
        where lower(cm.name) = lower(r.model)
          and (
            (c.brand_id is not null and cb.id = c.brand_id)
            or lower(cb.name) = lower(
              (select brand from public.cars where id = r.id)
            )
          )
        limit 1
      )
      where id = r.id and model_id is null;
    exception when others then end;
  end loop;
end;
$$;

-- 6. Add index on status_id for filtering
create index if not exists idx_cars_status_id on public.cars(status_id);

-- 7. Grant permissions
grant select on public.car_statuses to anon, authenticated;
