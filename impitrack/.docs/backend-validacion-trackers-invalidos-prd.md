# PRD Backend: validacion y observabilidad de trackers TCP mal formados

## Estado del documento

- Este documento define un PRD backend especializado para reducir ambiguedad entre ingreso TCP y telemetria util.
- El PRD maestro en `.docs/product-source-of-truth-prd.md` es la fuente de verdad de alto nivel para framing del producto y readiness.
- Este documento no debe interpretarse como evidencia de release cerrada de `telemetry`; describe una dependencia para que la experiencia sea confiable y no ambigua.

## Resumen

Hoy el listener TCP acepta y persiste frames `Tracking` aun cuando el payload viene mal formado y no puede transformarse en una posicion util para telemetria. Eso deja una experiencia ambigua:

- el socket responde `ON`
- `Ops > Raw` muestra actividad
- pero no aparece nada en mapa ni en historial de posiciones

El objetivo de este PRD es eliminar esa ambiguedad y hacer visible cuando un `Tracking` fue recibido pero no pudo parsearse de forma valida.

## Problema observado

Caso real reproducido con Coban:

- el servidor TCP recibe payloads `tracker`
- persiste `Raw` con `messageType=Tracking`
- responde `ACK ON`
- pero telemetria no obtiene `lastPosition` ni puntos historicos

En el caso analizado, la causa fue un payload mal formado por coordenadas con separador decimal incorrecto dentro de un CSV. El sistema hoy no deja suficientemente claro que el parseo de posicion fallo.

## Objetivo

Hacer que el backend diferencie claramente entre:

1. frame TCP recibido
2. raw persistido
3. tracking parseado correctamente
4. tracking invalido o no utilizable para telemetria

La meta no es dejar de guardar raw, sino evitar que un `Tracking` invalido se vea como si fuera funcional.

## Comportamiento esperado

### 1. Persistencia raw

- el raw packet se sigue guardando aunque el payload este mal formado
- `Ops > Raw` debe poder mostrar el payload exacto recibido

### 2. Resultado de parseo visible

Cuando un `Tracking` no pueda convertirse en una posicion valida, debe quedar registrado con:

- `parseStatus = Failed` o `Rejected`
- `parseError` descriptivo

Ejemplos de errores esperados:

- `invalid_coordinate_format`
- `invalid_tracking_field_count`
- `invalid_latitude`
- `invalid_longitude`
- `invalid_hemisphere`

### 3. Derivacion a telemetria

Si el parseo de posicion falla:

- no actualizar `lastPosition`
- no generar puntos historicos de posicion
- no generar eventos funcionales de telemetria como si el tracking hubiese sido valido

### 4. ACK y protocolo

Si por compatibilidad de protocolo se debe seguir respondiendo `ON`, eso puede mantenerse.

Pero internamente no debe tratarse como tracking util para telemetria si el parseo fallo.

## Contratos / superficies afectadas

## Raw / Ops

Revisar que el modelo equivalente a `RawPacketRecord` exponga y llene correctamente:

- `messageType`
- `payloadText`
- `parseStatus`
- `parseError`
- `packetId`
- `sessionId`

## Telemetria

Revisar que los endpoints de telemetria no reflejen datos de posicion cuando el `Tracking` fue invalido:

- resumen de dispositivos
- ultima posicion
- historial de posiciones

## Criterios de aceptacion

### Caso 1. Tracking valido

Payload Coban bien formado:

- raw persistido
- `parseStatus = Ok`
- sin `parseError`
- posicion visible en telemetria

### Caso 2. Tracking mal formado por coordenadas invalidas

Payload con columnas rotas o formato decimal invalido:

- raw persistido
- `parseStatus = Failed` o `Rejected`
- `parseError` claro
- sin posicion en telemetria
- sin falsa apariencia de tracking sano

### Caso 3. Tracking con hemisferio o longitud invalida

- raw persistido
- parseo marcado como fallido
- sin posicion derivada

## Casos de prueba recomendados

- login Coban valido
- tracker Coban valido con `0226.6880` y `07636.8820`
- tracker con coma decimal que rompa el CSV
- tracker con latitud incompleta
- tracker con longitud incompleta
- tracker con hemisferio invalido

## Resultado esperado para frontend y soporte

Despues de este cambio, si un payload entra mal formado:

- `Ops > Raw` mostrara actividad y el motivo del fallo
- QA y soporte podran diagnosticar el problema sin revisar logs internos
- el frontend no parecera roto cuando en realidad no hubo posicion valida

## No objetivos

- no se pide cambiar la politica de ACK salvo necesidad tecnica fuerte
- no se pide dejar de persistir raw
- no se pide redisenar telemetria ni `Ops`
