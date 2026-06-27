-- Drop old text columns from cars table, now replaced by FK columns
alter table public.cars drop column if exists brand;
alter table public.cars drop column if exists model;
alter table public.cars drop column if exists status;

-- Drop the old enum type since it's no longer used (only if no other tables reference it)
-- do $$
-- begin
--   if exists (select 1 from pg_type where typname = 'car_status') then
--     -- Check if any column still references this enum
--     if not exists (
--       select 1 from information_schema.columns
--       where udt_name = 'car_status' and table_name != 'cars'
--     ) then
--       drop type if exists public.car_status;
--     end if;
--   end if;
-- end;
-- $$;

-- Remove stale index on old status column
drop index if exists public.cars_status_idx;

-- Update column-level grants to reflect removed columns
grant select (id, owner_id, year, km, price, city, description, image, gallery, transmission, fuel, body, color, featured, created_at, updated_at, accepts_trade, trade_preference, vin, serial_number, plates, status_id, brand_id, model_id, version_id) on public.cars to anon, authenticated;
