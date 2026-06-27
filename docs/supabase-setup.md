# Supabase Setup

El admin panel comparte el MISMO proyecto Supabase con `new-wecar/`. Las migraciones del schema público están en `new-wecar/supabase/migrations/`, y las del schema `admin` (para administradores) están en `admin-panel/supabase/migrations/`.

## Esquema `admin`

```sql
-- admin.users: perfiles de administradores
CREATE TABLE admin.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL UNIQUE,
  full_name text,
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- admin.user_roles: roles por usuario
CREATE TABLE admin.user_roles (
  user_id uuid REFERENCES admin.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('superadmin', 'manager', 'viewer')),
  PRIMARY KEY (user_id, role)
);

-- admin.audit_log: registro de acciones
CREATE TABLE admin.audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid REFERENCES admin.users(id),
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
```

## Migraciones

Las migraciones están en `supabase/migrations/`. Se ejecutan con:

```bash
supabase migration up
```

## Seed

El seed crea el schema `admin` y las tablas. Para el primer admin, se usa la Edge Function `admin-bootstrap`.

## Edge Functions

### `admin-bootstrap`

Crea el primer usuario admin. Se invoca manualmente:

```bash
curl -X POST https://<project>.supabase.co/functions/v1/admin-bootstrap \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@wecar.mx", "password": "<temp-password>", "full_name": "Admin"}'
```

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key (pública, para auth del lado cliente) |
| `SUPABASE_URL` | Igual que VITE_SUPABASE_URL (para server) |
| `SUPABASE_PUBLISHABLE_KEY` | Igual que VITE_SUPABASE_PUBLISHABLE_KEY (para server) |
| `SUPABASE_SERVICE_KEY` | Service role key (solo server, para operaciones admin) |
| `WECAR_API_URL` | URL base de la API pública (new-wecar) |
| `WECAR_API_KEY` | Shared secret para autenticación contra la API pública |
