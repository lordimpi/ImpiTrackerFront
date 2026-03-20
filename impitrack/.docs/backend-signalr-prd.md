# PRD Backend: notificaciones en tiempo real via SignalR para telemetria

## Estado del documento

- Este documento define un PRD backend para habilitar push en tiempo real de posiciones y eventos de telemetria hacia el frontend.
- El PRD maestro en `.docs/product-source-of-truth-prd.md` es la fuente de verdad de alto nivel para framing del producto.
- Este documento no cubre la implementacion frontend del consumo de SignalR; solo define el contrato y comportamiento esperado del backend.

## Resumen ejecutivo

El frontend actualmente obtiene posiciones de dispositivos GPS mediante polling cada 30 segundos contra la REST API. Esto genera datos stale de hasta 30 segundos, carga innecesaria al API, y una experiencia de monitoreo que no se siente en tiempo real.

Se necesita un canal de push desde el backend hacia el frontend para que, cuando el TcpServer reciba una nueva posicion de un dispositivo, el usuario dueno de ese dispositivo la reciba instantaneamente en el browser.

La solucion propuesta es un SignalR Hub autenticado con JWT, scoped por usuario.

## Problema actual

| Aspecto                  | Situacion actual                            | Impacto                                                                          |
| ------------------------ | ------------------------------------------- | -------------------------------------------------------------------------------- |
| Frecuencia de datos      | Polling cada 30s                            | Posiciones stale hasta 30 segundos                                               |
| Carga al API             | Cada cliente activo hace 1 request cada 30s | Carga lineal con cantidad de usuarios conectados, incluso si no hay datos nuevos |
| Experiencia de monitoreo | El marcador salta cada 30s                  | No se siente como monitoreo en tiempo real                                       |
| Eventos de telemetria    | Se descubren en el proximo ciclo de polling | Alertas como ACC_OFF llegan tarde                                                |

## Solucion propuesta

### Componente: SignalR Hub autenticado

Un hub de SignalR expuesto en la API que:

1. Acepta conexiones WebSocket autenticadas con JWT.
2. Asocia cada conexion al `userId` del token.
3. Recibe notificaciones internas cuando el TcpServer persiste una nueva posicion.
4. Pushea el evento solo a las conexiones del usuario dueno del dispositivo.

### Flujo de datos

```
Dispositivo GPS
    |
    v
TcpServer (TCP listener)
    |
    v
Parseo + Persistencia (SQL Server)
    |
    v
Notificacion interna (in-process o message bus)
    |
    v
SignalR Hub
    |
    v
Conexiones WebSocket del usuario dueno del dispositivo
    |
    v
Frontend (browser)
```

### Mecanismo de notificacion interna

El TcpServer y la API corren en el mismo proceso o necesitan un canal de comunicacion entre ellos. Opciones validas:

- **In-process**: si TcpServer y API comparten proceso, un servicio singleton que inyecte `IHubContext<TelemetryHub>` y publique directamente.
- **Message bus**: si corren en procesos separados, un canal como Redis pub/sub, una cola en memoria, o similar.

La eleccion es decision del backend. Lo que importa es que el frontend reciba el mensaje con latencia sub-segundo desde la persistencia.

## Contrato del Hub

### Nombre del Hub

`/hubs/telemetry`

### Autenticacion

JWT Bearer token enviado como query string parameter en la conexion inicial:

```
wss://host/hubs/telemetry?access_token={jwt}
```

SignalR soporta esto nativamente. El hub debe validar el token y extraer el `userId` del claim.

Si el token es invalido o esta expirado, la conexion debe rechazarse con `401`.

### Metodos del servidor (client -> server)

No se requieren metodos client-to-server en esta fase. El hub es unidireccional: solo pushea.

### Eventos del servidor (server -> client)

#### `PositionUpdated`

Se emite cuando un dispositivo del usuario conectado recibe una nueva posicion valida.

| Campo           | Tipo                | Descripcion                               |
| --------------- | ------------------- | ----------------------------------------- |
| `imei`          | `string`            | IMEI del dispositivo                      |
| `latitude`      | `number`            | Latitud en grados decimales               |
| `longitude`     | `number`            | Longitud en grados decimales              |
| `speedKmh`      | `number`            | Velocidad en km/h                         |
| `headingDeg`    | `number`            | Rumbo en grados (0-360)                   |
| `occurredAtUtc` | `string (ISO 8601)` | Timestamp del GPS                         |
| `ignitionOn`    | `boolean`           | Estado de ignicion al momento del reporte |

#### `DeviceStatusChanged`

Se emite cuando un dispositivo del usuario cambia de estado online/offline.

| Campo          | Tipo                | Descripcion              |
| -------------- | ------------------- | ------------------------ |
| `imei`         | `string`            | IMEI del dispositivo     |
| `status`       | `string`            | `"online"` o `"offline"` |
| `changedAtUtc` | `string (ISO 8601)` | Timestamp del cambio     |

#### `TelemetryEventOccurred`

Se emite cuando ocurre un evento de telemetria relevante para un dispositivo del usuario.

| Campo           | Tipo                | Descripcion                                                     |
| --------------- | ------------------- | --------------------------------------------------------------- |
| `imei`          | `string`            | IMEI del dispositivo                                            |
| `eventType`     | `string`            | Tipo de evento: `ACC_ON`, `ACC_OFF`, `SOS`, `LOW_BATTERY`, etc. |
| `latitude`      | `number`            | Latitud donde ocurrio el evento                                 |
| `longitude`     | `number`            | Longitud donde ocurrio el evento                                |
| `occurredAtUtc` | `string (ISO 8601)` | Timestamp del evento                                            |

### DTOs C# esperados

```csharp
public record PositionUpdatedMessage(
    string Imei,
    double Latitude,
    double Longitude,
    double SpeedKmh,
    double HeadingDeg,
    DateTime OccurredAtUtc,
    bool IgnitionOn);

public record DeviceStatusChangedMessage(
    string Imei,
    string Status,
    DateTime ChangedAtUtc);

public record TelemetryEventOccurredMessage(
    string Imei,
    string EventType,
    double Latitude,
    double Longitude,
    DateTime OccurredAtUtc);
```

## Seguridad

### Autenticacion

- La conexion SignalR debe validar el JWT de la misma forma que los endpoints REST.
- El `userId` se extrae del token y se usa para filtrar que dispositivos le corresponden al usuario.
- Si el token expira durante una conexion activa, el backend puede cerrar la conexion o esperar a que el cliente reconecte.

### Scoping por usuario

- Un usuario solo recibe eventos de dispositivos que tiene vinculados (binding activo).
- El hub debe consultar los bindings del usuario al momento de pushear, o mantener un cache invalidable.
- Un usuario no debe recibir eventos de dispositivos de otros usuarios bajo ninguna circunstancia.

### Grupo de SignalR

La estrategia recomendada es usar grupos de SignalR por `userId`:

- Al conectar, agregar la conexion al grupo `user_{userId}`.
- Al pushear, enviar al grupo `user_{userId}` del dueno del dispositivo.
- Al desconectar, SignalR remueve automaticamente la conexion del grupo.

## Consideraciones de escalabilidad

### Escenario actual

- Decenas de usuarios concurrentes, no miles.
- In-process con un solo servidor es suficiente.

### Escenario futuro (si escala)

- Si se necesita scale-out horizontal, agregar Redis backplane para SignalR.
- Si TcpServer y API se separan en procesos distintos, usar Redis pub/sub o equivalente como canal de notificacion.
- No implementar esto ahora; documentarlo como path de escalabilidad.

### Rate de mensajes

- Un dispositivo GPS tipico reporta cada 10-30 segundos.
- Con una flota de 50 dispositivos y un usuario mirando el mapa, son ~2-5 mensajes/segundo.
- SignalR maneja esto sin problema. No se necesita throttling en esta fase.

## Criterios de aceptacion

### Caso 1. Conexion exitosa

- El frontend conecta al hub con un JWT valido.
- La conexion se establece sin error.
- El usuario queda registrado en su grupo.

### Caso 2. Posicion en tiempo real

- Un dispositivo GPS del usuario envia una posicion al TcpServer.
- El TcpServer parsea y persiste la posicion.
- El hub pushea `PositionUpdated` al frontend del usuario.
- Latencia total desde persistencia hasta recepcion en frontend: menor a 1 segundo.

### Caso 3. Evento de telemetria

- Un dispositivo del usuario genera un evento `ACC_OFF`.
- El hub pushea `TelemetryEventOccurred` con `eventType = "ACC_OFF"` al usuario.

### Caso 4. Cambio de estado del dispositivo

- Un dispositivo deja de reportar por mas del umbral configurado.
- El hub pushea `DeviceStatusChanged` con `status = "offline"` al usuario.

### Caso 5. Aislamiento de usuarios

- El usuario A tiene el dispositivo X.
- El usuario B tiene el dispositivo Y.
- Cuando X reporta una posicion, solo A recibe `PositionUpdated`.
- B no recibe nada.

### Caso 6. Token invalido

- El frontend intenta conectar con un JWT expirado o invalido.
- La conexion es rechazada con `401`.

### Caso 7. Reconexion

- Si la conexion WebSocket se corta y el cliente reconecta con un token valido, debe poder reestablecer la suscripcion sin estado previo.
- El hub no necesita buffering de mensajes perdidos durante la desconexion.

## Fuera de scope

- Implementacion frontend del consumo de SignalR (eso se hace en el repo de frontend).
- Buffering o replay de mensajes perdidos durante desconexion.
- Notificaciones push (mobile/browser push notifications).
- Historico de notificaciones.
- Filtrado por tipo de evento en el hub (el frontend filtra client-side).
- Dashboard de estado de conexiones SignalR.
- Redis backplane (solo documentar como path futuro si se necesita scale-out).
