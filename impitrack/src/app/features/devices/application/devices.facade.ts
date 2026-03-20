import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthFacade } from '../../../core/auth/application/auth.facade';
import { normalizeApiError, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { DevicesApiService } from '../data-access/devices-api.service';
import {
  BindDeviceResultDto,
  UserDeviceBindingDto,
  UserDevicesQuery,
} from '../models/user-device.model';

interface DevicesState {
  readonly devices: readonly UserDeviceBindingDto[];
  readonly devicesQuery: UserDevicesQuery;
  readonly totalDevices: number;
  readonly totalDevicePages: number;
  readonly pendingInitialLoad: boolean;
  readonly pendingBind: boolean;
  readonly pendingUnbindImei: string | null;
  readonly bindModalVisible: boolean;
  readonly errorMessage: string | null;
}

export type BindDeviceOutcome = 'bound' | 'already-bound';

@Injectable({
  providedIn: 'root',
})
export class DevicesFacade {
  private readonly devicesApi = inject(DevicesApiService);
  private readonly authFacade = inject(AuthFacade);

  private readonly state = signal<DevicesState>({
    devices: [],
    devicesQuery: { page: 1, pageSize: 10 },
    totalDevices: 0,
    totalDevicePages: 0,
    pendingInitialLoad: false,
    pendingBind: false,
    pendingUnbindImei: null,
    bindModalVisible: false,
    errorMessage: null,
  });

  readonly devices = computed(() => this.state().devices);
  readonly devicesQuery = computed(() => this.state().devicesQuery);
  readonly totalDevices = computed(() => this.state().totalDevices);
  readonly totalDevicePages = computed(() => this.state().totalDevicePages);
  readonly pendingInitialLoad = computed(() => this.state().pendingInitialLoad);
  readonly pendingBind = computed(() => this.state().pendingBind);
  readonly pendingUnbindImei = computed(() => this.state().pendingUnbindImei);
  readonly bindModalVisible = computed(() => this.state().bindModalVisible);
  readonly errorMessage = computed(() => this.state().errorMessage);
  readonly hasDevices = computed(() => this.totalDevices() > 0 || this.devices().length > 0);

  async loadDevices(): Promise<void> {
    if (this.pendingInitialLoad()) {
      return;
    }

    this.patchState({
      pendingInitialLoad: true,
      errorMessage: null,
    });

    try {
      const query = this.state().devicesQuery;
      const response = await firstValueFrom(this.devicesApi.getDevices(query));
      const pagedResult = unwrapApiResponse(response);

      this.patchState({
        devices: pagedResult.items,
        totalDevices: pagedResult.totalItems,
        totalDevicePages: pagedResult.totalPages,
      });
    } catch (error) {
      this.patchState({
        errorMessage: this.getFriendlyError(error),
      });
    } finally {
      this.patchState({
        pendingInitialLoad: false,
      });
    }
  }

  async changeDevicesPage(page: number, pageSize: number, search?: string): Promise<void> {
    this.patchState({
      devicesQuery: { page, pageSize, search },
    });

    await this.loadDevices();
  }

  openBindModal(): void {
    this.patchState({
      bindModalVisible: true,
    });
  }

  closeBindModal(): void {
    if (this.pendingBind()) {
      return;
    }

    this.patchState({
      bindModalVisible: false,
    });
  }

  async bindDevice(rawImei: string): Promise<BindDeviceOutcome> {
    this.patchState({
      pendingBind: true,
      errorMessage: null,
    });

    try {
      const response = await firstValueFrom(
        this.devicesApi.bindDevice({
          imei: rawImei.trim(),
        }),
      );
      const result = unwrapApiResponse(response);

      await this.loadDevicesSnapshot();
      this.patchState({
        bindModalVisible: false,
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
    this.patchState({
      pendingUnbindImei: imei,
      errorMessage: null,
    });

    try {
      await firstValueFrom(this.devicesApi.unbindDevice(imei));
      await this.loadDevicesSnapshot();
    } catch (error) {
      throw normalizeApiError(error);
    } finally {
      this.patchState({
        pendingUnbindImei: null,
      });
    }
  }

  private async loadDevicesSnapshot(): Promise<void> {
    const query = this.state().devicesQuery;
    const response = await firstValueFrom(this.devicesApi.getDevices(query));
    const pagedResult = unwrapApiResponse(response);

    this.patchState({
      devices: pagedResult.items,
      totalDevices: pagedResult.totalItems,
      totalDevicePages: pagedResult.totalPages,
      errorMessage: null,
    });

    await this.authFacade.refreshProfile();
  }

  private resolveBindOutcome(result: BindDeviceResultDto): BindDeviceOutcome {
    return result.status === 2 ? 'already-bound' : 'bound';
  }

  private getFriendlyError(error: unknown): string {
    const apiError = normalizeApiError(error);

    switch (apiError.code) {
      case 'plan_quota_exceeded':
        return 'Tu plan actual no permite vincular mas dispositivos.';
      case 'imei_owned_by_another_user':
        return 'El IMEI ingresado ya esta vinculado a otro usuario.';
      case 'missing_active_plan':
        return 'Necesitas un plan activo para vincular dispositivos.';
      case 'device_binding_not_found':
        return 'No existe un vinculo activo para el IMEI indicado.';
      default:
        return apiError.message;
    }
  }

  private patchState(partial: Partial<DevicesState>): void {
    this.state.update((state) => ({
      ...state,
      ...partial,
    }));
  }
}
