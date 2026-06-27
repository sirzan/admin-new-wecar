# Arquitectura

## Flujo de datos

```
Browser                  TanStack Start Server              Supabase
  │                             │                              │
  │  ┌─ createServerFn ──── RPC ──► handler ─── supabaseAdmin ─►│
  │  │   (client proxy)         │     (server)   (service role) │
  │  │                          │                               │
  │  └──────────────────────────┘                               │
  │                                                             │
  │  ┌─ TanStack Query ──── createServerFn ─────────────────────┘
  │  │                     (React Query cache + fetch)
  │  └──────────────────────────────────────────────────────────
```

## Capas

### 1. Route layer (`src/routes/`)
- Define layouts, páginas, y guards de autenticación
- Llama a funciones RPC desde `src/actions/`
- Nunca importa directamente desde `src/server/`

### 2. Action layer (`src/actions/`)
- Define operaciones RPC con `createServerFn`
- Importa dinámicamente dependencias server-only (`getServerSession`)
- Usa `supabaseAdmin` (service-role) para leer/escribir directamente en Supabase

### 3. Server layer (`src/server/`)
- Solo `auth.server.ts` — lógica de sesión con Supabase SSR
- Dependencias: `@supabase/ssr`, `@tanstack/react-start/server` (getCookie)

### 4. Base de datos (Supabase)
- Mismo proyecto que `new-wecar/` (comparten las tablas `public.*`)
- Admin panel usa service-role key para operaciones CRUD
- Schema `admin.*` para autenticación y roles de administradores

## Protección de importaciones

TanStack Start bloquea automáticamente que código cliente importe desde `**/server/**`. Para evitarlo:

1. Los `createServerFn` viven en `src/actions/` (fuera del patrón bloqueado)
2. El código server-only (supabase admin, cookies) se importa dinámicamente DENTRO del handler
3. El handler body es tree-shaken del bundle cliente por el plugin de TanStack Start

## Autenticación

El admin panel usa su propio proyecto Supabase con esquema `admin`:

- `admin.users` — perfiles de administradores
- `admin.user_roles` — roles (superadmin, manager, viewer)
- Flujo: Login → Supabase Auth → sesión en cookies → `requireAdmin` guard verifica sesión en cada ruta protegida
