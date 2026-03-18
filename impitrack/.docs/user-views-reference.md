# IMPITrack -- User Views Reference

> **Scope:** Role `user` (no Admin, no Ops). All views accessible to a regular authenticated user.
> **Stack:** Angular 21 + SSR, PrimeNG, Leaflet, Angular Signals, Reactive Forms.
> **Generated from:** actual `.html` and `.ts` source files as of March 2026.

---

## Table of Contents

1. [Public Layout (auth shell)](#1-public-layout-auth-shell)
2. [App Shell (authenticated shell)](#2-app-shell-authenticated-shell)
3. [/auth/login](#3-authlogin)
4. [/auth/register](#4-authregister)
5. [/auth/recover-password](#5-authrecover-password)
6. [/auth/reset-password](#6-authreset-password)
7. [/app/dashboard](#7-appdashboard)
8. [/app/map](#8-appmap)
   - [TelemetryDeviceListComponent](#telemetrydevicelistcomponent)
   - [TelemetryMapComponent](#telemetrymapcomponent)
9. [/app/devices](#9-appdevices)
   - [Dialog: Vincular dispositivo](#dialog-vincular-dispositivo)
   - [Dialog: Confirmar desvincular](#dialog-confirmar-desvincular)
10. [/app/devices/:imei/telemetry](#10-appdevicesimeiitelemetry)
    - [TelemetryMapComponent (reused)](#telemetrymapcomponent-reused)
    - [TelemetryTripsListComponent](#telemetrytripslistcomponent)
    - [TelemetryTripSummaryComponent](#telemetrytripsummarycomponent)
    - [TelemetryEventsTimelineComponent](#telemetryeventstimelinecomponent)
    - [TelemetryEventsTableComponent](#telemetryeventstablecomponent)
    - [Dialog: Resumen del dispositivo](#dialog-resumen-del-dispositivo)
11. [/app/account](#11-appaccount)
12. [Data Models Reference](#12-data-models-reference)
13. [Full Navigation Flow](#13-full-navigation-flow)
14. [Default Query Limits](#14-default-query-limits)

---

## 1. Public Layout (auth shell)

**Component:** `PublicLayoutComponent`
**File:** `src/app/core/layout/public-layout/public-layout.component.ts`
**Route prefix:** `/auth/**`
**Guard:** `guestGuard` -- redirects authenticated users away from auth routes.

### What the user sees

A two-panel split layout:

| Panel                 | Description                                                                     |
| --------------------- | ------------------------------------------------------------------------------- |
| Left (`signal-panel`) | Branding / marketing panel with a badge, headline, 3 metrics, and two CTA links |
| Right (`auth-panel`)  | `<router-outlet>` -- renders the active auth page (login, register, etc.)       |

**Left panel elements:**

- Badge: `"tablero operativo MVP"`
- Headline (dynamic signal):
  - Unauthenticated: `"Telemetria operativa, sin ruido innecesario"`
  - Authenticated (edge case): `"Vuelve a la consola"`
- Lead paragraph (static copy about the MVP flow)
- 3 metric cards (`aria-hidden`):
  - Cobertura: `Auth + Perfil`
  - Siguiente frente: `Dispositivos`
  - Renderizado: `Seguro para SSR`
- Two footer links: `"Entrar a la consola"` -> `/auth/login`, `"Crear cuenta"` -> `/auth/register`

### What the user can do

- Click `"Entrar a la consola"` to navigate to login
- Click `"Crear cuenta"` to navigate to register
- Interact with the auth form rendered in the right panel

### UI states

| State                                       | Behavior                                                                                        |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Unauthenticated                             | Headline shows the product tagline                                                              |
| Authenticated (navigated to /auth directly) | Headline switches to "Vuelve a la consola"; guard should redirect but layout handles gracefully |

### Outbound navigation

- `/auth/login` (footer link)
- `/auth/register` (footer link)
- Router outlet renders child auth pages

---

## 2. App Shell (authenticated shell)

**Component:** `AppShellComponent`
**File:** `src/app/core/layout/app-shell/app-shell.component.ts`
**Route prefix:** `/app/**`
**Guard:** `authGuard` -- redirects unauthenticated users to login.

### What the user sees

A sidebar + canvas layout:

**Sidebar (`rail`):**

| Element           | Description                                                            |
| ----------------- | ---------------------------------------------------------------------- |
| Brand block       | Eyebrow `"shell operativo"`, title `"IMPITrack"`, descriptive tagline  |
| Navigation links  | Filtered by role -- see table below                                    |
| Role tags section | Eyebrow `"roles"`, then one `p-tag` per role from the JWT/user profile |

**Canvas:**

| Element      | Description                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------- |
| Header       | Menu toggle button (hamburger `pi pi-bars`), display name, sign-out button (`pi pi-sign-out`) |
| Main content | `<router-outlet>` -- renders the active feature page                                          |

### Navigation items visible to a regular user

| Label            | Route            | Icon               |
| ---------------- | ---------------- | ------------------ |
| Resumen          | `/app/dashboard` | `pi pi-chart-line` |
| Mapa             | `/app/map`       | `pi pi-map`        |
| Cuenta           | `/app/account`   | `pi pi-user`       |
| Mis dispositivos | `/app/devices`   | `pi pi-truck`      |

> `Administracion` (`/admin/users`) and `Operaciones` (`/ops/raw`) are only shown to `Admin` role.

### What the user can do

- Toggle the sidebar open/closed with the hamburger button
- Close the sidebar by clicking the backdrop on mobile
- Navigate to any visible section via the sidebar links (active link gets `rail__link--active` class)
- View their display name in the header
- Sign out (calls `authFacade.logout()`, clears session, shows toast `"Sesion cerrada"`, navigates to `/auth/login`)

### Responsive behavior

| Breakpoint | Behavior                                                                    |
| ---------- | --------------------------------------------------------------------------- |
| > 980 px   | Sidebar open by default; no backdrop                                        |
| <= 980 px  | Sidebar closed by default; backdrop appears when open; closes on link click |
| SSR        | Sidebar open, mobile = false (safe defaults)                                |

### Display name resolution (priority order)

1. `user.fullName`
2. `user.email`
3. JWT claim `email`
4. JWT claim `unique_name`
5. Fallback: `"Operador"`

---

## 3. /auth/login

**Component:** `LoginPageComponent`
**File:** `src/app/features/auth/pages/login-page.component.ts`
**Guard:** `guestGuard`

### What the user sees

A `p-card` with:

- Title: `"Ingresa al tablero operativo"`
- Subtitle: description of JWT + refresh token + SSR-safe flow
- Reactive form with 3 fields
- Error message area
- Submit button
- Two footer links

### Form fields

| Field            | Control           | Type                            | Validation             |
| ---------------- | ----------------- | ------------------------------- | ---------------------- |
| Usuario o correo | `userNameOrEmail` | text                            | required, minLength(3) |
| Contrasena       | `password`        | password (PrimeNG `p-password`) | required, minLength(8) |
| Recordar sesion  | `rememberSession` | checkbox (binary)               | none                   |

**Password field:** `[toggleMask]="true"`, `[feedback]="false"` -- no strength meter, just visibility toggle.

### What the user can do

- Fill credentials and submit
- Toggle password visibility
- Check "Recordar sesion" to persist session in `localStorage` (vs `sessionStorage`)
- Navigate to register via footer link
- Navigate to recover-password via footer link

### Actions on submit

1. Marks all fields as touched if invalid (shows inline errors)
2. Sets `pending = true`, shows `LoadingSpinner` overlay with label `"Validando acceso..."`
3. Calls `authFacade.login(credentials, rememberSession)`
4. On success: navigates to `/app/dashboard`
5. On error: sets `submitError` signal

### Inline field errors

| Field           | Condition         | Message                                             |
| --------------- | ----------------- | --------------------------------------------------- |
| userNameOrEmail | invalid + touched | `"Ingresa tu usuario o correo."`                    |
| password        | invalid + touched | `"La contrasena debe tener al menos 8 caracteres."` |

### Submit errors

| HTTP status / code | Message shown                       |
| ------------------ | ----------------------------------- |
| 401                | `"Usuario o contrasena invalidos."` |
| Other              | Raw `apiError.message`              |

### UI states

| State   | Behavior                                                                                    |
| ------- | ------------------------------------------------------------------------------------------- |
| Idle    | Form enabled, button `"Entrar"` active                                                      |
| Loading | Button disabled, `LoadingSpinner` (`mode="screen"`, label `"Validando acceso..."`) overlaid |
| Error   | `p-message` with `severity="error"` appears below password field                            |

### Outbound navigation

- On success: `/app/dashboard`
- Footer: `/auth/register`, `/auth/recover-password`

---

## 4. /auth/register

**Component:** `RegisterPageComponent`
**File:** `src/app/features/auth/pages/register-page.component.ts`

### What the user sees

A `p-card` with:

- Title: `"Crear cuenta de telemetria"`
- Subtitle: describes simple registration flow
- Reactive form with 5 fields
- Live password rule checklist
- Error message area
- Submit button
- Two footer links

### Form fields

| Field                | Control           | Type     | Validation                            |
| -------------------- | ----------------- | -------- | ------------------------------------- |
| Nombre de usuario    | `userName`        | text     | required, minLength(3)                |
| Nombre completo      | `fullName`        | text     | optional                              |
| Correo               | `email`           | email    | required, Validators.email            |
| Contrasena           | `password`        | password | required, `passwordPolicyValidator()` |
| Confirmar contrasena | `confirmPassword` | password | required                              |

### Password policy rules (live checklist)

Shown as `<span>` elements that get class `password-rule--ok` when satisfied:

| Rule                          | Condition   |
| ----------------------------- | ----------- |
| Minimo 8 caracteres           | `minLength` |
| Una letra mayuscula           | `uppercase` |
| Una letra minuscula           | `lowercase` |
| Un numero                     | `digit`     |
| Un simbolo, por ejemplo . o ! | `symbol`    |

Rules are computed reactively from `passwordValue` signal via `getPasswordRuleState()`.

### Password mismatch validation

Computed signal `passwordMismatch`:

- True when `confirmPasswordTouched && password !== confirmPassword`
- Shows: `"Las contrasenas deben coincidir antes de enviar."`
- "Touched" condition includes: field touched, dirty, OR confirmPassword has any content

### What the user can do

- Fill the registration form
- See live password rules update as they type
- Submit to create account

### Actions on submit

1. Validates form + mismatch + not pending
2. Sets `pending = true`, shows spinner `"Creando tu cuenta..."`
3. Calls `authFacade.register({ userName, fullName?, email, password })`
4. On success: shows toast `{ severity: 'success', summary: 'Cuenta creada', detail: 'Revisa tu correo para validar la cuenta antes de iniciar sesion.' }`, navigates to `/auth/login`
5. On error: sets `submitError` signal

### Submit errors (mapped by error code)

| Code                      | Message                                                 |
| ------------------------- | ------------------------------------------------------- |
| `username_already_exists` | `"Ese nombre de usuario ya esta en uso."`               |
| `email_already_exists`    | `"El correo ingresado ya esta registrado."`             |
| `validation_failed`       | `"Revisa los datos del formulario antes de continuar."` |
| other                     | Raw `apiError.message`                                  |

### UI states

| State   | Behavior                                          |
| ------- | ------------------------------------------------- |
| Idle    | Form enabled                                      |
| Loading | Button disabled, spinner `"Creando tu cuenta..."` |
| Error   | `p-message` `severity="error"`                    |
| Success | Toast + redirect to login                         |

### Outbound navigation

- On success: `/auth/login`
- Footer: `/auth/login`, `/auth/recover-password`

---

## 5. /auth/recover-password

**Component:** `RecoverPasswordPageComponent`
**File:** `src/app/features/auth/pages/recover-password-page.component.ts`

### What the user sees

A `p-card` with:

- Title: `"Recuperar contrasena"`
- Subtitle: instructs user to enter their email to receive a reset link
- Single-field form
- Error + success message areas
- Submit button
- Two footer links

### Form fields

| Field  | Control | Type  | Validation                 |
| ------ | ------- | ----- | -------------------------- |
| Correo | `email` | email | required, Validators.email |

### What the user can do

- Enter their account email
- Submit to request a password reset link

### Actions on submit

1. Validates + not pending
2. Sets `pending = true`, shows spinner `"Enviando enlace..."`
3. Calls `authFacade.forgotPassword({ email })`
4. On success: sets `successMessage` = `"Si el correo existe, te enviaremos un enlace para restablecer la contrasena."` (intentionally ambiguous for security)
5. On error: sets `submitError`

### UI states

| State   | Behavior                                                           |
| ------- | ------------------------------------------------------------------ |
| Idle    | Form enabled                                                       |
| Loading | Button disabled, spinner `"Enviando enlace..."`                    |
| Error   | `p-message` `severity="error"`                                     |
| Success | `p-message` `severity="success"` shown inline (user stays on page) |

### Inline field errors

| Field | Condition         | Message                       |
| ----- | ----------------- | ----------------------------- |
| email | invalid + touched | `"Ingresa un correo valido."` |

### Outbound navigation

- Footer: `/auth/login`, `/auth/register`
- No automatic redirect on success (user stays on page)

---

## 6. /auth/reset-password

**Component:** `ResetPasswordPageComponent`
**File:** `src/app/features/auth/pages/reset-password-page.component.ts`

### What the user sees

A `p-card` with:

- Title: `"Restablecer contrasena"`
- Subtitle: instructs user to define a new password using the emailed link
- Two password fields with live policy checklist
- Error message area
- Submit button
- Two footer links

### Query parameters (required)

The component reads from the URL on init:

| Param   | Description                                        |
| ------- | -------------------------------------------------- |
| `email` | User's email, injected from the reset link         |
| `token` | Password reset token, injected from the reset link |

If either param is missing or empty, `submitError` is immediately set to: `"El enlace de recuperacion no es valido o esta incompleto."` and submission is blocked.

### Form fields

| Field                | Control           | Type     | Validation                            |
| -------------------- | ----------------- | -------- | ------------------------------------- |
| Nueva contrasena     | `newPassword`     | password | required, `passwordPolicyValidator()` |
| Confirmar contrasena | `confirmPassword` | password | required                              |

### Password policy rules

Same live checklist as registration:

- Minimo 8 caracteres
- Una letra mayuscula
- Una letra minuscula
- Un numero
- Un simbolo, por ejemplo . o !

### What the user can do

- Enter and confirm their new password
- See live password rule feedback
- Submit the new password

### Actions on submit

1. Checks `resetContextMissing` (email + token from URL)
2. Validates form + mismatch + not pending
3. Sets `pending = true`, shows spinner `"Actualizando contrasena..."`
4. Calls `authFacade.resetPassword({ email, token, newPassword })`
5. On success: toast `{ severity: 'success', summary: 'Contrasena actualizada', detail: 'Ya puedes iniciar sesion con tu nueva contrasena.' }`, navigates to `/auth/login`
6. On error: sets `submitError`

### Submit errors (mapped)

| Code / condition                 | Message                                                 |
| -------------------------------- | ------------------------------------------------------- |
| `invalid_password_reset_token`   | `"El enlace de recuperacion no es valido o ya vencio."` |
| `apiError.details` is `string[]` | Details joined with space                               |
| other                            | Raw `apiError.message`                                  |

### UI states

| State              | Behavior                                                |
| ------------------ | ------------------------------------------------------- |
| Missing URL params | Immediate error shown, button submission blocked        |
| Idle               | Form enabled                                            |
| Loading            | Button disabled, spinner `"Actualizando contrasena..."` |
| Error              | `p-message` `severity="error"`                          |
| Success            | Toast + redirect to login                               |

### Outbound navigation

- On success: `/auth/login`
- Footer: `/auth/login`, `/auth/recover-password`

---

## 7. /app/dashboard

**Component:** `DashboardPageComponent`
**File:** `src/app/features/dashboard/pages/dashboard-page.component.ts`
**Guard:** `authGuard`

### What the user sees

A two-card grid:

**Card 1 (hero):**

- Title: `"Shell operativo establecido"`
- Subtitle: describes the established auth + nav + PrimeNG setup
- Readiness checklist: 3 articles with label + `p-tag`
- Action button: `"Ver alcance del MVP"` (opens dialog)

**Readiness items (computed from auth state):**

| Label         | Value                                                      | Severity        |
| ------------- | ---------------------------------------------------------- | --------------- |
| Autenticacion | `Activa`                                                   | `success`       |
| Perfil        | `Listo` (if user loaded) OR `Esperando sesion del backend` | `info` / `warn` |
| Dispositivos  | `Siguiente corte`                                          | `secondary`     |

**Card 2 (delivery order):**

- Title: `"Orden de entrega"`
- Ordered list:
  1. Auth y control de acceso
  2. Contexto de perfil via `/api/me`
  3. Modulo de dispositivos
  4. Administracion de usuarios y planes
  5. Toolbox de operaciones

**Dialog (MVP scope):**

- Header: `"Alcance del MVP"`
- Modal, non-draggable, non-resizable, `width: min(92vw, 42rem)`
- Content: paragraph + 4-item bullet list describing MVP priorities

### What the user can do

- Open the MVP roadmap dialog via `"Ver alcance del MVP"` button
- Close the dialog (standard PrimeNG modal close)

### UI states

| State               | Behavior                                                 |
| ------------------- | -------------------------------------------------------- |
| User loaded         | "Perfil" tag shows `Listo` (info)                        |
| User not yet loaded | "Perfil" tag shows `Esperando sesion del backend` (warn) |
| Dialog closed       | Default                                                  |
| Dialog open         | Modal overlay with roadmap content                       |

### Outbound navigation

None -- this is a status/informational page with no outbound links.

---

## 8. /app/map

**Component:** `TelemetryMapPageComponent`
**File:** `src/app/features/telemetry/pages/telemetry-map-page.component.ts`
**Guard:** `authGuard`

### What the user sees

A hero card + content grid layout:

**Hero card:**

- Title: `"Mapa"`
- Subtitle: describes last-known position visualization
- Button: `"Actualizar"` (`pi pi-refresh`, secondary, disabled during load/refresh)

**Content area:**

| State    | What renders                                            |
| -------- | ------------------------------------------------------- |
| Loading  | `LoadingSpinner` `"Cargando mapa..."`                   |
| Error    | Error state card (see below)                            |
| No error | Two-column grid: devices card (left) + map card (right) |

**Devices card (left):**

- Title: `"Dispositivos monitoreados"`
- Subtitle: `"Selecciona un IMEI para abrir su historial y eventos recientes."`
- If has devices: renders `TelemetryDeviceListComponent`
- If no devices: empty state with message + `"Ir a Mis dispositivos"` button

**Map card (right):**

- Title: `"Ultima posicion conocida"`
- Subtitle: only mappable devices shown
- If no mappable devices: `p-message` (info) explaining either no positions yet or map centered on Colombia
- Always renders `TelemetryMapComponent` with the computed markers

### Polling

- **Interval:** 30 seconds (browser only, not SSR)
- **On destroy:** interval cleared via `ngOnDestroy`
- Manual refresh via button calls `facade.load(true)` (background refresh)

### TelemetryDeviceListComponent

**File:** `src/app/features/telemetry/components/telemetry-device-list.component.ts`

Renders a list of cards, one per device:

**Each device card shows:**

| Element        | Value                                                             |
| -------------- | ----------------------------------------------------------------- |
| IMEI (bold)    | `device.imei`                                                     |
| Position tag   | `"Con posicion"` (success) OR `"Sin posicion"` (secondary)        |
| Ultimo visto   | `device.lastSeenAtUtc` formatted as `medium` date OR `"Sin dato"` |
| Protocolo      | `normalizeTelemetryText(device.protocol)`                         |
| Ultimo mensaje | `normalizeTelemetryText(device.lastMessageType)`                  |
| Button         | `"Ver telemetria"` (`pi pi-arrow-right`, secondary)               |

**Inputs:**

| Input     | Type                                   | Default |
| --------- | -------------------------------------- | ------- |
| `devices` | `readonly TelemetryDeviceSummaryDto[]` | `[]`    |

**Outputs:**

| Output          | Payload         | Description                               |
| --------------- | --------------- | ----------------------------------------- |
| `openTelemetry` | `string` (imei) | Emitted when user clicks "Ver telemetria" |

**`normalizeTelemetryText`:** returns `"No disponible"` for null/empty values, otherwise `String(value)`.

### TelemetryMapComponent

**File:** `src/app/features/telemetry/components/telemetry-map.component.ts`

A Leaflet-based map component, SSR-safe (browser-only init).

**Inputs:**

| Input        | Type                            | Default                                     | Description                     |
| ------------ | ------------------------------- | ------------------------------------------- | ------------------------------- |
| `markers`    | `readonly TelemetryMapMarker[]` | `[]`                                        | Vehicle markers (last position) |
| `pathPoints` | `readonly TelemetryMapMarker[]` | `[]`                                        | Points for polyline path        |
| `activeImei` | `string \| null`                | `null`                                      | Highlights the matching marker  |
| `emptyLabel` | `string`                        | `"Todavia no hay posiciones para mostrar."` | Message when no data            |

**Rendering behavior:**

| Condition                  | Map behavior                                                               |
| -------------------------- | -------------------------------------------------------------------------- |
| No markers, no path points | Empty label shown, map centered on Colombia (`[4.5709, -74.2973]`, zoom 6) |
| 1 marker only              | Map `setView` at marker coords, zoom 14                                    |
| 2+ points                  | `fitBounds` with 24px padding                                              |
| Path points > 1            | Polyline drawn, segmented by ignition state                                |

**Ignition coloring (polylines):**

| Ignition state                   | Color            |
| -------------------------------- | ---------------- |
| `ignitionOn = true`              | `#77c9de` (blue) |
| `ignitionOn = false / undefined` | `#aaaaaa` (gray) |

**Marker icon:** Custom `divIcon` with `<i class="pi pi-car">` icon. Active marker (matching `activeImei`) gets class `telemetry-map__vehicle-icon--active`.

**Popup:** Shows IMEI + "Ultimo visto: {lastSeenAtUtc}" on click.

**Tile layer:** OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`), maxZoom 19.

### Error state (map page)

- Title: `"No pudimos cargar el mapa"`
- Error message displayed
- Button: `"Reintentar"` (secondary, disabled during load)

### What the user can do

- View last known positions of all their devices on the map
- Click device card -> triggers navigation to `/app/devices/{imei}/telemetry`
- Click map marker -> popup with IMEI + last seen date
- Click `"Actualizar"` -> background refresh of device data
- Click `"Ir a Mis dispositivos"` (empty state) -> navigates to `/app/devices`

### UI states

| State                   | Behavior                                                    |
| ----------------------- | ----------------------------------------------------------- |
| Loading (initial)       | Full spinner overlay `"Cargando mapa..."`                   |
| Refreshing (background) | Button disabled, no spinner overlay                         |
| Error                   | Error state card with retry                                 |
| No devices              | Empty state in device list card with link to `/app/devices` |
| No mappable devices     | Info message in map card; map centered on Colombia          |
| Devices with positions  | Device list + markers on map                                |

### Outbound navigation

- `openTelemetry` event -> `/app/devices/{imei}/telemetry`
- Empty state button -> `/app/devices`

---

## 9. /app/devices

**Component:** `DevicesPageComponent`
**File:** `src/app/features/devices/pages/devices-page.component.ts`
**Guard:** `authGuard`

### What the user sees

**Hero card (`devices-hero`):**

| Element          | Value                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Title            | `"Mis dispositivos"`                                                              |
| Subtitle         | Describes IMEI-based GPS linking                                                  |
| Plan actual      | `user.planName` OR `"Pendiente de asignacion"`                                    |
| Uso disponible   | `{user.usedGps} / {user.maxGps} GPS usados` OR `"Sin contexto de plan"`           |
| Availability tag | `"Puedes vincular mas GPS"` (success) OR `"Sin cupos disponibles"` (warn)         |
| Bind button      | `"Vincular dispositivo"` (`pi pi-plus`) -- only shown when `hasDevices()` is true |

**Content area (mutually exclusive states):**

### State: loading

- `LoadingSpinner` mode `"screen"`, size `"sm"`, label `"Cargando dispositivos..."`

### State: error

- Card title: `"No pudimos cargar tus dispositivos"`
- `p-message` severity `"error"` with error text
- Button: `"Reintentar"` (secondary)

### State: has devices

- Card title: `"Dispositivos vinculados"`
- Subtitle: `"Cada fila representa un IMEI activo bajo tu cuenta actual."`
- PrimeNG `p-table` with `responsiveLayout="scroll"`

**Table columns:**

| Column               | Data                                      | Notes                           |
| -------------------- | ----------------------------------------- | ------------------------------- |
| IMEI                 | `device.imei`                             | Styled with class `device-imei` |
| Fecha de vinculacion | `device.boundAtUtc \| date:'medium'`      | Angular `DatePipe`              |
| Estado               | `p-tag value="Vinculado" severity="info"` | Static always                   |
| Acciones             | Two buttons                               | See below                       |

**Action buttons per row:**

| Button      | Icon          | Label           | Action                                                   |
| ----------- | ------------- | --------------- | -------------------------------------------------------- |
| Telemetria  | `pi pi-map`   | `"Telemetria"`  | Navigates to `/app/devices/{device.imei}/telemetry`      |
| Desvincular | `pi pi-trash` | `"Desvincular"` | Opens confirm dialog; disabled while unbinding this IMEI |

### State: no devices (empty)

- Card title: `"Todavia no tienes dispositivos vinculados"`
- Subtitle: when first device appears, it shows here with binding date
- Paragraph with instructions
- Button: `"Vincular primer dispositivo"` (`pi pi-plus`)

### Dialog: Vincular dispositivo

**Trigger:** `"Vincular dispositivo"` or `"Vincular primer dispositivo"` button.

| Property        | Value                               |
| --------------- | ----------------------------------- |
| Header          | `"Vincular dispositivo"`            |
| Modal           | true                                |
| Draggable       | false                               |
| Resizable       | false                               |
| Closable        | false while `pendingBind()` is true |
| DismissableMask | false while `pendingBind()` is true |
| Width           | `min(92vw, 30rem)`                  |

**Form content:**

- Instruction copy: `"Ingresa el IMEI exacto del GPS que quieres asociar a tu cuenta."`
- Field: `IMEI` (text, `inputmode="numeric"`, `autocomplete="off"`, placeholder `"Ej. 359339080123456"`)
- Validation: required, minLength(8), maxLength(32)
- Inline error (dirty/touched): `"Ingresa un IMEI valido entre 8 y 32 caracteres."`
- API error area: `p-message` severity `"error"` if bind fails

**Buttons:**

| Button                   | Behavior                                           |
| ------------------------ | -------------------------------------------------- |
| Cancelar (secondary)     | Closes dialog, resets form; disabled while pending |
| Vincular (`pi pi-check`) | Submits form; disabled if form invalid OR pending  |

**On successful bind:**

- Dialog closes
- Device list refreshes (re-fetches from API)
- `authFacade.refreshProfile()` called (updates `usedGps`)
- Toast shown:
  - `outcome = 'bound'`: `{ severity: 'success', summary: 'Dispositivo vinculado', detail: 'El IMEI fue agregado a tu lista de dispositivos.' }`
  - `outcome = 'already-bound'`: `{ severity: 'info', summary: 'IMEI ya vinculado', detail: 'Ese IMEI ya estaba asociado a tu cuenta.' }`

**Bind outcome logic:** API returns `status = 2` for already-bound, anything else = newly bound.

**Bind spinners:** `LoadingSpinner mode="screen" size="sm"` with label `"Vinculando dispositivo..."` shown outside the dialog while `pendingBind()` is true.

### Dialog: Confirmar desvincular

**Trigger:** `"Desvincular"` button in table row.
**Service:** PrimeNG `ConfirmationService`.

| Property            | Value                                              |
| ------------------- | -------------------------------------------------- |
| Header              | `"Desvincular dispositivo"`                        |
| Message             | `"Se quitara el IMEI {imei} de tu cuenta actual."` |
| Accept label        | `"Desvincular"`                                    |
| Reject label        | `"Cancelar"`                                       |
| Accept button class | `p-button-danger`                                  |

**On confirm:**

- Calls `facade.unbindDevice(imei)`
- Re-fetches device list
- `authFacade.refreshProfile()` called
- Toast success: `{ severity: 'success', summary: 'Dispositivo desvinculado', detail: 'El IMEI {imei} fue retirado de tu cuenta.' }`
- Toast error: `{ severity: 'error', summary: 'No fue posible desvincular', detail: friendlyError }`

**Unbind spinners:** `LoadingSpinner mode="screen" size="sm"` label `"Desvinculando dispositivo..."` while `pendingUnbindImei()` is set.

### Friendly error codes (bind + unbind)

| Code                         | Message                                                  |
| ---------------------------- | -------------------------------------------------------- |
| `plan_quota_exceeded`        | `"Tu plan actual no permite vincular mas dispositivos."` |
| `imei_owned_by_another_user` | `"El IMEI ingresado ya esta vinculado a otro usuario."`  |
| `missing_active_plan`        | `"Necesitas un plan activo para vincular dispositivos."` |
| `device_binding_not_found`   | `"No existe un vinculo activo para el IMEI indicado."`   |
| other                        | Raw `apiError.message`                                   |

### What the user can do

- View all their linked devices with binding dates
- See plan usage (`usedGps / maxGps`)
- Bind new GPS devices via IMEI
- Navigate to device telemetry per device
- Unbind devices with confirmation

### UI states

| State          | Behavior                              |
| -------------- | ------------------------------------- |
| Loading        | Full screen spinner                   |
| Error          | Error card with retry                 |
| Empty          | Empty state card with bind CTA        |
| Has devices    | Table with actions                    |
| Bind pending   | Spinner, dialog not closable          |
| Unbind pending | Spinner, affected row button disabled |

### Outbound navigation

- `"Telemetria"` button -> `/app/devices/{imei}/telemetry`

---

## 10. /app/devices/:imei/telemetry

**Component:** `DeviceTelemetryPageComponent`
**File:** `src/app/features/telemetry/pages/device-telemetry-page.component.ts`
**Route data:** `{ telemetryContext: 'self' }` (user context, vs `'admin'` for admin view)
**Guard:** `authGuard`

### What the user sees (overview)

A single large `p-card` containing:

- Title: `"Telemetria del dispositivo"`
- Subtitle: describes last location, trips, and filtered events
- Toolbar row with time-window controls
- Content panel switcher (Mapa / Eventos)

### Not-found state

If IMEI does not match any bound device:

- Card title: `"Telemetria no disponible"`
- Subtitle: `"El dispositivo solicitado no existe dentro del contexto actual o ya no esta vinculado."`
- Back button: label depends on context (user: `"Volver al mapa"`, admin: `"Volver al usuario"`)

### Error state

- Card title: `"No pudimos cargar la telemetria"`
- `p-message` severity `"error"` with error text
- Button: `"Reintentar"` (secondary)

### Toolbar row

**Time-window preset buttons (left group):**

| Button          | Preset | Time window                     |
| --------------- | ------ | ------------------------------- |
| `"Ultima hora"` | `hour` | Last 1 hour                     |
| `"24 horas"`    | `day`  | Last 24 hours (default on load) |
| `"7 dias"`      | `week` | Last 7 days                     |

Active preset gets primary severity; others get `secondary`.

**Action buttons (right group):**

| Button         | Icon                | Action                            |
| -------------- | ------------------- | --------------------------------- |
| `"Resumen"`    | `pi pi-info-circle` | Opens summary dialog              |
| Back button    | `pi pi-arrow-left`  | `"Volver al mapa"` -> `/app/map`  |
| `"Actualizar"` | `pi pi-refresh`     | Refreshes data for current window |

**Window label:** `"Ventana: {from} a {to}"` formatted with `es-CO` locale, `dateStyle: 'short'`, `timeStyle: 'short'`.

**Custom range form:**

| Field | Control | Type                   |
| ----- | ------- | ---------------------- |
| Desde | `from`  | `datetime-local` input |
| Hasta | `to`    | `datetime-local` input |

Button: `"Aplicar rango"` (secondary, disabled if form invalid or refreshing).

On apply: converts datetime-local values to ISO UTC, sets preset to `'custom'`, triggers `facade.refresh(window)`.

### Content panel switch

Two buttons: `"Mapa"` and `"Eventos"`. Active view gets primary severity.

---

### Panel: Mapa

**Sub-section 1: Ultima ubicacion**

Shows `TelemetryMapComponent` with:

- `markers`: last known position marker for the device (if any)
- `pathPoints`: empty array (no path in this sub-section)
- `activeImei`: current device IMEI
- `emptyLabel`: `"No hay ultima ubicacion conocida para este dispositivo."`

**Insight grid (3 articles below map):**

| Label            | Value                                                                         |
| ---------------- | ----------------------------------------------------------------------------- |
| Ultima ubicacion | `{lat}, {lon}` formatted `1.4-4` decimal places, OR `"Sin posicion conocida"` |
| Velocidad actual | `{speedKmh} km/h` formatted `1.0-1`, OR `"Sin dato"`                          |
| Rumbo            | `{headingDeg} grados` formatted `1.0-0`, OR `"Sin dato"`                      |

**Sub-section 2: Recorridos**

Section label: `"Recorridos"`.

| Condition                              | What renders                                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `hasTrips()`                           | Trips layout: list on left, trip detail on right                                                      |
| `!hasTrips() && positions.length > 0`  | Fallback route (raw positions as polyline)                                                            |
| `!hasTrips() && positions.length == 0` | `p-message` info: `"No hay recorridos ni suficientes posiciones disponibles dentro de esta ventana."` |

**Trips layout (when trips exist):**

Left column: `TelemetryTripsListComponent`
Right column: `TelemetryMapComponent` (trip path) + optional error message + window label + `TelemetryTripSummaryComponent`

Trip window label: `"Recorridos consultados entre {from} y {to}"`.

If `tripErrorMessage()` is set: `p-message` severity `"warn"` with the error text.

**Fallback route (when no trips but positions exist):**

- `p-message` info: `"No hay recorridos segmentados en esta ventana. Mostrando el historial de posiciones como respaldo."`
- `TelemetryMapComponent` with all position points as `pathPoints`
- Fallback route label: `"Mostrando historial entre {start} y {end}."`
- 5-metric summary grid:

| Label              | Value                                |
| ------------------ | ------------------------------------ |
| Puntos             | `routeSummary.pointCount`            |
| Velocidad maxima   | `{maxSpeedKmh} km/h` OR `"Sin dato"` |
| Velocidad promedio | `{avgSpeedKmh} km/h` OR `"Sin dato"` |
| Inicio             | `startedAtUtc \| date:'short'`       |
| Fin                | `endedAtUtc \| date:'short'`         |

---

### Panel: Eventos

**Filter toolbar:**

- Dropdown `p-select`: options are `"Todos los eventos"` (value `'all'`) + distinct event codes sorted alphabetically
- Event summary label:
  - When `'all'`: `"{n} evento{s} en la ventana actual"`
  - When filtered: `"Mostrando {filtered} de {total} evento{s}"`
- `"Quitar filtro"` button (`pi pi-filter-slash`, secondary) -- only shown when filter is not `'all'`

**Events panel sub-switch (shown when filtered events exist):**

| Button              | View                                       |
| ------------------- | ------------------------------------------ |
| `"Timeline"`        | Renders `TelemetryEventsTimelineComponent` |
| `"Detalle tabular"` | Renders `TelemetryEventsTableComponent`    |

**Empty states:**

| Condition                         | Message                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| No events at all in window        | `p-message` info: `"No hay eventos dentro de la ventana seleccionada."`                  |
| Events exist but filter returns 0 | `p-message` info: `"No hay eventos para el filtro seleccionado dentro de esta ventana."` |

---

### TelemetryTripsListComponent

**File:** `src/app/features/telemetry/components/telemetry-trips-list.component.ts`

Renders a scrollable list of trip selector buttons.

**Each trip button shows:**

| Element      | Value                                                      |
| ------------ | ---------------------------------------------------------- |
| Date (bold)  | `trip.startedAtUtc \| date:'short'`                        |
| Status       | `"Finalizado"` OR `"En curso"` (when `endedAtUtc` is null) |
| Points count | `"{n} puntos"`                                             |
| Max speed    | `"Max {n} km/h"` (1.0-1 format) OR `"Max sin dato"`        |

**Inputs:**

| Input              | Type                        | Default |
| ------------------ | --------------------------- | ------- |
| `trips`            | `readonly TripSummaryDto[]` | `[]`    |
| `selectedTripId`   | `string \| null`            | `null`  |
| `pendingSelection` | `boolean`                   | `false` |

Active trip gets class `telemetry-trips-list__item--active`. All buttons disabled while `pendingSelection`.

**Outputs:**

| Output       | Payload           |
| ------------ | ----------------- |
| `selectTrip` | `string` (tripId) |

---

### TelemetryTripSummaryComponent

**File:** `src/app/features/telemetry/components/telemetry-trip-summary.component.ts`

Displays a 6-metric grid for the selected trip:

| Label              | Value                                              |
| ------------------ | -------------------------------------------------- |
| Inicio             | `trip.startedAtUtc \| date:'medium'`               |
| Fin                | `trip.endedAtUtc \| date:'medium'` OR `"En curso"` |
| Puntos             | `trip.pointCount`                                  |
| Velocidad maxima   | `{n} km/h` OR `"Sin dato"`                         |
| Velocidad promedio | `{n} km/h` OR `"Sin dato"`                         |
| Regla              | `trip.sourceRule`                                  |

**Inputs:**

| Input  | Required | Type            |
| ------ | -------- | --------------- |
| `trip` | yes      | `TripDetailDto` |

---

### TelemetryEventsTimelineComponent

**File:** `src/app/features/telemetry/components/telemetry-events-timeline.component.ts`

Renders a vertical timeline. Each event is an `<article>` with:

**Rail dot:** colored by severity (see severity mapping below).

**Header area:**

| Element                  | Value                                              |
| ------------------------ | -------------------------------------------------- |
| Event code tag (`p-tag`) | `event.eventCode` with computed severity           |
| Timestamp (bold)         | `event.occurredAtUtc \| date:'medium'`             |
| Received (small)         | `"Recibido {event.receivedAtUtc \| date:'short'}"` |

**Meta grid (dl):**

| Term      | Value                                       |
| --------- | ------------------------------------------- |
| Protocolo | `normalizeTelemetryText(event.protocol)`    |
| Tipo      | `normalizeTelemetryText(event.messageType)` |
| Packet    | `<code>{event.packetId}</code>`             |
| Sesion    | `<code>{event.sessionId}</code>`            |

**Payload area:**

- Label: `"Payload"`
- `<code>{event.payloadText}</code>` OR `"Sin payload textual disponible."`

**Severity mapping (by eventCode substring):**

| Keywords                                                      | Severity    |
| ------------------------------------------------------------- | ----------- |
| `alarm`, `panic`, `sos`, `tamper`, `fail`, `error`, `invalid` | `danger`    |
| `heartbeat`                                                   | `success`   |
| `tracking`, `position`                                        | `info`      |
| `acc_on`                                                      | `success`   |
| `acc_off`                                                     | `secondary` |
| `pwr_on`                                                      | `info`      |
| `pwr_off`                                                     | `secondary` |
| `login`, `connect`                                            | `warn`      |
| anything else                                                 | `secondary` |

**Inputs:**

| Input    | Type                        | Default |
| -------- | --------------------------- | ------- |
| `events` | `readonly DeviceEventDto[]` | `[]`    |

---

### TelemetryEventsTableComponent

**File:** `src/app/features/telemetry/components/telemetry-events-table.component.ts`

PrimeNG `p-table` with `responsiveLayout="scroll"`.

**Columns:**

| Header    | Data                  | Format                                   |
| --------- | --------------------- | ---------------------------------------- |
| Ocurrio   | `event.occurredAtUtc` | `date:'medium'`                          |
| Codigo    | `event.eventCode`     | Styled with class `telemetry-event-code` |
| Protocolo | `event.protocol`      | `normalizeTelemetryText`                 |
| Tipo      | `event.messageType`   | `normalizeTelemetryText`                 |
| Packet    | `event.packetId`      | `<code>`                                 |
| Sesion    | `event.sessionId`     | `<code>`                                 |
| Payload   | `event.payloadText`   | `<code>` OR `'-'`                        |

**Inputs:**

| Input    | Type                        | Default |
| -------- | --------------------------- | ------- |
| `events` | `readonly DeviceEventDto[]` | `[]`    |

---

### Dialog: Resumen del dispositivo

**Trigger:** `"Resumen"` button in the toolbar row.

| Property        | Value                       |
| --------------- | --------------------------- |
| Header          | `"Resumen del dispositivo"` |
| Modal           | true                        |
| Draggable       | false                       |
| Resizable       | false                       |
| DismissableMask | true                        |
| Width           | `min(92vw, 42rem)`          |

**Content (definition list `dl`):**

| Term             | Value                                                            |
| ---------------- | ---------------------------------------------------------------- |
| IMEI             | `device.imei`                                                    |
| Ultimo visto     | `device.lastSeenAtUtc \| date:'medium'` OR `"Sin dato"`          |
| Protocolo        | `normalizeTelemetryText(device.protocol)`                        |
| Ultimo mensaje   | `normalizeTelemetryText(device.lastMessageType)`                 |
| Sesion activa    | `device.activeSessionId` OR `"Sin sesion reportada"`             |
| Vinculado desde  | `device.boundAtUtc \| date:'medium'`                             |
| Ultima posicion  | `"{lat}, {lon}"` (4 decimal places) OR `"Sin posicion conocida"` |
| Velocidad actual | `"{n} km/h"` (1 decimal place) OR `"Sin dato"`                   |

### UI states (telemetry page overall)

| State                   | Behavior                                            |
| ----------------------- | --------------------------------------------------- |
| Not found               | Not-found card with back button                     |
| Loading initial         | `LoadingSpinner "Cargando telemetria..."`           |
| Error                   | Error card with retry                               |
| Refreshing              | `LoadingSpinner "Actualizando telemetria..."`       |
| Trip selection loading  | Trip list buttons disabled (`pendingTripSelection`) |
| No trips + positions    | Fallback route map                                  |
| No trips + no positions | Info message                                        |
| No events               | Info message in events panel                        |
| Events filtered to 0    | Filtered empty message                              |

### Initialization behavior

On component init (via `combineLatest([route.paramMap, route.data])`):

1. Reads `imei` from route params
2. Reads `telemetryContext` from route data (`'self'` for user, `'admin'` for admin path)
3. Resets all UI state (preset -> `'day'`, content panel -> `'map'`, events panel -> `'timeline'`, summary dialog -> closed, event filter -> `'all'`)
4. Sets current window to last 24 hours
5. Calls `facade.initialize(context, imei, window)`

`DeviceTelemetryFacade.initialize` fetches in parallel:

- Device summaries (`GET /api/me/telemetry/devices`)
- Events (`GET /api/me/telemetry/devices/{imei}/events?from=&to=&limit=100`)
- Positions (`GET /api/me/telemetry/devices/{imei}/positions?from=&to=&limit=500`)
- Trips (`GET /api/me/telemetry/devices/{imei}/trips?from=&to=&limit=20`)
- Then auto-selects first trip (most recent) and fetches its detail

Devices sorted by IMEI asc, trips sorted by `startedAtUtc` desc, events sorted by `receivedAtUtc` desc, positions sorted by `occurredAtUtc` asc.

### What the user can do

- Switch between time presets (hour / day / week) or enter a custom range
- Switch between Map view and Events view
- Select a trip from the list to see its path and summary
- Filter events by code
- Switch between timeline and table view for events
- Open the device summary dialog
- Manually refresh data
- Go back to `/app/map`

### Outbound navigation

- Back button -> `/app/map`
- (If admin context) -> `/admin/users/{userId}`

---

## 11. /app/account

**Component:** `AccountPageComponent`
**File:** `src/app/features/account/pages/account-page.component.ts`
**Guard:** `authGuard`

### What the user sees

Two `p-card` elements stacked:

**Card 1: Perfil actual**

- Title: `"Perfil actual"`
- Subtitle: `"Conectado a \`GET /api/me\` y persistido entre recargas."`

If user is loaded (definition list):

| Term            | Value                                          |
| --------------- | ---------------------------------------------- |
| Nombre          | `user.fullName` OR `"No informado"`            |
| Correo          | `user.email`                                   |
| Plan            | `user.planName` OR `"Pendiente de asignacion"` |
| Codigo del plan | `user.planCode`                                |
| GPS usados      | `{user.usedGps} / {user.maxGps}`               |

If user not loaded: `"Todavia no hay un snapshot de usuario cargado."`

If error: error message displayed (inline `<p class="error-copy">`).

Button: `"Actualizar perfil"` (`pi pi-refresh`, secondary, disabled while pending).

**Card 2: Envolvente de roles**

- Title: `"Envolvente de roles"`
- Subtitle: `"Estos valores alimentan solo los guards del cliente; la API debe seguir validando la autorizacion."`
- List of `p-tag` per role from `authFacade.roles()`
- Empty state: `"El token actual no expone roles para este usuario."`

### What the user can do

- View their profile data (fullName, email, plan, usage)
- Click `"Actualizar perfil"` to re-fetch from `GET /api/me`
- View their assigned roles (read-only)

### Actions on refresh

1. Sets `pending = true`, shows `LoadingSpinner mode="screen" size="sm"` label `"Actualizando perfil..."`
2. Calls `authFacade.refreshProfile()` -> internally calls `GET /api/me`
3. On error: sets `errorMessage` signal

### UI states

| State           | Behavior                         |
| --------------- | -------------------------------- |
| User loaded     | Profile data shown               |
| User not loaded | Empty copy                       |
| Refreshing      | Spinner overlay, button disabled |
| Error           | Error text below profile         |
| No roles        | Empty copy in roles card         |

### Outbound navigation

None -- self-contained informational page.

---

## 12. Data Models Reference

### CurrentUserDto

Source: `src/app/core/auth/models/current-user.model.ts`

```
interface CurrentUserDto {
  userId:    string
  email:     string
  fullName?: string | null
  planCode:  string
  planName:  string
  maxGps:    number
  usedGps:   number
  roles?:    readonly string[]
}
```

Used in: account page, devices page (plan/usage), app-shell (display name, roles), dashboard (profile status).

---

### AuthSession

Source: `src/app/core/auth/models/auth-session.model.ts`

```
interface AuthSession {
  accessToken:  string
  refreshToken: string
  tokenType:    string   // always 'Bearer'
  expiresAt:    string   // ISO datetime UTC
}
```

Persisted in `localStorage` (remember session) or `sessionStorage` (default).

---

### AuthLoginRequest / AuthLoginResponse

Source: `src/app/core/auth/models/auth-login.model.ts`

```
interface AuthLoginRequest {
  userNameOrEmail: string
  password:        string
}

interface AuthLoginResponse {
  accessToken:               string
  accessTokenExpiresAtUtc:   string
  refreshToken:              string
  refreshTokenExpiresAtUtc:  string
}
```

---

### UserDeviceBindingDto

Source: `src/app/features/devices/models/user-device.model.ts`

```
interface UserDeviceBindingDto {
  deviceId:   string
  imei:       string
  boundAtUtc: string   // ISO datetime UTC
}
```

Used in: devices page table. Sorted by `boundAtUtc` descending (most recently bound first).

---

### BindDeviceResultDto

```
interface BindDeviceResultDto {
  status:    number
  deviceId?: string | null
}
```

`status = 2` means already-bound. Any other value = newly bound.

---

### TelemetryDeviceSummaryDto

Source: `src/app/features/telemetry/models/telemetry.model.ts`

```
interface TelemetryDeviceSummaryDto {
  imei:            string
  boundAtUtc:      string
  lastSeenAtUtc:   string | null
  activeSessionId: string | null
  protocol:        string | number | null
  lastMessageType: string | number | null
  lastPosition:    LastKnownPositionDto | null
}
```

Used in: map page device list, device telemetry page summary dialog.

---

### LastKnownPositionDto

```
interface LastKnownPositionDto {
  occurredAtUtc: string
  receivedAtUtc: string
  gpsTimeUtc:    string | null
  latitude:      number
  longitude:     number
  speedKmh:      number | null
  headingDeg:    number | null
  packetId:      string
  sessionId:     string
}
```

---

### DevicePositionPointDto

```
interface DevicePositionPointDto {
  occurredAtUtc: string
  receivedAtUtc: string
  gpsTimeUtc:    string | null
  latitude:      number
  longitude:     number
  speedKmh:      number | null
  headingDeg:    number | null
  packetId:      string
  sessionId:     string
  ignitionOn?:   boolean
}
```

Used for: polyline path rendering. `ignitionOn` controls polyline segment color.

---

### DeviceEventDto

```
interface DeviceEventDto {
  eventId:       string
  occurredAtUtc: string
  receivedAtUtc: string
  eventCode:     string
  payloadText:   string
  protocol:      string | number
  messageType:   string | number
  packetId:      string
  sessionId:     string
}
```

---

### TripSummaryDto

```
interface TripSummaryDto {
  tripId:        string
  imei:          string
  startedAtUtc:  string
  endedAtUtc:    string | null   // null = trip in progress
  pointCount:    number
  maxSpeedKmh:   number | null
  avgSpeedKmh:   number | null
  startPosition: DevicePositionPointDto
  endPosition:   DevicePositionPointDto
}
```

---

### TripDetailDto

```
interface TripDetailDto {
  tripId:        string
  imei:          string
  startedAtUtc:  string
  endedAtUtc:    string | null
  pointCount:    number
  maxSpeedKmh:   number | null
  avgSpeedKmh:   number | null
  pathPoints:    readonly DevicePositionPointDto[]
  startPosition: DevicePositionPointDto
  endPosition:   DevicePositionPointDto
  sourceRule:    string
}
```

`sourceRule` identifies the trip segmentation algorithm used by the backend.

---

### TelemetryMapMarker

```
interface TelemetryMapMarker {
  imei:          string
  latitude:      number
  longitude:     number
  lastSeenAtUtc: string | null
  protocol:      string | number | null
  ignitionOn?:   boolean
}
```

Internal model used to pass data to `TelemetryMapComponent`.

---

### TelemetryWindowSelection

```
interface TelemetryWindowSelection {
  preset:  'hour' | 'day' | 'week' | 'custom'
  fromUtc: string   // ISO UTC
  toUtc:   string   // ISO UTC
}
```

---

## 13. Full Navigation Flow

```
/
 |-- redirects to /app/dashboard (if no session: authGuard -> /auth/login)

/auth/* (PublicLayoutComponent, guestGuard)
 |-- /auth/login
 |    |-- success -> /app/dashboard
 |    |-- link -> /auth/register
 |    |-- link -> /auth/recover-password
 |
 |-- /auth/register
 |    |-- success -> /auth/login  (+ toast: check email)
 |    |-- link -> /auth/login
 |    |-- link -> /auth/recover-password
 |
 |-- /auth/recover-password
 |    |-- success -> stays on page  (+ inline success message)
 |    |-- link -> /auth/login
 |    |-- link -> /auth/register
 |
 |-- /auth/reset-password?email=&token=
      |-- success -> /auth/login  (+ toast: password updated)
      |-- link -> /auth/login
      |-- link -> /auth/recover-password

/app/* (AppShellComponent, authGuard)
 |-- /app/dashboard
 |    |-- no outbound navigation (informational)
 |
 |-- /app/map
 |    |-- device card "Ver telemetria" -> /app/devices/{imei}/telemetry
 |    |-- empty state "Ir a Mis dispositivos" -> /app/devices
 |    |-- (polling every 30s, browser only)
 |
 |-- /app/devices
 |    |-- table row "Telemetria" -> /app/devices/{imei}/telemetry
 |    |-- (bind/unbind actions stay on page)
 |
 |-- /app/devices/:imei/telemetry
 |    |-- back button -> /app/map
 |    |-- (all actions stay on page: preset, custom range, trip select, filter)
 |
 |-- /app/account
      |-- (refresh action stays on page)

Header (AppShell)
 |-- sign-out button -> clears session + /auth/login  (+ toast: session closed)
```

---

## 14. Default Query Limits

Source: `src/app/features/telemetry/models/telemetry.model.ts`

| Resource  | Constant                  | Default limit |
| --------- | ------------------------- | ------------- |
| Positions | `DEFAULT_POSITIONS_LIMIT` | **500**       |
| Events    | `DEFAULT_EVENTS_LIMIT`    | **100**       |
| Trips     | `DEFAULT_TRIPS_LIMIT`     | **20**        |

These limits are sent as the `limit` query parameter in all telemetry API calls.

**API endpoint pattern (user context):**

| Resource         | Endpoint                                                             |
| ---------------- | -------------------------------------------------------------------- |
| Device summaries | `GET /api/me/telemetry/devices`                                      |
| Positions        | `GET /api/me/telemetry/devices/{imei}/positions?from=&to=&limit=500` |
| Events           | `GET /api/me/telemetry/devices/{imei}/events?from=&to=&limit=100`    |
| Trips (list)     | `GET /api/me/telemetry/devices/{imei}/trips?from=&to=&limit=20`      |
| Trip (detail)    | `GET /api/me/telemetry/devices/{imei}/trips/{tripId}?from=&to=`      |
| My devices       | `GET /api/me/devices`                                                |
| Profile          | `GET /api/me`                                                        |

**Time window defaults (presets):**

| Preset          | Window                               |
| --------------- | ------------------------------------ |
| `hour`          | `now - 1 hour` to `now`              |
| `day` (default) | `now - 24 hours` to `now`            |
| `week`          | `now - 7 days` to `now`              |
| `custom`        | User-specified datetime-local inputs |

The telemetry page initializes with the `day` preset. Every preset change and custom range submission triggers a fresh API call (`facade.refresh(window)`).
