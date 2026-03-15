import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { normalizeApiError, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { OpsApiService } from '../data-access/ops-api.service';
import { PortIngestionSnapshotDto } from '../models/ops.model';

interface OpsPortsState {
  readonly ports: readonly PortIngestionSnapshotDto[];
  readonly pendingInitialLoad: boolean;
  readonly refreshing: boolean;
  readonly errorMessage: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class OpsPortsFacade {
  private readonly opsApi = inject(OpsApiService);
  private readonly state = signal<OpsPortsState>({
    ports: [],
    pendingInitialLoad: false,
    refreshing: false,
    errorMessage: null,
  });

  readonly ports = computed(() => this.state().ports);
  readonly pendingInitialLoad = computed(() => this.state().pendingInitialLoad);
  readonly refreshing = computed(() => this.state().refreshing);
  readonly errorMessage = computed(() => this.state().errorMessage);
  readonly hasPorts = computed(() => this.ports().length > 0);

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
      const response = await firstValueFrom(this.opsApi.getIngestionPorts());
      this.patchState({
        ports: unwrapApiResponse(response),
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

  private patchState(partial: Partial<OpsPortsState>): void {
    this.state.update((state) => ({
      ...state,
      ...partial,
    }));
  }
}
