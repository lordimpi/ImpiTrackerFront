import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { TelemetryDeviceSummaryDto, normalizeTelemetryText } from '../models/telemetry.model';

@Component({
  selector: 'app-telemetry-device-list',
  imports: [ButtonDirective, DatePipe, Tag],
  templateUrl: './telemetry-device-list.component.html',
  styleUrl: './telemetry-device-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelemetryDeviceListComponent {
  readonly devices = input<readonly TelemetryDeviceSummaryDto[]>([]);
  readonly openTelemetry = output<string>();

  protected readonly normalizeText = normalizeTelemetryText;

  protected viewTelemetry(imei: string): void {
    this.openTelemetry.emit(imei);
  }
}
