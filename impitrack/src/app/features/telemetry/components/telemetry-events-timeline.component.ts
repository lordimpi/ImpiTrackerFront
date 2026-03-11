import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tag } from 'primeng/tag';
import { DeviceEventDto, normalizeTelemetryText } from '../models/telemetry.model';

type TimelineSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

@Component({
  selector: 'app-telemetry-events-timeline',
  imports: [DatePipe, Tag],
  templateUrl: './telemetry-events-timeline.component.html',
  styleUrl: './telemetry-events-timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelemetryEventsTimelineComponent {
  readonly events = input<readonly DeviceEventDto[]>([]);
  protected readonly rows = computed(() => [...this.events()]);
  protected readonly normalizeText = normalizeTelemetryText;

  protected severityFor(eventCode: string): TimelineSeverity {
    const normalized = eventCode.trim().toLowerCase();

    if (
      normalized.includes('alarm') ||
      normalized.includes('panic') ||
      normalized.includes('sos') ||
      normalized.includes('tamper') ||
      normalized.includes('fail') ||
      normalized.includes('error') ||
      normalized.includes('invalid')
    ) {
      return 'danger';
    }

    if (normalized.includes('heartbeat')) {
      return 'success';
    }

    if (normalized.includes('tracking') || normalized.includes('position')) {
      return 'info';
    }

    if (normalized.includes('login') || normalized.includes('connect')) {
      return 'warn';
    }

    return 'secondary';
  }
}
