-- Catálogo de roles de administrador
create table if not exists admin.roles (
  name text primary key,
  label text not null,
  description text,
  created_at timestamptz not null default now()
);

insert into admin.roles (name, label, description) values
  ('superadmin', 'Superadmin', 'Acceso total a todas las secciones del panel'),
  ('manager', 'Manager', 'CRUD en contenido, no puede gestionar administradores'),
  ('viewer', 'Visor', 'Solo lectura en todas las secciones')
on conflict (name) do update set
  label = excluded.label,
  description = excluded.description;
