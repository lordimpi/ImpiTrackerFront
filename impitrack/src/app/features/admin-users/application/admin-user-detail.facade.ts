import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { normalizeApiError, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { AdminUsersApiService } from '../data-access/admin-users-api.service';
import {
  AdminPlanDto,
  AdminUserDetailDto,
  AdminUserDeviceDto,
  AdminUserDevicesQuery,
  BindAdminDeviceResultDto,
} from '../models/admin-user.model';

interface AdminUserDetailState {
  readonly userId: string | null;
  readonly user: AdminUserDetailDto | null;
  readonly devices: readonly AdminUserDeviceDto[];
  readonly devicesQuery: AdminUserDevicesQuery;
  readonly totalDevices: number;
  readonly totalDevicePages: number;
  readonly plans: readonly AdminPlanDto[];
  readonly pendingInitialLoad: boolean;
  readonly pendingPlanChange: boolean;
  readonly pendingBind: boolean;
  readonly pendingUnbindImei: string | null;
  readonly changePlanModalVisible: boolean;
  readonly bindDeviceModalVisible: boolean;
  readonly errorMessage: string | null;
  readonly notFound: boolean;
}

export type AdminBindDeviceOutcome = 'bound' | 'already-bound';

@Injectable({
  providedIn: 'root',
})
export class AdminUserDetailFacade {
  private readonly adminUsersApi = inject(AdminUsersApiService);

  private readonly state = signal<AdminUserDetailState>({
    userId: null,
    user: null,
    devices: [],
    devicesQuery: { page: 1, pageSize: 10 },
    totalDevices: 0,
    totalDevicePages: 0,
    plans: [],
    pendingInitialLoad: false,
    pendingPlanChange: false,
    pendingBind: false,
    pendingUnbindImei: null,
    changePlanModalVisible: false,
    bindDeviceModalVisible: false,
    errorMessage: null,
    notFound: false,
  });

  readonly userId = computed(() => this.state().userId);
  readonly user = computed(() => this.state().user);
  readonly devices = computed(() => this.state().devices);
  readonly plans = computed(() => this.state().plans);
  readonly pendingInitialLoad = computed(() => this.state().pendingInitialLoad);
  readonly pendingPlanChange = computed(() => this.state().pendingPlanChange);
  readonly pendingBind = computed(() => this.state().pendingBind);
  readonly pendingUnbindImei = computed(() => this.state().pendingUnbindImei);
  readonly changePlanModalVisible = computed(() => this.state().changePlanModalVisible);
  readonly bindDeviceModalVisible = computed(() => this.state().bindDeviceModalVisible);
  readonly errorMessage = computed(() => this.state().errorMessage);
  readonly notFound = computed(() => this.state().notFound);
  readonly devicesQuery = computed(() => this.state().devicesQuery);
  readonly totalDevices = computed(() => this.state().totalDevices);
  readonly totalDevicePages = computed(() => this.state().totalDevicePages);
  readonly hasDevices = computed(() => this.state().totalDevices > 0 || this.devices().length > 0);

  async initialize(userId: string): Promise<void> {
    if (!userId.trim()) {
      this.patchState({
        notFound: true,
        user: null,
        devices: [],
      });
      return;
    }

    this.patchState({
      userId,
      pendingInitialLoad: true,
      errorMessage: null,
      notFound: false,
    });

    try {
      const devicesQuery = this.state().devicesQuery;
      const [userResponse, devicesResponse, plansResponse] = await Promise.all([
        firstValueFrom(this.adminUsersApi.getUserSummary(userId)),
        firstValueFrom(this.adminUsersApi.getUserDevices(userId, devicesQuery)),
        firstValueFrom(this.adminUsersApi.getPlans()),
      ]);

      const pagedDevices = unwrapApiResponse(devicesResponse);
      this.patchState({
        user: unwrapApiResponse(userResponse),
        devices: pagedDevices.items,
        totalDevices: pagedDevices.totalItems,
        totalDevicePages: pagedDevices.totalPages,
        plans: unwrapApiResponse(plansResponse),
      });
    } catch (error) {
      this.handleLoadError(error);
    } finally {
      this.patchState({
        pendingInitialLoad: false,
      });
    }
  }

  openPlanModal(): void {
    this.patchState({
      changePlanModalVisible: true,
    });
  }

  closePlanModal(): void {
    if (this.pendingPlanChange()) {
      return;
    }

    this.patchState({
      changePlanModalVisible: false,
    });
  }

  openBindModal(): void {
    this.patchState({
      bindDeviceModalVisible: true,
    });
  }

  closeBindModal(): void {
    if (this.pendingBind()) {
      return;
    }

    this.patchState({
      bindDeviceModalVisible: false,
    });
  }

  async changePlan(planCode: string): Promise<void> {
    const userId = this.userId();
    if (!userId) {
      return;
    }

    this.patchState({
      pendingPlanChange: true,
      errorMessage: null,
    });

    try {
      const response = await firstValueFrom(this.adminUsersApi.setUserPlan(userId, { planCode }));
      this.patchState({
        user: unwrapApiResponse(response),
        changePlanModalVisible: false,
      });
    } catch (error) {
      throw normalizeApiError(error);
    } finally {
      this.patchState({
        pendingPlanChange: false,
      });
    }
  }

  async bindDevice(rawImei: string): Promise<AdminBindDeviceOutcome> {
    const userId = this.userId();
    if (!userId) {
      return 'already-bound';
    }

    this.patchState({
      pendingBind: true,
      errorMessage: null,
    });

    try {
      const response = await firstValueFrom(
        this.adminUsersApi.bindUserDevice(userId, {
          imei: rawImei.trim(),
        }),
      );
      const result = unwrapApiResponse(response);

      await this.refreshUserData();
      this.patchState({
        bindDeviceModalVisible: false,
      });

      return this.resolveBindOutcome(result);
    } catch (error) {
      throw normalizeApiError(error);
    } finally {
      this.patchState({
        pendingBind: false,
      });
    }
  }

  async unbindDevice(imei: string): Promise<void> {
    const userId = this.userId();
    if (!userId) {
      return;
    }

    this.patchState({
      pendingUnbindImei: imei,
      errorMessage: null,
    });

    try {
      await firstValueFrom(this.adminUsersApi.unbindUserDevice(userId, imei));
      await this.refreshUserData();
    } catch (error) {
      throw normalizeApiError(error);
    } finally {
      this.patchState({
        pendingUnbindImei: null,
      });
    }
  }

  async retry(): Promise<void> {
    const userId = this.userId();
    if (!userId) {
      return;
    }

    await this.initialize(userId);
  }

  async changeDevicesPage(page: number, pageSize: number, search?: string): Promise<void> {
    const userId = this.userId();
    if (!userId) {
      return;
    }

    const devicesQuery: AdminUserDevicesQuery = { page, pageSize, search };
    this.patchState({ devicesQuery });

    const devicesResponse = await firstValueFrom(
      this.adminUsersApi.getUserDevices(userId, devicesQuery),
    );
    const pagedDevices = unwrapApiResponse(devicesResponse);

    this.patchState({
      devices: pagedDevices.items,
      totalDevices: pagedDevices.totalItems,
      totalDevicePages: pagedDevices.totalPages,
    });
  }

  private async refreshUserData(): Promise<void> {
    const userId = this.userId();
    if (!userId) {
      return;
    }

    const devicesQuery = this.state().devicesQuery;
    const [userResponse, devicesResponse] = await Promise.all([
      firstValueFrom(this.adminUsersApi.getUserSummary(userId)),
      firstValueFrom(this.adminUsersApi.getUserDevices(userId, devicesQuery)),
    ]);

    const pagedDevices = unwrapApiResponse(devicesResponse);
    this.patchState({
      user: unwrapApiResponse(userResponse),
      devices: pagedDevices.items,
      totalDevices: pagedDevices.totalItems,
      totalDevicePages: pagedDevices.totalPages,
      errorMessage: null,
      notFound: false,
    });
  }

  private resolveBindOutcome(result: BindAdminDeviceResultDto): AdminBindDeviceOutcome {
    return result.status === 2 ? 'already-bound' : 'bound';
  }

  private handleLoadError(error: unknown): void {
    const apiError = normalizeApiError(error);

    if (apiError.code === 'user_not_found') {
      this.patchState({
        notFound: true,
        user: null,
        devices: [],
        errorMessage: null,
      });
      return;
    }

    this.patchState({
      errorMessage: apiError.message,
      notFound: false,
    });
  }

  private patchState(partial: Partial<AdminUserDetailState>): void {
    this.state.update((state) => ({
      ...state,
      ...partial,
    }));
  }
}
