import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { normalizeApiError, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { PagedResult } from '../../admin-users/models/admin-user.model';
import { OpsApiService } from '../data-access/ops-api.service';
import { SessionRecordDto } from '../models/ops.model';

interface OpsSessionsState {
  readonly sessions: readonly SessionRecordDto[];
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
export class OpsSessionsFacade {
  private readonly opsApi = inject(OpsApiService);
  private readonly state = signal<OpsSessionsState>({
    sessions: [],
    query: { page: 1, pageSize: 10 },
    totalItems: 0,
    totalPages: 0,
    pendingInitialLoad: false,
    refreshing: false,
    errorMessage: null,
  });

  readonly sessions = computed(() => this.state().sessions);
  readonly query = computed(() => this.state().query);
  readonly totalItems = computed(() => this.state().totalItems);
  readonly totalPages = computed(() => this.state().totalPages);
  readonly pendingInitialLoad = computed(() => this.state().pendingInitialLoad);
  readonly refreshing = computed(() => this.state().refreshing);
  readonly errorMessage = computed(() => this.state().errorMessage);
  readonly hasSessions = computed(() => this.totalItems() > 0 || this.sessions().length > 0);

  async load(port: number | undefined, background = false): Promise<void> {
    if (this.pendingInitialLoad() || this.refreshing()) {
      return;
    }

    this.patchState({
      pendingInitialLoad: !background,
      refreshing: background,
      errorMessage: background ? this.errorMessage() : null,
    });

    try {
      const { page, pageSize } = this.state().query;
      const response = await firstValueFrom(
        this.opsApi.getActiveSessions({ page, pageSize, port }),
      );
      const pagedResult = unwrapApiResponse(response) as PagedResult<SessionRecordDto>;
      this.patchState({
        sessions: pagedResult.items,
        totalItems: pagedResult.totalItems,
        totalPages: pagedResult.totalPages,
        query: { page: pagedResult.page, pageSize: pagedResult.pageSize },
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

  changePage(page: number, pageSize: number): void {
    this.patchState({
      query: { page, pageSize },
    });
  }

  private patchState(partial: Partial<OpsSessionsState>): void {
    this.state.update((state) => ({
      ...state,
      ...partial,
    }));
  }
}
