# IMPITrack -- User Role Redesign PRD

> **Scope:** Role `user` only. Admin and Ops views are out of scope.
> **Stack:** Angular 21 + SSR, PrimeNG, Leaflet, Angular Signals, Reactive Forms, SCSS.
> **Status:** Draft v1.0 -- March 2026
> **Source documents:** `user-views-reference.md`, `product-source-of-truth-prd.md`, HTML mockup reference.

---

## Table of Contents

- [A. Executive Summary](#a-executive-summary)
- [B. Business and User Objectives](#b-business-and-user-objectives)
- [C. UX/UI Principles](#c-uxui-principles)
- [D. Benchmark: Ruhavik + HTML Mockup](#d-benchmark-ruhavik--html-mockup)
- [E. Functional Scope of the Redesign](#e-functional-scope-of-the-redesign)
  - [E.1 Dashboard](#e1-appdashboard--monitoring-center)
  - [E.2 Map](#e2-appmap--fullscreen-map-with-overlays)
  - [E.3 Devices](#e3-appdevices--fleet-management)
  - [E.4 Telemetry](#e4-appdevicesimeitelemetry--device-deep-dive)
  - [E.5 Account](#e5-appaccount--user-profile)
  - [E.6 Shell / Navigation](#e6-shell-and-navigation)
- [F. Information Architecture](#f-information-architecture)
- [G. Key User Flows](#g-key-user-flows)
- [H. Functional Requirements (MoSCoW)](#h-functional-requirements-moscow)
- [I. Non-Functional Requirements](#i-non-functional-requirements)
- [J. Frontend Component Proposal](#j-frontend-component-proposal)
- [K. Per-Screen Design](#k-per-screen-design)
- [L. Phased Roadmap](#l-phased-roadmap)
- [M. Risks and Open Decisions](#m-risks-and-open-decisions)
- [N. Acceptance Criteria](#n-acceptance-criteria)
- [Appendix: Backend Data Availability Matrix](#appendix-backend-data-availability-matrix)

---

## A. Executive Summary

### Vision

Transform IMPITrack's user-facing views from a technical MVP shell into a professional GPS monitoring experience. The map becomes the heart of the product. Every view is redesigned to prioritize operational clarity, fast scanning, and actionable device state -- following a dark-theme, glassmorphism-inspired visual language defined by the HTML mockup.

### Current Problem

Today's user views are functional but utilitarian:

- **Dashboard** is a placeholder roadmap card with zero operational value.
- **Map** is a two-column card layout, not a fullscreen monitoring surface.
- **Devices** is a basic CRUD table with no visual state.
- **Telemetry** is powerful but dense and technical.
- **Account** is a debug-oriented profile dump.
- **Shell** uses a wide sidebar that wastes horizontal space.

Users see technical artifacts (raw IMEI, protocol codes, packet IDs) instead of operational meaning (vehicle name, last seen, speed, trip count).

### Opportunity

Adopt the HTML mockup's visual direction -- dark theme, fullscreen map, icon sidebar, floating overlays, live status indicators -- while respecting backend reality. The redesign makes every pixel serve a monitoring purpose.

### Expected Outcome

- A professional SaaS-grade monitoring interface.
- Map-first experience with zero wasted space.
- Users understand device state within 2 seconds of landing.
- Every view has clear loading, empty, error, and active states.
- Incremental delivery: each phase ships a usable improvement.

---

## B. Business and User Objectives

### Business Objectives

| #   | Objective                                      | Metric                                       |
| --- | ---------------------------------------------- | -------------------------------------------- |
| B1  | Reduce time-to-insight for device monitoring   | User sees vehicle position < 3s after login  |
| B2  | Reduce support tickets about "map not working" | Clear empty/error states explain problems    |
| B3  | Professional product perception                | Visual quality comparable to Ruhavik/Traccar |
| B4  | Increase daily active monitoring sessions      | Map as landing page drives engagement        |
| B5  | Foundation for paid plan differentiation       | Plan usage visible, device limits clear      |

### User Pains (Current)

| Pain                                | Evidence                                       |
| ----------------------------------- | ---------------------------------------------- |
| Dashboard is useless                | Shows MVP roadmap, not device state            |
| Map wastes space                    | Two-column card layout, not fullscreen         |
| Can't see device status at a glance | No status indicators, badges, or live state    |
| Telemetry is too technical          | Packet IDs, session IDs, raw protocols visible |
| No sense of "what happened today"   | No daily summary, trip count, or distance      |
| Navigation is heavy                 | Full sidebar with text labels consumes space   |
| No visual device identity           | Only raw IMEI, no alias or distinguishing info |

### Expected Outcomes

| Outcome                                   | How Measured                          |
| ----------------------------------------- | ------------------------------------- |
| Users land on a useful monitoring surface | Dashboard shows real device summaries |
| Map is the primary workspace              | Fullscreen with floating controls     |
| Device state is scannable                 | Status pills, badges, metric grids    |
| Telemetry is approachable                 | Restructured with visual hierarchy    |
| Navigation is compact                     | Icon sidebar with hover expand        |

---

## C. UX/UI Principles

### C1. Map First

The map is the primary monitoring surface. It gets maximum screen real estate. Controls float over it; they don't compete with it. Other views support the map, not the reverse.

### C2. Context Before Detail

Show status and summary before raw data. A user should understand "vehicle is moving at 45 km/h, last seen 30s ago" before ever seeing a packet ID.

### C3. Vehicle State Always Visible

Speed, position status, last-seen time, and ignition state should be accessible from any monitoring view without drilling into telemetry.

### C4. Frequent Actions Within Reach

Switching devices, changing time windows, refreshing data, and navigating to telemetry must be 1-click actions. No unnecessary dialogs or page transitions.

### C5. Consistent Visual Language

All views share the same dark theme, card treatment, typography, spacing, and color semantics. The HTML mockup's palette is the reference:

| Token                  | Value                   | Usage                                         |
| ---------------------- | ----------------------- | --------------------------------------------- |
| `bg-base`              | `#0a0c10`               | Page background                               |
| `bg-panel`             | `#0f1218`               | Sidebar, panels                               |
| `bg-card`              | `#141820`               | Cards, overlays                               |
| `accent`               | `#00e5a0`               | Online status, primary actions, active states |
| `warn`                 | `#f59e0b`               | Warnings, speed alerts                        |
| `danger`               | `#ef4444`               | Alarms, errors, destructive actions           |
| `info`                 | `#3b82f6`               | Informational badges                          |
| `text-primary`         | `#ffffff`               | Main text                                     |
| `text-secondary`       | `rgba(255,255,255,0.5)` | Labels, secondary info                        |
| `border-radius-card`   | `12px`                  | Cards                                         |
| `border-radius-button` | `8px`                   | Buttons, pills                                |

Typography: **Syne** for UI labels and headings, **Space Mono** for data values (speed, coordinates, IMEI).

### C6. Responsive and SSR-Safe

All views must work on desktop (1280px+), tablet (768px-1279px), and degrade gracefully on mobile (< 768px). SSR must not break -- browser-only APIs (Leaflet, `window`, `localStorage`) are guarded.

### C7. Fast Scanning

Use metric grids, status pills, colored dots, and badge counts to enable scanning without reading. Operational dashboards reward glance-ability.

---

## D. Benchmark: Ruhavik + HTML Mockup

### What to Adopt

| Element                               | Source                | Rationale                        |
| ------------------------------------- | --------------------- | -------------------------------- |
| Icon sidebar (64px/220px hover)       | HTML mockup           | Maximizes map/content space      |
| Fullscreen map with floating overlays | HTML mockup + Ruhavik | Standard in GPS monitoring       |
| Device switcher overlay (top-left)    | HTML mockup           | Quick access without leaving map |
| Live status badge (top-center)        | HTML mockup           | Real-time awareness indicator    |
| Map controls cluster (top-right)      | HTML mockup           | Standard cartographic controls   |
| Bottom status bar pill                | HTML mockup           | Persistent vehicle state         |
| Right panel with device details       | HTML mockup           | Device context alongside map     |
| Dark theme with glassmorphism         | HTML mockup           | Modern SaaS visual quality       |
| Pulsating marker                      | HTML mockup + Ruhavik | Live position emphasis           |
| Daily summary card                    | HTML mockup           | Contextual operational metrics   |
| Event timeline with severity dots     | HTML mockup + Ruhavik | Scannable event history          |

### What NOT to Adopt

| Element                        | Reason                                                 |
| ------------------------------ | ------------------------------------------------------ |
| Route replay player            | No backend support; complex; Phase 3+                  |
| Geofence management            | No backend endpoints; out of scope                     |
| Advanced fleet analytics       | No aggregate API; dashboard should use per-device data |
| In-map speed graph timeline    | Overengineered for current data; future consideration  |
| Multi-vehicle route comparison | No backend support                                     |

### What to Adapt

| Element                                 | Adaptation                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| Device switcher shows "vehicle name"    | Use IMEI as label (no alias system exists). Future: alias field                          |
| Summary card shows "km recorridos"      | **Not available from backend.** Show trip count + max speed instead. Mark as placeholder |
| Status bar shows "GSM signal, GPS sats" | **Not available from backend.** Show available data: speed, heading, last seen, ignition |
| Alert strip shows speed alerts          | **Not available from backend.** Show event count by severity instead                     |
| Plan usage progress bar                 | Available from `CurrentUserDto.usedGps / maxGps`                                         |
| "EN VIVO" badge                         | Adapt to show polling status: "Actualizando cada 30s" instead of true real-time          |

---

## E. Functional Scope of the Redesign

### E.1 `/app/dashboard` -- Monitoring Center

**Current state:** Placeholder with MVP roadmap cards and readiness checklist. Zero operational value.

**Proposed state:** A real operational dashboard that answers "What's happening with my devices right now?"

**Layout:**

```
+--------------------------------------------------+
| Welcome header: "Hola, {displayName}"            |
| Subtitle: "{date} - {n} dispositivos activos"    |
+--------------------------------------------------+
| [Plan Card]  [Activity Card]  [Quick Map Mini]   |
|  Plan name    Devices w/      Mini map with      |
|  Usage bar    position: n     all device markers |
|  GPS x/y      Last event:     Click -> /app/map  |
|               {summary}                          |
+--------------------------------------------------+
| [Device Status Grid]                             |
| Card per device:                                 |
|   IMEI | status pill | last seen | speed         |
|   -> Mapa | -> Telemetria                         |
+--------------------------------------------------+
```

**Blocks:**

1. **Welcome header** -- greeting + date + active device count.
2. **Plan summary card** -- plan name, usage bar (`usedGps / maxGps`), availability badge, link to `/app/devices`.
3. **Activity summary card** -- devices with position (count), devices without position (count), last event timestamp (from most recent device summary). Data source: `GET /api/me/telemetry/devices`.
4. **Quick map thumbnail** -- small Leaflet map showing all device markers (reuse `TelemetryMapComponent` in compact mode). Click navigates to `/app/map`.
5. **Device status grid** -- one card per bound device, showing: IMEI, status pill (online/offline based on `lastSeenAtUtc` recency), last seen relative time, speed if available, quick-action buttons (Map, Telemetry).

**Data sources:**

- `GET /api/me` -- user profile, plan info.
- `GET /api/me/telemetry/devices` -- device summaries with last position.
- `GET /api/me/devices` -- binding data (already loaded by facade).

**What's NOT available from backend (documented gaps):**

| Mockup element          | Status                     | Workaround                                         |
| ----------------------- | -------------------------- | -------------------------------------------------- |
| Distance traveled today | NOT available              | Omit. Show trip count if trips exist in 24h window |
| Time active today       | NOT available              | Omit. Show last seen relative time instead         |
| Alert count             | NOT available as aggregate | Show recent event count from telemetry if loaded   |
| Device alias/name       | NOT available              | Show IMEI. Document as future backend requirement  |

---

### E.2 `/app/map` -- Fullscreen Map with Overlays

**Current state:** Two-column card layout with device list (left) and map card (right). Works but wastes space.

**Proposed state:** Fullscreen map viewport with floating overlay panels, following the HTML mockup exactly.

**Layout:**

```
+------------------------------------------------------------------+
|  [Device Switcher]  [Time Filters]    [LIVE Badge]   [Map Ctrls] |
|   top-left           top-left-2nd     top-center      top-right  |
|                                                                   |
|                                                                   |
|                     FULLSCREEN MAP                                |
|                  (Leaflet, 100% viewport)                         |
|                                                                   |
|              [Vehicle Marker]                                     |
|                pulsating dot                                      |
|                                                          [Right   |
|  [Summary Card]                              [Status     Panel]  |
|   bottom-left                                 Bar]       320px   |
|                                              bottom-center       |
+------------------------------------------------------------------+
```

**Overlay blocks (floating over map):**

1. **Device Switcher (top-left)** -- Shows active device: IMEI + status pill (en linea/sin conexion) + chevron dropdown. Clicking opens a dropdown/overlay listing all devices. Selecting a device centers the map on it and updates all overlays.

2. **Time filter pills (top-left, below switcher)** -- `1H | HOY | 7D | MES | Personalizado`. Maps to presets: `hour`, `day` (= HOY), `week`, `month` (new), `custom`. Active pill highlighted with accent color.

3. **Live status badge (top-center)** -- Pill showing polling state:
   - When polling active: `"ACTUALIZANDO - cada 30s"` with pulsing dot.
   - When data is stale (> 60s since last update): `"DATOS DE HACE {n}s"` with warn color.
   - Future (SignalR): `"EN VIVO"` with green pulse.

4. **Map controls (top-right)** -- Vertical button stack: Center on vehicle, Zoom in, Zoom out, Layer toggle (street/satellite -- if tile layers configured), Toggle route path, Fullscreen toggle.

5. **Summary card (bottom-left)** -- "Resumen - Hoy" card with available metrics:
   - Trip count in current window (from trips API).
   - Max speed in current window (from trips or positions).
   - Last event count by severity.
   - **NOT available:** distance in km, time active. Show "Sin datos" or omit.

6. **Status bar pill (bottom-center)** -- Persistent pill for active device: speed (km/h), coordinates (lat, lon), heading (degrees), ignition state icon, last seen relative ("hace {n}s").
   - **NOT available:** GSM signal, GPS satellite count. Omit these fields.

7. **Right panel (320px, collapsible)** -- Device details panel:
   - Header: "Mis Dispositivos" + `"{active} / {total} GPS activos"` + bind button (+).
   - Plan usage bar (from user profile).
   - Active device card: IMEI, status pill, metric grid (speed, heading, last seen, ignition), coordinates, action buttons (Telemetria, Historial).
   - Tabs: `Eventos | Recorridos`
     - **Eventos tab:** Timeline of recent events for active device, colored dots by severity, contextual timestamps.
     - **Recorridos tab:** Trip list for active device in current time window.
   - Other devices list: compact cards with IMEI + status, click to switch.

**Marker rendering:**

- Active device: pulsating green dot (CSS animation) + tooltip with IMEI + speed.
- Other devices: static dot, muted color.
- Click marker: centers map, sets as active device, updates all panels.

**Polling:**

- Interval: 30 seconds (browser only). Same as current implementation.
- On each poll: refresh device summaries, update markers, update status bar.
- Manual refresh button available.

**Data sources (all existing):**

| Endpoint                                                             | Purpose                           |
| -------------------------------------------------------------------- | --------------------------------- |
| `GET /api/me/telemetry/devices`                                      | Device summaries + last positions |
| `GET /api/me/telemetry/devices/{imei}/events?from=&to=&limit=100`    | Events for active device          |
| `GET /api/me/telemetry/devices/{imei}/trips?from=&to=&limit=20`      | Trips for active device           |
| `GET /api/me/telemetry/devices/{imei}/positions?from=&to=&limit=500` | Path for route toggle             |

---

### E.3 `/app/devices` -- Fleet Management

**Current state:** Hero card with plan info + basic table. Functional but visually flat.

**Proposed state:** A fleet management view with visual device cards, plan awareness, and richer device state.

**Layout:**

```
+--------------------------------------------------+
| Header: "Mis Dispositivos"                       |
| Subtitle: "{n} dispositivos vinculados"           |
| [Vincular +]                                      |
+--------------------------------------------------+
| [Plan Card]                                       |
|  Plan: {planName} | Uso: {usedGps}/{maxGps}      |
|  [=======-----] progress bar                      |
|  Badge: "Puedes vincular mas" / "Sin cupos"       |
+--------------------------------------------------+
| [Device Cards Grid]                               |
|  +-------------+  +-------------+  +----------+  |
|  | IMEI        |  | IMEI        |  | + Bind   |  |
|  | Status pill |  | Status pill |  | Empty    |  |
|  | Last seen   |  | Last seen   |  | slot     |  |
|  | Speed       |  | Speed       |  |          |  |
|  | Bound date  |  | Bound date  |  |          |  |
|  | [Map][Tel]  |  | [Map][Tel]  |  |          |  |
|  | [Unbind]    |  | [Unbind]    |  |          |  |
|  +-------------+  +-------------+  +----------+  |
+--------------------------------------------------+
```

**Changes from current:**

1. Replace table with card grid -- more visual, better for small device counts (typical user: 1-5 devices).
2. Add device status (online/offline) based on `lastSeenAtUtc` recency.
3. Show last position data inline (speed, coordinates) if available.
4. Show empty "slots" based on plan capacity -- visual hint of capacity.
5. Keep bind/unbind flows (dialogs) as they are -- they work well.
6. Add "Ver en mapa" button per device that navigates to `/app/map` and centers on that device.

**Status determination (frontend heuristic, no backend endpoint):**

| Condition                             | Status         | Color          |
| ------------------------------------- | -------------- | -------------- |
| `lastSeenAtUtc` within last 5 minutes | `En linea`     | accent/green   |
| `lastSeenAtUtc` within last 1 hour    | `Reciente`     | info/blue      |
| `lastSeenAtUtc` older than 1 hour     | `Sin conexion` | secondary/gray |
| `lastSeenAtUtc` is null               | `Sin datos`    | warn/amber     |

**Data sources:** Same as current (`GET /api/me/devices`, `GET /api/me/telemetry/devices`, `GET /api/me`).

---

### E.4 `/app/devices/:imei/telemetry` -- Device Deep Dive

**Current state:** Single card with toolbar, map/events toggle, trip list, event timeline/table. Powerful but visually dense and technically-oriented.

**Proposed state:** Restructured layout with clearer visual hierarchy, same data, better presentation.

**Layout:**

```
+------------------------------------------------------------------+
| Breadcrumb: Dispositivos > {IMEI}                                 |
| Header: "Telemetria - {IMEI}"                                     |
| Status pill | Last seen | Protocol badge                          |
| [Back] [Refresh] [Summary]                                        |
+------------------------------------------------------------------+
| Time Window Bar                                                    |
| [1H] [HOY] [7D] [MES] [Personalizado __|__]  Ventana: x a y      |
+------------------------------------------------------------------+
| Tabs: [Mapa y Recorridos] [Eventos]                               |
+------------------------------------------------------------------+
|                                                                    |
| TAB: Mapa y Recorridos                                            |
| +---------------------------+  +-------------------------------+  |
| | Map (Leaflet)             |  | Trip List (scrollable)        |  |
| | Last position or          |  |  Trip 1: date, status,        |  |
| | selected trip path        |  |    points, max speed          |  |
| |                           |  |  Trip 2: ...                  |  |
| |                           |  |  Trip 3: ...                  |  |
| +---------------------------+  +-------------------------------+  |
| | Trip Summary Grid                                               |
| | Start | End | Points | Max speed | Avg speed | Rule            |
| +---------------------------+------+---+------+--+------+---------+
| | Position Insight Row (when no trip selected)                    |
| | Last position | Speed | Heading                                 |
+------------------------------------------------------------------+
|                                                                    |
| TAB: Eventos                                                      |
| [Filter dropdown] [Event count] [Clear filter]                    |
| Sub-tabs: [Timeline] [Tabla]                                      |
| Timeline or Table view                                             |
+------------------------------------------------------------------+
```

**Key changes:**

1. Add breadcrumb for navigation context.
2. Add device status pill and last-seen in the header (not buried in summary dialog).
3. Merge "Mapa" tab content: always show map + trip list side by side (when trips exist). Current design separates them awkwardly.
4. Keep trip selection, trip summary, fallback route, event filtering, timeline/table views -- they work.
5. Reduce visual noise: hide packetId, sessionId from default event timeline (move to expandable "technical details" per event).
6. Add `MES` preset (last 30 days) to time window options.

**Data sources:** No change. Same endpoints, same limits.

---

### E.5 `/app/account` -- User Profile

**Current state:** Two cards -- profile dump and role list. Debug-oriented.

**Proposed state:** Clean profile view with plan details and account actions.

**Layout:**

```
+--------------------------------------------------+
| Header: "Mi Cuenta"                               |
+--------------------------------------------------+
| [Profile Card]                                    |
|  Avatar placeholder (initials)                    |
|  Name: {fullName}                                 |
|  Email: {email}                                   |
|  [Actualizar perfil]                              |
+--------------------------------------------------+
| [Plan Card]                                       |
|  Plan: {planName} ({planCode})                    |
|  GPS: {usedGps} / {maxGps}                        |
|  [=========-----] progress bar                    |
|  Status: "Puedes vincular mas" / "Sin cupos"      |
|  [Ir a Mis Dispositivos]                          |
+--------------------------------------------------+
| [Security Card]                                    |
|  Roles: tag list                                  |
|  Session: token expiration info (read-only)       |
+--------------------------------------------------+
```

**Changes:**

1. Add avatar placeholder (initials-based, CSS only).
2. Reorganize into profile / plan / security cards.
3. Add link to devices from plan card.
4. Remove technical labels ("Envolvente de roles", "Conectado a GET /api/me").
5. Keep refresh profile action.

**Data sources:** No change (`GET /api/me`).

---

### E.6 Shell and Navigation

**Current state:** Wide sidebar with text labels, brand block, role tags. Header with hamburger, name, sign-out.

**Proposed state:** Compact icon sidebar following HTML mockup.

**Sidebar behavior:**

| State                  | Width              | Content                         |
| ---------------------- | ------------------ | ------------------------------- |
| Collapsed (default)    | 64px               | Icons only + logo mark          |
| Expanded (hover/click) | 220px              | Icons + text labels             |
| Mobile (< 768px)       | 0px / 100% overlay | Full overlay on hamburger click |

**Navigation items (user role):**

| Icon               | Label        | Route            | Badge                                         |
| ------------------ | ------------ | ---------------- | --------------------------------------------- |
| `pi pi-th-large`   | Dashboard    | `/app/dashboard` | --                                            |
| `pi pi-map`        | Mapa         | `/app/map`       | --                                            |
| `pi pi-truck`      | Dispositivos | `/app/devices`   | `{deviceCount}`                               |
| `pi pi-chart-line` | Telemetria   | --               | -- (contextual, shows when on telemetry page) |
| `pi pi-bell`       | Alertas      | --               | Future (event count badge)                    |
| -- spacer --       |              |                  |                                               |
| `pi pi-user`       | Cuenta       | `/app/account`   | --                                            |

**Bottom section:** User avatar (initials) + display name (visible on hover/expand) + sign-out icon.

**Header:** Removed as a separate bar. The header content (user name, sign-out) moves to the sidebar bottom. The hamburger toggle stays for mobile.

**Post-login landing:** Change from `/app/dashboard` to `/app/map`. The map is the primary workspace.

---

## F. Information Architecture

### Menu Hierarchy

```
Sidebar (icon rail)
  |-- Dashboard      /app/dashboard       Overview + device status grid
  |-- Mapa           /app/map             Primary monitoring workspace
  |-- Dispositivos   /app/devices         Fleet management + bind/unbind
  |-- Cuenta         /app/account         Profile + plan + security
  |
  |-- (Contextual: Telemetria)            /app/devices/:imei/telemetry
  |                                       Accessed from map or devices, not sidebar
```

### Labels

| Current label    | New label    | Reason                                |
| ---------------- | ------------ | ------------------------------------- |
| Resumen          | Dashboard    | More standard for monitoring products |
| Mis dispositivos | Dispositivos | Shorter, "mis" is implied             |
| Cuenta           | Cuenta       | No change needed                      |
| Mapa             | Mapa         | No change needed                      |

### Landing Page Post-Login

**Current:** `/app/dashboard` (placeholder).
**Proposed:** `/app/map` (the monitoring workspace).

Rationale: Users log in to check their vehicles. The map answers their first question immediately. The dashboard becomes a secondary overview.

### Navigation Between Views

| From      | To        | Trigger                                                      |
| --------- | --------- | ------------------------------------------------------------ |
| Login     | Map       | Successful login redirect                                    |
| Map       | Telemetry | Click device card action or device switcher "Ver telemetria" |
| Map       | Devices   | Right panel "Vincular" button or sidebar                     |
| Devices   | Map       | Device card "Ver en mapa" button                             |
| Devices   | Telemetry | Device card "Telemetria" button                              |
| Telemetry | Map       | Back button ("Volver al mapa")                               |
| Dashboard | Map       | Quick map thumbnail click or device card "Mapa" button       |
| Dashboard | Telemetry | Device card "Telemetria" button                              |
| Dashboard | Devices   | Plan card link                                               |
| Account   | Devices   | Plan card "Ir a Mis Dispositivos" link                       |

---

## G. Key User Flows

### G.1 Login -> Primary View

1. User enters credentials at `/auth/login`.
2. On success, redirect to `/app/map` (changed from `/app/dashboard`).
3. Map loads with all device markers. Right panel shows device list.
4. User sees their vehicle(s) immediately.

### G.2 Where Is My Vehicle Right Now?

1. User is on `/app/map`.
2. Active device shown in device switcher (top-left).
3. Map centered on vehicle marker (pulsating green dot).
4. Bottom status bar shows: speed, coordinates, last seen time.
5. If multiple devices: user clicks device switcher dropdown, selects another device.
6. Map re-centers, all panels update.

### G.3 Review a Trip

1. From `/app/map`, user clicks active device "Telemetria" action in right panel.
2. Navigates to `/app/devices/{imei}/telemetry`.
3. Default time window: last 24 hours. Trips tab is active.
4. Trip list shows available trips with start time, status, point count, max speed.
5. User clicks a trip. Map renders the trip path (polyline). Trip summary shows below.
6. User changes time window to 7D to see more trips.

### G.4 Inspect Events

1. From telemetry page, user clicks "Eventos" tab.
2. Events timeline shows with severity-colored dots.
3. User filters by event code via dropdown.
4. User switches between timeline and table views.

### G.5 Switch Active Device

1. On `/app/map`, user clicks device switcher (top-left overlay).
2. Dropdown shows all bound devices with status pills.
3. User selects a different device.
4. Map centers on new device. Right panel updates. Status bar updates. Events/trips reload for new device.

### G.6 Bind a New GPS

1. From `/app/devices` or right panel on `/app/map`, user clicks "Vincular" (+) button.
2. Bind dialog opens (same flow as current -- works well).
3. User enters IMEI, submits.
4. On success: device appears in list, profile refreshes, toast confirms.
5. If from map: new device marker appears.

### G.7 Understand Plan Capacity

1. On `/app/devices` or `/app/account`, user sees plan card.
2. Plan name, usage bar (`{used}/{max} GPS`), and availability badge.
3. If at capacity: badge shows "Sin cupos disponibles" (warn). Bind button is disabled or shows explanatory tooltip.

---

## H. Functional Requirements (MoSCoW)

### H.1 Shell / Navigation

| ID    | Requirement                                          | Priority |
| ----- | ---------------------------------------------------- | -------- |
| SH-01 | Icon sidebar: 64px collapsed, 220px on hover/expand  | MUST     |
| SH-02 | Dark theme matching mockup palette                   | MUST     |
| SH-03 | Active route indicator on sidebar icon               | MUST     |
| SH-04 | User info (initials avatar + name) at sidebar bottom | MUST     |
| SH-05 | Sign-out action from sidebar                         | MUST     |
| SH-06 | Mobile overlay sidebar with backdrop                 | MUST     |
| SH-07 | Badge on Dispositivos icon showing device count      | SHOULD   |
| SH-08 | Smooth expand/collapse animation                     | SHOULD   |
| SH-09 | Keyboard shortcut to toggle sidebar                  | COULD    |

### H.2 Dashboard (`/app/dashboard`)

| ID    | Requirement                                           | Priority |
| ----- | ----------------------------------------------------- | -------- |
| DB-01 | Welcome header with user name and date                | MUST     |
| DB-02 | Plan summary card with usage bar                      | MUST     |
| DB-03 | Device status grid (one card per device)              | MUST     |
| DB-04 | Device cards show IMEI, status pill, last seen, speed | MUST     |
| DB-05 | Quick actions per device: "Mapa", "Telemetria"        | MUST     |
| DB-06 | Activity summary: devices with/without position       | SHOULD   |
| DB-07 | Mini map thumbnail with all markers                   | SHOULD   |
| DB-08 | Empty state when no devices bound                     | MUST     |
| DB-09 | Loading and error states                              | MUST     |

### H.3 Map (`/app/map`)

| ID    | Requirement                                                   | Priority |
| ----- | ------------------------------------------------------------- | -------- |
| MP-01 | Fullscreen Leaflet map (100% viewport minus sidebar)          | MUST     |
| MP-02 | Floating device switcher (top-left)                           | MUST     |
| MP-03 | Time filter pills (1H, HOY, 7D, MES, custom)                  | MUST     |
| MP-04 | Polling status badge (top-center)                             | MUST     |
| MP-05 | Map controls: center, zoom+, zoom-, fullscreen                | MUST     |
| MP-06 | Pulsating marker for active device                            | MUST     |
| MP-07 | Right panel: active device details, tabs (Eventos/Recorridos) | MUST     |
| MP-08 | Right panel: device list with status for switching            | MUST     |
| MP-09 | Right panel: plan usage bar                                   | SHOULD   |
| MP-10 | Bottom status bar: speed, coords, heading, last seen          | MUST     |
| MP-11 | Bottom-left summary card with available metrics               | SHOULD   |
| MP-12 | Route path toggle on map (positions polyline)                 | SHOULD   |
| MP-13 | Layer toggle (street/satellite)                               | COULD    |
| MP-14 | Right panel collapsible                                       | SHOULD   |
| MP-15 | Click marker to set as active device                          | MUST     |
| MP-16 | Popup on marker click: IMEI + speed + last seen               | MUST     |
| MP-17 | Auto-center on active device on load                          | MUST     |
| MP-18 | 30s polling (browser only, same as current)                   | MUST     |
| MP-19 | Manual refresh button                                         | MUST     |

### H.4 Devices (`/app/devices`)

| ID    | Requirement                                         | Priority |
| ----- | --------------------------------------------------- | -------- |
| DV-01 | Card grid layout (instead of table)                 | MUST     |
| DV-02 | Device cards with status pill, last seen, speed     | MUST     |
| DV-03 | Plan card with usage bar and availability badge     | MUST     |
| DV-04 | Empty slots visual for remaining plan capacity      | SHOULD   |
| DV-05 | Bind dialog (same flow, dark theme styling)         | MUST     |
| DV-06 | Unbind confirmation (same flow, dark theme styling) | MUST     |
| DV-07 | "Ver en mapa" action per device                     | MUST     |
| DV-08 | "Ver telemetria" action per device                  | MUST     |
| DV-09 | Friendly error codes (same as current)              | MUST     |
| DV-10 | Loading, empty, error states                        | MUST     |

### H.5 Telemetry (`/app/devices/:imei/telemetry`)

| ID    | Requirement                                                       | Priority |
| ----- | ----------------------------------------------------------------- | -------- |
| TL-01 | Breadcrumb navigation                                             | MUST     |
| TL-02 | Device status in header (not just summary dialog)                 | MUST     |
| TL-03 | Time window bar with 1H, HOY, 7D, MES, custom                     | MUST     |
| TL-04 | Map + trip list side by side (when trips exist)                   | MUST     |
| TL-05 | Trip summary grid for selected trip                               | MUST     |
| TL-06 | Fallback route when no trips but positions exist                  | MUST     |
| TL-07 | Events tab with filter, timeline, table sub-views                 | MUST     |
| TL-08 | Hide packetId/sessionId from default timeline (expandable detail) | SHOULD   |
| TL-09 | Summary dialog (same content, styled for dark theme)              | MUST     |
| TL-10 | Not-found state with back navigation                              | MUST     |
| TL-11 | Loading, refreshing, error states                                 | MUST     |
| TL-12 | Ignition-colored polyline segments (same as current)              | MUST     |

### H.6 Account (`/app/account`)

| ID    | Requirement                                        | Priority |
| ----- | -------------------------------------------------- | -------- |
| AC-01 | Initials avatar                                    | SHOULD   |
| AC-02 | Profile card: name, email                          | MUST     |
| AC-03 | Plan card: plan name, code, usage bar, device link | MUST     |
| AC-04 | Security card: roles, session info                 | SHOULD   |
| AC-05 | Refresh profile action                             | MUST     |
| AC-06 | Loading and error states                           | MUST     |

---

## I. Non-Functional Requirements

### I.1 SSR Compatibility

| Requirement | Detail                                                         |
| ----------- | -------------------------------------------------------------- |
| NF-SSR-01   | Leaflet initialization guarded behind `isPlatformBrowser`      |
| NF-SSR-02   | No `window`, `document`, `localStorage` access during SSR      |
| NF-SSR-03   | Sidebar defaults to collapsed state in SSR                     |
| NF-SSR-04   | Polling only starts in browser context                         |
| NF-SSR-05   | All components render a meaningful skeleton/placeholder in SSR |

### I.2 Performance

| Requirement | Detail                                                                    |
| ----------- | ------------------------------------------------------------------------- |
| NF-PERF-01  | Map page loads with visible markers within 2 seconds (after API response) |
| NF-PERF-02  | Polling does not cause visible jank or map re-render flicker              |
| NF-PERF-03  | Lazy load all feature modules                                             |
| NF-PERF-04  | Leaflet tile layer uses browser cache headers                             |
| NF-PERF-05  | Right panel events/trips load on demand (when tab activated)              |
| NF-PERF-06  | `OnPush` change detection for all presentational components               |

### I.3 Polling

| Requirement | Detail                                                 |
| ----------- | ------------------------------------------------------ |
| NF-POLL-01  | 30s interval, browser only                             |
| NF-POLL-02  | Cleared on component destroy                           |
| NF-POLL-03  | Background refresh (no full overlay spinner)           |
| NF-POLL-04  | Status badge reflects polling state and data freshness |
| NF-POLL-05  | Manual refresh available on all data views             |

### I.4 Responsive

| Requirement | Detail                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| NF-RESP-01  | Desktop (1280px+): full layout with sidebar + right panel              |
| NF-RESP-02  | Tablet (768-1279px): sidebar collapsed by default, right panel overlay |
| NF-RESP-03  | Mobile (< 768px): sidebar overlay, right panel overlay, map fullscreen |
| NF-RESP-04  | Device card grid: 3 cols desktop, 2 cols tablet, 1 col mobile          |
| NF-RESP-05  | Map overlays reposition on smaller viewports                           |

### I.5 Accessibility

| Requirement | Detail                                                           |
| ----------- | ---------------------------------------------------------------- |
| NF-A11Y-01  | All interactive elements keyboard-focusable                      |
| NF-A11Y-02  | Sufficient color contrast (WCAG AA) for text on dark backgrounds |
| NF-A11Y-03  | Aria labels on icon-only buttons                                 |
| NF-A11Y-04  | Screen reader announces status changes (polling, device switch)  |
| NF-A11Y-05  | Focus trap in modal dialogs                                      |

### I.6 States

Every data-driven view MUST implement:

| State      | Implementation                             |
| ---------- | ------------------------------------------ |
| Loading    | Skeleton or spinner appropriate to context |
| Empty      | Explanatory message + primary action CTA   |
| Error      | Error message + retry action               |
| Data       | Normal content rendering                   |
| Refreshing | Background indicator (no blocking overlay) |

---

## J. Frontend Component Proposal

### Shell Components

| Component                 | New/Refactor | Responsibility                                               | Key I/O                                                                                  | View         |
| ------------------------- | ------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ------------ |
| `IconSidebarComponent`    | NEW          | Collapsible icon sidebar with nav items, user info, sign-out | `@Input() navItems`, `@Input() user`, `@Output() signOut`, `@Output() navigate`          | All `/app/*` |
| `SidebarNavItemComponent` | NEW          | Single nav item: icon + label + optional badge               | `@Input() icon`, `@Input() label`, `@Input() route`, `@Input() badge`, `@Input() active` | Shell        |
| `AppShellComponent`       | REFACTOR     | Layout wrapper: sidebar + content area                       | --                                                                                       | All `/app/*` |

### Map Components

| Component                     | New/Refactor | Responsibility                                                 | Key I/O                                                                                                                                                                          | View           |
| ----------------------------- | ------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `MapPageComponent`            | REFACTOR     | Fullscreen map page orchestrator                               | --                                                                                                                                                                               | `/app/map`     |
| `DeviceSwitcherComponent`     | NEW          | Active device selector overlay                                 | `@Input() devices`, `@Input() activeImei`, `@Output() deviceSelected`                                                                                                            | Map            |
| `TimeFilterPillsComponent`    | NEW          | Time window preset selector                                    | `@Input() activePreset`, `@Output() presetChanged`                                                                                                                               | Map, Telemetry |
| `PollingStatusBadgeComponent` | NEW          | Live/polling status indicator                                  | `@Input() lastRefreshAt`, `@Input() intervalMs`                                                                                                                                  | Map            |
| `MapControlsComponent`        | NEW          | Map action buttons (center, zoom, layers, fullscreen)          | `@Output() center`, `@Output() zoomIn`, `@Output() zoomOut`, `@Output() toggleFullscreen`                                                                                        | Map            |
| `DeviceStatusBarComponent`    | NEW          | Bottom pill with device metrics                                | `@Input() device`, `@Input() lastPosition`                                                                                                                                       | Map            |
| `DailySummaryCardComponent`   | NEW          | Bottom-left summary overlay                                    | `@Input() tripCount`, `@Input() maxSpeed`, `@Input() eventCount`                                                                                                                 | Map            |
| `MapRightPanelComponent`      | NEW          | Right panel: device details, tabs, device list                 | `@Input() devices`, `@Input() activeDevice`, `@Input() events`, `@Input() trips`, `@Input() user`, `@Output() deviceSelected`, `@Output() bindDevice`, `@Output() openTelemetry` | Map            |
| `TelemetryMapComponent`       | REFACTOR     | Leaflet map (add pulsating marker, better popup, layer toggle) | Same + `@Input() pulseActive`                                                                                                                                                    | Map, Telemetry |

### Dashboard Components

| Component                   | New/Refactor                | Responsibility                 | Key I/O                                                           | View                        |
| --------------------------- | --------------------------- | ------------------------------ | ----------------------------------------------------------------- | --------------------------- |
| `DashboardPageComponent`    | REFACTOR (complete rewrite) | Dashboard orchestrator         | --                                                                | `/app/dashboard`            |
| `WelcomeHeaderComponent`    | NEW                         | Greeting + date + device count | `@Input() userName`, `@Input() deviceCount`                       | Dashboard                   |
| `PlanSummaryCardComponent`  | NEW                         | Plan info with usage bar       | `@Input() planName`, `@Input() usedGps`, `@Input() maxGps`        | Dashboard, Devices, Account |
| `DeviceStatusCardComponent` | NEW                         | Single device summary card     | `@Input() device`, `@Output() openMap`, `@Output() openTelemetry` | Dashboard, Devices          |

### Devices Components

| Component                   | New/Refactor | Responsibility                     | Key I/O                                                                                                                       | View           |
| --------------------------- | ------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `DevicesPageComponent`      | REFACTOR     | Devices page with card grid        | --                                                                                                                            | `/app/devices` |
| `DeviceCardGridComponent`   | NEW          | Grid of device cards + empty slots | `@Input() devices`, `@Input() maxSlots`, `@Output() bind`, `@Output() unbind`, `@Output() openMap`, `@Output() openTelemetry` | Devices        |
| `BindDeviceDialogComponent` | REFACTOR     | Bind dialog (dark theme styling)   | Same                                                                                                                          | Devices, Map   |

### Telemetry Components

| Component                          | New/Refactor                                 | Responsibility                                 | Key I/O                       | View           |
| ---------------------------------- | -------------------------------------------- | ---------------------------------------------- | ----------------------------- | -------------- |
| `DeviceTelemetryPageComponent`     | REFACTOR                                     | Telemetry page with restructured layout        | --                            | Telemetry      |
| `TelemetryBreadcrumbComponent`     | NEW                                          | Breadcrumb: Dispositivos > {IMEI}              | `@Input() imei`               | Telemetry      |
| `TelemetryDeviceHeaderComponent`   | NEW                                          | Device header with status, last seen, protocol | `@Input() device`             | Telemetry      |
| `TelemetryTripsListComponent`      | REFACTOR (dark theme)                        | Trip selector list                             | Same                          | Telemetry      |
| `TelemetryTripSummaryComponent`    | REFACTOR (dark theme)                        | Trip metric grid                               | Same                          | Telemetry      |
| `TelemetryEventsTimelineComponent` | REFACTOR (hide technical details by default) | Event timeline                                 | Same + `@Input() compactMode` | Telemetry, Map |
| `TelemetryEventsTableComponent`    | REFACTOR (dark theme)                        | Event table                                    | Same                          | Telemetry      |

### Account Components

| Component              | New/Refactor | Responsibility                                | Key I/O                          | View             |
| ---------------------- | ------------ | --------------------------------------------- | -------------------------------- | ---------------- |
| `AccountPageComponent` | REFACTOR     | Account page with profile/plan/security cards | --                               | Account          |
| `UserAvatarComponent`  | NEW          | Initials-based avatar                         | `@Input() name`, `@Input() size` | Account, Sidebar |

### Shared Components

| Component             | New/Refactor | Responsibility                    | Key I/O                                             | View     |
| --------------------- | ------------ | --------------------------------- | --------------------------------------------------- | -------- |
| `StatusPillComponent` | NEW          | Online/offline/recent status pill | `@Input() status`, `@Input() size`                  | Multiple |
| `UsageBarComponent`   | NEW          | Plan usage progress bar           | `@Input() used`, `@Input() max`, `@Input() label`   | Multiple |
| `MetricCardComponent` | NEW          | Label + value + optional unit     | `@Input() label`, `@Input() value`, `@Input() unit` | Multiple |

---

## K. Per-Screen Design

### K.1 Shell

**Layout:** Sidebar (left) + content area (right, fills remaining width).

**Sidebar blocks:**

1. Logo mark (top, centered in 64px).
2. Nav items (icons, vertically stacked, centered).
3. Spacer (pushes user section to bottom).
4. User section: avatar + name + sign-out.

**States:**

- Collapsed: 64px, icons only, tooltips on hover.
- Expanded: 220px, icons + labels, smooth transition.
- Mobile: 0px default, full overlay on hamburger.

**Responsive:**

- Desktop: sidebar always visible (collapsed or expanded).
- Tablet: sidebar collapsed, expand on hover.
- Mobile: sidebar hidden, hamburger in top-left triggers overlay.

**Recommendations:**

- Use CSS transitions for expand/collapse (no Angular animations to keep SSR-safe).
- Active route: accent color on icon + left border indicator.
- Hover: subtle background highlight on nav items.

---

### K.2 Dashboard (`/app/dashboard`)

**Layout:** Single column, max-width 1200px, centered.

**Blocks (top to bottom):**

1. **Welcome header** -- full width.
   - "Hola, {displayName}" (h1, Syne).
   - "{formattedDate} - {n} dispositivos vinculados" (subtitle, text-secondary).

2. **Summary row** -- 2 or 3 cards, horizontal.
   - Plan card: plan name, usage bar, availability badge. CTA: "Gestionar dispositivos" -> `/app/devices`.
   - Activity card: "{n} con posicion" / "{n} sin posicion" counts. Most recent last seen timestamp.
   - Mini map card (optional, SHOULD): small Leaflet with all markers. Click -> `/app/map`.

3. **Device status grid** -- responsive grid.
   - One `DeviceStatusCardComponent` per device.
   - Each card: IMEI (monospace), status pill, last seen (relative), speed (if available), actions row.
   - Empty state: "Todavia no tienes dispositivos. Vincula tu primer GPS para comenzar." + CTA button.
   - Error state: retry card.
   - Loading state: skeleton cards.

**Content:**

- IMEI displayed in Space Mono.
- Status pill uses `StatusPillComponent`.
- Speed: "{n} km/h" or "Sin dato".
- Last seen: "hace {n}s" / "hace {n}m" / "hace {n}h" / date if > 24h.
- Actions: icon buttons for "Ver en mapa" and "Ver telemetria".

**Responsive:**

- Desktop: 3-column grid for device cards.
- Tablet: 2-column.
- Mobile: single column.

---

### K.3 Map (`/app/map`)

**Layout:** Fullscreen. Map fills entire content area (viewport minus 64px sidebar). All UI is floating overlays.

**Blocks:**

1. **Device Switcher (top-left, z-index above map):**
   - Card with: IMEI (bold), status pill, chevron icon.
   - Click opens dropdown overlay listing all devices.
   - Each device in dropdown: IMEI, status pill, last seen.
   - Selected device has accent highlight.
   - Width: 280px. Glassmorphism background (`bg-card` with `backdrop-filter: blur`).

2. **Time Filter Pills (top-left, below switcher):**
   - Horizontal row: `1H | HOY | 7D | MES | Personalizado`.
   - Active pill: accent background.
   - Inactive pills: `bg-card` background, text-secondary.
   - "Personalizado" shows date range inputs inline or in a small dropdown.
   - Pill row: glassmorphism background, rounded.

3. **Polling Badge (top-center):**
   - Pill: green dot (pulsating CSS) + "ACTUALIZANDO - cada 30s".
   - If data stale: warn color + "DATOS DE HACE {n}s".
   - Small, unobtrusive, glassmorphism background.

4. **Map Controls (top-right):**
   - Vertical stack of icon buttons:
     - `pi pi-crosshairs` -- center on active device.
     - `pi pi-plus` -- zoom in.
     - `pi pi-minus` -- zoom out.
     - `pi pi-map` -- toggle street/satellite (COULD).
     - `pi pi-replay` -- toggle route path display.
     - `pi pi-window-maximize` -- toggle fullscreen.
   - Each: 36x36px, `bg-card`, border-radius 8px, glassmorphism.
   - Spacing: 4px gap.

5. **Map (Leaflet):**
   - Full viewport fill.
   - Dark map tiles (SHOULD: use CartoDB Dark Matter or similar dark tile layer, fallback to OSM).
   - Markers: pulsating dot for active device (CSS `@keyframes pulse`), static dots for others.
   - Popup on click: IMEI, speed, last seen.
   - Route polyline when toggled on.

6. **Summary Card (bottom-left):**
   - "Resumen - Hoy" title.
   - Available metrics in small grid:
     - Recorridos: `{tripCount}` (requires trips API call).
     - Vel. maxima: `{maxSpeed} km/h` (from trips or positions).
     - Eventos: `{eventCount}` (requires events API call).
   - **NOT available:** km recorridos, tiempo activo. Omit or show "--".
   - Width: 240px. Glassmorphism.

7. **Status Bar (bottom-center):**
   - Horizontal pill:
     - Speed: `{n} km/h` icon + value.
     - Coordinates: `{lat}, {lon}` (4 decimal places).
     - Heading: `{n}deg` with compass icon.
     - Ignition: icon (green = on, gray = off/unknown).
     - Last seen: "hace {n}s".
   - **NOT available:** GSM signal, GPS satellite count. Omit.
   - Glassmorphism background.

8. **Right Panel (right, 320px, collapsible):**
   - Header: "Mis Dispositivos" + count + bind button (+).
   - Plan usage bar (compact).
   - Active device section:
     - IMEI (bold, monospace).
     - Status pill.
     - Metric grid: speed, heading, last seen, ignition status.
     - Coordinates.
     - Actions: "Telemetria" button, "Historial" button (-> telemetry with 7D preset).
   - Tabs: `Eventos | Recorridos`
     - Eventos: compact event timeline (severity dots, event code, relative time). Uses `TelemetryEventsTimelineComponent` with `compactMode=true`.
     - Recorridos: compact trip list. Uses `TelemetryTripsListComponent`.
   - Other devices: list of remaining devices with IMEI + status pill. Click to switch.
   - Collapse button: chevron on left edge of panel.

**States:**

| State         | Behavior                                                                        |
| ------------- | ------------------------------------------------------------------------------- |
| Loading       | Map loads immediately (tiles). Markers appear as data arrives.                  |
| No devices    | Map centered on Colombia. Right panel shows empty state with bind CTA.          |
| No positions  | Markers don't appear for devices without position. Status bar shows "--".       |
| Error         | Toast notification. Map remains visible. Retry available.                       |
| Refreshing    | Polling badge pulses. No overlay spinner.                                       |
| Device switch | Map re-centers. All panels update. Brief loading indicator on right panel tabs. |

**Responsive:**

- Desktop: map + right panel side by side. All overlays visible.
- Tablet: right panel becomes a drawer (slide-in from right). Toggle button on map.
- Mobile: right panel fullscreen overlay. Bottom status bar simplified (speed + last seen only). Summary card hidden.

---

### K.4 Devices (`/app/devices`)

**Layout:** Single column, max-width 1200px, centered.

**Blocks:**

1. **Header row:**
   - "Dispositivos" (h1) + "{n} vinculados" subtitle.
   - "Vincular +" button (accent, top-right).

2. **Plan card (full width):**
   - `PlanSummaryCardComponent` with usage bar.
   - Availability badge.

3. **Device card grid:**
   - `DeviceCardGridComponent`.
   - Each card: dark card (`bg-card`), IMEI (monospace), status pill, binding date, last seen, speed if available, action buttons (Mapa, Telemetria, Desvincular).
   - Empty slots: dashed-border placeholder cards showing "+" icon for remaining plan capacity.
   - Grid: 3 cols desktop, 2 tablet, 1 mobile.

4. **Empty state:**
   - Centered illustration placeholder + "Vincula tu primer GPS" message + CTA button.

**States:**

| State          | Behavior                                     |
| -------------- | -------------------------------------------- |
| Loading        | Skeleton card grid                           |
| Empty          | Empty state with bind CTA                    |
| Error          | Error card with retry                        |
| Has devices    | Card grid                                    |
| Bind pending   | Dialog + spinner overlay                     |
| Unbind pending | Affected card shows spinner, button disabled |

**Actions:**

- Bind dialog: same flow as current, dark theme styling. Dialog uses `bg-panel` background.
- Unbind dialog: same confirmation flow, dark theme.

---

### K.5 Telemetry (`/app/devices/:imei/telemetry`)

**Layout:** Full width content area.

**Blocks (top to bottom):**

1. **Header section:**
   - Breadcrumb: `Dispositivos > {IMEI}` (links to `/app/devices`).
   - "Telemetria" (h1).
   - Device header: IMEI (monospace), status pill, protocol badge, last seen (relative).
   - Action buttons: Back ("Volver al mapa"), Refresh, Summary dialog trigger.

2. **Time window bar:**
   - `TimeFilterPillsComponent`: `1H | HOY | 7D | MES | Personalizado`.
   - Window label: "Ventana: {from} a {to}" (text-secondary, right-aligned).
   - Custom range inputs (shown when "Personalizado" active): from/to datetime fields + "Aplicar" button.

3. **Content tabs: `Mapa y Recorridos | Eventos`**

4. **Mapa y Recorridos tab:**
   - If trips exist:
     - Two-column layout: map (left, 60%) + trip list (right, 40%).
     - Map shows selected trip path or last position.
     - Trip summary grid below map.
   - If no trips but positions:
     - Fallback: map with position polyline + fallback summary grid.
     - Info message explaining no segmented trips.
   - If no trips and no positions:
     - Info message: "No hay recorridos ni posiciones en esta ventana."

5. **Eventos tab:**
   - Filter dropdown + event count label + clear filter.
   - Sub-tabs: Timeline | Tabla.
   - Timeline: severity-colored dots, event code badge, timestamp, protocol/type.
     - Technical details (packetId, sessionId, payload) hidden by default, expandable per event.
   - Table: full data columns (same as current, styled dark).
   - Empty states for no events / filter returns zero.

**States:**

| State        | Behavior                                        |
| ------------ | ----------------------------------------------- |
| Loading      | Spinner: "Cargando telemetria..."               |
| Not found    | Card: "Dispositivo no encontrado" + back button |
| Error        | Error card + retry                              |
| Refreshing   | Inline indicator, no blocking overlay           |
| Trip loading | Trip list buttons disabled                      |
| No data      | Contextual messages per section                 |

**Responsive:**

- Desktop: two-column map+trips.
- Tablet: stacked (map above, trips below).
- Mobile: stacked, simplified.

---

### K.6 Account (`/app/account`)

**Layout:** Single column, max-width 600px, centered.

**Blocks:**

1. **Profile card:**
   - Initials avatar (large, accent background).
   - Full name (or "No informado").
   - Email.
   - Refresh button.

2. **Plan card:**
   - Plan name + plan code.
   - Usage bar.
   - Availability badge.
   - "Ir a Mis Dispositivos" link.

3. **Security card:**
   - Roles: tag list (PrimeNG tags).
   - Empty state: "Sin roles asignados."
   - No raw JWT info visible (removed from user-facing view).

**States:**

| State           | Behavior                        |
| --------------- | ------------------------------- |
| User loaded     | All cards populated             |
| User not loaded | Skeleton + "Cargando perfil..." |
| Refreshing      | Spinner overlay on profile card |
| Error           | Inline error message            |

---

## L. Phased Roadmap

### Phase 1: Shell + Theme Foundation

**Goal:** Establish the new visual foundation. All existing functionality continues working.

**Deliverables:**

1. Dark theme SCSS variables and PrimeNG theme override.
2. Icon sidebar (`IconSidebarComponent`) replacing current wide sidebar.
3. Refactored `AppShellComponent` layout.
4. Typography setup (Syne + Space Mono).
5. Shared components: `StatusPillComponent`, `UsageBarComponent`, `UserAvatarComponent`.
6. Post-login redirect changed to `/app/map`.

**Verification:**

- All existing routes still work.
- Sidebar navigates correctly.
- Sign-out works.
- Mobile sidebar works.
- SSR renders without errors.
- Dark theme applied consistently.

**Estimated scope:** ~15 components/files touched.

---

### Phase 2: Map Redesign

**Goal:** Transform the map into the fullscreen monitoring workspace.

**Deliverables:**

1. Fullscreen map layout (replace two-column cards).
2. `DeviceSwitcherComponent` (top-left overlay).
3. `TimeFilterPillsComponent` (reusable, used here and in telemetry).
4. `PollingStatusBadgeComponent` (top-center).
5. `MapControlsComponent` (top-right).
6. `DeviceStatusBarComponent` (bottom-center pill).
7. `MapRightPanelComponent` with device details, events/trips tabs, device list.
8. Pulsating marker CSS for active device.
9. Marker click -> set active device.
10. Glassmorphism overlay styling.

**Verification:**

- Map fills viewport.
- All overlays positioned correctly.
- Device switching works.
- Polling continues working (30s).
- Right panel shows device data.
- Events and trips tabs load data.
- Responsive: tablet/mobile degradation works.
- SSR: map initializes correctly (browser-only).

**Estimated scope:** ~10 new components, ~5 refactored.

---

### Phase 3: Dashboard Redesign

**Goal:** Replace the placeholder dashboard with a real monitoring overview.

**Deliverables:**

1. `WelcomeHeaderComponent`.
2. `PlanSummaryCardComponent` (reused in devices and account).
3. `DeviceStatusCardComponent` (reused in devices).
4. Dashboard page rewrite.
5. Activity summary card.
6. Optional: mini map thumbnail.

**Verification:**

- Dashboard shows real device data.
- Plan usage visible and accurate.
- Device cards show status, last seen, speed.
- Quick actions navigate correctly.
- Empty/loading/error states work.

**Estimated scope:** ~8 components.

---

### Phase 4: Devices Redesign

**Goal:** Replace the table with a visual card grid.

**Deliverables:**

1. `DeviceCardGridComponent`.
2. Device cards with status pills.
3. Empty slot placeholders.
4. Dark-themed bind/unbind dialogs.
5. "Ver en mapa" action per device.

**Verification:**

- Card grid displays correctly.
- Bind/unbind flows still work.
- Plan usage bar accurate.
- Empty/loading/error states work.
- Responsive grid works.

**Estimated scope:** ~5 components.

---

### Phase 5: Telemetry Refinement

**Goal:** Restructure the telemetry view for better visual hierarchy.

**Deliverables:**

1. Breadcrumb component.
2. Device header with status.
3. Merged map + trip list layout.
4. Collapsible technical details in event timeline.
5. `MES` preset added to time filters.
6. Dark theme styling for all telemetry sub-components.

**Verification:**

- All existing telemetry functionality preserved.
- Trip selection, path rendering, event filtering all work.
- Technical details hidden by default, expandable.
- Time window changes work including MES.

**Estimated scope:** ~6 refactored components.

---

### Phase 6: Account + Polish

**Goal:** Final view redesign + cross-cutting polish.

**Deliverables:**

1. Account page redesign.
2. Cross-view consistency pass.
3. Loading/empty/error state audit.
4. Accessibility pass (keyboard, contrast, aria labels).
5. Dark tile layer for map (CartoDB Dark Matter or similar).

**Verification:**

- Account page shows profile/plan/security clearly.
- All views pass visual consistency review.
- All states implemented across all views.
- Keyboard navigation works on all interactive elements.

**Estimated scope:** ~5 components, cross-cutting fixes.

---

### Phase Summary

| Phase | Focus            | Dependencies                               | Independently Shippable |
| ----- | ---------------- | ------------------------------------------ | ----------------------- |
| 1     | Shell + Theme    | None                                       | Yes                     |
| 2     | Map              | Phase 1 (theme + sidebar)                  | Yes                     |
| 3     | Dashboard        | Phase 1 (theme + shared components)        | Yes                     |
| 4     | Devices          | Phase 1 (theme + shared components)        | Yes                     |
| 5     | Telemetry        | Phase 1 (theme), Phase 2 (TimeFilterPills) | Yes                     |
| 6     | Account + Polish | Phases 1-5                                 | Yes                     |

Phases 3 and 4 can run in parallel after Phase 1.

---

## M. Risks and Open Decisions

### Technical Risks

| Risk                                            | Impact                                   | Mitigation                                                                |
| ----------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| PrimeNG dark theme conflicts                    | Inconsistent styling, double theming     | Create a custom PrimeNG preset/theme. Test early in Phase 1               |
| Leaflet + glassmorphism overlays z-index issues | Overlays hidden behind map layers        | Establish z-index scale. Test overlay positioning in Phase 2              |
| SSR + Leaflet initialization timing             | Hydration mismatches, runtime errors     | Keep existing `isPlatformBrowser` guards. Test SSR after every map change |
| Font loading performance (Syne + Space Mono)    | Flash of unstyled text, layout shifts    | Use `font-display: swap`, preload critical fonts                          |
| Dark tile layer availability                    | CartoDB may have rate limits or downtime | Keep OSM as fallback. Tile source configurable                            |

### UX Risks

| Risk                                           | Impact                                 | Mitigation                                                            |
| ---------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Right panel competes with map on small screens | Map too cramped                        | Make right panel collapsible/overlay on < 1280px                      |
| Too many floating overlays on map              | Visual clutter                         | Test with 1-5 devices. Reduce overlays on mobile                      |
| Users expect "km recorridos" from mockup       | Disappointment when metric unavailable | Show available metrics clearly. Mark gaps as "Proximamente"           |
| Device switcher dropdown with 5+ devices       | Overflow, scrolling needed             | Set max-height with scroll. Sufficient for typical user (1-5 devices) |

### Backend Dependencies

| Dependency                | Status               | Impact                                                               |
| ------------------------- | -------------------- | -------------------------------------------------------------------- |
| Device alias/name         | NOT available        | Must use IMEI as device label. Propose backend addition              |
| Distance calculation (km) | NOT available        | Cannot show daily/trip distance. Propose backend aggregation         |
| Active time calculation   | NOT available        | Cannot show "time active today". Propose backend aggregation         |
| Alert/notification system | NOT available        | Cannot show alert badges or alert strip. Use event severity as proxy |
| GSM signal strength       | NOT available in API | Cannot show in status bar. Omit                                      |
| GPS satellite count       | NOT available in API | Cannot show in status bar. Omit                                      |
| Reverse geocoding         | NOT available        | Cannot show address in device card. Show coordinates only            |
| Odometer                  | NOT available        | Cannot show total distance. Omit                                     |
| SignalR/WebSocket         | NOT available        | No true real-time. Continue with 30s polling                         |

### Open Decisions

| Decision                         | Options                                            | Recommendation                                                                                      |
| -------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Dark tile layer provider         | CartoDB Dark Matter vs Stadia Dark vs OSM standard | CartoDB Dark Matter (free tier, good quality). Configure as environment variable for easy switching |
| Glassmorphism depth              | Full blur + transparency vs subtle hint            | Subtle hint. Heavy glassmorphism causes rendering perf issues on lower-end devices                  |
| Device "online" threshold        | 2 min vs 5 min vs 10 min                           | 5 minutes. Configurable constant. Typical GPS reports every 30-120s                                 |
| MES preset period                | Last 30 days vs calendar month                     | Last 30 days (rolling). Consistent with other rolling presets                                       |
| Right panel default state on map | Open vs collapsed                                  | Open on desktop (>= 1280px), collapsed on smaller                                                   |
| Post-login landing page          | `/app/map` vs `/app/dashboard`                     | `/app/map`. Users log in to check vehicles, not read summaries                                      |
| Mini map on dashboard            | Include vs skip                                    | SHOULD. Include if Phase 3 timeline allows. Adds significant value                                  |
| Event timeline compact mode      | Show all fields vs hide technical                  | Hide packetId, sessionId, payload by default. Expandable per event                                  |

---

## N. Acceptance Criteria

### N.1 Shell

| ID       | Criterion                                                            |
| -------- | -------------------------------------------------------------------- |
| AC-SH-01 | Sidebar renders at 64px width with centered icons                    |
| AC-SH-02 | Hovering/clicking sidebar expands to 220px with labels visible       |
| AC-SH-03 | Active route has accent-colored icon and left border                 |
| AC-SH-04 | Sign-out clears session, redirects to `/auth/login`, shows toast     |
| AC-SH-05 | Mobile (< 768px): sidebar hidden by default, hamburger opens overlay |
| AC-SH-06 | User display name and initials avatar visible in expanded sidebar    |
| AC-SH-07 | SSR: sidebar renders collapsed, no JavaScript errors                 |
| AC-SH-08 | Dark theme applied: `bg-base` background, white text                 |

### N.2 Dashboard

| ID       | Criterion                                                                         |
| -------- | --------------------------------------------------------------------------------- |
| AC-DB-01 | Welcome header shows user's display name and current date                         |
| AC-DB-02 | Plan card shows plan name, usage bar with `{usedGps}/{maxGps}`                    |
| AC-DB-03 | Device grid shows one card per bound device                                       |
| AC-DB-04 | Each device card shows IMEI, status pill, last seen, speed (or "Sin dato")        |
| AC-DB-05 | Clicking "Mapa" on device card navigates to `/app/map`                            |
| AC-DB-06 | Clicking "Telemetria" on device card navigates to `/app/devices/{imei}/telemetry` |
| AC-DB-07 | Empty state shows when user has no devices, with bind CTA                         |
| AC-DB-08 | Loading state shows skeleton cards                                                |
| AC-DB-09 | Error state shows error message with retry button                                 |

### N.3 Map

| ID       | Criterion                                                           |
| -------- | ------------------------------------------------------------------- |
| AC-MP-01 | Map fills entire content area (viewport minus sidebar width)        |
| AC-MP-02 | Device switcher shows active device IMEI + status pill              |
| AC-MP-03 | Clicking device switcher opens dropdown with all devices            |
| AC-MP-04 | Selecting device in switcher centers map and updates all panels     |
| AC-MP-05 | Time filter pills switch between 1H, HOY, 7D, MES, custom           |
| AC-MP-06 | Polling badge shows "ACTUALIZANDO - cada 30s" with pulsing dot      |
| AC-MP-07 | Map controls: center button re-centers on active device             |
| AC-MP-08 | Active device marker has pulsating CSS animation                    |
| AC-MP-09 | Right panel shows device IMEI, status, metrics, coordinates         |
| AC-MP-10 | Right panel Eventos tab shows event timeline for active device      |
| AC-MP-11 | Right panel Recorridos tab shows trip list for active device        |
| AC-MP-12 | Bottom status bar shows speed, coordinates, heading, last seen      |
| AC-MP-13 | No devices: map centered on Colombia, right panel shows empty state |
| AC-MP-14 | Polling refreshes data every 30s without blocking UI                |
| AC-MP-15 | Clicking marker on map sets that device as active                   |
| AC-MP-16 | Right panel collapse button hides panel, map expands                |
| AC-MP-17 | Mobile: right panel is a full overlay, not inline                   |

### N.4 Devices

| ID       | Criterion                                                         |
| -------- | ----------------------------------------------------------------- |
| AC-DV-01 | Devices displayed as card grid (not table)                        |
| AC-DV-02 | Each card shows IMEI, status pill, binding date, last seen, speed |
| AC-DV-03 | Plan card shows usage bar and availability badge                  |
| AC-DV-04 | Empty slots shown as dashed placeholder cards                     |
| AC-DV-05 | Bind dialog opens, validates IMEI, submits correctly              |
| AC-DV-06 | Unbind dialog confirms, unbinds, refreshes list                   |
| AC-DV-07 | "Ver en mapa" navigates to `/app/map`                             |
| AC-DV-08 | "Telemetria" navigates to `/app/devices/{imei}/telemetry`         |
| AC-DV-09 | All existing error codes handled with friendly messages           |

### N.5 Telemetry

| ID       | Criterion                                                                |
| -------- | ------------------------------------------------------------------------ |
| AC-TL-01 | Breadcrumb shows Dispositivos > {IMEI} with link                         |
| AC-TL-02 | Device header shows IMEI, status pill, last seen                         |
| AC-TL-03 | Time presets include MES (last 30 days)                                  |
| AC-TL-04 | Map and trip list render side by side when trips exist                   |
| AC-TL-05 | Event timeline hides packetId/sessionId by default                       |
| AC-TL-06 | Expanding an event in timeline reveals technical details                 |
| AC-TL-07 | All existing telemetry functionality preserved (trips, events, fallback) |
| AC-TL-08 | Not-found state works for invalid IMEI                                   |
| AC-TL-09 | Time window changes trigger data refresh                                 |
| AC-TL-10 | Ignition-colored polyline segments render correctly                      |

### N.6 Account

| ID       | Criterion                                        |
| -------- | ------------------------------------------------ |
| AC-AC-01 | Initials avatar renders from user name           |
| AC-AC-02 | Profile card shows name, email                   |
| AC-AC-03 | Plan card shows plan name, code, usage bar       |
| AC-AC-04 | "Ir a Mis Dispositivos" link navigates correctly |
| AC-AC-05 | Refresh profile action re-fetches from API       |
| AC-AC-06 | Roles displayed as tags                          |

### N.7 Cross-Cutting

| ID       | Criterion                                                         |
| -------- | ----------------------------------------------------------------- |
| AC-CC-01 | All views render without SSR errors                               |
| AC-CC-02 | All views have loading, empty, and error states                   |
| AC-CC-03 | Dark theme consistent across all views                            |
| AC-CC-04 | Syne font used for UI labels, Space Mono for data                 |
| AC-CC-05 | All icon-only buttons have aria-label                             |
| AC-CC-06 | Color contrast meets WCAG AA on dark backgrounds                  |
| AC-CC-07 | `ChangeDetectionStrategy.OnPush` on all presentational components |
| AC-CC-08 | Feature modules lazy-loaded                                       |
| AC-CC-09 | No `any` types in new components                                  |
| AC-CC-10 | All components use separate `.ts`, `.html`, `.scss` files         |

---

## Appendix: Backend Data Availability Matrix

This matrix documents which data points from the HTML mockup are available from existing backend APIs and which are NOT.

### Available Today

| Data Point               | Source                                        | Endpoint                                              |
| ------------------------ | --------------------------------------------- | ----------------------------------------------------- |
| User name                | `CurrentUserDto.fullName`                     | `GET /api/me`                                         |
| User email               | `CurrentUserDto.email`                        | `GET /api/me`                                         |
| Plan name                | `CurrentUserDto.planName`                     | `GET /api/me`                                         |
| Plan code                | `CurrentUserDto.planCode`                     | `GET /api/me`                                         |
| GPS used / max           | `CurrentUserDto.usedGps`, `maxGps`            | `GET /api/me`                                         |
| Roles                    | `CurrentUserDto.roles`                        | `GET /api/me` (+ JWT)                                 |
| Device IMEI              | `UserDeviceBindingDto.imei`                   | `GET /api/me/devices`                                 |
| Device binding date      | `UserDeviceBindingDto.boundAtUtc`             | `GET /api/me/devices`                                 |
| Last seen timestamp      | `TelemetryDeviceSummaryDto.lastSeenAtUtc`     | `GET /api/me/telemetry/devices`                       |
| Protocol                 | `TelemetryDeviceSummaryDto.protocol`          | `GET /api/me/telemetry/devices`                       |
| Last message type        | `TelemetryDeviceSummaryDto.lastMessageType`   | `GET /api/me/telemetry/devices`                       |
| Active session ID        | `TelemetryDeviceSummaryDto.activeSessionId`   | `GET /api/me/telemetry/devices`                       |
| Last position (lat, lon) | `LastKnownPositionDto.latitude`, `.longitude` | `GET /api/me/telemetry/devices`                       |
| Speed (km/h)             | `LastKnownPositionDto.speedKmh`               | `GET /api/me/telemetry/devices`                       |
| Heading (degrees)        | `LastKnownPositionDto.headingDeg`             | `GET /api/me/telemetry/devices`                       |
| Ignition state           | `DevicePositionPointDto.ignitionOn`           | Positions endpoint (per point)                        |
| Position history         | `DevicePositionPointDto[]`                    | `GET /api/me/telemetry/devices/{imei}/positions`      |
| Events                   | `DeviceEventDto[]`                            | `GET /api/me/telemetry/devices/{imei}/events`         |
| Event code + severity    | `DeviceEventDto.eventCode`                    | Events endpoint                                       |
| Trip list                | `TripSummaryDto[]`                            | `GET /api/me/telemetry/devices/{imei}/trips`          |
| Trip detail + path       | `TripDetailDto`                               | `GET /api/me/telemetry/devices/{imei}/trips/{tripId}` |
| Trip max/avg speed       | `TripSummaryDto.maxSpeedKmh`, `.avgSpeedKmh`  | Trips endpoint                                        |
| Trip point count         | `TripSummaryDto.pointCount`                   | Trips endpoint                                        |

### NOT Available (Backend Gaps)

| Data Point                            | Mockup Reference                    | Impact                                                                      | Proposed Backend Feature                               |
| ------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------ |
| Device alias / name                   | Device switcher shows "Mi Vehiculo" | Must use IMEI as label everywhere                                           | `PATCH /api/me/devices/{imei}` with `alias` field      |
| Distance traveled (km)                | Summary card "15.3 km recorridos"   | Cannot show distance metric                                                 | Backend trip aggregation: sum of trip distances        |
| Time active today                     | Summary card implied                | Cannot show active time                                                     | Backend aggregation: sum of ignition-on periods        |
| Odometer / total distance             | Not shown but expected future       | No cumulative distance tracking                                             | Backend device stats endpoint                          |
| GSM signal strength                   | Status bar "GSM" indicator          | Cannot show signal quality                                                  | Telemetry enrichment from device protocol data         |
| GPS satellite count                   | Status bar "GPS sats"               | Cannot show satellite count                                                 | Telemetry enrichment from device protocol data         |
| Reverse geocoding (address)           | Implied by map apps                 | Cannot show human-readable address                                          | Integration with geocoding service (Nominatim, Google) |
| Alert definitions                     | Alert strip "Exceso de velocidad"   | No configurable alerts                                                      | Alert rules engine + `GET /api/me/alerts`              |
| Alert count / badge                   | Sidebar badge on "Alertas"          | No alert aggregation                                                        | Alert rules engine                                     |
| Real-time updates (WebSocket/SignalR) | "EN VIVO" badge                     | 30s polling only, no push                                                   | SignalR hub for position updates                       |
| Ignition state on last position       | Status bar ignition icon            | `ignitionOn` only on position history points, not on `LastKnownPositionDto` | Add `ignitionOn` to `LastKnownPositionDto`             |
| Device online/offline status          | Status pills                        | Frontend heuristic only (recency of `lastSeenAtUtc`)                        | Backend `isOnline` flag or last-heartbeat tracking     |

### Workarounds for Missing Data

| Missing Data              | Workaround in UI                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| Device alias              | Show IMEI in monospace. Tooltip: "Este es el identificador unico del dispositivo"         |
| Distance (km)             | Show trip count instead: "{n} recorridos". Omit km metric                                 |
| Time active               | Show last seen relative time: "hace {n}s". Omit duration metric                           |
| GSM / GPS sats            | Omit from status bar. Show only available metrics                                         |
| Alerts                    | Show event count by severity as proxy. Label as "Eventos" not "Alertas"                   |
| Reverse geocoding         | Show coordinates only. Consider client-side Nominatim call as COULD (rate-limited)        |
| Real-time                 | Show "ACTUALIZANDO - cada 30s" instead of "EN VIVO". Pulsing dot indicates active polling |
| Ignition on last position | Check most recent position point's `ignitionOn` from positions endpoint as fallback       |
| Online status             | Frontend heuristic: < 5 min = online, < 1h = recent, else offline                         |

---

_End of document._
