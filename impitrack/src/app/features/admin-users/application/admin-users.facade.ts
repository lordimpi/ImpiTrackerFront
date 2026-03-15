import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { normalizeApiError, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { AdminUsersApiService } from '../data-access/admin-users-api.service';
import {
  AdminPlanDto,
  AdminUserListItemDto,
  AdminUserListQuery,
  PagedResult,
} from '../models/admin-user.model';

interface AdminUsersListState {
  readonly users: readonly AdminUserListItemDto[];
  readonly plans: readonly AdminPlanDto[];
  readonly query: AdminUserListQuery;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly pendingUsers: boolean;
  readonly pendingPlans: boolean;
  readonly errorMessage: string | null;
}

const DEFAULT_QUERY: AdminUserListQuery = {
  page: 1,
  pageSize: 20,
  sortBy: 'email',
  sortDirection: 'asc',
};

@Injectable({
  providedIn: 'root',
})
export class AdminUsersFacade {
  private readonly adminUsersApi = inject(AdminUsersApiService);

  private readonly state = signal<AdminUsersListState>({
    users: [],
    plans: [],
    query: DEFAULT_QUERY,
    totalItems: 0,
    totalPages: 0,
    pendingUsers: false,
    pendingPlans: false,
    errorMessage: null,
  });

  readonly users = computed(() => this.state().users);
  readonly plans = computed(() => this.state().plans);
  readonly query = computed(() => this.state().query);
  readonly totalItems = computed(() => this.state().totalItems);
  readonly totalPages = computed(() => this.state().totalPages);
  readonly pendingUsers = computed(() => this.state().pendingUsers);
  readonly pendingPlans = computed(() => this.state().pendingPlans);
  readonly errorMessage = computed(() => this.state().errorMessage);
  readonly pendingInitialLoad = computed(() => this.pendingUsers() || this.pendingPlans());

  async initialize(): Promise<void> {
    await Promise.all([this.loadPlans(), this.loadUsers()]);
  }

  async loadPlans(): Promise<void> {
    if (this.pendingPlans()) {
      return;
    }

    this.patchState({
      pendingPlans: true,
    });

    try {
      const response = await firstValueFrom(this.adminUsersApi.getPlans());
      this.patchState({
        plans: unwrapApiResponse(response),
      });
    } catch (error) {
      this.patchState({
        errorMessage: this.getFriendlyError(error),
      });
    } finally {
      this.patchState({
        pendingPlans: false,
      });
    }
  }

  async loadUsers(): Promise<void> {
    if (this.pendingUsers()) {
      return;
    }

    this.patchState({
      pendingUsers: true,
      errorMessage: null,
    });

    try {
      const response = await firstValueFrom(this.adminUsersApi.getUsers(this.query()));
      const pagedResult = unwrapApiResponse(response);
      this.applyPagedUsers(pagedResult);
    } catch (error) {
      this.patchState({
        errorMessage: this.getFriendlyError(error),
      });
    } finally {
      this.patchState({
        pendingUsers: false,
      });
    }
  }

  async applyQuery(partialQuery: Partial<AdminUserListQuery>): Promise<void> {
    this.patchState({
      query: {
        ...this.query(),
        ...partialQuery,
      },
    });
    await this.loadUsers();
  }

  async resetQuery(): Promise<void> {
    this.patchState({
      query: DEFAULT_QUERY,
    });
    await this.loadUsers();
  }

  private applyPagedUsers(pagedResult: PagedResult<AdminUserListItemDto>): void {
    this.patchState({
      users: pagedResult.items,
      totalItems: pagedResult.totalItems,
      totalPages: pagedResult.totalPages,
      query: {
        ...this.query(),
        page: pagedResult.page,
        pageSize: pagedResult.pageSize,
      },
    });
  }

  private getFriendlyError(error: unknown): string {
    const apiError = normalizeApiError(error);

    switch (apiError.code) {
      case 'invalid_sort_by':
        return 'El campo de ordenamiento solicitado no es valido.';
      case 'invalid_sort_direction':
        return 'La direccion de ordenamiento solicitada no es valida.';
      default:
        return apiError.message;
    }
  }

  private patchState(partial: Partial<AdminUsersListState>): void {
    this.state.update((state) => ({
      ...state,
      ...partial,
    }));
  }
}
