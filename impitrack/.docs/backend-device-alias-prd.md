# PRD Backend: alias de dispositivos por usuario

## Estado del documento

- Este documento define un PRD backend para que los usuarios puedan asignar nombres personalizados a sus dispositivos GPS.
- El PRD maestro en `.docs/product-source-of-truth-prd.md` es la fuente de verdad de alto nivel para framing del producto.
- Este documento no cubre la implementacion frontend de la UI de alias; solo define el contrato y modelo de datos esperado del backend.

## Resumen ejecutivo

Los usuarios de IMPITrack solo ven el IMEI crudo como identificador de sus dispositivos GPS. Para una flota de multiples vehiculos, esto no es usable: nadie memoriza IMEIs.

Se necesita que cada usuario pueda asignar un alias legible a cada uno de sus dispositivos vinculados. El alias es por binding (relacion usuario-dispositivo), no global del dispositivo.

## Problema actual

| Aspecto               | Situacion actual                                  | Impacto                                                           |
| --------------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| Identificacion visual | Solo se muestra el IMEI (`869710057803456`)       | El usuario no puede distinguir vehiculos rapidamente              |
| Flotas multiples      | Todos los dispositivos se ven como numeros largos | Confuso, propenso a error                                         |
| Contexto operativo    | Sin nombre asociado                               | El usuario tiene que recordar que IMEI corresponde a que vehiculo |

## Solucion propuesta

Agregar un campo `alias` a la relacion usuario-dispositivo (binding) en la base de datos, y exponerlo a traves de la API existente.

### Modelo de datos

#### Tabla afectada

La tabla que modela el binding entre usuario y dispositivo (el nombre exacto depende de la implementacion actual; tipicamente algo como `UserDeviceBindings` o equivalente).

#### Campo nuevo

| Campo   | Tipo           | Nullable | Default | Restriccion       |
| ------- | -------------- | -------- | ------- | ----------------- |
| `Alias` | `nvarchar(50)` | Si       | `NULL`  | Max 50 caracteres |

#### Migracion

- Agregar columna `Alias` como `nvarchar(50) NULL` a la tabla de bindings.
- No requiere backfill: los bindings existentes quedan con alias `NULL` y el frontend usa el IMEI como fallback.
- Migracion no destructiva, compatible hacia atras.

### Reglas del alias

- El alias es un string libre elegido por el usuario.
- Maximo 50 caracteres.
- Puede ser `null` o vacio (el frontend muestra el IMEI como fallback).
- El alias es por binding, no por dispositivo. Si en el futuro dos usuarios comparten un mismo dispositivo, cada uno puede tener su propio alias.
- No se requiere unicidad: dos dispositivos del mismo usuario pueden tener el mismo alias (no recomendado, pero no restringido).
- Se permite cualquier caracter Unicode valido dentro del limite de 50.

## Contrato de API

### Leer alias

El alias debe incluirse en el response existente de `GET /api/me/telemetry/devices`.

No se necesita un endpoint separado para leer el alias. Se agrega al DTO de device summary que ya existe.

#### Campo a agregar en `DeviceSummaryDto`

| Campo   | Tipo      | Descripcion                                              |
| ------- | --------- | -------------------------------------------------------- |
| `alias` | `string?` | Alias asignado por el usuario. `null` si no tiene alias. |

Ejemplo de response parcial:

```json
{
  "imei": "869710057803456",
  "alias": "Camioneta Roja",
  "lastPosition": { ... },
  "status": "online"
}
```

### Escribir alias

#### `PUT /api/me/telemetry/devices/{imei}/alias`

Asigna o actualiza el alias de un dispositivo vinculado al usuario autenticado.

**Request body:**

```json
{
  "alias": "Camioneta Roja"
}
```

**Validaciones:**

| Regla             | Detalle                                             | Error                          |
| ----------------- | --------------------------------------------------- | ------------------------------ |
| Binding existente | El IMEI debe estar vinculado al usuario autenticado | `404 device_binding_not_found` |
| Longitud maxima   | Alias no puede exceder 50 caracteres                | `400 alias_too_long`           |
| Tipo              | Debe ser string o null                              | `400 invalid_alias`            |

**Responses:**

| Status | Significado                             |
| ------ | --------------------------------------- |
| `200`  | Alias actualizado exitosamente          |
| `400`  | Validacion fallida (ver errores arriba) |
| `401`  | No autenticado                          |
| `404`  | Binding no encontrado                   |

**Response body exitoso:**

```json
{
  "data": {
    "imei": "869710057803456",
    "alias": "Camioneta Roja"
  },
  "success": true
}
```

#### Borrar alias

Para borrar un alias, el frontend envia el mismo `PUT` con `alias: null` o `alias: ""`. No se necesita un endpoint `DELETE` separado.

Comportamiento:

- Si `alias` es `null` o string vacio, el backend almacena `NULL` en la columna.
- El frontend interpreta `null` como "mostrar IMEI".

### Endpoints admin (opcional)

Si el admin necesita ver o editar alias de otros usuarios:

- `GET /api/admin/users/{userId}/telemetry/devices` ya devolveria el alias si esta en el DTO.
- `PUT /api/admin/users/{userId}/telemetry/devices/{imei}/alias` para set/clear.

Mismo contrato que el endpoint de usuario autenticado.

## DTO C# esperado

### Request

```csharp
public record SetDeviceAliasRequest(string? Alias);
```

### Validacion

```csharp
// En el handler o validator
if (request.Alias is not null && request.Alias.Length > 50)
    return Error("alias_too_long");
```

### Response (campo nuevo en DeviceSummaryDto)

```csharp
// Agregar al DTO existente de device summary
public string? Alias { get; init; }
```

## Implementacion sugerida

### Capa Application

- Agregar `SetDeviceAliasCommand` (o equivalente en el patron que use el backend).
- Validar que el binding existe para el usuario.
- Validar longitud del alias.
- Persistir.

### Capa DataAccess

- Agregar migracion para la columna `Alias`.
- Actualizar el mapeo del binding entity para incluir `Alias`.
- Actualizar la query de device summary para incluir `Alias` en la proyeccion.

### Capa API

- Agregar endpoint `PUT /api/me/telemetry/devices/{imei}/alias`.
- Actualizar el mapping del DTO de device summary para incluir `alias`.

## Criterios de aceptacion

### Caso 1. Asignar alias por primera vez

- Usuario autenticado hace `PUT /api/me/telemetry/devices/{imei}/alias` con `{"alias": "Camioneta Roja"}`.
- Response `200` con el alias asignado.
- `GET /api/me/telemetry/devices` incluye `"alias": "Camioneta Roja"` para ese IMEI.

### Caso 2. Actualizar alias existente

- Usuario que ya tiene alias `"Camioneta Roja"` hace PUT con `{"alias": "Toyota Hilux"}`.
- Response `200`.
- El alias se actualiza correctamente.

### Caso 3. Borrar alias

- Usuario hace PUT con `{"alias": null}`.
- Response `200`.
- `GET /api/me/telemetry/devices` devuelve `"alias": null` para ese IMEI.

### Caso 4. Alias demasiado largo

- Usuario envia un alias de 51+ caracteres.
- Response `400` con error `alias_too_long`.

### Caso 5. Dispositivo no vinculado

- Usuario intenta asignar alias a un IMEI que no tiene vinculado.
- Response `404` con error `device_binding_not_found`.

### Caso 6. Compatibilidad hacia atras

- Bindings existentes sin alias devuelven `"alias": null` en el device summary.
- El frontend sigue funcionando sin cambios hasta que implemente la UI de alias.

### Caso 7. Seguridad

- Un usuario no puede asignar alias a dispositivos de otro usuario.
- El binding se valida contra el `userId` del JWT.

## Fuera de scope

- Iconos de vehiculo (futuro).
- Tipos de vehiculo o categorias (futuro).
- Agrupaciones o folders de dispositivos (futuro).
- Busqueda por alias (puede ser util pero no es requerido ahora).
- Alias global del dispositivo (compartido entre usuarios).
- Historico de cambios de alias.
- Validacion de contenido del alias (palabras prohibidas, etc.).
