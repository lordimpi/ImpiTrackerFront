import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TripDetailDto } from '../models/telemetry.model';

@Component({
  selector: 'app-telemetry-trip-summary',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './telemetry-trip-summary.component.html',
  styleUrl: './telemetry-trip-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelemetryTripSummaryComponent {
  readonly trip = input.required<TripDetailDto>();
}
