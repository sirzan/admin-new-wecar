-- Inserta los tres roles (superadmin, manager, viewer) para el admin.
-- Idempotente: ON CONFLICT no duplica.

insert into admin.user_roles (user_id, role)
select u.id, r.role
from admin.users u
cross join (values ('superadmin'::admin.app_role), ('manager'::admin.app_role), ('viewer'::admin.app_role)) as r(role)
where u.email = 'admin@wecar.mx'
on conflict (user_id, role) do nothing;
