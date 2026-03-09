# AGENTS.md

## Propósito del repositorio
Este repositorio contiene únicamente el frontend de IMPITrack.

IMPITrack es una plataforma de monitoreo GPS y telemetría en tiempo real. El frontend debe ofrecer una interfaz moderna, clara, operativa y mantenible para monitoreo de dispositivos, mapas, eventos, alertas y vistas relacionadas con telemetría.

Este repositorio no contiene la lógica principal de negocio del backend. El frontend debe consumir contratos existentes y mantenerse desacoplado de los detalles internos de implementación del backend.

---

## Objetivo principal
Construir una aplicación frontend profesional, escalable y mantenible usando Angular moderno, con fuerte énfasis en:

- UI usable y concreta
- dashboards operativos limpios
- mantenibilidad
- claridad visual
- separación clara de responsabilidades
- rendimiento razonable
- crecimiento incremental

Prioriza pantallas concretas y utilizables por encima de abstracciones innecesarias o sobreingeniería teórica.

---

## Contexto técnico actual
Este proyecto es una aplicación Angular 21 con SSR habilitado.

La estructura principal actual incluye:

- código fuente en `src/`
- archivos raíz de la app en `src/app/`
- puntos de entrada del navegador en `src/main.ts` y `src/index.html`
- puntos de entrada SSR en `src/main.server.ts` y `src/server.ts`
- assets estáticos en `public/`
- salida de build en `dist/`

No edites manualmente archivos generados en `dist/`.

---

## Stack esperado
- Angular 21
- componentes standalone de Angular
- Angular Signals cuando aporten claridad
- RxJS cuando sea necesario
- PrimeNG para componentes de UI
- Leaflet para funcionalidades de mapa
- SCSS para estilos
- lazy loading por feature
- Reactive Forms para formularios
- código frontend compatible con SSR

---

## Prioridades del repositorio
1. UI usable y concreta
2. claridad visual
3. mantenibilidad
4. consistencia
5. separación de responsabilidades
6. seguridad SSR
7. rendimiento razonable
8. estructura frontend escalable

No priorices abstracciones ingeniosas por encima de una pantalla funcional y clara.

---

## Reglas generales de trabajo
Antes de hacer cambios no triviales:

- entiende el flujo actual
- identifica el alcance real del cambio
- propone un enfoque breve si la tarea afecta varias pantallas, varios componentes o varias capas
- prefiere cambios pequeños, localizados y verificables

Para tareas medianas o grandes:

- usa plan mode
- divide el trabajo en pasos concretos
- implementa de forma incremental
- evita rediseños amplios salvo que se pidan explícitamente

No hagas grandes refactors fuera del alcance solicitado.
No renombres archivos, carpetas, símbolos o rutas sin necesidad real.
No reorganices grandes secciones de la app salvo que la tarea lo requiera explícitamente.

---

## Regla estricta para templates y estilos
No se permite HTML inline en este proyecto.

Todos los componentes deben usar archivos separados:

- `.component.ts`
- `.component.html`
- `.component.scss`

No uses `template` inline.
No uses `styles` inline.
No generes componentes con HTML embebido dentro de archivos TypeScript salvo que el usuario lo pida explícitamente.

Esta regla es obligatoria incluso para componentes pequeños, salvo que el usuario diga lo contrario.

---

## Estilo de arquitectura frontend
Usa una arquitectura frontend orientada por features.

Usa la siguiente estructura conceptual:

- `core/` para preocupaciones globales y transversales
- `shared/` para piezas reutilizables y neutrales al dominio
- `features/` para módulos funcionales y de negocio

Dentro de cada feature, usa esta separación cuando tenga sentido:

- `pages/`
- `components/`
- `application/`
- `data-access/`
- `models/`

### Definición de capas

#### `core/`
Contiene elementos globales como:

- configuración global de la app
- guards
- interceptors
- layout principal
- manejo de sesión
- shell de navegación
- servicios transversales

No conviertas `core` en un cajón de sastre.

#### `shared/`
Contiene piezas reutilizables y neutrales al dominio, por ejemplo:

- bloques genéricos de UI
- pipes
- directivas
- utilidades
- tipos compartidos

Si algo pertenece claramente a una feature, mantenlo dentro de esa feature.

#### `features/`
Contiene el comportamiento real de la aplicación, por ejemplo:

- dashboard
- devices
- map
- telemetry
- alerts
- settings
- auth

Cada feature debe ser lo más autocontenida posible dentro de lo razonable.

---

## Organización esperada por feature

### `pages/`
Pantallas completas a nivel de ruta o vista principal.

Ejemplos:
- páginas de dashboard
- páginas de listados
- páginas de detalle
- pantallas de monitoreo
- formularios grandes

Las páginas son componentes smart/container.

### `components/`
Piezas visuales específicas de una feature, como:

- tablas
- filtros
- paneles laterales
- cards
- badges
- toolbars
- widgets

No muevas algo a `shared` si solo se usa en una feature.

### `application/`
Coordina el comportamiento de la feature.

Puede contener:

- facades
- estado local
- signals
- view models
- coordinación de filtros
- orquestación UI/datos

No coloques lógica fuerte de orquestación directamente dentro de páginas o componentes presentacionales.

### `data-access/`
Contiene acceso a datos externos, por ejemplo:

- servicios HTTP
- clientes SignalR si hacen falta
- adaptadores
- mapeadores DTO
- normalización de respuestas

La UI no debe depender directamente de respuestas crudas del backend si eso perjudica la mantenibilidad.

### `models/`
Contiene tipos de la feature, por ejemplo:

- DTOs
- modelos request/response
- filtros
- view models
- interfaces internas de la feature

---

## Convenciones de diseño de componentes
Prefiere una separación clara entre:

- componentes smart/container
- componentes presentacionales

### Componentes smart / container
Responsables de:

- conectar datos
- coordinar facades o estado local
- manejar navegación
- orquestar servicios
- pasar datos a componentes hijos

### Componentes presentacionales
Responsables de:

- renderizar UI
- recibir `input()`
- emitir `output()`
- mantenerse simples y enfocados

No coloques acceso HTTP, lógica SignalR u orquestación dentro de componentes visuales pequeños.

---

## Convenciones Angular
Usa prácticas modernas de Angular de forma consistente:

- componentes standalone
- signals cuando simplifiquen el estado
- `ChangeDetectionStrategy.OnPush` cuando corresponda
- control flow moderno de Angular cuando sea compatible con el proyecto
- lazy loading por feature
- Reactive Forms para formularios
- tipado explícito

Evita:

- `any`
- lógica compleja en templates
- manipulación directa del DOM innecesaria
- componentes gigantes con demasiadas responsabilidades

---

## Reglas de PrimeNG
PrimeNG es la librería base de componentes UI.

Usa PrimeNG para:

- tablas
- formularios
- filtros
- sidebars
- diálogos
- dropdowns
- menús
- cards
- tabs
- overlays

No reinventes piezas base de UI que PrimeNG ya resuelve bien.

No abuses de PrimeNG si una solución más simple y clara es mejor.

Mantén consistencia visual entre tablas, paneles, filtros, overlays y acciones del usuario.

---

## Reglas de Leaflet
El uso de Leaflet debe mantenerse encapsulado y ordenado.

La lógica de mapa no debe quedar dispersa en toda la aplicación.

Cuando trabajes con mapas:

- mantén la lógica del mapa dentro de la feature correspondiente
- separa el render del mapa de la orquestación de datos
- organiza capas, marcadores, popups y eventos de forma clara
- evita mezclar orquestación de telemetría dentro de componentes visuales no relacionados

No coloques lógica grande de mapa directamente dentro de páginas de ruta si puede separarse en componentes o facades.

---

## Estado y manejo de datos
Usa un enfoque simple y mantenible.

Enfoque preferido:

- estado local por feature
- facades por módulo cuando aporte valor
- Angular Signals para estado de UI y composición local
- RxJS donde realmente ayude con flujos async o streams

No introduzcas soluciones pesadas de estado global sin una justificación clara.

No uses NgRx o equivalentes salvo que exista una razón explícita.

Evita la sobreingeniería en manejo de estado.

---

## API y contratos
El código frontend debe consumir contratos existentes de forma clara y mantenible.

Reglas:

- no inventes estructuras cuando el backend ya define contratos claros
- si un contrato backend está incompleto, dilo explícitamente
- mapea DTOs a modelos de UI cuando sea útil
- no acoples la UI a respuestas frágiles del backend
- no ocultes inconsistencias del backend con hacks silenciosos sin dejarlo claro

Si un cambio afecta o rompe contratos esperados, indícalo explícitamente.

---

## Reglas SSR
Este proyecto usa SSR, por lo tanto la compatibilidad SSR importa.

Cuando hagas cambios:

- no asumas que APIs exclusivas del navegador están siempre disponibles
- protege el acceso a APIs del navegador cuando sea necesario
- revisa con cuidado los cambios de rutas
- revisa con cuidado `src/main.server.ts`, `src/server.ts` y configuración SSR relacionada
- trata cambios sensibles a SSR como cambios de alto impacto

No introduzcas comportamiento client-only sin considerar antes su impacto en SSR.

---

## UX y diseño visual
El frontend debe priorizar una experiencia operativa y clara.

### Principios visuales
- jerarquía visual clara
- buen espaciado
- layouts limpios
- dashboards operativos estilo SaaS
- información fácil de escanear
- foco en legibilidad
- responsividad razonable

### Estados de UI
Cuando aplique, incluye:

- estados de carga
- estados vacíos
- estados de error
- feedback de éxito
- estados deshabilitados

No dejes pantallas en blanco sin explicación.

### Evita
- UI sobrecargada
- demasiados paneles compitiendo entre sí
- estilos inconsistentes
- componentes genéricos innecesarios
- UI decorativa sin propósito
- ruido visual

---

## Formularios
Usa Reactive Forms.

Reglas:

- validaciones claras
- mensajes de error legibles
- nombres consistentes
- estructuras simples
- no coloques lógica compleja de validación directamente en el template

Separa construcción de formulario, reglas de validación y render cuando la complejidad lo justifique.

---

## Routing
Usa lazy loading por feature cuando corresponda.

Mantén el routing ordenado y legible.

No centralices toda la navegación en un solo archivo de rutas gigante si el proyecto crece.

Los archivos de rutas por feature son válidos y preferibles cuando mejoran la claridad.

---

## Nombres y consistencia
Usa nombres explícitos, simples y predecibles.

Ejemplos recomendados:

- `devices-list-page.component.ts`
- `device-detail-page.component.ts`
- `monitoring-dashboard-page.component.ts`
- `live-map.component.ts`
- `device-status-badge.component.ts`
- `devices.facade.ts`
- `devices-api.service.ts`
- `auth.routes.ts`

No uses nombres crípticos.
No uses abreviaciones innecesarias.

Sigue las reglas de formato del proyecto definidas en `.editorconfig` y `.prettierrc` cuando existan.

---

## Reglas de estilos
Usa SCSS en archivos separados por componente.

Reglas:

- mantén los estilos cerca del componente
- evita estilos globales innecesarios
- usa estilos globales solo para tokens, resets, themes y preocupaciones de layout realmente compartidas
- evita acoplar estilos entre features
- prefiere nombres de clase limpios y estilos bien estructurados

No uses estilos inline salvo que exista una razón muy específica y justificada.

---

## Rendimiento
Considera el rendimiento sin caer en optimización prematura.

Prácticas preferidas:

- lazy loading por feature
- evitar renders innecesarios
- usar tracking correcto en listas cuando aplique
- mantener componentes enfocados
- evitar recálculos costosos en templates
- evitar suscripciones manuales innecesarias

No optimices a ciegas sin una razón real.

---

## Testing y validación
Después de cambios relevantes:

- valida compilación
- valida el flujo visual principal
- valida estados de carga y error cuando aplique
- valida happy paths
- valida casos borde evidentes

Las pruebas unitarias viven junto al código como `*.spec.ts`.

Prefiere pruebas enfocadas usando Angular `TestBed` cuando se necesiten tests de componentes.

Ejecuta:

- `npm test`
- o `ng test`

antes de considerar el trabajo terminado, cuando apliquen tests.

No afirmes que algo funciona si no fue validado.
Si no fue posible validar, dilo claramente.

Como todavía no hay framework e2e configurado, documenta pasos de verificación manual para cambios visibles o sensibles a SSR.

---

## Comandos de build, ejecución y desarrollo
Usa estos comandos cuando sea necesario:

- `npm install` para instalar dependencias
- `npm start` o `ng serve` para levantar el servidor local
- `npm run build` para crear el build SSR de producción
- `npm run watch` para builds incrementales de desarrollo
- `npm test` o `ng test` para correr pruebas unitarias
- `npm run serve:ssr:impitrack` para servir el build SSR generado después de un build de producción

Trata cambios en build, routing y puntos de entrada SSR como cambios de mayor riesgo.

---

## Guía de commits y PRs
Usa mensajes de commit claros e imperativos.

Prefiere Conventional Commit, por ejemplo:

- `feat: add monitoring dashboard shell`
- `fix: correct SSR-safe map initialization`
- `refactor: simplify device filters panel`

Mantén cada commit enfocado en un cambio lógico.

Para resúmenes tipo PR o notas de handoff, incluye:

- resumen corto
- archivos afectados
- notas de testing
- capturas para cambios visibles cuando aplique
- notas SSR si corresponde

---

## Reglas de seguridad y configuración
No subas secretos ni credenciales específicas de entorno.

Ten cuidado con:

- archivos de entorno
- configuración SSR
- configuración de rutas
- puntos de entrada del servidor
- tokens o URLs embebidos en el código

No registres información sensible en la UI o en consola sin una buena razón.

---

## Qué evitar en este repositorio
Evita lo siguiente salvo que se pida explícitamente:

- HTML inline
- CSS inline
- refactors amplios fuera de alcance
- sobreingeniería
- componentes gigantes todopoderosos
- lógica de negocio enterrada dentro de componentes visuales
- uso indiscriminado de `any`
- hacks silenciosos
- dependencias nuevas innecesarias
- abstracciones prematuras
- componentes falsamente reutilizables que aumentan complejidad en vez de reducirla

---

## Cómo responder en tareas no triviales
Cuando el trabajo no sea trivial, estructura las respuestas así:

1. enfoque breve
2. archivos tocados
3. impacto visual o técnico
4. validación realizada o pendiente

Si existen varias opciones razonables:

- recomienda una
- justifícala brevemente
- no listes demasiadas alternativas sin tomar posición

---

## Comportamiento esperado del agente
Cuando se pida construir una pantalla o componente visual:

- prioriza un resultado concreto y usable
- entrega primero una base visible
- evita gastar demasiado tiempo en planificación o documentación innecesaria
- no conviertas una tarea visual en una discusión interminable de arquitectura abstracta

Cuando la tarea sea grande:

- propone un plan corto
- ejecuta por pasos
- mantén el alcance bajo control

Cuando falte contexto:

- indica que falta contexto
- continúa con la suposición más razonable
- no inventes requerimientos completos sin decirlo

---

## Regla final
Este frontend debe crecer con orden, claridad y criterio práctico.

Siempre prefiere:

- soluciones simples
- pantallas mantenibles
- límites claros de responsabilidad
- consistencia visual
- HTML y estilos separados de TypeScript
- arquitectura orientada por features
- resultados concretos por encima de teoría innecesaria
