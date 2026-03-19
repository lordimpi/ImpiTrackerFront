# IMPITrack Frontend

Role: index
Status: active
Owner: frontend-maintainers
Last Reviewed: 2026-03-19

This README is the stable entry point for frontend project documentation.

## Start Here

- Product source of truth: [`.docs/product-source-of-truth-prd.md`](.docs/product-source-of-truth-prd.md)
- Telemetry release status: [`.docs/telemetry-release-status.md`](.docs/telemetry-release-status.md)
- User experience redesign PRD: [`.docs/user-redesign-prd.md`](.docs/user-redesign-prd.md)
- User views reference (pre-redesign): [`.docs/user-views-reference.md`](.docs/user-views-reference.md)
- Frontend roadmap: [`.docs/frontend-post-mvp-plan.md`](.docs/frontend-post-mvp-plan.md)

## Current Project Snapshot

- Frontend-only repository. Consumes the IMPITrack backend API; no business logic lives here.
- Angular 21 with SSR, standalone components, PrimeNG for UI, Leaflet for maps.
- Feature-oriented architecture: `core/`, `shared/`, `features/`.
- Unified icon-rail shell for all roles. Map-first experience for users. Admin pages manage their own layout.

## Architecture

### Feature Structure

```
src/app/
  core/          auth, guards, interceptors, layouts
  shared/        reusable UI blocks, pipes, models, validators
  features/
    auth/        login, register, recover, reset
    dashboard/   redirects to map
    telemetry/   map monitoring, device telemetry, trips, events
    devices/     user device management (bind/unbind)
    account/     user profile and plan info
    admin-users/ admin user management
    ops/         operational diagnostics (raw, errors, sessions, ports)
```

### Key Capabilities

| Area      | Description                                                        |
| --------- | ------------------------------------------------------------------ |
| Auth      | JWT + refresh token, register, recover, reset, remember session    |
| Map       | Fullscreen with device panel, polling 30s, last known position     |
| Telemetry | Per-device: trips, events, position history, ignition segmentation |
| Devices   | Bind/unbind by IMEI, plan usage visibility                         |
| Admin     | User list, detail, plan management, device oversight               |
| Ops       | Raw packets, parse errors, active sessions, TCP ports              |

## Development

```bash
npm install
npm start          # http://localhost:4200
```

Expected backend API: `https://localhost:54124`

## Commands

| Command                       | Purpose               |
| ----------------------------- | --------------------- |
| `npm start`                   | Dev server            |
| `npm run build`               | Production SSR build  |
| `npm run watch`               | Incremental dev build |
| `npm test -- --watch=false`   | Unit tests            |
| `npm run serve:ssr:impitrack` | Serve SSR build       |

## Conventions

- Code in English. UI text in Spanish.
- Separate `.ts`, `.html`, `.scss` files per component.
- Feature-oriented architecture with `pages/`, `components/`, `application/`, `data-access/`, `models/`.
- SSR compatibility required for all changes.
- PrimeNG as UI foundation.

## Documentation Rules

- Put product decisions, scope and priorities in [`.docs/product-source-of-truth-prd.md`](.docs/product-source-of-truth-prd.md).
- Keep `README.md` short. If it starts becoming a wiki, move detail to `.docs/` and link it.
- Historical or superseded docs must say so explicitly and point to their canonical replacement.
