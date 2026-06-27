ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS accepts_trade boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trade_preference text,
  ADD COLUMN IF NOT EXISTS vin text,
  ADD COLUMN IF NOT EXISTS serial_number text,
  ADD COLUMN IF NOT EXISTS plates text,
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'basico';