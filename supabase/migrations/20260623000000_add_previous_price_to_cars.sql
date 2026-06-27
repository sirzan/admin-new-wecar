-- Add previous_price column to cars for historical price display
alter table public.cars add column if not exists previous_price numeric default null;

-- Update column-level grants to include the new field
grant select (id, owner_id, year, km, price, previous_price, city, description, image, gallery, transmission, fuel, body, color, featured, created_at, updated_at, accepts_trade, trade_preference, vin, serial_number, plates, status_id, brand_id, model_id, version_id) on public.cars to anon, authenticated;
