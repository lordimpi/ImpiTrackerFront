import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TripSummaryDto } from '../models/telemetry.model';

@Component({
  selector: 'app-telemetry-trips-list',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './telemetry-trips-list.component.html',
  styleUrl: './telemetry-trips-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelemetryTripsListComponent {
  readonly trips = input<readonly TripSummaryDto[]>([]);
  readonly selectedTripId = input<string | null>(null);
  readonly pendingSelection = input(false);
  readonly selectTrip = output<string>();

  protected openTrip(tripId: string): void {
    this.selectTrip.emit(tripId);
  }
}
