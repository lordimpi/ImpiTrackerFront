import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { Tag } from 'primeng/tag';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { normalizeApiError, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { OpsApiService } from '../data-access/ops-api.service';
import { RawPacketRecordDto } from '../models/ops.model';

@Component({
  selector: 'app-ops-raw-detail-page',
  imports: [ButtonDirective, Card, DatePipe, LoadingSpinnerComponent, Message, RouterLink, Tag],
  templateUrl: './ops-raw-detail-page.component.html',
  styleUrl: './ops-raw-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpsRawDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly opsApi = inject(OpsApiService);

  protected readonly packet = signal<RawPacketRecordDto | null>(null);
  protected readonly pending = signal(true);
  protected readonly notFound = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    void this.load();
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

  protected getParseSeverity(): 'success' | 'warn' | 'danger' {
    const parseStatus = this.packet()?.parseStatus;
    const label = parseStatus ? this.getParseLabel(parseStatus) : 'Rejected';

    if (label === 'Ok') {
      return 'success';
    }

    return label === 'Failed' ? 'warn' : 'danger';
  }

  protected toText(value: string | number | null | undefined): string {
    return value == null || value === '' ? 'No disponible' : String(value);
  }

  private async load(): Promise<void> {
    const packetId = this.route.snapshot.paramMap.get('packetId');

    if (!packetId) {
      this.notFound.set(true);
      this.pending.set(false);
      return;
    }

    try {
      const response = await firstValueFrom(this.opsApi.getRawPacket(packetId));
      this.packet.set(unwrapApiResponse(response));
    } catch (error) {
      const apiError = normalizeApiError(error);

      if (apiError.code === 'resource_not_found' || apiError.status === 404) {
        this.notFound.set(true);
      } else {
        this.errorMessage.set(apiError.message);
      }
    } finally {
      this.pending.set(false);
    }
  }
}
