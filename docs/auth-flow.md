# Flujo de autenticación

## Login

1. Usuario ingresa email + password en `/login`
2. `supabase.auth.signInWithPassword()` — autentica contra Supabase Auth del admin
3. Supabase SSR settea cookies (`sb-access-token`, `sb-refresh-token`)
4. Redirección a `/dashboard`

## Route guards

### `_admin.tsx` (layout protegido)
```
beforeLoad → requireAdmin() [createServerFn]
               │
               ▼
        import("@/server/auth.server")
               │
               ▼
        getServerSession() → lee cookies → supabase.auth.getSession()
               │
        ┌──────┴──────┐
        ▼              ▼
     session         null
        │              │
        ▼              ▼
    continua     redirect(/login)
```

### `_auth.tsx` (layout anónimo)
```
beforeLoad → requireAnonymous() [createServerFn]
               │
               ▼
        getServerSession()
               │
        ┌──────┴──────┐
        ▼              ▼
     session         null
        │              │
        ▼              ▼
  redirect(/dashboard)  continua
```

## Logout

`Sidebar.tsx` / `Topbar.tsx` → `supabase.auth.signOut()` → limpia cookies → redirect `/login`

## Actor identity

Para operaciones que mutan datos en la API pública, se envía `X-Admin-Email`:
1. `getServerSession()` obtiene la sesión
2. Se extrae `session.user.email`
3. Se pasa como `actorEmail` en `wecarFetch()`
4. `new-wecar/` valida que el email tenga rol admin via `requireAdminPrincipal()`

## Password recovery

Flujo en `/login`:
1. Usuario click "¿Olvidaste tu contraseña?"
2. `supabase.auth.resetPasswordForEmail()`
3. Supabase envía email con magic link
4. Usuario setea nueva contraseña
