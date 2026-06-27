# Development

## Prerequisitos

- Node.js 20+
- Bun (opcional, pero recomendado)
- Supabase CLI (para migraciones y Edge Functions)

## Setup local

```bash
# Instalar dependencias
cd admin-panel
bun install

# Copiar variables de entorno
cp .env.example .env
# Editar .env con las credenciales reales

# Iniciar servidor de desarrollo
bun run dev
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `bun run dev` | Iniciar servidor de desarrollo |
| `bun run build` | Build para producción |
| `bun run build:dev` | Build en modo development |
| `bun run preview` | Preview del build |
| `bun run lint` | Lint (ESLint) |
| `bun run format` | Formatear código (Prettier) |

## Rutas

El router usa file-based routing de TanStack Start:

```
src/routes/
  __root.tsx           # Layout raíz (Toaster, auth listener)
  index.tsx            # Redirección → /login o /dashboard
  _auth.tsx            # Layout para páginas públicas (login)
  _auth/login.tsx      # Página de login
  _admin.tsx           # Layout protegido (sidebar)
  _admin/dashboard.tsx # Dashboard
  _admin/vehicles/     # CRUD vehículos (brands, models, versions)
  _admin/cars/         # CRUD autos
  _admin/users/        # CRUD usuarios
  _admin/plans/        # CRUD planes
  _admin/financieras/  # CRUD financieras
  _admin/advertisements.tsx  # CRUD ads
  _admin/reports.tsx   # Reportes de usuarios
  _admin/settings/     # Configuraciones (roles, facebook, mercadolibre)
```

Al agregar una ruta, regenerar el route tree:

```bash
bunx @tanstack/react-router route-manifest
```

## Agregar un nuevo CRUD

1. Crear endpoints en `new-wecar/src/routes/api/admin/`
2. Crear server functions en `src/actions/<recurso>.ts`
3. Crear ruta en `src/routes/_admin/<recurso>/`
4. Usar componentes `DataTable`, `FormDrawer`, `ConfirmDialog`

## Import Protection

No importar archivos desde `src/server/` en rutas o componentes. Las únicas excepciones son imports dinámicos dentro de handlers de `createServerFn`. Todas las funciones RPC deben definirse en `src/actions/`.
