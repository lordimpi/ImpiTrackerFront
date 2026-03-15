$ErrorActionPreference = 'Stop'

$hostName = '127.0.0.1'
$port = 5001
$imei = '359586015829802'
$delaySeconds = 2
$loopCount = 1
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

$route = @(
    @{ Lat = 2.4448; Lon = -76.6147 }
    @{ Lat = 2.4455; Lon = -76.6139 }
    @{ Lat = 2.4462; Lon = -76.6130 }
    @{ Lat = 2.4470; Lon = -76.6121 }
    @{ Lat = 2.4478; Lon = -76.6113 }
    @{ Lat = 2.4487; Lon = -76.6106 }
    @{ Lat = 2.4496; Lon = -76.6100 }
    @{ Lat = 2.4506; Lon = -76.6095 }
    @{ Lat = 2.4515; Lon = -76.6091 }
    @{ Lat = 2.4524; Lon = -76.6088 }
    @{ Lat = 2.4532; Lon = -76.6089 }
    @{ Lat = 2.4540; Lon = -76.6093 }
    @{ Lat = 2.4547; Lon = -76.6100 }
    @{ Lat = 2.4552; Lon = -76.6108 }
    @{ Lat = 2.4556; Lon = -76.6118 }
    @{ Lat = 2.4557; Lon = -76.6129 }
    @{ Lat = 2.4555; Lon = -76.6140 }
    @{ Lat = 2.4550; Lon = -76.6150 }
    @{ Lat = 2.4542; Lon = -76.6158 }
    @{ Lat = 2.4533; Lon = -76.6165 }
    @{ Lat = 2.4523; Lon = -76.6170 }
    @{ Lat = 2.4512; Lon = -76.6173 }
    @{ Lat = 2.4501; Lon = -76.6174 }
    @{ Lat = 2.4490; Lon = -76.6172 }
    @{ Lat = 2.4480; Lon = -76.6168 }
    @{ Lat = 2.4471; Lon = -76.6162 }
    @{ Lat = 2.4463; Lon = -76.6155 }
    @{ Lat = 2.4455; Lon = -76.6149 }
    @{ Lat = 2.4448; Lon = -76.6147 }
)

try {
    Write-Host "Conectado a $hostName`:$port para IMEI $imei"
    Send-Payload -StreamWriter $writer -NetworkStream $stream -AckBuffer $buffer -Payload "##,imei:$imei,A;"

    for ($loop = 0; $loop -lt $loopCount; $loop++) {
        $start = [datetime]::UtcNow.AddMinutes(-($route.Count))

        for ($index = 0; $index -lt $route.Count; $index++) {
            $point = $route[$index]
            $payload = New-CobanTrackerPayload `
                -DeviceImei $imei `
                -UtcTime $start.AddMinutes($index + ($loop * $route.Count)) `
                -Latitude $point.Lat `
                -Longitude $point.Lon

            if ($loop -eq 0 -and $index -eq 0) {
                Write-Host "Primer tracker de ejemplo => $payload"
            }

            Send-Payload -StreamWriter $writer -NetworkStream $stream -AckBuffer $buffer -Payload $payload
            Start-Sleep -Seconds $delaySeconds
        }
    }

    Write-Host ''
    Write-Host "Simulacion enviada. Esperando $settleSeconds segundos para que el backend procese la telemetria..."
    Start-Sleep -Seconds $settleSeconds
    Write-Host 'Ahora valida en este orden: Ops > Raw -> /app/devices/:imei/telemetry -> /app/map (pulsa Actualizar si ya estaba abierto).'
}
finally {
    $writer.Dispose()
    $stream.Dispose()
    $client.Dispose()
    Write-Host 'Conexion cerrada.'
}
