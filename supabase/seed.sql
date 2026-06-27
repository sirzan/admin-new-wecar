-- =============================================
-- Admin Panel seed
-- =============================================
-- This seed does NOT create the auth user itself (that requires the
-- service role key). Run the admin-bootstrap Edge Function once to
-- provision the first superadmin, then this file will link it.
--
-- Usage:
--   1. Deploy the Edge Function:
--        supabase functions deploy admin-bootstrap
--   2. Invoke it once:
--        curl -X POST $SUPABASE_URL/functions/v1/admin-bootstrap \
--          -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
--          -H "Content-Type: application/json" \
--          -d '{"email":"admin@wecar.mx","password":"CHANGE_ME","full_name":"Admin Wecar"}'
--   3. The user will be created in auth.users and promoted to
--      superadmin via admin.handle_new_auth_user() + this seed.
--
-- Manual fallback (e.g. from Supabase Dashboard SQL editor):
--   - Create the user via Authentication → Users → Add user (confirm email).
--   - Then run the inserts below; ON CONFLICT makes the script idempotent.

-- Link existing auth users with the given email to admin schema
insert into admin.users (id, email, full_name, is_active)
select id, email,
       coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1)),
       true
from auth.users
where email = 'admin@wecar.mx'
on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, admin.users.full_name),
      is_active = true;

-- Promote to superadmin
insert into admin.user_roles (user_id, role)
select id, 'superadmin'::admin.app_role
from auth.users
where email = 'admin@wecar.mx'
on conflict (user_id, role) do nothing;
