# Wecar Admin Panel

Panel de administración para Wecar.mx construido con React, TanStack Start y Supabase.

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | React + TanStack Start (SSR + RPC) |
| Estilos | Tailwind CSS + shadcn/ui |
| Formularios | react-hook-form + zod |
| Estado servidor | TanStack Query |
| Gráficos | Recharts |
| Base de datos | Supabase (proyecto separado del frontend público) |
| Base de datos | Supabase (compartido con `new-wecar/`, mismo proyecto) |
| Auth | Supabase Auth (esquema `admin.users` + `admin.user_roles`) |
| Conexión a datos | Service-role de Supabase directo (sin HTTP intermediario) |

## Estructura del proyecto

```
admin-panel/
  src/
    actions/          # createServerFn definitions (importables desde rutas)
    components/       # Componentes React compartidos
      admin/          # Componentes específicos del admin (Sidebar, DataTable, etc.)
      ui/             # Componentes base shadcn/ui
    hooks/            # Custom hooks (useAuth, etc.)
    integrations/     # Clientes Supabase
      supabase/
        client.ts     # Cliente browser
        server.ts     # Cliente service-role (server-only)
        types.ts      # Tipos generados de Supabase
    lib/              # Utilidades
      wecar-client.ts # HTTP client para la API pública
    routes/           # TanStack Start route tree
      _admin/         # Rutas protegidas (requieren auth)
      _auth/          # Rutas públicas (login)
    server/           # Código server-only (solo auth.server.ts)
```

## Convenciones

- **`src/actions/`**: Contiene todas las definiciones de `createServerFn`. Estas funciones RPC pueden ser importadas desde cualquier archivo. Las dependencias server-only se importan dinámicamente dentro del handler.
- **`src/server/`**: Solo contiene código que NO debe llegar al cliente (`auth.server.ts`). La protección de importación de TanStack Start bloquea `**/server/**` desde archivos de ruta.
- **`src/actions/auth.ts`**: Define guards `requireAdmin` y `requireAnonymous` usando import dinámico de `@/server/auth.server`.
- **Archivos `.server.ts`**: Se consideran server-only; no importarlos estáticamente desde rutas o componentes.
