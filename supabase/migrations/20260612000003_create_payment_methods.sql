create table if not exists public.user_payment_methods (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    stripe_payment_method_id text unique not null,
    brand text not null,
    last4 text not null,
    exp_month integer not null,
    exp_year integer not null,
    is_default boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security
alter table public.user_payment_methods enable row level security;

-- Políticas
create policy "Users can view own payment methods" on public.user_payment_methods for select using (auth.uid() = user_id);
create policy "Users can insert own payment methods" on public.user_payment_methods for insert with check (auth.uid() = user_id);
create policy "Users can update own payment methods" on public.user_payment_methods for update using (auth.uid() = user_id);
create policy "Users can delete own payment methods" on public.user_payment_methods for delete using (auth.uid() = user_id);
