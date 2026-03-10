import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { normalizeApiError, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { OpsApiService } from '../data-access/ops-api.service';
import { OpsSessionsQuery, SessionRecordDto } from '../models/ops.model';

interface OpsSessionsState {
  readonly sessions: readonly SessionRecordDto[];
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
    pendingInitialLoad: false,
    refreshing: false,
    errorMessage: null,
  });

  readonly sessions = computed(() => this.state().sessions);
  readonly pendingInitialLoad = computed(() => this.state().pendingInitialLoad);
  readonly refreshing = computed(() => this.state().refreshing);
  readonly errorMessage = computed(() => this.state().errorMessage);
  readonly hasSessions = computed(() => this.sessions().length > 0);

  async load(query: OpsSessionsQuery, background = false): Promise<void> {
    if (this.pendingInitialLoad() || this.refreshing()) {
      return;
    }

    this.patchState({
      pendingInitialLoad: !background,
      refreshing: background,
      errorMessage: background ? this.errorMessage() : null,
    });

    try {
      const response = await firstValueFrom(this.opsApi.getActiveSessions(query));
      this.patchState({
        sessions: unwrapApiResponse(response),
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

  private patchState(partial: Partial<OpsSessionsState>): void {
    this.state.update((state) => ({
      ...state,
      ...partial,
    }));
  }
}
