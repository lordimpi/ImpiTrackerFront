import { DatePipe, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Paginator } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { firstValueFrom } from 'rxjs';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { normalizeApiError, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { OpsApiService } from '../data-access/ops-api.service';
import { OpsRawFacade } from '../application/ops-raw.facade';
import { RawPacketRecordDto } from '../models/ops.model';

@Component({
  selector: 'app-ops-raw-page',
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
    RouterLinkActive,
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
  private readonly opsApi = inject(OpsApiService);

  private pollingHandle: ReturnType<typeof setInterval> | null = null;

  protected readonly packets = computed(() => [...this.facade.packets()]);
  protected readonly pendingInitialLoad = this.facade.pendingInitialLoad;
  protected readonly refreshing = this.facade.refreshing;
  protected readonly featureError = this.facade.errorMessage;
  protected readonly hasPackets = this.facade.hasPackets;
  protected readonly query = this.facade.query;
  protected readonly totalItems = this.facade.totalItems;
  protected readonly totalPages = this.facade.totalPages;
  protected readonly form = this.formBuilder.group({
    imei: [''],
  });
  protected readonly pageSizeOptions = [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
  ];
  protected readonly detailVisible = signal(false);
  protected readonly detailPacket = signal<RawPacketRecordDto | null>(null);
  protected readonly detailPending = signal(false);
  protected readonly detailError = signal<string | null>(null);
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
    const { page, pageSize } = this.query();
    await this.facade.changePage(1, pageSize, this.getImeiParam());
  }

  protected async clearFilters(): Promise<void> {
    this.form.reset({ imei: '' });
    const { pageSize } = this.query();
    await this.facade.changePage(1, pageSize);
  }

  protected changeRawPage(event: { page?: number; rows?: number }): void {
    const currentQuery = this.query();
    void this.facade.changePage(
      (event.page ?? 0) + 1,
      event.rows ?? currentQuery.pageSize,
      this.getImeiParam(),
    );
  }

  protected changePageSize(pageSize: number): void {
    void this.facade.changePage(1, pageSize, this.getImeiParam());
  }

  protected async openDetail(packetId: string): Promise<void> {
    this.detailPacket.set(null);
    this.detailError.set(null);
    this.detailPending.set(true);
    this.detailVisible.set(true);

    try {
      const response = await firstValueFrom(this.opsApi.getRawPacket(packetId));
      this.detailPacket.set(unwrapApiResponse(response));
    } catch (error) {
      this.detailError.set(normalizeApiError(error).message);
    } finally {
      this.detailPending.set(false);
    }
  }

  protected closeDetail(): void {
    this.detailVisible.set(false);
  }

  protected getDetailParseSeverity(): 'success' | 'warn' | 'danger' {
    const packet = this.detailPacket();
    if (!packet) return 'danger';
    return this.getParseSeverity(packet);
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
    const { page, pageSize } = this.query();
    await this.facade.load(
      {
        page,
        pageSize,
        imei: this.getImeiParam(),
      },
      background,
    );
  }

  private getImeiParam(): string | undefined {
    const trimmed = this.form.controls.imei.getRawValue().trim();
    return trimmed.length > 0 ? trimmed : undefined;
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
}
