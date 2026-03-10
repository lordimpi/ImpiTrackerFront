import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthFacade } from '../../../core/auth/application/auth.facade';
import { normalizeApiError, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { DevicesApiService } from '../data-access/devices-api.service';
import { BindDeviceResultDto, UserDeviceBindingDto } from '../models/user-device.model';

interface DevicesState {
  readonly devices: readonly UserDeviceBindingDto[];
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
    pendingInitialLoad: false,
    pendingBind: false,
    pendingUnbindImei: null,
    bindModalVisible: false,
    errorMessage: null,
  });

  readonly devices = computed(() => this.state().devices);
  readonly pendingInitialLoad = computed(() => this.state().pendingInitialLoad);
  readonly pendingBind = computed(() => this.state().pendingBind);
  readonly pendingUnbindImei = computed(() => this.state().pendingUnbindImei);
  readonly bindModalVisible = computed(() => this.state().bindModalVisible);
  readonly errorMessage = computed(() => this.state().errorMessage);
  readonly hasDevices = computed(() => this.devices().length > 0);

  async loadDevices(): Promise<void> {
    if (this.pendingInitialLoad()) {
      return;
    }

    this.patchState({
      pendingInitialLoad: true,
      errorMessage: null,
    });

    try {
      const response = await firstValueFrom(this.devicesApi.getDevices());
      const devices = unwrapApiResponse(response);

      this.patchState({
        devices: this.sortDevices(devices),
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
    const response = await firstValueFrom(this.devicesApi.getDevices());
    const devices = unwrapApiResponse(response);

    this.patchState({
      devices: this.sortDevices(devices),
      errorMessage: null,
    });

    await this.authFacade.refreshProfile();
  }

  private resolveBindOutcome(result: BindDeviceResultDto): BindDeviceOutcome {
    return result.status === 2 ? 'already-bound' : 'bound';
  }

  private sortDevices(devices: readonly UserDeviceBindingDto[]): readonly UserDeviceBindingDto[] {
    return [...devices].sort((left, right) => right.boundAtUtc.localeCompare(left.boundAtUtc));
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
