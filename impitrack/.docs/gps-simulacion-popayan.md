# Simulacion GPS Coban para Popayan

## Objetivo

Generar datos GPS simulados para un IMEI vinculado y ver el recorrido en:

- `/app/map`
- `/app/devices/:imei/telemetry`
- `Ops > Raw`

Este tutorial usa el protocolo **Coban** y el puerto **5001**, que son los valores actuales del `TcpServer` en desarrollo.

## Requisitos previos

Debes tener corriendo:

1. Frontend
2. API
3. `TcpServer`
4. EMQX

EMQX es necesario porque el `TcpServer` de desarrollo esta configurado con:

- `EventBus.Provider = Emqx`
- `Host = 127.0.0.1`
- `Port = 1883`

## Datos base de la prueba

- Protocolo: `COBAN`
- Puerto TCP: `5001`
- IMEI de ejemplo: `359586015829802`
- Script: [.docs/gps-simulacion-popayan.ps1](/C:/Users/snt-2/OneDrive/Escritorio/GPS/ImpiTrackerFront/impitrack/.docs/gps-simulacion-popayan.ps1)
- Script para recorridos: [.docs/gps-recorridos-popayan.ps1](/C:/Users/snt-2/OneDrive/Escritorio/GPS/ImpiTrackerFront/impitrack/.docs/gps-recorridos-popayan.ps1)
- Script para recorrido desde KMZ: [.docs/gps-recorrido-kmz.ps1](/C:/Users/snt-2/OneDrive/Escritorio/GPS/ImpiTrackerFront/impitrack/.docs/gps-recorrido-kmz.ps1)

Puedes cambiar el IMEI en el script si necesitas usar otro.

Usa cada script asi:

- `gps-simulacion-popayan.ps1`: validar ultima ubicacion y puntos historicos
- `gps-recorridos-popayan.ps1`: validar la vista `Recorridos`
- `gps-recorrido-kmz.ps1`: validar un solo recorrido realista a partir de un archivo `.kmz`

## Flujo E2E completo

### 1. Vincular el IMEI en el frontend

1. Inicia sesion con un usuario normal.
2. Ve a `Mis dispositivos`.
3. Vincula el IMEI que vas a usar en la simulacion.

No sigas con la prueba hasta confirmar que el IMEI aparece en la tabla.

### 2. Abrir la vista destino

Abre una de estas rutas antes de correr el script:

- `/app/map`
- `/app/devices/359586015829802/telemetry`
- `/ops/raw` si quieres validar primero que el TCP esta entrando

Si todavia no hay datos, el mapa debe verse centrado en Colombia.

### 3. Orden correcto de validacion

No esperes primero el mapa. Valida en este orden:

1. **ACK del script**
2. **Ops > Raw**
3. **Telemetria en API**
4. **Mapa y detalle**

Si `Ops > Raw` no muestra paquetes, el problema no esta en el mapa sino antes, en TCP o persistencia.

### 4. Ejecutar el script

Desde PowerShell, parado en la raiz del frontend:

```powershell
powershell -ExecutionPolicy Bypass -File .\.docs\gps-simulacion-popayan.ps1
```

### 5. Que hace el script

El script:

1. Se conecta a `127.0.0.1:5001`
2. Envia login Coban
3. Espera el ACK `LOAD`
4. Envia una ruta circular corta en Popayan
5. Espera `ON` por cada tracker enviado
6. Cierra la conexion

### 6. Payload valido esperado

El primer tracker que imprime el script debe verse con este patron:

```text
imei:359586015829802,tracker,260311001219,,F,175816.000,A,0226.6880,N,07636.8820,W,,;
```

Fijate en esto:

- `260311001219`
- `0226.6880`
- `07636.8820`

El timestamp Coban debe ir en formato `yyMMddHHmmss`.

Las coordenadas deben llevar `.` decimal, no `,`.

Si ves algo como esto:

```text
0226,6880
07636,8820
```

el payload esta mal formado para Coban y no debes esperar posiciones validas en telemetria.

### 7. Validaciones esperadas

En consola debes ver algo similar a:

```text
ACK => LOAD
ACK => ON
ACK => ON
ACK => ON
```

Despues valida:

1. `Ops > Raw`
   Esperado:
   - aparecen paquetes del IMEI
   - se ve login y tracking

2. `Telemetria de la API`
   Esperado:
   - `GET /api/me/telemetry/devices` devuelve el IMEI
   - `GET /api/me/telemetry/devices/{imei}/positions` devuelve puntos

   Si no quieres usar Postman, puedes validar desde la propia UI:
   - entra a `/app/devices/:imei/telemetry`
   - pulsa `Actualizar` si la vista ya estaba abierta

3. `/app/map`
   Esperado:
   - aparece el marcador en Popayan
   - se actualiza la ultima posicion
   - si la pagina ya estaba abierta, pulsa `Actualizar` o espera el polling de 30 segundos

4. `/app/devices/:imei/telemetry`
   Esperado:
   - se ve el recorrido
   - aparecen puntos historicos
   - aparecen eventos y/o timeline segun lo persistido

## Validacion especifica de recorridos

Si quieres probar la pestaña `Recorridos`, ejecuta:

```powershell
powershell -ExecutionPolicy Bypass -File .\.docs\gps-recorridos-popayan.ps1
```

Ese script:

1. envia cuatro bloques de puntos separados por gaps de mas de 10 minutos
2. usa saltos geograficos suficientemente grandes para que backend los considere movimiento real
3. sigue cuatro corredores urbanos aproximados dentro de Popayan para evitar recorridos artificiales
4. debe terminar mostrando varios recorridos en `/app/devices/:imei/telemetry`

Si despues de ejecutarlo no aparecen recorridos, valida en este orden:

1. `Ops > Raw`
2. `Actualizar` dentro de `/app/devices/:imei/telemetry`
3. panel `Recorridos`

## Si no funciona

### No hay ACK

Revisa:

1. que `TcpServer` este arriba
2. que el puerto `5001` este escuchando
3. que no haya firewall bloqueando el socket

### Hay ACK pero no sale nada en el mapa

Revisa:

1. que el IMEI este vinculado al usuario correcto
2. que la API este arriba
3. que el frontend este consultando la misma base donde persiste el `TcpServer`
4. pulsa `Actualizar` en `/app/map` o espera el polling de 30 segundos
5. revisa que el primer tracker impreso por el script tenga `.` decimal en latitud y longitud
6. revisa que el tracker tenga fecha en formato `yyMMddHHmmss`; por ejemplo `260311001219`, no `110326001219`

### Sale en Ops pero no en telemetria

Revisa:

1. `/api/me/telemetry/devices`
2. `/api/me/telemetry/devices/{imei}/positions`
3. que la posicion haya sido persistida y no solo el raw packet
4. que estes entrando con el mismo usuario al que vinculaste el IMEI
5. si en UI solo aparecen eventos `Login`, el tracking no esta generando posicion util
6. si `positions` o `trips` salen vacios, valida primero que el payload tracker tenga fecha `yyMMddHHmmss`

### El TcpServer arranca pero no persiste bien

Revisa EMQX, porque en desarrollo el `TcpServer` esta configurado para usarlo como event bus.

### Se ve la lista de dispositivos pero no el marcador

Eso significa casi siempre una de estas dos cosas:

1. el resumen de `/api/me/telemetry/devices` aun no trae `lastPosition`
2. la pagina del mapa estaba abierta antes de simular y necesita `Actualizar`

## Resultado esperado

La prueba se considera exitosa cuando:

1. el script devuelve `LOAD` y luego varios `ON`
2. los paquetes aparecen en `Ops > Raw`
3. el mapa muestra el marcador en Popayan
4. el detalle del IMEI muestra el recorrido

## Repetir la prueba con otro IMEI

Solo cambia este valor dentro del script:

```powershell
$imei = '359586015829802'
```

Y recuerda volver a vincular ese nuevo IMEI en `Mis dispositivos` antes de ejecutar la simulacion.

## Probar un recorrido real desde KMZ

Si quieres usar una ruta mas realista, ejecuta:

```powershell
powershell -ExecutionPolicy Bypass -File .\.docs\gps-recorrido-kmz.ps1
```

Ese script:

1. lee el archivo `C:\Users\snt-2\Downloads\ruta1.kmz`
2. extrae la geometria principal del `doc.kml`
3. conserva solo puntos separados por una distancia util para Coban
4. envia un solo recorrido para validarlo en el panel `Recorridos`

Si luego quieres usar otro archivo KMZ, cambia esta variable:

```powershell
$kmzPath = 'C:\Users\snt-2\Downloads\ruta1.kmz'
```
