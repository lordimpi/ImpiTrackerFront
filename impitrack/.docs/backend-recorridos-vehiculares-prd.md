# PRD Backend: recorridos vehiculares para telemetria

## Estado del documento

- Este documento define un PRD backend especializado para recorridos como dependencia de producto.
- El PRD maestro en `.docs/product-source-of-truth-prd.md` es la fuente de verdad de alto nivel para framing, prioridades y release intent.
- Este documento no confirma por si solo que `trips` o `telemetry` esten liberados; define el contrato y comportamiento esperados para cerrar esa brecha.

## Resumen

La telemetria actual ya expone:

- resumen del dispositivo
- ultima posicion conocida
- historial de posiciones por ventana temporal
- eventos recientes

Eso permite ver puntos e historico dentro de un rango, pero no permite modelar un **recorrido** como entidad real con:

- inicio
- fin
- duracion
- mapa propio
- metricas del recorrido

Para la experiencia vehicular de carro/moto, el frontend necesita que backend exponga recorridos reales y no solo posiciones sueltas.

## Objetivo

Agregar soporte backend para recorridos vehiculares legibles por usuario y admin, sin delegar al frontend la inferencia de viajes.

## Problema actual

Hoy el frontend solo puede:

- mostrar la ultima ubicacion como punto
- dibujar una linea historica dentro de una ventana temporal

Pero no puede responder con claridad:

- cuando inicio un viaje
- cuando termino
- cuantos recorridos hubo en el dia
- que velocidad maxima/promedio tuvo cada recorrido

## Requerimiento funcional

Backend debe exponer recorridos como entidad de lectura de telemetria.

Cada recorrido debe tener identidad propia y poder consultarse por lista y detalle.

## Endpoints requeridos

### Usuario autenticado

- `GET /api/me/telemetry/devices/{imei}/trips?from&to&limit`
- `GET /api/me/telemetry/devices/{imei}/trips/{tripId}`

### Admin

- `GET /api/admin/users/{userId}/telemetry/devices/{imei}/trips?from&to&limit`
- `GET /api/admin/users/{userId}/telemetry/devices/{imei}/trips/{tripId}`

## Contratos minimos esperados

### TripSummaryDto

- `tripId`
- `imei`
- `startedAtUtc`
- `endedAtUtc`
- `pointCount`
- `maxSpeedKmh`
- `avgSpeedKmh`
- `startPosition`
- `endPosition`

### TripDetailDto

- `tripId`
- `imei`
- `startedAtUtc`
- `endedAtUtc`
- `pointCount`
- `maxSpeedKmh`
- `avgSpeedKmh`
- `pathPoints`
- `startPosition`
- `endPosition`
- `sourceRule` o criterio usado para armar el recorrido

### PositionPointDto

Puede reutilizar el shape actual de posiciones:

- `occurredAtUtc`
- `receivedAtUtc`
- `gpsTimeUtc`
- `latitude`
- `longitude`
- `speedKmh`
- `headingDeg`
- `packetId`
- `sessionId`

## Regla de construccion del recorrido

Backend debe definir explicitamente como se detecta inicio y fin.

Opciones validas:

- evento de ignicion / switch
- criterio de movimiento + inactividad
- regla hibrida basada en telemetria y eventos

Lo importante es que esa logica viva en backend y sea consistente.

Frontend no debe inferir recorridos por su cuenta.

## Reglas de comportamiento

- si no hay recorridos en la ventana: responder `200` con lista vacia
- si el IMEI no pertenece al usuario: `404 device_binding_not_found`
- si el usuario admin consulta un usuario inexistente: `404 user_not_found`
- mantener `ApiResponse<T>` como envelope

## Criterios de aceptacion

### Caso 1. Dispositivo con varios recorridos

- lista de recorridos devuelve multiples items
- cada item tiene inicio, fin y metricas basicas

### Caso 2. Recorrido en curso

- si el recorrido no ha terminado, `endedAtUtc` puede ser `null`
- el detalle debe seguir devolviendo `pathPoints` acumulados hasta el momento

### Caso 3. Ventana sin recorridos

- lista vacia
- sin error

### Caso 4. Seguridad

- usuario no puede consultar recorridos de IMEIs ajenos
- admin si puede dentro del contexto del usuario correcto

## Resultado esperado para frontend

Con estos endpoints el frontend podra construir una vista donde:

- la ultima ubicacion siga siendo un punto
- los recorridos aparezcan como opcion separada dentro del panel de mapa
- cada recorrido tenga su propio mapa y su propia informacion

## No objetivos

- no se pide tiempo real
- no se pide clustering
- no se pide dashboard analitico
- no se pide maestro de tipos de dispositivo en esta fase
