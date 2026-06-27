-- Eliminar las tablas previas (que tenían ID de texto)
drop table if exists public.stripe_payments cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.plans cascade;

-- Volver a crearlas con UUID como primary key
create table public.plans (
    id uuid primary key default gen_random_uuid(),
    key_name text unique not null, -- Mantenemos un identificador de texto interno (ej. 'basico') para poder mapear los iconos en el frontend
    name text not null,
    price numeric not null,
    duration text not null,
    duration_weeks integer not null,
    max_cars integer not null,
    highlight boolean default false,
    features jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    car_id uuid not null references public.cars(id) on delete cascade,
    plan_id uuid not null references public.plans(id) on delete restrict, -- Ahora es un UUID
    status text not null,
    billing_cycle text not null,
    stripe_subscription_id text,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.stripe_payments (
    id uuid primary key default gen_random_uuid(),
    subscription_id uuid not null references public.subscriptions(id) on delete cascade,
    stripe_payment_intent_id text,
    amount numeric not null,
    currency text default 'mxn',
    status text not null,
    receipt_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stripe_payments enable row level security;

-- Políticas
create policy "Plans are viewable by everyone" on public.plans for select using (true);
create policy "Users can view own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users can view own payments" on public.stripe_payments for select using (
    exists (
        select 1 from public.subscriptions s
        where s.id = stripe_payments.subscription_id and s.user_id = auth.uid()
    )
);

-- Insertar los planes iniciales
insert into public.plans (key_name, name, price, duration, duration_weeks, max_cars, highlight, features) values
('basico', 'Básico', 0, '30 días', 4, 2, false, '["Hasta 2 autos publicados", "2.5% comisión compra segura", "Financiamiento disponible", "Publicación estándar"]'::jsonb),
('destacado', 'Destacado / Pro', 499, '45 días', 6, 3, true, '["Hasta 3 autos publicados", "2% comisión · Garantía Wecar", "Financiamiento disponible", "Validación de identidad a posibles interesados", "Posicionamiento prioritario en wecar.mx y Google"]'::jsonb),
('premium', 'Premium', 999, '60 días', 8, 3, false, '["Hasta 3 autos publicados", "Top en resultados (Meta, Mercado Libre, Google)", "Certificado de validación mecánica y legal", "1.5% comisión · Garantía Wecar", "Financiamiento disponible", "Validación de identidad a posibles interesados"]'::jsonb),
('agencia', 'Agencia', 2990, '30 días', 4, 30, false, '["Hasta 30 autos publicados", "Panel para agencias y multiusuario", "Top en resultados (Meta, Mercado Libre, Google)", "Certificado de validación mecánica y legal", "1.2% comisión · Garantía Wecar", "Soporte prioritario dedicado"]'::jsonb)
on conflict (key_name) do nothing;
