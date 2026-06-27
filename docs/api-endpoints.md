# API Endpoints

El admin panel consume endpoints REST en `new-wecar/src/routes/api/admin/`.

## Base URL

Configurado via `WECAR_API_URL` (variable de entorno).

## Autenticación

| Header | Descripción |
|--------|-------------|
| `X-Admin-Key` | Shared secret (requerido en todas las requests) |
| `X-Admin-Email` | Email del admin autenticado (requerido en mutaciones) |

## Endpoints

### Stats
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/stats` | Dashboard stats (counts, series, recent) |

### Brands (CRUD)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/brands` | Listar marcas |
| POST | `/api/admin/brands` | Crear marca |
| PATCH | `/api/admin/brands` | Actualizar marca |
| DELETE | `/api/admin/brands?id=uuid` | Eliminar marca |

### Models (CRUD)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/models?brand_id=uuid` | Listar modelos |
| POST | `/api/admin/models` | Crear modelo |
| PATCH | `/api/admin/models` | Actualizar modelo |
| DELETE | `/api/admin/models?id=uuid` | Eliminar modelo |

### Versions (CRUD)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/versions?model_id=uuid` | Listar versiones |
| POST | `/api/admin/versions` | Crear versión |
| PATCH | `/api/admin/versions` | Actualizar versión |
| DELETE | `/api/admin/versions?id=uuid` | Eliminar versión |

### Cars
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/cars` | Listar autos (filtros: status, brand_id, q) |
| PATCH | `/api/admin/cars` | Actualizar auto (status_id, featured) |

### Users
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/users` | Listar usuarios (filtros: q, limit, offset) |
| PATCH | `/api/admin/users` | Setear/remover admin |

### Plans (CRUD)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/plans` | Listar planes |
| POST | `/api/admin/plans` | Crear plan |
| PATCH | `/api/admin/plans` | Actualizar plan |
| DELETE | `/api/admin/plans?id=uuid` | Eliminar plan |

### Financieras (CRUD)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/financieras` | Listar financieras |
| POST | `/api/admin/financieras` | Crear financiera |
| PATCH | `/api/admin/financieras` | Actualizar financiera |
| DELETE | `/api/admin/financieras?id=uuid` | Eliminar financiera |

### Advertisements (CRUD)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/advertisements` | Listar ads (filtro: status) |
| POST | `/api/admin/advertisements` | Crear ad |
| PATCH | `/api/admin/advertisements` | Actualizar ad |
| DELETE | `/api/admin/advertisements?id=uuid` | Eliminar ad |

### Settings
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/settings?key=...` | Obtener setting |
| PATCH | `/api/admin/settings` | Actualizar setting |

### Car Reports
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/car-reports` | Listar reportes (filtros: status, limit, offset) |
| PATCH | `/api/admin/car-reports` | Actualizar reporte (status) |

### Integrations
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/integrations?provider=...` | Obtener integración |
| PUT | `/api/admin/integrations` | Crear/actualizar integración |
| DELETE | `/api/admin/integrations?provider=...` | Eliminar integración |
