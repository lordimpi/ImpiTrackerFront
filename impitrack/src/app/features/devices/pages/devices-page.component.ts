import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { AuthFacade } from '../../../core/auth/application/auth.facade';
import { ApiError } from '../../../shared/models/api-error.model';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { normalizeApiError } from '../../../shared/utils/api-response.util';
import { BindDeviceOutcome, DevicesFacade } from '../application/devices.facade';

@Component({
  selector: 'app-devices-page',
  imports: [
    ButtonDirective,
    Card,
    DatePipe,
    Dialog,
    InputText,
    LoadingSpinnerComponent,
    Message,
    ReactiveFormsModule,
    TableModule,
    Tag,
  ],
  templateUrl: './devices-page.component.html',
  styleUrl: './devices-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevicesPageComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly devicesFacade = inject(DevicesFacade);
  private readonly authFacade = inject(AuthFacade);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly user = this.authFacade.user;
  protected readonly devices = computed(() => [...this.devicesFacade.devices()]);
  protected readonly pendingInitialLoad = this.devicesFacade.pendingInitialLoad;
  protected readonly pendingBind = this.devicesFacade.pendingBind;
  protected readonly pendingUnbindImei = this.devicesFacade.pendingUnbindImei;
  protected readonly bindModalVisible = this.devicesFacade.bindModalVisible;
  protected readonly featureError = this.devicesFacade.errorMessage;
  protected readonly hasDevices = this.devicesFacade.hasDevices;
  protected readonly bindErrorMessage = signal<string | null>(null);
  protected readonly planUsageLabel = computed(() => {
    const currentUser = this.user();

    if (!currentUser) {
      return 'Sin contexto de plan';
    }

    return `${currentUser.usedGps} / ${currentUser.maxGps} GPS usados`;
  });
  protected readonly canBindMore = computed(() => {
    const currentUser = this.user();
    return currentUser ? currentUser.usedGps < currentUser.maxGps : false;
  });
  protected readonly form = this.formBuilder.group({
    imei: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(32)]],
  });

  constructor() {
    if (this.user()) {
      void this.devicesFacade.loadDevices();
    }
  }

  protected openBindModal(): void {
    this.bindErrorMessage.set(null);
    this.form.reset({
      imei: '',
    });
    this.devicesFacade.openBindModal();
  }

  protected closeBindModal(): void {
    this.bindErrorMessage.set(null);
    this.form.reset({
      imei: '',
    });
    this.devicesFacade.closeBindModal();
  }

  protected async retryLoad(): Promise<void> {
    await this.devicesFacade.loadDevices();
  }

  protected async submitBind(): Promise<void> {
    if (this.form.invalid || this.pendingBind()) {
      this.form.markAllAsTouched();
      return;
    }

    this.bindErrorMessage.set(null);

    try {
      const outcome = await this.devicesFacade.bindDevice(this.form.controls.imei.getRawValue());
      this.form.reset({
        imei: '',
      });
      this.publishBindMessage(outcome);
    } catch (error) {
      this.bindErrorMessage.set(this.getFriendlyError(normalizeApiError(error)));
    }
  }

  protected confirmUnbind(imei: string): void {
    this.confirmationService.confirm({
      header: 'Desvincular dispositivo',
      message: `Se quitara el IMEI ${imei} de tu cuenta actual.`,
      acceptLabel: 'Desvincular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        void this.handleUnbind(imei);
      },
    });
  }

  protected isUnbinding(imei: string): boolean {
    return this.pendingUnbindImei() === imei;
  }

  private async handleUnbind(imei: string): Promise<void> {
    try {
      await this.devicesFacade.unbindDevice(imei);
      this.messageService.add({
        severity: 'success',
        summary: 'Dispositivo desvinculado',
        detail: `El IMEI ${imei} fue retirado de tu cuenta.`,
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'No fue posible desvincular',
        detail: this.getFriendlyError(normalizeApiError(error)),
      });
    }
  }

  private publishBindMessage(outcome: BindDeviceOutcome): void {
    if (outcome === 'already-bound') {
      this.messageService.add({
        severity: 'info',
        summary: 'IMEI ya vinculado',
        detail: 'Ese IMEI ya estaba asociado a tu cuenta.',
      });
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Dispositivo vinculado',
      detail: 'El IMEI fue agregado a tu lista de dispositivos.',
    });
  }

  private getFriendlyError(apiError: ApiError): string {
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
}
