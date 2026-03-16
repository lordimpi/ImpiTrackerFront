# IMPITrack Product Source of Truth PRD

## 0. Document status

- This document is the high-level product source of truth for IMPITrack.
- It governs product framing, baseline, priorities, and release intent across `.docs`.
- Specialized documents remain valid for implementation detail, operational validation, or focused backend requirements.
- If a specialized document diverges, this PRD wins at the high-level framing layer until the specialized document is updated.

## 1. Purpose of this document

This document is the master product PRD for IMPITrack.

Its purpose is to unify the current product narrative, align frontend and backend expectations, and define the current product baseline without treating IMPITrack as an early MVP.

This document does not replace detailed implementation plans or backend PRDs. It establishes the high-level source of truth and points to specialized documents when more detail is needed.

## 2. Product context and vision

IMPITrack is a GPS monitoring and telemetry product for operational tracking of devices and vehicles.

The product is no longer framed as a speculative MVP. The documented state already reflects a post-foundation product with:

- authenticated user flows,
- device ownership and management,
- admin operations,
- TCP ingestion observability,
- SSR-compatible Angular frontend architecture,
- an active transition toward monitoring-centric telemetry experiences.

The product vision is to provide a serious operational platform where users and administrators can:

- manage device ownership and access safely,
- validate ingest and device health quickly,
- monitor location and telemetry with confidence,
- diagnose pipeline issues without relying on backend-only tools,
- evolve toward richer monitoring, trips, live updates, and operational dashboards.

## 3. Problem IMPITrack solves

Teams operating GPS trackers need more than raw socket evidence. They need a product that connects the full chain from device ownership to operational monitoring.

Without a unified product surface, common failures become ambiguous:

- a tracker may send data but not produce valid telemetry,
- support may see TCP activity but users may not see positions,
- admins may need technical tools while end users need understandable monitoring views,
- roadmap decisions may drift if frontend, backend, and operations optimize for different truths.

IMPITrack solves this by combining:

- account and device ownership management,
- admin control surfaces,
- technical observability for ingestion and parsing,
- user-facing telemetry and map experiences,
- a product architecture that keeps technical diagnostics separate from functional monitoring.

## 4. Primary users and actors

### 4.1 End user

Owns one or more GPS devices and needs to:

- authenticate securely,
- bind devices to their account,
- inspect device state,
- monitor last known position and telemetry history,
- understand trips and relevant events without reading raw technical payloads.

### 4.2 Admin

Operates the platform across users and devices and needs to:

- inspect users,
- manage plans,
- bind and unbind devices for users,
- access operational diagnostics,
- review telemetry in the context of a specific user.

### 4.3 Operations / support / QA

Needs to:

- verify TCP ingress,
- inspect raw packets,
- validate parse outcomes,
- troubleshoot discrepancies between ingest and telemetry,
- run controlled simulations and E2E checks.

### 4.4 Backend and frontend teams

Need a shared contract for:

- what the product already supports,
- which capabilities are considered active versus planned,
- which backend dependencies gate each stage,
- what release readiness means.

## 5. Product goals

The current product goals are:

- provide a stable authenticated operational frontend for IMPITrack,
- support self-service device ownership and admin control flows,
- expose technical observability of the TCP pipeline through the product UI,
- deliver monitoring experiences that are understandable to non-technical users,
- keep frontend and backend contracts aligned as telemetry matures,
- preserve SSR safety, maintainability, and feature-oriented architecture.

## 6. Source hierarchy and related documents

This PRD is the high-level source of truth.

Supporting documents remain valid and should be read as specialized references:

- `.docs/frontend-mvp-plan.md`: original frontend foundation and MVP closure baseline.
- `.docs/frontend-post-mvp-plan.md`: frontend roadmap after the baseline admin/devices/ops closure.
- `.docs/telemetry-release-status.md`: specialized telemetry release-status companion clarifying what is Released, In Active Validation, and Planned / Not Committed.
- `.docs/backend-recorridos-vehiculares-prd.md`: backend requirements for trips as a first-class telemetry entity.
- `.docs/backend-validacion-trackers-invalidos-prd.md`: backend requirements to make invalid tracking visible and non-ambiguous.
- `.docs/gps-simulacion-popayan.md`: operational simulation and validation flow for telemetry and trips.
- `.docs/*.ps1`: environment-specific simulation scripts used for QA and troubleshooting.

If a detailed document conflicts with this PRD, this PRD governs product framing and release intent, while the specialized document governs implementation detail until explicitly updated.

## 7. Current product baseline

### 7.1 Product maturity statement

IMPITrack should be treated as a product in active post-MVP evolution, not as an unreleased concept.

The documented baseline already includes a functional product core composed of account, admin, and ops capabilities. Telemetry and monitoring are the primary growth axis from this point onward.

### 7.2 Current documented capabilities

The current documented and/or expected active product surface includes:

- authentication flows: register, verify email, login, refresh, revoke,
- current-user profile access,
- self-service device binding and unbinding,
- per-user device listing,
- admin user listing and detail,
- admin plan management,
- admin device ownership actions,
- ops toolbox for raw packets, parse visibility, active sessions, and ingestion ports,
- frontend architecture with Angular 21, SSR, PrimeNG, guards, interceptors, and feature-based structure,
- documented telemetry routes and validation flows for map, device telemetry detail, and trips-oriented testing.

### 7.3 Current product narrative by capability area

#### A. Identity and access

This area is considered foundational and established.

Expected outcome:

- users can authenticate and manage their session,
- protected routes and role boundaries exist,
- the frontend does not depend on direct broker access.

#### B. Device ownership and administration

This area is part of the stable operational baseline.

Expected outcome:

- users manage their own linked devices,
- admins manage user plans and device ownership,
- ownership context determines access to telemetry and operational data.

#### C. Ops and technical observability

This area is part of the current product baseline and remains strategically important.

Expected outcome:

- support and QA can inspect raw ingestion evidence,
- parse outcomes are visible or expected to become visible enough to explain telemetry gaps,
- troubleshooting does not depend exclusively on Postman or internal logs.

#### D. Telemetry and monitoring

This area is the active product expansion front.

The documentation indicates a product direction centered on:

- map-based monitoring,
- last known position,
- position history,
- events,
- trips as a first-class experience,
- later evolution to live updates and dashboards.

This means telemetry is not optional future exploration; it is the main product capability being hardened and expanded after the baseline closure.

## 8. Current scope and active capabilities

The current product scope should be treated as two layers.

### 8.1 Baseline layer: established product capability

- auth and session handling,
- account/profile access,
- self-service device ownership flows,
- admin user and plan operations,
- technical ops visibility,
- SSR-safe frontend foundation.

### 8.2 Monitoring layer: active product capability under expansion

- telemetry-oriented routes and UI flows are already part of the product direction,
- map and device telemetry views are operational targets with documented validation paths,
- trips and invalid-tracker observability are documented backend dependencies to reduce ambiguity and improve user trust.

This framing avoids a contradiction:

- the product is post-MVP,
- the baseline is already beyond CRUD-only planning,
- telemetry is the next serious product surface being stabilized rather than a vague idea.

## 9. Out of scope or not closed yet

The following items are not considered closed product capabilities yet:

- globally polished real-time telemetry via SignalR or WebSockets,
- executive dashboards backed by stable aggregate contracts,
- advanced alert center and alert workflows,
- geofences and advanced map layers,
- global multi-user monitoring map for admin outside explicit user context,
- advanced trip replay and richer fleet analytics,
- any frontend behavior that invents telemetry semantics not backed by API contracts.

These may exist as roadmap targets or experiments, but they are not the default readiness baseline for the product today.

## 10. Backend and operational dependencies

### 10.1 Core backend dependencies

The frontend depends on API contracts for:

- auth and session lifecycle,
- current user profile,
- user-device ownership,
- admin user and plan management,
- ops raw packet and ingestion observability.

### 10.2 Telemetry backend dependencies

Telemetry maturity depends on backend support for:

- telemetry device summaries,
- last known position,
- position history by time window,
- recent events,
- user-scoped and admin-scoped telemetry routes,
- trip list and trip detail contracts,
- clear parse status and parse error semantics for malformed tracking payloads.

### 10.3 Operational environment dependencies

Current operational validation depends on:

- frontend application,
- backend API,
- TCP server,
- EMQX in development scenarios documented today,
- valid IMEI binding before simulation,
- simulation scripts and environment-specific local values.

### 10.4 Dependency principle

The frontend must remain decoupled from internal backend implementation details, but not from backend truth.

In practice this means:

- Angular does not connect directly to EMQX,
- telemetry semantics must come from API contracts,
- frontend must not infer trips or hide invalid data silently,
- technical ambiguity must be surfaced before decorative UX is added.

## 11. Immediate roadmap and priorities

### Priority 1. Stabilize telemetry as a trustworthy product surface

The highest-value near-term work is to make monitoring reliable, understandable, and contract-backed.

This includes:

- map and telemetry base experience,
- last known position and history clarity,
- events that are readable to users and admins,
- SSR-safe polling and refresh behavior.

### Priority 2. Make trips first-class

Trips are a required product step because they turn raw history into operational meaning.

This depends on backend-owned trip construction and frontend consumption of explicit trip entities.

### Priority 3. Eliminate ambiguity for invalid tracking

If raw traffic is accepted but telemetry is unusable, the product must explain why.

This is critical for:

- support efficiency,
- QA confidence,
- user trust,
- avoiding false blame on the frontend.

### Priority 4. Introduce live updates only after telemetry truth is stable

Real-time matters, but only after base telemetry is semantically reliable.

### Priority 5. Add dashboards only after operational contracts are stable

Dashboards should summarize reality, not compensate for missing telemetry semantics.

## 12. Release and readiness criteria

### 12.1 Product baseline readiness

The product baseline is considered ready when:

- auth and session flows work against the real API,
- users can manage device ownership safely,
- admins can operate user/device/plan flows,
- ops surfaces expose enough technical truth for troubleshooting,
- SSR-safe navigation and route protection remain intact,
- loading, empty, and error states exist on critical screens.

### 12.2 Telemetry readiness for a serious release increment

A telemetry-focused increment should not be considered ready until:

- device ownership context is respected in telemetry routes,
- last known position and history are visible through stable contracts,
- malformed tracking does not appear as healthy telemetry,
- trips are either explicitly unsupported in the release notes or contract-backed and visible,
- manual validation exists for ingest -> ops -> telemetry -> UI flow,
- the product explains missing telemetry with evidence rather than silence.

### 12.3 Documentation readiness

For any release increment, documentation is only considered ready when:

- this PRD still matches the real product framing,
- specialized frontend/backend docs still map to the active roadmap,
- environment-specific guides are marked as local/dev-only where applicable,
- major known gaps are explicit rather than implied.

## 13. Risks and assumptions

### 13.1 Risks

- documentation drift between frontend roadmap, backend PRDs, and actual implementation,
- local simulation scripts becoming stale due to hard-coded ports, hosts, IMEIs, or file paths,
- telemetry UX overpromising meaning before backend contracts are mature,
- confusion between technical ops visibility and user-facing monitoring,
- SSR regressions if browser-only behavior is introduced carelessly,
- release ambiguity if trips and invalid-tracker behavior are not defined consistently.

### 13.2 Assumptions

- backend remains the authoritative source for telemetry meaning,
- Angular frontend continues using SSR-safe patterns,
- PrimeNG remains the primary UI component base,
- feature-oriented architecture remains the expected frontend structure,
- monitoring value will drive roadmap priority over new admin-only screens.

## 14. UX and architecture principles

### 14.1 UX principles

- operational clarity over decorative complexity,
- readable states for loading, empty, error, and success,
- separate technical diagnostics from end-user monitoring,
- map and telemetry screens must explain device state quickly,
- avoid inventing labels or statuses unsupported by backend truth,
- prioritize scanning speed and confidence for operational users.

### 14.2 Frontend architecture principles

- Angular standalone components with separate `.ts`, `.html`, and `.scss` files,
- `core`, `shared`, and `features` boundaries remain explicit,
- telemetry lives in its own feature rather than leaking into unrelated modules,
- local feature state with Signals and RxJS where appropriate,
- SSR compatibility is mandatory,
- no direct frontend integration with EMQX.

### 14.3 Product architecture principle

The product should expose a layered truth model:

- ownership and access,
- operational ingest evidence,
- telemetry meaning,
- higher-level user understanding such as trips and later dashboards.

Each layer must build on the previous one without pretending missing layers already exist.

## 15. Success metrics and signals

Initial success should be evaluated with practical signals, not vanity metrics.

### 15.1 Product signals

- users can complete auth and device binding without external support,
- admins can resolve common user/device issues from the product UI,
- telemetry views show positions for valid trackers with predictable refresh behavior,
- support can distinguish invalid tracking from frontend failure,
- trips become understandable without frontend heuristics.

### 15.2 Operational signals

- reduced dependence on Postman or direct database inspection for common troubleshooting,
- faster diagnosis when packets appear in raw but not in telemetry,
- fewer ambiguous support reports about "map not working" when parse failure is the real cause,
- stable validation flow using the documented simulation sequence.

### 15.3 Engineering signals

- no critical SSR regressions in monitoring features,
- stable contract alignment between frontend and backend,
- roadmap work lands in the correct feature boundaries,
- release discussions use one consistent product framing.

## 16. Open decisions

The following decisions remain open or need explicit confirmation as the product matures:

- what exact telemetry capabilities are already released versus only validated in active development environments,
- when trips move from backend PRD to default release expectation,
- the final contract and UX semantics for telemetry events,
- when real-time becomes a release requirement instead of a roadmap item,
- how far admin monitoring should go outside per-user context,
- which local simulation assumptions should be converted into environment-agnostic tooling or docs.

## 17. Recommended product stance going forward

IMPITrack should now be described as:

- a production-oriented GPS monitoring platform in active post-MVP expansion,
- already grounded in identity, device ownership, admin operations, and ingest observability,
- currently prioritizing telemetry trust, trips, and user-facing monitoring maturity,
- intentionally sequencing live updates and dashboards after telemetry truth is stabilized.

That framing is consistent with the existing documents without freezing the product in outdated MVP language.
