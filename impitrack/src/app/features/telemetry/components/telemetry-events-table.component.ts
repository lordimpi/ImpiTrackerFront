import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { DeviceEventDto, normalizeTelemetryText } from '../models/telemetry.model';

@Component({
  selector: 'app-telemetry-events-table',
  imports: [DatePipe, TableModule],
  templateUrl: './telemetry-events-table.component.html',
  styleUrl: './telemetry-events-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelemetryEventsTableComponent {
  readonly events = input<readonly DeviceEventDto[]>([]);
  protected readonly rows = computed(() => [...this.events()]);

  protected readonly normalizeText = normalizeTelemetryText;
}
