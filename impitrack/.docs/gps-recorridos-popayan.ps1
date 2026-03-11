$ErrorActionPreference = 'Stop'

$hostName = '127.0.0.1'
$port = 5001
$imei = '359586015829802'
$delaySeconds = 2
$gapMinutesBetweenTrips = 12
$settleSeconds = 8
$invariantCulture = [System.Globalization.CultureInfo]::InvariantCulture

$client = [System.Net.Sockets.TcpClient]::new()
$client.Connect($hostName, $port)
$stream = $client.GetStream()
$writer = [System.IO.StreamWriter]::new($stream, [System.Text.Encoding]::ASCII)
$writer.NewLine = ''
$writer.AutoFlush = $true
$buffer = New-Object byte[] 64

function Read-Ack {
    param(
        [System.Net.Sockets.NetworkStream]$NetworkStream,
        [byte[]]$AckBuffer
    )

    Start-Sleep -Milliseconds 350

    if (-not $NetworkStream.DataAvailable) {
        Write-Host 'ACK => <sin respuesta>'
        return
    }

    $rawAck = New-Object System.Text.StringBuilder

    while ($NetworkStream.DataAvailable) {
        $read = $NetworkStream.Read($AckBuffer, 0, $AckBuffer.Length)
        if ($read -le 0) {
            break
        }

        [void]$rawAck.Append([System.Text.Encoding]::ASCII.GetString($AckBuffer, 0, $read))
        Start-Sleep -Milliseconds 80
    }

    if ($rawAck.Length -eq 0) {
        Write-Host 'ACK => <conexion cerrada>'
        return
    }

    $ackText = $rawAck.ToString().Replace("`r", '').Replace("`n", '').Trim()
    if ([string]::IsNullOrWhiteSpace($ackText)) {
        Write-Host 'ACK => <sin respuesta>'
        return
    }

    $ackTokens = [System.Text.RegularExpressions.Regex]::Matches($ackText, 'LOAD|ON') |
        ForEach-Object { $_.Value }

    if ($ackTokens.Count -gt 0) {
        foreach ($ackToken in $ackTokens) {
            Write-Host "ACK => $ackToken"
        }

        return
    }

    Write-Host "ACK => $ackText"
}

function Send-Payload {
    param(
        [System.IO.StreamWriter]$StreamWriter,
        [System.Net.Sockets.NetworkStream]$NetworkStream,
        [byte[]]$AckBuffer,
        [string]$Payload
    )

    Write-Host "TX  => $Payload"
    $StreamWriter.Write($Payload)
    Read-Ack -NetworkStream $NetworkStream -AckBuffer $AckBuffer
}

function Convert-ToCobanCoordinate {
    param(
        [double]$Decimal,
        [string]$PositiveHemisphere,
        [string]$NegativeHemisphere,
        [int]$DegreeDigits
    )

    $absoluteValue = [math]::Abs($Decimal)
    $degrees = [math]::Floor($absoluteValue)
    $minutes = ($absoluteValue - $degrees) * 60
    $degreesText = [string]::Format($invariantCulture, "{0:D$DegreeDigits}", [int]$degrees)
    $minutesText = $minutes.ToString('00.0000', $invariantCulture)
    $formatted = "$degreesText$minutesText"
    $hemisphere = if ($Decimal -ge 0) { $PositiveHemisphere } else { $NegativeHemisphere }

    return @{
        Value = $formatted
        Hemisphere = $hemisphere
    }
}

function New-CobanTrackerPayload {
    param(
        [string]$DeviceImei,
        [datetime]$UtcTime,
        [double]$Latitude,
        [double]$Longitude
    )

    $lat = Convert-ToCobanCoordinate -Decimal $Latitude -PositiveHemisphere 'N' -NegativeHemisphere 'S' -DegreeDigits 2
    $lon = Convert-ToCobanCoordinate -Decimal $Longitude -PositiveHemisphere 'E' -NegativeHemisphere 'W' -DegreeDigits 3
    $datePart = $UtcTime.ToString('ddMMyyHHmmss')

    return "imei:$DeviceImei,tracker,$datePart,,F,175816.000,A,$($lat.Value),$($lat.Hemisphere),$($lon.Value),$($lon.Hemisphere),,;"
}

function Send-Trip {
    param(
        [string]$TripName,
        [datetime]$StartUtc,
        [object[]]$RoutePoints
    )

    Write-Host ''
    Write-Host "=== Enviando $TripName ==="

    for ($index = 0; $index -lt $RoutePoints.Count; $index++) {
        $point = $RoutePoints[$index]
        $payload = New-CobanTrackerPayload `
            -DeviceImei $imei `
            -UtcTime $StartUtc.AddMinutes($index) `
            -Latitude $point.Lat `
            -Longitude $point.Lon

        if ($index -eq 0) {
            Write-Host "Primer tracker de $TripName => $payload"
        }

        Send-Payload -StreamWriter $writer -NetworkStream $stream -AckBuffer $buffer -Payload $payload
        Start-Sleep -Seconds $delaySeconds
    }
}

$tripOneRoute = @(
    @{ Lat = 2.4448; Lon = -76.6147 }
    @{ Lat = 2.4462; Lon = -76.6131 }
    @{ Lat = 2.4478; Lon = -76.6114 }
    @{ Lat = 2.4493; Lon = -76.6098 }
    @{ Lat = 2.4509; Lon = -76.6082 }
)

$tripTwoRoute = @(
    @{ Lat = 2.4511; Lon = -76.6081 }
    @{ Lat = 2.4528; Lon = -76.6074 }
    @{ Lat = 2.4545; Lon = -76.6069 }
    @{ Lat = 2.4560; Lon = -76.6076 }
    @{ Lat = 2.4573; Lon = -76.6091 }
)

try {
    Write-Host "Conectado a $hostName`:$port para IMEI $imei"
    Send-Payload -StreamWriter $writer -NetworkStream $stream -AckBuffer $buffer -Payload "##,imei:$imei,A;"

    $nowUtc = [datetime]::UtcNow
    $tripTwoStart = $nowUtc.AddMinutes(-6)
    $tripOneStart = $tripTwoStart.AddMinutes(-($gapMinutesBetweenTrips + $tripOneRoute.Count))

    Write-Host ''
    Write-Host 'Regla actual del backend para recorridos: gap mayor a 10 minutos crea un nuevo recorrido.'
    Write-Host 'Ademas, el backend solo arma recorridos cuando detecta movimiento real entre puntos.'
    Write-Host "Gap configurado en este script: $gapMinutesBetweenTrips minutos."
    Write-Host "Inicio Recorrido 1 (UTC): $($tripOneStart.ToString('O'))"
    Write-Host "Inicio Recorrido 2 (UTC): $($tripTwoStart.ToString('O'))"

    Send-Trip -TripName 'Recorrido 1' -StartUtc $tripOneStart -RoutePoints $tripOneRoute
    Send-Trip -TripName 'Recorrido 2' -StartUtc $tripTwoStart -RoutePoints $tripTwoRoute

    Write-Host ''
    Write-Host "Simulacion enviada. Esperando $settleSeconds segundos para que el backend procese los recorridos..."
    Start-Sleep -Seconds $settleSeconds
    Write-Host 'Ahora valida en este orden: Ops > Raw -> /app/devices/:imei/telemetry -> panel Recorridos.'
}
finally {
    $writer.Dispose()
    $stream.Dispose()
    $client.Dispose()
    Write-Host 'Conexion cerrada.'
}
