# Telemetry Release Status

## Document status

- This document is a specialized release-status companion to `.docs/product-source-of-truth-prd.md`.
- The PRD master remains the high-level source of truth for product framing, priorities, and release intent.
- This document does not redefine telemetry scope. It only clarifies how current `.docs` evidence should be interpreted for release discussions.
- If a statement here is weaker than a source document, keep the weaker interpretation until the source evidence becomes explicit.

## Purpose

Telemetry is currently the biggest documentation ambiguity in IMPITrack.

The product clearly treats telemetry as a serious capability area, but the current docs do not cleanly separate:

- what is already released,
- what is being actively validated or hardened,
- what is still roadmap only.

This document makes that separation explicit without inventing certainty that the current docs do not support.

## Status model used in this document

### Confirmed Released

Use this only when there is combined evidence from current docs and shipped frontend code that the capability is part of the active product surface today.

### Recommended for Release Confirmation

Use this when docs and/or code strongly suggest the capability exists and is operational, but there is still no explicit release confirmation at product/environment level.

### In Active Validation

Use this when the docs show active implementation direction, validation flows, backend dependencies, or dev/QA evidence, but the capability still reads as hardening work rather than a confirmed release surface.

### Planned / Not Committed

Use this when the docs describe roadmap direction, later phases, or capabilities explicitly called out as not closed yet.

## Executive read

- Telemetry is already part of the active product surface, not speculative roadmap.
- The frontend codebase now gives stronger evidence for some telemetry capabilities than the docs alone did.
- The sharp line is not "telemetry yes/no"; it is capability by capability.
- Map entry, device telemetry detail, ownership-scoped access, last known position, and position history have enough code + doc evidence to treat them as Confirmed Released.
- Events, trips, and invalid-tracker clarity still need either release confirmation or active hardening language depending on the capability.
- Real-time telemetry, dashboards, advanced alerts, geofences, and advanced replay remain Planned / Not Committed.

## Capability decision matrix

| Capability                                                               | Status                               | Evidence / source                                                                                                                                                                                                                                                                                          | Operational read                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Telemetry as active product surface                                      | Confirmed Released                   | `.docs/product-source-of-truth-prd.md` sections 7.3.D, 8.2, 11                                                                                                                                                                                                                                             | Safe to describe telemetry as current product scope, but not to claim every telemetry sub-capability is equally mature.                                                                                                                                                                                                                                                  |
| Ownership-scoped telemetry access                                        | Confirmed Released                   | `.docs/product-source-of-truth-prd.md` sections 4.1, 4.2, 7.3.B, 12.2; `src/app/features/devices/devices.routes.ts`; `src/app/features/admin-users/admin-users.routes.ts`                                                                                                                                  | User and admin telemetry are implemented around explicit ownership/user context, not as open global monitoring.                                                                                                                                                                                                                                                          |
| User map entry `/app/map`                                                | Confirmed Released                   | `.docs/frontend-post-mvp-plan.md` phase 6; `.docs/gps-simulacion-popayan.md`; `src/app/app.routes.ts`; `src/app/core/layout/app-shell/app-shell.component.ts`; `src/app/features/telemetry/pages/telemetry-map-page.component.ts`                                                                          | Route, navigation entry, and page implementation exist. Docs also treat it as the validation destination for telemetry.                                                                                                                                                                                                                                                  |
| User device telemetry detail `/app/devices/:imei/telemetry`              | Confirmed Released                   | `.docs/frontend-post-mvp-plan.md` phase 6; `.docs/gps-simulacion-popayan.md`; `src/app/features/devices/devices.routes.ts`; `src/app/features/telemetry/pages/device-telemetry-page.component.ts`                                                                                                          | Safe to treat as shipped frontend surface for telemetry inspection by device.                                                                                                                                                                                                                                                                                            |
| Admin device telemetry detail `/admin/users/:id/devices/:imei/telemetry` | Confirmed Released                   | `.docs/frontend-post-mvp-plan.md` phase 6; `src/app/features/admin-users/admin-users.routes.ts`; `src/app/features/telemetry/pages/device-telemetry-page.component.ts`                                                                                                                                     | Admin monitoring exists, but only inside explicit user context.                                                                                                                                                                                                                                                                                                          |
| Device telemetry summaries / device list for monitoring                  | Recommended for Release Confirmation | `.docs/product-source-of-truth-prd.md` sections 7.2, 10.2; `.docs/backend-recorridos-vehiculares-prd.md` summary; `src/app/features/telemetry/data-access/telemetry-api.service.ts`; `src/app/features/telemetry/pages/telemetry-map-page.component.ts`                                                    | Code and docs strongly suggest this is live, but there is still no explicit release statement for environment-level availability.                                                                                                                                                                                                                                        |
| Last known position                                                      | Confirmed Released                   | `.docs/product-source-of-truth-prd.md` sections 10.2, 11.1, 12.2; `.docs/gps-simulacion-popayan.md`; `src/app/features/telemetry/pages/telemetry-map-page.component.ts`; `src/app/features/telemetry/pages/device-telemetry-page.component.ts`                                                             | Enough evidence to say the product already exposes last known position in map/detail flows.                                                                                                                                                                                                                                                                              |
| Position history by time window                                          | Confirmed Released                   | `.docs/product-source-of-truth-prd.md` sections 10.2, 11.1, 12.2; `.docs/gps-simulacion-popayan.md`; `src/app/features/telemetry/pages/device-telemetry-page.component.ts`; `src/app/features/telemetry/data-access/telemetry-api.service.ts`                                                              | History query and visualization are implemented. The polyline is segmented by ignition state and rendered in yellow (#f5c842) with black border stroke. Previous coloring (cyan for on, gray for off/unknown) was replaced during the UX redesign.                                                                                                                       |
| Telemetry events surface                                                 | Recommended for Release Confirmation | `.docs/product-source-of-truth-prd.md` sections 10.2, 11.1, 16; `.docs/frontend-post-mvp-plan.md` phases 6 and 7; `.docs/gps-simulacion-popayan.md`; `src/app/features/telemetry/pages/device-telemetry-page.component.ts`; `src/app/features/telemetry/components/telemetry-events-timeline.component.ts` | Events are implemented with explicit visual severity mapping: ACC_ON (success), ACC_OFF (secondary), PWR_ON (info), PWR_OFF (secondary), alarms (danger), heartbeat (success). Specific checks are ordered before generic ones (commit 23810f8). The PRD still leaves final event semantics open -- status stays until product confirms event meanings are communicable. |
| SSR-safe polling / refresh for map telemetry                             | Confirmed Released                   | `.docs/frontend-post-mvp-plan.md` phase 6; `.docs/gps-simulacion-popayan.md`; `src/app/features/telemetry/pages/telemetry-map-page.component.ts`                                                                                                                                                           | Browser-guarded polling plus manual refresh are implemented; this is stronger than a roadmap-only statement.                                                                                                                                                                                                                                                             |
| Trips / recorridos UI surface                                            | In Active Validation                 | `.docs/backend-recorridos-vehiculares-prd.md`; `.docs/product-source-of-truth-prd.md` sections 11.2, 12.2, 16; `.docs/gps-simulacion-popayan.md`; `src/app/features/telemetry/pages/device-telemetry-page.component.ts`; `src/app/features/telemetry/components/telemetry-trips-list.component.ts`         | Frontend and validation evidence exist, but the PRD still treats trips as the next product step rather than a fully closed default baseline.                                                                                                                                                                                                                             |
| Trip detail metrics and map                                              | In Active Validation                 | `.docs/backend-recorridos-vehiculares-prd.md`; `.docs/gps-simulacion-popayan.md`; `src/app/features/telemetry/components/telemetry-trip-summary.component.ts`; `src/app/features/telemetry/data-access/telemetry-api.service.ts`                                                                           | Clear implementation direction exists, but release intent is still gated by backend truth and product confirmation.                                                                                                                                                                                                                                                      |
| Invalid tracker parse visibility and non-ambiguous telemetry gaps        | In Active Validation                 | `.docs/backend-validacion-trackers-invalidos-prd.md`; `.docs/product-source-of-truth-prd.md` sections 11.3, 12.2, 16                                                                                                                                                                                       | This is still documented as a dependency to make telemetry trustworthy, not as a confirmed released capability.                                                                                                                                                                                                                                                          |
| Event semantics as stable product truth                                  | In Active Validation                 | `.docs/product-source-of-truth-prd.md` sections 11.1, 16; `.docs/frontend-post-mvp-plan.md` phase 7                                                                                                                                                                                                        | The UI can render events, but business meaning and UX semantics are still explicitly open.                                                                                                                                                                                                                                                                               |
| Globally polished real-time telemetry via SignalR or WebSockets          | Planned / Not Committed              | `.docs/product-source-of-truth-prd.md` sections 9 and 11.4; `.docs/frontend-post-mvp-plan.md` phase 8                                                                                                                                                                                                      | Explicitly sequenced after telemetry truth is stable.                                                                                                                                                                                                                                                                                                                    |
| Executive or operational dashboards based on stable aggregates           | Planned / Not Committed              | `.docs/product-source-of-truth-prd.md` sections 9 and 11.5; `.docs/frontend-post-mvp-plan.md` phase 9                                                                                                                                                                                                      | Explicitly out of current closed baseline.                                                                                                                                                                                                                                                                                                                               |
| Advanced alert center and alert workflows                                | Planned / Not Committed              | `.docs/product-source-of-truth-prd.md` section 9; `.docs/frontend-post-mvp-plan.md` pending items                                                                                                                                                                                                          | Not part of the current telemetry release baseline.                                                                                                                                                                                                                                                                                                                      |
| Geofences and advanced map layers                                        | Planned / Not Committed              | `.docs/product-source-of-truth-prd.md` section 9; `.docs/frontend-post-mvp-plan.md` pending items                                                                                                                                                                                                          | Roadmap only.                                                                                                                                                                                                                                                                                                                                                            |
| Global multi-user admin monitoring map outside explicit user context     | Planned / Not Committed              | `.docs/product-source-of-truth-prd.md` sections 9 and 16; `.docs/frontend-post-mvp-plan.md` out-of-scope notes                                                                                                                                                                                             | Still intentionally outside committed scope.                                                                                                                                                                                                                                                                                                                             |
| Advanced trip replay and richer fleet analytics                          | Planned / Not Committed              | `.docs/product-source-of-truth-prd.md` section 9; `.docs/frontend-post-mvp-plan.md` phases 9 and 10                                                                                                                                                                                                        | Direction exists, commitment does not.                                                                                                                                                                                                                                                                                                                                   |

## Decision view by status

### Confirmed Released

- Telemetry as active product surface
- Ownership-scoped telemetry access
- User map entry `/app/map`
- User device telemetry detail `/app/devices/:imei/telemetry`
- Admin device telemetry detail `/admin/users/:id/devices/:imei/telemetry`
- Last known position
- Position history by time window
- SSR-safe polling / refresh for map telemetry

### Recommended for Release Confirmation

- Device telemetry summaries / device list for monitoring
- Telemetry events surface

Interpretation:

- These capabilities look implemented and usable.
- What is still missing is explicit confirmation that product wants to describe them as formally released across target environments.

### In Active Validation

- Trips / recorridos UI surface
- Trip detail metrics and map
- Invalid tracker parse visibility and non-ambiguous telemetry gaps
- Event semantics as stable product truth

Interpretation:

- There is real evidence of active implementation or validation.
- But these still depend on backend hardening, product semantics, or explicit release intent before they should be spoken about as closed release scope.

### Planned / Not Committed

- Real-time telemetry
- Dashboards
- Advanced alerts
- Geofences and advanced map layers
- Global multi-user admin monitoring outside explicit user context
- Advanced trip replay and richer analytics

## Decision required

- `Device telemetry summaries / device list for monitoring`: confirm whether product wants to treat `/api/me/telemetry/devices` + `/app/map` list behavior as officially released, not just implemented and validated.
- `Telemetry events surface`: decide whether the product should already communicate events as released capability, or keep them under release confirmation until event semantics are documented.
- `Trips / recorridos`: decide when trips move from active validation to default release expectation. Current PRD language still treats them as the next serious step, not fully closed baseline.
- `Invalid tracker parse visibility`: confirm whether backend already exposes parse failure evidence end-to-end, or whether this remains a hardening dependency before release claims are made.
- `Event semantics as stable product truth`: define what events mean for end users versus admin/support so the UI is not "implemented but semantically fuzzy".

## Proposed product decisions ready for validation

These are recommendations for product/ops review based on the current `.docs` evidence.

They are intentionally written as proposed decisions, not as external confirmations already obtained.

| Capability                                              | Recommended status                   | Why now                                                                                                                                         | Blocking condition                                                                                                               | Suggested decision owner |
| ------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Device telemetry summaries / device list for monitoring | Recommended for Release Confirmation | Docs and shipped frontend surface consistently point to `/api/me/telemetry/devices` + `/app/map` as active monitoring entry points.             | Product/ops must confirm this capability is part of the official release baseline in the target environments.                    | product                  |
| Telemetry events surface                                | Recommended for Release Confirmation | Events are already present in telemetry detail and validation flows, so leaving them undefined keeps release communication fuzzier than needed. | Product must approve which event semantics are safe to communicate now, even if richer categorization stays for later hardening. | product                  |
| Trips / recorridos                                      | In Active Validation                 | Frontend surface, validation scripts, and backend contract direction exist, but the master PRD still frames trips as the next serious step.     | Backend and ops must validate that trip list/detail contracts are stable enough to treat trips as default release scope.         | backend                  |
| Invalid tracker parse visibility                        | In Active Validation                 | This is the main trust gap between TCP ingress evidence and user-facing telemetry, so it needs an explicit go/no-go decision now.               | Backend must prove end-to-end parse failure visibility and non-ambiguous telemetry gaps before any release promotion.            | backend                  |

### Capability-by-capability recommendation

- `Device telemetry summaries / device list for monitoring`
  Recommended status: `Recommended for Release Confirmation`.
  Why now: current docs already treat map entry and telemetry device access as active product scope, so this is the lowest-effort capability to validate formally.
  Blocking condition: product/ops confirmation that environment-level availability matches the documented product baseline.
  Suggested decision owner: `product`.

- `Telemetry events surface`
  Recommended status: `Recommended for Release Confirmation`.
  Why now: the frontend already exposes events with explicit visual severity for ACC_ON, ACC_OFF, PWR_ON, PWR_OFF, alarms, and heartbeat (commit 23810f8). The product needs a cleaner stance than "implemented but maybe not communicable".
  Blocking condition: product confirmation of which event meanings are acceptable for release language right now.
  Suggested decision owner: `product`.

- `Trips / recorridos`
  Recommended status: `In Active Validation`.
  Why now: there is enough implementation and QA evidence to keep validating aggressively, but not enough release framing evidence to call it closed baseline.
  Blocking condition: backend-backed trip contracts and target-environment validation must be confirmed before promotion.
  Suggested decision owner: `backend`.

- `Invalid tracker parse visibility`
  Recommended status: `In Active Validation`.
  Why now: this is the clearest remaining telemetry trust risk and it directly affects support, QA, and user confidence.
  Blocking condition: backend must expose parse failure evidence clearly enough that missing telemetry is no longer ambiguous.
  Suggested decision owner: `backend`.

### Recommended validation stance

- Strongest recommendation to promote after external validation: `Device telemetry summaries / device list for monitoring`.
- Next strongest recommendation if product accepts current event semantics: `Telemetry events surface`.
- Keep `Trips / recorridos` and `Invalid tracker parse visibility` in `In Active Validation` until backend and ops close the hard evidence gap.

## Remaining ambiguities that are still open

- Exactly which environments and audiences product considers when saying a telemetry capability is "released".
- Whether device summaries and events should be promoted from `Recommended for Release Confirmation` to `Confirmed Released` after explicit product confirmation.
- When trips become default release expectation instead of an active dependency / hardening track.
- Whether invalid-tracker observability is already implemented end-to-end or still primarily a backend requirement document.

## Recommended documentation posture

- Use `.docs/product-source-of-truth-prd.md` for product framing and priority decisions.
- Use this document when someone asks "what telemetry is actually released vs being validated vs still roadmap?"
- Do not cite `.docs/gps-simulacion-popayan.md` as production release evidence; cite it as validation evidence only.
- Do not cite backend telemetry dependency PRDs as release proof; cite them as contract and hardening evidence.

## Minimum future update needed to reduce ambiguity further

This document can become materially sharper once one of these happens:

- product or ops explicitly confirms which capabilities in `Recommended for Release Confirmation` are part of the official release baseline,
- the PRD master resolves the open decisions in section 16 about released vs actively validated telemetry,
- backend and release notes explicitly confirm the state of trips and invalid-tracker observability.
