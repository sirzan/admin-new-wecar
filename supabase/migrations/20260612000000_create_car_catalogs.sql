create table if not exists public.car_brands (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.car_models (
    id uuid primary key default gen_random_uuid(),
    brand_id uuid not null references public.car_brands(id) on delete cascade,
    name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.car_versions (
    id uuid primary key default gen_random_uuid(),
    model_id uuid not null references public.car_models(id) on delete cascade,
    name text not null,
    years text, -- Guardado como texto (ej: "2018-2022" o "2020, 2021")
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Row Level Security)
alter table public.car_brands enable row level security;
alter table public.car_models enable row level security;
alter table public.car_versions enable row level security;

-- Políticas de lectura pública (asumiendo que los catálogos de autos deben ser públicos)
create policy "Permitir lectura publica de marcas" on public.car_brands for select using (true);
create policy "Permitir lectura publica de modelos" on public.car_models for select using (true);
create policy "Permitir lectura publica de versiones" on public.car_versions for select using (true);
