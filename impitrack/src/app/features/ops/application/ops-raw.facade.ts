import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PagedResult } from '../../admin-users/models/admin-user.model';
import { normalizeApiError, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { OpsApiService } from '../data-access/ops-api.service';
import { OpsRawQuery, RawPacketRecordDto } from '../models/ops.model';

interface OpsRawState {
  readonly packets: readonly RawPacketRecordDto[];
  readonly query: { page: number; pageSize: number };
  readonly totalItems: number;
  readonly totalPages: number;
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
    query: { page: 1, pageSize: 10 },
    totalItems: 0,
    totalPages: 0,
    pendingInitialLoad: false,
    refreshing: false,
    errorMessage: null,
  });

  readonly packets = computed(() => this.state().packets);
  readonly query = computed(() => this.state().query);
  readonly totalItems = computed(() => this.state().totalItems);
  readonly totalPages = computed(() => this.state().totalPages);
  readonly pendingInitialLoad = computed(() => this.state().pendingInitialLoad);
  readonly refreshing = computed(() => this.state().refreshing);
  readonly errorMessage = computed(() => this.state().errorMessage);
  readonly hasPackets = computed(() => this.totalItems() > 0 || this.packets().length > 0);

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
      const pagedResult = unwrapApiResponse(response) as PagedResult<RawPacketRecordDto>;
      this.patchState({
        packets: pagedResult.items,
        query: { page: pagedResult.page, pageSize: pagedResult.pageSize },
        totalItems: pagedResult.totalItems,
        totalPages: pagedResult.totalPages,
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

  async changePage(page: number, pageSize: number, imei?: string): Promise<void> {
    this.patchState({
      query: { page, pageSize },
    });
    await this.load({ page, pageSize, imei });
  }

  private patchState(partial: Partial<OpsRawState>): void {
    this.state.update((state) => ({
      ...state,
      ...partial,
    }));
  }
}
