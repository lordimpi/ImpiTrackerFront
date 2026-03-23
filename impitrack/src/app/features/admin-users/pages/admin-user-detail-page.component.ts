import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Paginator } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { ApiError } from '../../../shared/models/api-error.model';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { normalizeApiError } from '../../../shared/utils/api-response.util';
import {
  AdminBindDeviceOutcome,
  AdminUserDetailFacade,
} from '../application/admin-user-detail.facade';

@Component({
  selector: 'app-admin-user-detail-page',
  imports: [
    ButtonDirective,
    Card,
    DatePipe,
    Dialog,
    FormsModule,
    InputText,
    LoadingSpinnerComponent,
    Message,
    Paginator,
    ReactiveFormsModule,
    RouterLink,
    SelectModule,
    TableModule,
    Tag,
  ],
  templateUrl: './admin-user-detail-page.component.html',
  styleUrl: './admin-user-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserDetailPageComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly route = inject(ActivatedRoute);
  private readonly detailFacade = inject(AdminUserDetailFacade);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly user = this.detailFacade.user;
  protected readonly devices = computed(() => [...this.detailFacade.devices()]);
  protected readonly plans = computed(() =>
    this.detailFacade.plans().map((plan) => ({
      label: `${plan.name} (${plan.code}) - ${plan.maxGps} GPS`,
      value: plan.code,
    })),
  );
  protected readonly pendingInitialLoad = this.detailFacade.pendingInitialLoad;
  protected readonly pendingPlanChange = this.detailFacade.pendingPlanChange;
  protected readonly pendingBind = this.detailFacade.pendingBind;
  protected readonly pendingUnbindImei = this.detailFacade.pendingUnbindImei;
  protected readonly changePlanModalVisible = this.detailFacade.changePlanModalVisible;
  protected readonly bindDeviceModalVisible = this.detailFacade.bindDeviceModalVisible;
  protected readonly featureError = this.detailFacade.errorMessage;
  protected readonly notFound = this.detailFacade.notFound;
  protected readonly hasDevices = this.detailFacade.hasDevices;
  protected readonly devicesQuery = this.detailFacade.devicesQuery;
  protected readonly totalDevices = this.detailFacade.totalDevices;
  protected readonly totalDevicePages = this.detailFacade.totalDevicePages;
  protected readonly pageSizeOptions = [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
  ];
  protected expandedRows: Record<string, boolean> = {};

  protected toggleRow(device: any): void {
    const key = device.imei;
    if (this.expandedRows[key]) {
      delete this.expandedRows[key];
    } else {
      this.expandedRows[key] = true;
    }
    this.expandedRows = { ...this.expandedRows };
  }

  protected readonly searchValue = signal('');
  protected readonly planErrorMessage = signal<string | null>(null);
  protected readonly bindErrorMessage = signal<string | null>(null);
  protected readonly planUsageLabel = computed(() => {
    const currentUser = this.user();

    if (!currentUser) {
      return 'Sin datos';
    }

    return `${currentUser.usedGps} / ${currentUser.maxGps} GPS usados`;
  });
  protected readonly planForm = this.formBuilder.group({
    planCode: ['', [Validators.required]],
  });
  protected readonly bindForm = this.formBuilder.group({
    imei: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(32)]],
  });

  constructor() {
    void this.detailFacade.initialize(this.route.snapshot.paramMap.get('id') ?? '');
  }

  protected openPlanModal(): void {
    this.planErrorMessage.set(null);
    this.planForm.reset({
      planCode: this.user()?.planCode ?? '',
    });
    this.detailFacade.openPlanModal();
  }

  protected closePlanModal(): void {
    this.planErrorMessage.set(null);
    this.detailFacade.closePlanModal();
  }

  protected openBindModal(): void {
    this.bindErrorMessage.set(null);
    this.bindForm.reset({
      imei: '',
    });
    this.detailFacade.openBindModal();
  }

  protected closeBindModal(): void {
    this.bindErrorMessage.set(null);
    this.bindForm.reset({
      imei: '',
    });
    this.detailFacade.closeBindModal();
  }

  protected async retryLoad(): Promise<void> {
    await this.detailFacade.retry();
  }

  protected async submitPlanChange(): Promise<void> {
    if (this.planForm.invalid || this.pendingPlanChange()) {
      this.planForm.markAllAsTouched();
      return;
    }

    this.planErrorMessage.set(null);

    try {
      await this.detailFacade.changePlan(this.planForm.controls.planCode.getRawValue());
      this.messageService.add({
        severity: 'success',
        summary: 'Plan actualizado',
        detail: 'El plan del usuario fue actualizado correctamente.',
      });
    } catch (error) {
      this.planErrorMessage.set(this.getFriendlyError(normalizeApiError(error)));
    }
  }

  protected async submitBind(): Promise<void> {
    if (this.bindForm.invalid || this.pendingBind()) {
      this.bindForm.markAllAsTouched();
      return;
    }

    this.bindErrorMessage.set(null);

    try {
      const outcome = await this.detailFacade.bindDevice(this.bindForm.controls.imei.getRawValue());
      this.bindForm.reset({
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
      message: `Se quitara el IMEI ${imei} de la cuenta seleccionada.`,
      acceptLabel: 'Desvincular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        void this.handleUnbind(imei);
      },
    });
  }

  protected submitSearch(): void {
    const search = this.searchValue().trim() || undefined;
    void this.detailFacade.changeDevicesPage(1, this.devicesQuery().pageSize, search);
  }

  protected clearSearch(): void {
    this.searchValue.set('');
    void this.detailFacade.changeDevicesPage(1, this.devicesQuery().pageSize);
  }

  protected changeDevicesPage(event: { page?: number; rows?: number }): void {
    const query = this.devicesQuery();
    const search = this.searchValue().trim() || undefined;
    void this.detailFacade.changeDevicesPage((event.page ?? 0) + 1, event.rows ?? query.pageSize, search);
  }

  protected changePageSize(pageSize: number): void {
    const search = this.searchValue().trim() || undefined;
    void this.detailFacade.changeDevicesPage(1, pageSize, search);
  }

  protected isUnbinding(imei: string): boolean {
    return this.pendingUnbindImei() === imei;
  }

  private async handleUnbind(imei: string): Promise<void> {
    try {
      await this.detailFacade.unbindDevice(imei);
      this.messageService.add({
        severity: 'success',
        summary: 'Dispositivo desvinculado',
        detail: `El IMEI ${imei} fue retirado de la cuenta.`,
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'No fue posible desvincular',
        detail: this.getFriendlyError(normalizeApiError(error)),
      });
    }
  }

  private publishBindMessage(outcome: AdminBindDeviceOutcome): void {
    if (outcome === 'already-bound') {
      this.messageService.add({
        severity: 'info',
        summary: 'IMEI ya vinculado',
        detail: 'Ese IMEI ya estaba asociado a la cuenta seleccionada.',
      });
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Dispositivo vinculado',
      detail: 'El IMEI fue agregado a la cuenta del usuario.',
    });
  }

  private getFriendlyError(apiError: ApiError): string {
    switch (apiError.code) {
      case 'user_not_found':
        return 'No existe la cuenta solicitada.';
      case 'invalid_plan_code':
        return 'No fue posible asignar el plan solicitado.';
      case 'plan_quota_exceeded':
        return 'El plan actual no permite vincular mas dispositivos.';
      case 'imei_owned_by_another_user':
        return 'El IMEI ingresado ya esta vinculado a otro usuario.';
      case 'missing_active_plan':
        return 'La cuenta no tiene un plan activo para vincular dispositivos.';
      case 'device_binding_not_found':
        return 'No existe un vinculo activo para el IMEI indicado.';
      case 'device_bind_invalid':
        return 'No fue posible procesar la vinculacion solicitada.';
      default:
        return apiError.message;
    }
  }
}
