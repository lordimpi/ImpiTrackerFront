# IMPITrack Frontend

Frontend de IMPITrack construido con Angular 21, SSR y PrimeNG. Este repositorio contiene solo la aplicacion web y consume la API de IMPITrack; no incluye la logica de negocio del backend.

## Estado del producto

IMPITrack ya no se describe como un MVP especulativo. La base actual corresponde a un producto operativo en evolucion post-MVP, con capacidades estables de autenticacion, gestion de dispositivos, administracion, observabilidad operativa y una expansion activa de experiencias de telemetria y monitoreo.

## Stack principal

- Angular 21 con componentes standalone.
- SSR habilitado para navegador y servidor.
- PrimeNG como base del sistema de UI.
- Leaflet para experiencias de mapa y monitoreo geoespacial.
- RxJS y Angular Signals segun la necesidad del flujo.
- SCSS y arquitectura frontend orientada por features.

## Enfoque arquitectonico

- Estructura por `core`, `shared` y `features` para separar preocupaciones globales, reutilizables y de dominio.
- Features organizadas con capas como `pages`, `components`, `application`, `data-access` y `models` cuando aporta claridad.
- Compatibilidad SSR como restriccion de base, evitando acoplar la UI a APIs exclusivas del navegador.
- Integracion desacoplada del backend mediante contratos existentes y mapeos de UI cuando hace falta.

## Documentacion clave

- `.docs/product-source-of-truth-prd.md`: fuente principal de narrativa, alcance y prioridades del producto.
- `.docs/telemetry-release-status.md`: companion de release para interpretar que parte de telemetria esta liberada, en validacion activa o planificada.
- `.docs/frontend-post-mvp-plan.md`: roadmap frontend posterior a la base operativa ya cerrada.

## Desarrollo local

Instala dependencias:

```bash
npm install
```

Levanta el frontend:

```bash
npm start
```

La aplicacion queda disponible en `http://localhost:4200/`.

La API de desarrollo esperada por el frontend es:

```text
https://localhost:54124
```

## Comandos principales

```bash
npm start
npm run build
npm run watch
npm test -- --watch=false
npm run serve:ssr:impitrack
```

## Estructura del proyecto

- `src/app/core/`: auth, guards, interceptors, configuracion y layouts.
- `src/app/shared/`: modelos, utilidades, validadores y bloques reutilizables de interfaz.
- `src/app/features/`: `auth`, `dashboard`, `account`, `devices`, `admin-users`, `ops`, `telemetry`.
- `public/`: assets estaticos.

## Convenciones

- Codigo en ingles.
- Documentacion y textos visibles en espanol.
- Componentes con archivos separados `.ts`, `.html` y `.scss`.
- Arquitectura orientada por features.
- Compatibilidad SSR obligatoria.
- PrimeNG como base de UI.

## Verificacion manual recomendada

- Auth: registro, login, logout, recordar sesion, recuperacion y reset.
- Devices: listar, vincular y desvincular IMEI.
- Admin: listado, detalle, cambio de plan y gestion de dispositivos.
- Ops: `raw`, `errors`, `sessions` y `ports` con usuario `Admin`.

## Nota tecnica

El budget inicial del bundle de produccion se ajusto a `760 kB` para reflejar mejor el tamano actual del shell SSR + PrimeNG. Sigue siendo un pendiente de optimizacion, pero no redefine la narrativa del producto ni su baseline operativo actual.
