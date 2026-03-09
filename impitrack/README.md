# IMPITrack Frontend

Frontend de IMPITrack construido con Angular 21, SSR y PrimeNG. Este repositorio contiene solo la aplicación web y consume la API de IMPITrack; no incluye lógica de negocio del backend.

## Estado actual

- Fase 0 cerrada: fundación técnica, SSR, arquitectura base, layouts, guards, interceptors y theming.
- Fase 1 cerrada: registro, login, refresh, logout, perfil, recuperación y restablecimiento de contraseña.
- Siguiente fase: `Mis dispositivos`.

## Desarrollo local

Instala dependencias:

```bash
npm install
```

Levanta el frontend:

```bash
npm start
```

La aplicación queda disponible en `http://localhost:4200/`.

La API de desarrollo esperada por el frontend es:

```text
https://localhost:54124
```

## Comandos principales

```bash
npm start
npm run build
npm run watch
npm test
npm run serve:ssr:impitrack
```

## Estructura del proyecto

- `src/app/core/`: auth, guards, interceptors, configuración y layouts.
- `src/app/shared/`: modelos, utilidades, validadores y UI reutilizable.
- `src/app/features/`: `auth`, `dashboard`, `account`, `devices`, `admin-users`, `ops`.
- `public/`: assets estáticos.

## Convenciones

- Código en inglés.
- Documentación y textos visibles en español.
- Componentes con archivos separados `.ts`, `.html` y `.scss`.
- Arquitectura orientada por features.
- Compatibilidad SSR obligatoria.
- PrimeNG como base de UI.

## Flujos validados en Fase 1

- Registro con validaciones y mensajes de negocio.
- Verificación de correo contra backend real.
- Login y logout.
- Persistencia y refresh de sesión.
- `GET /api/me`.
- Recuperación y restablecimiento de contraseña.
- Guards por autenticación y rol.

## Próximo paso

Fase 2 se enfocará en `Mis dispositivos`: listado, vinculación, desvinculación, estados de carga/error y confirmaciones de UX.
