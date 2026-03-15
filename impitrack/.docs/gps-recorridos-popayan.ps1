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
    $datePart = $UtcTime.ToString('yyMMddHHmmss')

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
    @{ Lat = 2.4418; Lon = -76.6149 }
    @{ Lat = 2.4426; Lon = -76.6141 }
    @{ Lat = 2.4434; Lon = -76.6133 }
    @{ Lat = 2.4442; Lon = -76.6125 }
    @{ Lat = 2.4450; Lon = -76.6118 }
    @{ Lat = 2.4459; Lon = -76.6110 }
    @{ Lat = 2.4468; Lon = -76.6102 }
)

$tripTwoRoute = @(
    @{ Lat = 2.4469; Lon = -76.6101 }
    @{ Lat = 2.4478; Lon = -76.6093 }
    @{ Lat = 2.4488; Lon = -76.6086 }
    @{ Lat = 2.4499; Lon = -76.6079 }
    @{ Lat = 2.4510; Lon = -76.6072 }
    @{ Lat = 2.4522; Lon = -76.6065 }
    @{ Lat = 2.4533; Lon = -76.6058 }
)

$tripThreeRoute = @(
    @{ Lat = 2.4529; Lon = -76.6057 }
    @{ Lat = 2.4524; Lon = -76.6048 }
    @{ Lat = 2.4519; Lon = -76.6039 }
    @{ Lat = 2.4511; Lon = -76.6033 }
    @{ Lat = 2.4500; Lon = -76.6030 }
    @{ Lat = 2.4489; Lon = -76.6032 }
    @{ Lat = 2.4479; Lon = -76.6037 }
)

$tripFourRoute = @(
    @{ Lat = 2.4478; Lon = -76.6038 }
    @{ Lat = 2.4472; Lon = -76.6047 }
    @{ Lat = 2.4466; Lon = -76.6057 }
    @{ Lat = 2.4459; Lon = -76.6067 }
    @{ Lat = 2.4451; Lon = -76.6078 }
    @{ Lat = 2.4443; Lon = -76.6089 }
    @{ Lat = 2.4435; Lon = -76.6100 }
)

try {
    Write-Host "Conectado a $hostName`:$port para IMEI $imei"
    Send-Payload -StreamWriter $writer -NetworkStream $stream -AckBuffer $buffer -Payload "##,imei:$imei,A;"

    $nowUtc = [datetime]::UtcNow
    $tripFourStart = $nowUtc.AddMinutes(-6)
    $tripThreeStart = $tripFourStart.AddMinutes(-($gapMinutesBetweenTrips + $tripThreeRoute.Count))
    $tripTwoStart = $tripThreeStart.AddMinutes(-($gapMinutesBetweenTrips + $tripTwoRoute.Count))
    $tripOneStart = $tripTwoStart.AddMinutes(-($gapMinutesBetweenTrips + $tripOneRoute.Count))

    Write-Host ''
    Write-Host 'Regla actual del backend para recorridos: gap mayor a 10 minutos crea un nuevo recorrido.'
    Write-Host 'Ademas, el backend solo arma recorridos cuando detecta movimiento real entre puntos.'
    Write-Host 'Esta version usa cuatro corredores urbanos aproximados en Popayan: centro, salida norte, tramo oriental y retorno urbano.'
    Write-Host "Gap configurado en este script: $gapMinutesBetweenTrips minutos."
    Write-Host "Inicio Recorrido 1 (UTC): $($tripOneStart.ToString('O'))"
    Write-Host "Inicio Recorrido 2 (UTC): $($tripTwoStart.ToString('O'))"
    Write-Host "Inicio Recorrido 3 (UTC): $($tripThreeStart.ToString('O'))"
    Write-Host "Inicio Recorrido 4 (UTC): $($tripFourStart.ToString('O'))"

    Send-Trip -TripName 'Recorrido 1' -StartUtc $tripOneStart -RoutePoints $tripOneRoute
    Send-Trip -TripName 'Recorrido 2' -StartUtc $tripTwoStart -RoutePoints $tripTwoRoute
    Send-Trip -TripName 'Recorrido 3' -StartUtc $tripThreeStart -RoutePoints $tripThreeRoute
    Send-Trip -TripName 'Recorrido 4' -StartUtc $tripFourStart -RoutePoints $tripFourRoute

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
