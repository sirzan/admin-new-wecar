# Deployment

El admin panel se despliega en Cloudflare (pages + workers) usando el adaptador de TanStack Start.

## Build

```bash
cd admin-panel
bun run build
```

El build genera:
- `dist/client/` — assets estáticos (Cloudflare Pages)
- `dist/server/` — server bundle (Cloudflare Workers)

## Variables de entorno (producción)

Configurar en Cloudflare Pages:

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase admin |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key |
| `SUPABASE_URL` | URL del proyecto Supabase admin |
| `SUPABASE_PUBLISHABLE_KEY` | Anon key |
| `SUPABASE_SERVICE_KEY` | Service role key |
| `WECAR_API_URL` | URL de la API pública (new-wecar) |
| `WECAR_API_KEY` | Shared secret |

## Bootstrap del primer admin

```bash
curl -X POST https://<project>.supabase.co/functions/v1/admin-bootstrap \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@wecar.mx", "password": "<temp-password>", "full_name": "Admin"}'
```

Luego iniciar sesión en `/login` con esas credenciales y configurar roles adicionales desde Settings → Roles.

## Supabase migrations

```bash
cd admin-panel
supabase migration up
supabase db push
```
