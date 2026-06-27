-- =============================================
-- User Security Settings (2FA / MFA metadata)
-- =============================================

create table if not exists public.user_security_settings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade unique,
    phone_number text,
    phone_verified boolean default false,
    recovery_codes_hashed text[],
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

create trigger user_security_settings_updated_at
    before update on public.user_security_settings
    for each row execute function public.update_updated_at();

-- RLS
alter table public.user_security_settings enable row level security;

create policy "user_security_select_own" on public.user_security_settings
    for select using (auth.uid() = user_id);

create policy "user_security_insert_own" on public.user_security_settings
    for insert with check (auth.uid() = user_id);

create policy "user_security_update_own" on public.user_security_settings
    for update using (auth.uid() = user_id);

create policy "user_security_delete_own" on public.user_security_settings
    for delete using (auth.uid() = user_id);

-- Auto-create security settings row on signup (extends existing handle_new_user)
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
    insert into public.user_security_settings (user_id) values (new.id)
        on conflict (user_id) do nothing;
    return new;
end;
$$;
