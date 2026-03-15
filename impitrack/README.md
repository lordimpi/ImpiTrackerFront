# IMPITrack Frontend

Frontend de IMPITrack construido con Angular 21, SSR y PrimeNG. Este repositorio contiene solo la aplicacion web y consume la API de IMPITrack; no incluye la logica de negocio del backend.

## Estado del MVP

- Fase 0 cerrada: fundacion tecnica, SSR, arquitectura base, layouts, guards e interceptors.
- Fase 1 cerrada: auth completa con registro, login, refresh, logout, perfil y recuperacion de contrasena.
- Fase 2 cerrada: `Mis dispositivos` con listado, vinculacion y desvinculacion.
- Fase 3 cerrada: administracion de usuarios, planes y dispositivos.
- Fase 4 cerrada: toolbox de operaciones (`raw`, `errors`, `sessions`, `ports`) y recordar sesion.
- Fase 5 cerrada: hardening, smoke final, consistencia UX y cierre del MVP.
- Estado actual: MVP funcional cerrado.

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
- `src/app/features/`: `auth`, `dashboard`, `account`, `devices`, `admin-users`, `ops`.
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

El budget inicial del bundle de produccion se ajusto a `760 kB` para reflejar mejor el tamano actual del shell SSR + PrimeNG. Sigue siendo un pendiente de optimizacion, pero ya no bloquea el cierre funcional del MVP.

## Siguiente etapa

Lo siguiente queda fuera del MVP actual y se puede abordar como etapa posterior:

- optimizacion del bundle inicial
- graficos y dashboards analiticos
- mapa y telemetria en tiempo real
- mejoras avanzadas de accesibilidad y performance
