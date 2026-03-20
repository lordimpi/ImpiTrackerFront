import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { normalizeApiError, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { OpsApiService } from '../data-access/ops-api.service';
import { ErrorAggregateDto, OpsErrorGroupBy } from '../models/ops.model';

interface OpsErrorsFilterParams {
  readonly from: string;
  readonly to: string;
  readonly groupBy: OpsErrorGroupBy;
}

interface OpsErrorsState {
  readonly groups: readonly ErrorAggregateDto[];
  readonly query: { page: number; pageSize: number };
  readonly totalItems: number;
  readonly totalPages: number;
  readonly filterParams: OpsErrorsFilterParams | null;
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
    query: { page: 1, pageSize: 10 },
    totalItems: 0,
    totalPages: 0,
    filterParams: null,
    pendingInitialLoad: false,
    errorMessage: null,
  });

  readonly groups = computed(() => this.state().groups);
  readonly pendingInitialLoad = computed(() => this.state().pendingInitialLoad);
  readonly errorMessage = computed(() => this.state().errorMessage);
  readonly hasGroups = computed(() => this.state().totalItems > 0 || this.groups().length > 0);
  readonly query = computed(() => this.state().query);
  readonly totalItems = computed(() => this.state().totalItems);
  readonly totalPages = computed(() => this.state().totalPages);

  async load(filterParams: OpsErrorsFilterParams): Promise<void> {
    if (this.pendingInitialLoad()) {
      return;
    }

    this.patchState({
      pendingInitialLoad: true,
      errorMessage: null,
      filterParams,
      query: { page: 1, pageSize: this.state().query.pageSize },
    });

    try {
      const { page, pageSize } = this.state().query;
      const response = await firstValueFrom(
        this.opsApi.getTopErrors({ page, pageSize, ...filterParams }),
      );
      const pagedResult = unwrapApiResponse(response);
      this.patchState({
        groups: pagedResult.items,
        totalItems: pagedResult.totalItems,
        totalPages: pagedResult.totalPages,
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

  async changePage(page: number, pageSize: number): Promise<void> {
    const filterParams = this.state().filterParams;
    if (!filterParams || this.pendingInitialLoad()) {
      return;
    }

    this.patchState({
      query: { page, pageSize },
      pendingInitialLoad: true,
      errorMessage: null,
    });

    try {
      const response = await firstValueFrom(
        this.opsApi.getTopErrors({ page, pageSize, ...filterParams }),
      );
      const pagedResult = unwrapApiResponse(response);
      this.patchState({
        groups: pagedResult.items,
        totalItems: pagedResult.totalItems,
        totalPages: pagedResult.totalPages,
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
