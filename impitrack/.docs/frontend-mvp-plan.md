# Plan de ejecución frontend para IMPITrack

## Estado del documento

- Este documento se conserva como referencia historica del plan MVP/base del frontend.
- El PRD maestro en `.docs/product-source-of-truth-prd.md` es la fuente de verdad de alto nivel del producto.
- Este plan sigue siendo util para entender el cierre de la base inicial, pero no reemplaza el framing actual del producto ni define por si solo el estado de release de `telemetry`.

## 1. Objetivo

Construir una aplicación frontend separada para consumir la API actual de IMPITrack y cubrir el flujo operativo central del producto:

- autenticación y manejo de sesión JWT,
- gestión autoservicio de cuenta y dispositivos GPS,
- administración de usuarios/planes/dispositivos para el rol Admin,
- toolbox operativa para diagnósticos del pipeline TCP,
- una base preparada para soportar tiempo real más adelante sin reescribir la UI.

Este plan asume que el backend ya existe en `ImpiTrack.Api` y que el frontend **no** se conectará directamente a EMQX. Toda comunicación debe pasar por la API.

---

## 2. Alcance funcional de la primera versión

### Usuario final

- Registrarse.
- Confirmar correo electrónico.
- Iniciar sesión y refrescar token.
- Ver su perfil actual.
- Vincular un dispositivo GPS a su cuenta.
- Listar sus dispositivos GPS vinculados.
- Desvincular un dispositivo GPS.
- Ver el estado básico de sus dispositivos GPS.

### Administrador

- Listar usuarios.
- Ver detalle de usuario.
- Cambiar el plan de un usuario.
- Vincular un dispositivo GPS a cualquier usuario.
- Desvincular un dispositivo GPS de un usuario.
- Acceder a endpoints `/api/ops/*`.

### Operaciones

- Ver los últimos paquetes crudos por IMEI.
- Ver el detalle de un paquete crudo por `packetId`.
- Ver los errores más frecuentes.
- Ver sesiones activas.
- Ver puertos de ingestión.

### Fuera de alcance en esta fase

- Mapas en tiempo real.
- SignalR / WebSockets.
- Comandos TCP desde la UI.
- Dashboard analítico avanzado.
- Soporte visual multi-tenant completo.

---

## 3. Endpoints reales a cubrir

### Auth

- `POST /api/auth/register`
- `GET /api/auth/verify-email/confirm`
- `POST /api/auth/verify-email`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/revoke`

### Me

- `GET /api/me`
- `GET /api/me/devices`
- `POST /api/me/devices`
- `DELETE /api/me/devices/{imei}`

### Admin

- `GET /api/admin/users`
- `GET /api/admin/users/{userId}`
- `PUT /api/admin/users/{userId}/plan`
- `POST /api/admin/users/{userId}/devices`
- `DELETE /api/admin/users/{userId}/devices/{imei}`

### Ops

- `GET /api/ops/raw/latest`
- `GET /api/ops/raw/{packetId}`
- `GET /api/ops/errors/top`
- `GET /api/ops/sessions/active`
- `GET /api/ops/ingestion/ports`

---

## 4. Stack recomendado

- Angular standalone como proyecto separado.
- TypeScript estricto.
- Angular Router con guards de autenticación y roles.
- Angular HttpClient con interceptors para:
  - Bearer token,
  - refresh token,
  - manejo global de errores.
- Estado local con Signals para auth, usuario actual y filtros de UI.
- PrimeNG como librería base de UI para tablas, formularios, diálogos, overlays y componentes operativos.
- Reactive Forms para formularios.
- SCSS para estilos.
- Implementación segura para SSR desde el inicio.
- Gráficos simples para Ops solo cuando realmente hagan falta y existan contratos estables detrás.

### Convenciones frontend obligatorias

- Siempre usar archivos separados para componentes:
  - `.ts`
  - `.html`
  - `.scss`
- No usar templates HTML inline.
- No usar estilos inline en componentes.
- No conectar Angular directamente a EMQX.
- No introducir estado global pesado salvo necesidad clara.
- No empezar por dashboards ricos antes de estabilizar flujos CRUD y operativos.

---

## 5. Estructura frontend

```text
src/app/
  core/
    auth/
    http/
    layout/
    guards/
    interceptors/
    config/
  shared/
    ui/
    models/
    utils/
    pipes/
    directives/
  features/
    auth/
    account/
    devices/
    admin-users/
    ops/
  app.routes.ts
```

### Rutas sugeridas

- `/auth/register`
- `/auth/login`
- `/auth/verify-email`
- `/app/dashboard`
- `/app/account`
- `/app/devices`
- `/admin/users`
- `/admin/users/:id`
- `/ops/raw`
- `/ops/errors`
- `/ops/sessions`
- `/ops/ports`
- `/unauthorized`

---

## 6. Fases de desarrollo

### Fase 0. Fundación técnica

#### Objetivo

Dejar el proyecto listo para crecer sin deuda estructural inmediata.

#### Entregables

- Proyecto Angular creado.
- Configuración por entorno.
- `core` y `shared` definidos.
- Estructura orientada por features definida.
- Layout público y layout autenticado.
- Sistema de rutas y guards.
- Interceptor JWT + refresh.
- Manejo global de errores.
- Tipado base para `ApiResponse<T>`.
- Base segura para SSR.
- Convención obligatoria de componentes con:
  - `.ts`
  - `.html`
  - `.scss`

#### Definición de terminado

- La app compila y navega.
- Las rutas privadas están protegidas.
- Un `401` dispara refresh controlado o logout controlado.
- La URL base de la API proviene de configuración.
- El layout público y el autenticado están separados.
- No se usan templates inline.
- El build SSR sigue siendo estable.

### Fase 1. Auth y acceso

#### Objetivo

Cubrir el flujo completo de onboarding del usuario.

#### Entregables

- Pantalla de login.
- Pantalla de registro.
- Pantalla de verificación de correo.
- Logout.
- Persistencia segura de sesión.
- Vista básica de perfil (`GET /api/me`).
- Pantalla de acceso no autorizado.

#### Definición de terminado

- Un usuario puede registrarse, verificar correo e iniciar sesión.
- El token se adjunta automáticamente a llamadas autenticadas.
- Si el refresh falla, la UI redirige a login.
- Se muestran mensajes de error legibles.
- El flujo de auth funciona contra la API backend real.

### Fase 2. Módulo de usuario y GPS

#### Objetivo

Permitir que el usuario gestione sus propios dispositivos sin depender de Admin.

#### Entregables

- Vista Mis dispositivos.
- Tabla/listado de dispositivos vinculados.
- Formulario para vincular GPS por IMEI.
- Acción para desvincular GPS.
- Estado visual vacío cuando no hay dispositivos.
- Badges de estado simples según la información disponible.
- Estados de carga y error.
- Diálogo de confirmación para desvincular.
- Protección contra envíos duplicados.

#### Definición de terminado

- El usuario lista sus dispositivos GPS con `GET /api/me/devices`.
- Puede vincular y desvincular dispositivos sin recargar toda la app.
- Los errores de negocio se muestran en UI.
- Los formularios validan IMEI y previenen envíos duplicados.
- Las acciones destructivas requieren confirmación.
- La UI se actualiza de inmediato o mediante refetch controlado.

### Fase 3. Administración

#### Objetivo

Dar al Admin las herramientas mínimas para operar usuarios, planes y propiedad de dispositivos.

#### Entregables

- Lista de usuarios.
- Detalle de usuario.
- Flujo para cambiar plan.
- Vincular GPS a usuario.
- Desvincular GPS de usuario.
- Guard por rol Admin.

#### Definición de terminado

- Un usuario no Admin no puede entrar en `/admin/*`.
- Admin puede inspeccionar y modificar usuarios sin usar Scalar/Postman.
- Los cambios se reflejan en UI de inmediato o mediante refetch controlado.
- Las acciones admin muestran feedback claro de éxito y error.

### Fase 4. Toolbox de operaciones

#### Objetivo

Llevar la observabilidad operativa mínima del backend TCP a la interfaz web.

#### Entregables

- Pantalla de paquetes crudos con filtro por IMEI y límite.
- Pantalla de errores más frecuentes.
- Pantalla de sesiones activas.
- Pantalla de puertos de ingestión.
- Vista de detalle de paquete crudo por `packetId`.
- UI centrada en detalle técnico para diagnósticos.
- Polling controlado donde no exista tiempo real.

#### Definición de terminado

- Admin puede validar desde la UI que un GPS está entrando al pipeline.
- La UI muestra `ack`, `parseStatus`, `parseError`, `sessionId` y `packetId`.
- El flujo básico de troubleshooting deja de depender de Postman.
- Si el backend no aporta suficiente semántica de negocio, la UI muestra primero la verdad técnica en lugar de inventar significado.

### Fase 5. Endurecimiento y release

#### Objetivo

Cerrar brechas de calidad, experiencia de usuario y preparación para despliegue.

#### Entregables

- Skeleton loaders y estados vacíos.
- Manejo de errores consistente.
- Diálogos de confirmación para acciones destructivas.
- Toasts o notificaciones para resultados relevantes.
- Auditoría básica de accesibilidad.
- Tests unitarios.
- Validación smoke para login y navegación principal, manual o automatizada según tooling disponible.
- Documentación de despliegue frontend.
- Notas de verificación manual para flujos sensibles a SSR.

#### Definición de terminado

- La app pasa build de producción.
- Login y navegación principal tienen validación smoke.
- No hay rutas críticas sin manejo de carga o error.
- Las acciones destructivas están protegidas con confirmación.
- Los aspectos básicos de despliegue están documentados.

---

## 7. Orden recomendado de implementación

1. Fundación técnica.
2. Auth.
3. Mis dispositivos.
4. Admin.
5. Ops.
6. Endurecimiento.
7. Solo después: tiempo real, mapas y dashboards más ricos.

Este orden reduce riesgo y permite validación temprana del negocio con el backend real.

---

## 8. Reglas de arquitectura frontend

- No consumir EMQX directamente desde Angular.
- No colocar lógica de negocio fuerte dentro de componentes.
- Cada feature debe contener:
  - page,
  - componentes presentacionales,
  - servicio HTTP,
  - modelos tipados.
- `core` es solo para infraestructura transversal.
- `shared` es solo para UI reutilizable y utilidades.
- Guards e interceptors deben permanecer centralizados.
- No mezclar vistas Admin con vistas de usuario final.
- Usar siempre HTML y SCSS separados del TypeScript.
- No introducir complejidad visual ni dashboards avanzados antes de estabilizar flujos MVP respaldados por backend.

---

## 9. Contratos frontend a tipar primero

- `ApiResponse<T>`
- `ApiError`
- `AuthLoginRequest`
- `AuthLoginResponse`
- `RegisterRequest`
- `CurrentUserDto`
- `UserDeviceDto`
- `BindDeviceRequest`
- `AdminUserListItemDto`
- `AdminUserDetailDto`
- `SetUserPlanRequest`
- `OpsRawPacketDto`
- `OpsErrorGroupDto`
- `ActiveSessionDto`
- `IngestionPortStatusDto`

---

## 10. Riesgos y mitigaciones

- La API aún no expone tiempo real: usar polling controlado en Ops.
- Algunos estados GPS pueden no estar visualmente normalizados todavía: mostrar primero dato técnico y no inventar semántica.
- Si cambian contratos backend, regenerar typings o ajustar adaptadores rápidamente.
- No empezar por dashboards complejos; primero cerrar CRUD y trazabilidad operativa.
- SSR puede romperse si se introducen APIs del navegador sin cuidado: tratar desde el inicio los cambios sensibles a SSR.

---

## 11. Criterios de “Frontend MVP listo”

El frontend se considera listo cuando:

- un usuario puede registrarse, verificar correo e iniciar sesión,
- un usuario puede vincular y ver sus dispositivos GPS,
- un Admin puede gestionar usuarios, planes y propiedad de dispositivos,
- un Admin puede revisar la toolbox de Ops para diagnósticos TCP,
- el frontend funciona contra la API actual sin depender de herramientas externas para el flujo operativo diario.

---

## 12. Siguiente fase después del MVP

- Tiempo real vía API / SignalR.
- Última posición conocida por dispositivo.
- Mapa operativo.
- Historial de posiciones / eventos.
- Centro de alertas.
- Dashboard ejecutivo.
- Preparación visual multi-tenant.
