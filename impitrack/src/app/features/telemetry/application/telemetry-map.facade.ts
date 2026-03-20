import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { normalizeApiError, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { TelemetryApiService } from '../data-access/telemetry-api.service';
import { TelemetryHubService } from '../data-access/telemetry-hub.service';
import { TelemetryDeviceSummaryDto } from '../models/telemetry.model';

interface TelemetryMapState {
  readonly devices: readonly TelemetryDeviceSummaryDto[];
  readonly pendingInitialLoad: boolean;
  readonly refreshing: boolean;
  readonly errorMessage: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class TelemetryMapFacade {
  private readonly telemetryApi = inject(TelemetryApiService);
  private readonly hub = inject(TelemetryHubService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly state = signal<TelemetryMapState>({
    devices: [],
    pendingInitialLoad: false,
    refreshing: false,
    errorMessage: null,
  });

  readonly devices = computed(() => this.state().devices);
  readonly pendingInitialLoad = computed(() => this.state().pendingInitialLoad);
  readonly refreshing = computed(() => this.state().refreshing);
  readonly errorMessage = computed(() => this.state().errorMessage);
  readonly hasDevices = computed(() => this.devices().length > 0);
  readonly hasMappableDevices = computed(() =>
    this.devices().some((device) => device.lastPosition !== null),
  );
  readonly hubConnected = this.hub.connected;
  readonly hubReconnecting = this.hub.reconnecting;

  constructor() {
    this.hub.positionUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.state.update((state) => ({
          ...state,
          devices: state.devices.map((device) => {
            if (device.imei !== event.imei) return device;
            return {
              ...device,
              lastSeenAtUtc: event.occurredAtUtc,
              lastPosition: {
                occurredAtUtc: event.occurredAtUtc,
                receivedAtUtc: event.occurredAtUtc,
                gpsTimeUtc: device.lastPosition?.gpsTimeUtc ?? null,
                latitude: event.latitude ?? device.lastPosition?.latitude ?? 0,
                longitude: event.longitude ?? device.lastPosition?.longitude ?? 0,
                speedKmh: event.speedKmh ?? null,
                headingDeg: event.headingDeg ?? null,
                packetId: device.lastPosition?.packetId ?? '',
                sessionId: device.lastPosition?.sessionId ?? '',
              },
            };
          }),
        }));
      });

    this.hub.deviceStatusChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.state.update((state) => ({
          ...state,
          devices: state.devices.map((device) => {
            if (device.imei !== event.imei) return device;
            return { ...device, lastSeenAtUtc: event.changedAtUtc };
          }),
        }));
      });
  }

  async load(background = false): Promise<void> {
    if (this.pendingInitialLoad() || this.refreshing()) {
      return;
    }

    this.patchState({
      pendingInitialLoad: !background,
      refreshing: background,
      errorMessage: background ? this.errorMessage() : null,
    });

    try {
      const response = await firstValueFrom(this.telemetryApi.getMyDeviceSummaries());
      const devices = unwrapApiResponse(response);
      this.patchState({
        devices: [...devices].sort((left, right) => left.imei.localeCompare(right.imei)),
        errorMessage: null,
      });
      this.hub.connect();
    } catch (error) {
      this.patchState({
        errorMessage: normalizeApiError(error).message,
      });
    } finally {
      this.patchState({
        pendingInitialLoad: false,
        refreshing: false,
      });
    }
  }

  async disconnect(): Promise<void> {
    await this.hub.disconnect();
  }

  private patchState(partial: Partial<TelemetryMapState>): void {
    this.state.update((state) => ({
      ...state,
      ...partial,
    }));
  }
}
