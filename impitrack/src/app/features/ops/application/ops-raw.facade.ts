import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { normalizeApiError, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { OpsApiService } from '../data-access/ops-api.service';
import { OpsRawQuery, RawPacketRecordDto } from '../models/ops.model';

interface OpsRawState {
  readonly packets: readonly RawPacketRecordDto[];
  readonly pendingInitialLoad: boolean;
  readonly refreshing: boolean;
  readonly errorMessage: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class OpsRawFacade {
  private readonly opsApi = inject(OpsApiService);
  private readonly state = signal<OpsRawState>({
    packets: [],
    pendingInitialLoad: false,
    refreshing: false,
    errorMessage: null,
  });

  readonly packets = computed(() => this.state().packets);
  readonly pendingInitialLoad = computed(() => this.state().pendingInitialLoad);
  readonly refreshing = computed(() => this.state().refreshing);
  readonly errorMessage = computed(() => this.state().errorMessage);
  readonly hasPackets = computed(() => this.packets().length > 0);

  async load(query: OpsRawQuery, background = false): Promise<void> {
    if (this.pendingInitialLoad() || this.refreshing()) {
      return;
    }

    this.patchState({
      pendingInitialLoad: !background,
      refreshing: background,
      errorMessage: background ? this.errorMessage() : null,
    });

    try {
      const response = await firstValueFrom(this.opsApi.getLatestRaw(query));
      this.patchState({
        packets: unwrapApiResponse(response),
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

  private patchState(partial: Partial<OpsRawState>): void {
    this.state.update((state) => ({
      ...state,
      ...partial,
    }));
  }
}
