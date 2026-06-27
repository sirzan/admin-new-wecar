-- Add missing values to car_status enum that are used in the app code
ALTER TYPE public.car_status ADD VALUE IF NOT EXISTS 'pendiente';
ALTER TYPE public.car_status ADD VALUE IF NOT EXISTS 'cancelado';
ALTER TYPE public.car_status ADD VALUE IF NOT EXISTS 'promocion';
