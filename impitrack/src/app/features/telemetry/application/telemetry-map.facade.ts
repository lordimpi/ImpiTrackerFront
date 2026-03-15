import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { normalizeApiError, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { TelemetryApiService } from '../data-access/telemetry-api.service';
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

  private patchState(partial: Partial<TelemetryMapState>): void {
    this.state.update((state) => ({
      ...state,
      ...partial,
    }));
  }
}
