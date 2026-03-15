import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { normalizeApiError, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { OpsApiService } from '../data-access/ops-api.service';
import { ErrorAggregateDto, OpsErrorsQuery } from '../models/ops.model';

interface OpsErrorsState {
  readonly groups: readonly ErrorAggregateDto[];
  readonly pendingInitialLoad: boolean;
  readonly errorMessage: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class OpsErrorsFacade {
  private readonly opsApi = inject(OpsApiService);
  private readonly state = signal<OpsErrorsState>({
    groups: [],
    pendingInitialLoad: false,
    errorMessage: null,
  });

  readonly groups = computed(() => this.state().groups);
  readonly pendingInitialLoad = computed(() => this.state().pendingInitialLoad);
  readonly errorMessage = computed(() => this.state().errorMessage);
  readonly hasGroups = computed(() => this.groups().length > 0);

  async load(query: OpsErrorsQuery): Promise<void> {
    if (this.pendingInitialLoad()) {
      return;
    }

    this.patchState({
      pendingInitialLoad: true,
      errorMessage: null,
    });

    try {
      const response = await firstValueFrom(this.opsApi.getTopErrors(query));
      this.patchState({
        groups: unwrapApiResponse(response),
      });
    } catch (error) {
      this.patchState({
        errorMessage: normalizeApiError(error).message,
      });
    } finally {
      this.patchState({
        pendingInitialLoad: false,
      });
    }
  }

  private patchState(partial: Partial<OpsErrorsState>): void {
    this.state.update((state) => ({
      ...state,
      ...partial,
    }));
  }
}
