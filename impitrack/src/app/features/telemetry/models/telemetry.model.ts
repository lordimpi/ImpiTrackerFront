export type TelemetryPrimitive = string | number;

export interface LastKnownPositionDto {
  readonly occurredAtUtc: string;
  readonly receivedAtUtc: string;
  readonly gpsTimeUtc: string | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly speedKmh: number | null;
  readonly headingDeg: number | null;
  readonly packetId: string;
  readonly sessionId: string;
}

export interface TelemetryDeviceSummaryDto {
  readonly imei: string;
  readonly boundAtUtc: string;
  readonly lastSeenAtUtc: string | null;
  readonly activeSessionId: string | null;
  readonly protocol: TelemetryPrimitive | null;
  readonly lastMessageType: TelemetryPrimitive | null;
  readonly lastPosition: LastKnownPositionDto | null;
}

export interface DevicePositionPointDto {
  readonly occurredAtUtc: string;
  readonly receivedAtUtc: string;
  readonly gpsTimeUtc: string | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly speedKmh: number | null;
  readonly headingDeg: number | null;
  readonly packetId: string;
  readonly sessionId: string;
  readonly ignitionOn?: boolean;
}

export interface DeviceEventDto {
  readonly eventId: string;
  readonly occurredAtUtc: string;
  readonly receivedAtUtc: string;
  readonly eventCode: string;
  readonly payloadText: string;
  readonly protocol: TelemetryPrimitive;
  readonly messageType: TelemetryPrimitive;
  readonly packetId: string;
  readonly sessionId: string;
}

export interface TripSummaryDto {
  readonly tripId: string;
  readonly imei: string;
  readonly startedAtUtc: string;
  readonly endedAtUtc: string | null;
  readonly pointCount: number;
  readonly maxSpeedKmh: number | null;
  readonly avgSpeedKmh: number | null;
  readonly startPosition: DevicePositionPointDto;
  readonly endPosition: DevicePositionPointDto;
}

export interface TripDetailDto {
  readonly tripId: string;
  readonly imei: string;
  readonly startedAtUtc: string;
  readonly endedAtUtc: string | null;
  readonly pointCount: number;
  readonly maxSpeedKmh: number | null;
  readonly avgSpeedKmh: number | null;
  readonly pathPoints: readonly DevicePositionPointDto[];
  readonly startPosition: DevicePositionPointDto;
  readonly endPosition: DevicePositionPointDto;
  readonly sourceRule: string;
}

export interface TelemetryQueryWindow {
  readonly fromUtc?: string;
  readonly toUtc?: string;
  readonly limit?: number;
}

export interface TelemetryMapMarker {
  readonly imei: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly lastSeenAtUtc: string | null;
  readonly protocol: TelemetryPrimitive | null;
  readonly ignitionOn?: boolean;
}

export type TelemetryRangePreset = 'hour' | 'day' | 'week' | 'custom';

export interface TelemetryContext {
  readonly kind: 'self' | 'admin';
  readonly userId?: string;
}

export interface TelemetryWindowSelection {
  readonly preset: TelemetryRangePreset;
  readonly fromUtc: string;
  readonly toUtc: string;
}

export const DEFAULT_POSITIONS_LIMIT = 500;
export const DEFAULT_EVENTS_LIMIT = 100;
export const DEFAULT_TRIPS_LIMIT = 20;

export function normalizeTelemetryText(value: TelemetryPrimitive | null | undefined): string {
  return value == null || value === '' ? 'No disponible' : String(value);
}

export function buildTelemetryPresetWindow(
  preset: Exclude<TelemetryRangePreset, 'custom'>,
  now = new Date(),
): TelemetryWindowSelection {
  const toUtc = now.toISOString();
  const fromDate = new Date(now);

  switch (preset) {
    case 'hour':
      fromDate.setHours(fromDate.getHours() - 1);
      break;
    case 'week':
      fromDate.setDate(fromDate.getDate() - 7);
      break;
    default:
      fromDate.setDate(fromDate.getDate() - 1);
      break;
  }

  return {
    preset,
    fromUtc: fromDate.toISOString(),
    toUtc,
  };
}

export function toDateTimeInputValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function toIsoFromDateTimeInput(value: string): string {
  return new Date(value).toISOString();
}
