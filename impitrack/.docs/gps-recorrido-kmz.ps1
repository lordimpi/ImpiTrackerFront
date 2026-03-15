$ErrorActionPreference = 'Stop'

$hostName = '127.0.0.1'
$port = 5001
$imei = '359586015829802'
$kmzPath = 'C:\Users\snt-2\Downloads\ruta1.kmz'
$delaySeconds = 2
$settleSeconds = 8
$minimumDistanceMeters = 120
$invariantCulture = [System.Globalization.CultureInfo]::InvariantCulture

Add-Type -AssemblyName System.IO.Compression.FileSystem

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

function Get-DistanceMeters {
    param(
        [double]$LatitudeA,
        [double]$LongitudeA,
        [double]$LatitudeB,
        [double]$LongitudeB
    )

    $earthRadius = 6371000.0
    $latARad = $LatitudeA * [math]::PI / 180.0
    $latBRad = $LatitudeB * [math]::PI / 180.0
    $deltaLat = ($LatitudeB - $LatitudeA) * [math]::PI / 180.0
    $deltaLon = ($LongitudeB - $LongitudeA) * [math]::PI / 180.0

    $sinLat = [math]::Sin($deltaLat / 2.0)
    $sinLon = [math]::Sin($deltaLon / 2.0)
    $a = ($sinLat * $sinLat) + ([math]::Cos($latARad) * [math]::Cos($latBRad) * $sinLon * $sinLon)
    $c = 2.0 * [math]::Atan2([math]::Sqrt($a), [math]::Sqrt(1.0 - $a))

    return $earthRadius * $c
}

function Get-RoutePointsFromKmz {
    param(
        [string]$RouteKmzPath,
        [double]$MinDistanceMeters
    )

    if (-not (Test-Path $RouteKmzPath)) {
        throw "No existe el archivo KMZ: $RouteKmzPath"
    }

    $zip = [System.IO.Compression.ZipFile]::OpenRead($RouteKmzPath)

    try {
        $entry = $zip.GetEntry('doc.kml')
        if ($null -eq $entry) {
            throw 'El KMZ no contiene doc.kml'
        }

        $reader = [System.IO.StreamReader]::new($entry.Open())

        try {
            $content = $reader.ReadToEnd()
        }
        finally {
            $reader.Dispose()
        }
    }
    finally {
        $zip.Dispose()
    }

    $coordinatesBlock = [System.Text.RegularExpressions.Regex]::Match(
        $content,
        '<LineString>.*?<coordinates>(.*?)</coordinates>',
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    ).Groups[1].Value.Trim()

    if ([string]::IsNullOrWhiteSpace($coordinatesBlock)) {
        throw 'No se encontraron coordenadas de LineString dentro del KMZ'
    }

    $rawPoints = $coordinatesBlock.Split([Environment]::NewLine, [System.StringSplitOptions]::RemoveEmptyEntries) |
        ForEach-Object {
            $parts = $_.Trim().Split(',')
            if ($parts.Count -lt 2) {
                return
            }

            [pscustomobject]@{
                Latitude = [double]::Parse($parts[1], $invariantCulture)
                Longitude = [double]::Parse($parts[0], $invariantCulture)
            }
        } |
        Where-Object { $null -ne $_ }

    if ($rawPoints.Count -lt 2) {
        throw 'El KMZ no tiene suficientes puntos para simular un recorrido'
    }

    $selectedPoints = New-Object System.Collections.Generic.List[object]
    $selectedPoints.Add($rawPoints[0])
    $lastKeptPoint = $rawPoints[0]

    for ($index = 1; $index -lt $rawPoints.Count - 1; $index++) {
        $candidate = $rawPoints[$index]
        $distance = Get-DistanceMeters `
            -LatitudeA $lastKeptPoint.Latitude `
            -LongitudeA $lastKeptPoint.Longitude `
            -LatitudeB $candidate.Latitude `
            -LongitudeB $candidate.Longitude

        if ($distance -ge $MinDistanceMeters) {
            $selectedPoints.Add($candidate)
            $lastKeptPoint = $candidate
        }
    }

    $lastPoint = $rawPoints[$rawPoints.Count - 1]
    $distanceToLast = Get-DistanceMeters `
        -LatitudeA $lastKeptPoint.Latitude `
        -LongitudeA $lastKeptPoint.Longitude `
        -LatitudeB $lastPoint.Latitude `
        -LongitudeB $lastPoint.Longitude

    if ($distanceToLast -gt 0) {
        $selectedPoints.Add($lastPoint)
    }

    return $selectedPoints
}

try {
    $routePoints = Get-RoutePointsFromKmz -RouteKmzPath $kmzPath -MinDistanceMeters $minimumDistanceMeters

    Write-Host "Conectado a $hostName`:$port para IMEI $imei"
    Send-Payload -StreamWriter $writer -NetworkStream $stream -AckBuffer $buffer -Payload "##,imei:$imei,A;"

    $tripStart = [datetime]::UtcNow.AddMinutes(-($routePoints.Count + 1))

    Write-Host ''
    Write-Host "Ruta KMZ origen: $kmzPath"
    Write-Host "Puntos retenidos para Coban: $($routePoints.Count)"
    Write-Host "Distancia minima entre puntos retenidos: $minimumDistanceMeters m"
    Write-Host "Inicio del recorrido (UTC): $($tripStart.ToString('O'))"
    Write-Host 'Esta simulacion envia un solo recorrido realista derivado del KMZ.'

    for ($index = 0; $index -lt $routePoints.Count; $index++) {
        $point = $routePoints[$index]
        $payload = New-CobanTrackerPayload `
            -DeviceImei $imei `
            -UtcTime $tripStart.AddMinutes($index) `
            -Latitude $point.Latitude `
            -Longitude $point.Longitude

        if ($index -eq 0) {
            Write-Host "Primer tracker del KMZ => $payload"
        }

        Send-Payload -StreamWriter $writer -NetworkStream $stream -AckBuffer $buffer -Payload $payload
        Start-Sleep -Seconds $delaySeconds
    }

    Write-Host ''
    Write-Host "Simulacion enviada. Esperando $settleSeconds segundos para que el backend procese el recorrido..."
    Start-Sleep -Seconds $settleSeconds
    Write-Host 'Ahora valida en este orden: Ops > Raw -> /app/devices/:imei/telemetry -> panel Recorridos.'
}
finally {
    $writer.Dispose()
    $stream.Dispose()
    $client.Dispose()
    Write-Host 'Conexion cerrada.'
}
