# Plan de ejecucion frontend post-MVP para IMPITrack

## Estado del documento

- Este documento es una referencia especializada de roadmap frontend post-MVP.
- El PRD maestro en `.docs/product-source-of-truth-prd.md` es la fuente de verdad de alto nivel del producto y de la narrativa de release.
- Este roadmap no reemplaza el PRD maestro y no debe leerse como confirmacion automatica de que `telemetry` ya este liberado en produccion; describe direccion, dependencias y cortes de implementacion.

## 1. Objetivo

Definir la hoja de ruta de frontend despues del cierre del MVP actual, priorizando experiencias de monitoreo reales sobre nuevas pantallas administrativas o analiticas.

Este documento funciona como base de conocimiento activa para las siguientes etapas del frontend y complementa al PRD maestro como referencia de planificacion especializada.

La prioridad inicial es evolucionar desde CRUD + toolbox operativa hacia:

- mapa de dispositivos,
- ultima posicion conocida,
- historial de posiciones,
- eventos del dispositivo,
- monitoreo usable para usuario dueno y Admin.

---

## 2. Estado actual del frontend

El MVP ya quedo cerrado con estas features:

- `auth`
- `account`
- `devices`
- `admin-users`
- `ops`

La aplicacion actual ya cuenta con:

- Angular 21 + SSR,
- arquitectura por `core`, `shared` y `features`,
- PrimeNG como base de UI,
- guards, interceptors y manejo de sesion,
- layouts publico y autenticado,
- compatibilidad SSR,
- soporte de `Recordar sesion`,
- toolbox operativa de `Ops`.

Restricciones vigentes a mantener:

- codigo en ingles,
- textos visibles y documentacion en espanol,
- componentes con archivos `.ts`, `.html` y `.scss` separados,
- arquitectura orientada por features,
- no sobreingenierizar estado global,
- no mezclar observabilidad tecnica con monitoreo funcional de usuario.

---

## 3. Objetivo del post-MVP

La siguiente etapa debe convertir a IMPITrack en una interfaz real de monitoreo, no solo en una consola de gestion y diagnostico.

### Audiencias iniciales

- Usuario dueno de dispositivos.
- Admin dentro del contexto de un usuario especifico.

### Fuera del primer corte post-MVP

- tiempo real con SignalR o WebSockets,
- dashboards analiticos,
- centro de alertas avanzado,
- mapa global multiusuario para Admin,
- geocercas,
- replay avanzado de recorridos.

---

## 4. Roadmap por fases

### Fase 6. Mapa y telemetria base

#### Objetivo

Entregar la primera experiencia funcional de monitoreo geoespacial y telemetrico.

#### Entregables frontend

- Nueva feature `telemetry`.
- Integracion de Leaflet.
- Nueva ruta `/app/map`.
- Nueva ruta `/app/devices/:imei/telemetry`.
- Nueva ruta `/admin/users/:id/devices/:imei/telemetry`.
- Mapa con ultima posicion conocida por dispositivo.
- Lista lateral de dispositivos con ultimo visto.
- Vista de detalle del dispositivo con:
  - mapa,
  - historial de posiciones,
  - eventos recientes,
  - filtro temporal.
- Polling controlado para ultima posicion.
- Estados vacios, carga y error completos.

#### Dependencias minimas de backend

El frontend depende de que backend exponga:

- `GET /api/me/telemetry/devices`
- `GET /api/me/telemetry/devices/{imei}/positions`
- `GET /api/me/telemetry/devices/{imei}/events`
- `GET /api/admin/users/{userId}/telemetry/devices`
- `GET /api/admin/users/{userId}/telemetry/devices/{imei}/positions`
- `GET /api/admin/users/{userId}/telemetry/devices/{imei}/events`

#### Definicion de terminado

- El usuario puede abrir un mapa con sus dispositivos.
- El usuario puede entrar al detalle de un IMEI y ver historial + eventos.
- Admin puede inspeccionar el monitoreo de un dispositivo dentro del contexto de usuario.
- La UI no inventa estados que backend no expone.
- El polling no rompe SSR ni degrada la experiencia.

---

### Fase 7. Recorridos reales y eventos enriquecidos

#### Objetivo

Agregar recorridos reales dentro del detalle del IMEI y hacer que los eventos del dispositivo se vuelvan legibles y utiles para operacion diaria.

#### Entregables frontend

- Vista de `Recorridos` dentro del detalle de telemetria.
- Lista de recorridos reales entregados por backend.
- Mapa propio por recorrido seleccionado.
- Resumen del recorrido: inicio, fin, puntos, velocidad maxima y promedio.
- Timeline visual del dispositivo.
- Filtros por tipo de evento.
- Estados visuales por categoria o severidad si backend lo soporta.
- Mejor presentacion de eventos frente a payloads crudos.
- Navegacion mas clara entre ultima ubicacion, recorridos y eventos.

#### Dependencias minimas de backend

El frontend depende de que backend exponga o estabilice:

- `GET /api/me/telemetry/devices/{imei}/trips`
- `GET /api/me/telemetry/devices/{imei}/trips/{tripId}`
- equivalentes admin dentro de `/api/admin/users/{userId}/telemetry/...`
- contratos de eventos con `eventCode` consistente,
- metadata suficiente para clasificar eventos,
- filtros por ventana temporal y tipo cuando aplique.

#### Definicion de terminado

- El usuario puede revisar recorridos reales sin depender de heuristicas del frontend.
- Admin puede inspeccionar recorridos y eventos dentro del contexto del usuario.
- El usuario entiende rapidamente que paso con su dispositivo.
- Admin puede revisar eventos sin depender de `Ops`.
- La UI ya no muestra solo evidencia tecnica; muestra contexto operativo.

---

### Fase 8. Tiempo real frontend

#### Objetivo

Actualizar mapa, estados y eventos en vivo sin recarga manual.

#### Entregables frontend

- Cliente de SignalR o WebSockets.
- Indicador visible de conexion en vivo.
- Actualizacion live del mapa.
- Actualizacion live de eventos del dispositivo.
- Estrategia de reconexion.
- Fallback controlado a polling.

#### Dependencias minimas de backend

El frontend depende de que backend exponga:

- canal en vivo autenticado,
- contratos de publicacion para posicion, estado y eventos,
- semantica clara para reconexion y mensajes iniciales.

#### Definicion de terminado

- El usuario ve actualizaciones sin refrescar la pagina.
- La UI tolera desconexiones temporales.
- La experiencia en vivo no degrada la claridad ni el rendimiento.

---

### Fase 9. Dashboards operativos y ejecutivos

#### Objetivo

Agregar vistas resumidas para operacion y lectura ejecutiva.

#### Entregables frontend

- Widgets de actividad por ventana temporal.
- Tarjetas de salud de flota.
- Resumen de eventos y dispositivos activos.
- Graficos solo sobre contratos estables.
- Dashboard separado de `Ops`.

#### Dependencias minimas de backend

El frontend depende de que backend exponga:

- endpoints agregados de metricas,
- ventanas temporales consistentes,
- datos listos para widgets y tendencias.

#### Definicion de terminado

- Existe una vista resumida util para lectura rapida.
- No se duplica la toolbox tecnica de `Ops`.
- Los graficos tienen base de datos confiable y entendible.

---

### Fase 10. Optimizacion y experiencia avanzada

#### Objetivo

Cerrar brechas de performance, accesibilidad y refinamiento visual para una etapa mas madura del producto.

#### Entregables frontend

- Revision del bundle inicial.
- Refinamiento responsive de pantallas densas.
- Mejoras avanzadas de accesibilidad.
- Ajustes de rendimiento en listas, mapas y polling.
- Estrategias de cache local cuando aporten valor.

#### Dependencias minimas de backend

El frontend depende de que backend mantenga:

- contratos estables,
- tiempos de respuesta razonables,
- consultas optimizadas para historiales y dashboards.

#### Definicion de terminado

- El frontend responde bien en pantallas complejas.
- El costo de carga inicial queda bajo control.
- La experiencia general se siente mas madura y robusta.

---

## 5. Arquitectura frontend esperada para post-MVP

### Feature principal nueva

```text
src/app/features/telemetry/
  pages/
  components/
  application/
  data-access/
  models/
```

### Principios

- `telemetry` debe ser una feature propia, no una extension desordenada de `devices` u `ops`.
- `Ops` se mantiene como toolbox tecnico.
- `telemetry` se orienta al monitoreo funcional del producto.
- Los componentes de mapa deben encapsular Leaflet y no filtrar logica tecnica a paginas grandes.
- Los facades de feature deben coordinar:
  - filtros temporales,
  - polling,
  - carga de posiciones,
  - carga de eventos,
  - estados visuales.

### Dependencias nuevas permitidas

- Leaflet en Fase 6.
- Cliente SignalR o similar en Fase 8.
- Libreria de graficos solo en Fase 9 y solo si los contratos backend ya estan estabilizados.

---

## 6. Pendientes frontend a tener en cuenta

### Alertas y eventos avanzados

- centro de alertas,
- bandeja operativa,
- timeline enriquecido,
- filtros por severidad,
- estados de lectura o resolucion.

### Tiempo real

- reconexion,
- stale state,
- degradacion controlada a polling,
- indicadores de sincronizacion.

### Dashboards

- vistas operativas,
- vistas ejecutivas,
- widgets,
- graficos,
- indicadores agregados.

### Mapa avanzado

- clustering,
- replay visual,
- mapa global admin,
- futuras capas como geocercas o zonas de interes.

### Performance y experiencia

- optimizacion de bundle,
- accesibilidad avanzada,
- refinamiento de mobile,
- tablas y listas densas,
- performance del mapa.

---

## 7. Orden recomendado de implementacion

1. Mapa y telemetria base.
2. Timeline y eventos enriquecidos.
3. Tiempo real frontend.
4. Dashboards operativos y ejecutivos.
5. Optimizacion y experiencia avanzada.

Este orden evita adelantar tiempo real o analitica antes de estabilizar primero la lectura funcional del monitoreo.

---

## 8. Criterios de priorizacion

Siempre priorizar:

1. valor visible al usuario,
2. monitoreo funcional real,
3. claridad visual,
4. consistencia de UX,
5. crecimiento escalable de la arquitectura,
6. rendimiento razonable,
7. tiempo real y analitica solo cuando la base ya sea estable.

---

## 9. Definicion de “post-MVP fase 6 lista”

La primera fase post-MVP se considera lista cuando:

- existe una feature `telemetry` operativa,
- el usuario puede ver sus dispositivos en mapa,
- el usuario puede consultar historial y eventos de un IMEI,
- Admin puede inspeccionar el monitoreo de un usuario,
- la experiencia funciona con polling,
- la UI mantiene estados claros y consistencia visual con el resto del producto.
