import { DatePipe, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { OpsRawFacade } from '../application/ops-raw.facade';
import { RawPacketRecordDto } from '../models/ops.model';

interface LimitOption {
  readonly label: string;
  readonly value: number;
}

@Component({
  selector: 'app-ops-raw-page',
  imports: [
    ButtonDirective,
    Card,
    DatePipe,
    InputText,
    LoadingSpinnerComponent,
    Message,
    ReactiveFormsModule,
    RouterLink,
    SelectModule,
    TableModule,
    Tag,
  ],
  templateUrl: './ops-raw-page.component.html',
  styleUrl: './ops-raw-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpsRawPageComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly facade = inject(OpsRawFacade);

  private pollingHandle: ReturnType<typeof setInterval> | null = null;

  protected readonly packets = computed(() => [...this.facade.packets()]);
  protected readonly pendingInitialLoad = this.facade.pendingInitialLoad;
  protected readonly refreshing = this.facade.refreshing;
  protected readonly featureError = this.facade.errorMessage;
  protected readonly hasPackets = this.facade.hasPackets;
  protected readonly form = this.formBuilder.group({
    imei: [''],
    limit: [50],
  });
  protected readonly limitOptions: LimitOption[] = [
    { label: '20 registros', value: 20 },
    { label: '50 registros', value: 50 },
    { label: '100 registros', value: 100 },
  ];
  protected readonly filtersSummary = computed(() => {
    const imei = this.form.controls.imei.getRawValue().trim();
    return imei ? `Filtrando IMEI ${imei}` : 'Todos los paquetes recientes';
  });

  async ngOnInit(): Promise<void> {
    await this.load();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  protected async submitFilters(): Promise<void> {
    await this.load();
  }

  protected async clearFilters(): Promise<void> {
    this.form.reset({
      imei: '',
      limit: 50,
    });
    await this.load();
  }

  protected getParseSeverity(packet: RawPacketRecordDto): 'success' | 'warn' | 'danger' {
    const status = this.getParseLabel(packet.parseStatus).toLowerCase();

    if (status === 'ok') {
      return 'success';
    }

    return status === 'failed' ? 'warn' : 'danger';
  }

  protected getParseLabel(parseStatus: string | number): string {
    switch (parseStatus) {
      case 1:
      case 'Ok':
        return 'Ok';
      case 2:
      case 'Failed':
        return 'Failed';
      case 3:
      case 'Rejected':
        return 'Rejected';
      default:
        return String(parseStatus);
    }
  }

  protected getAckSeverity(packet: RawPacketRecordDto): 'success' | 'secondary' {
    return packet.ackSent ? 'success' : 'secondary';
  }

  protected toText(value: string | number | null | undefined): string {
    return value == null || value === '' ? 'No disponible' : String(value);
  }

  private async load(background = false): Promise<void> {
    await this.facade.load(
      {
        imei: this.normalizeOptional(this.form.controls.imei.getRawValue()),
        limit: this.form.controls.limit.getRawValue(),
      },
      background,
    );
  }

  private startPolling(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.pollingHandle = globalThis.setInterval(() => {
      void this.load(true);
    }, 10_000);
  }

  private stopPolling(): void {
    if (this.pollingHandle) {
      globalThis.clearInterval(this.pollingHandle);
      this.pollingHandle = null;
    }
  }

  private normalizeOptional(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}
