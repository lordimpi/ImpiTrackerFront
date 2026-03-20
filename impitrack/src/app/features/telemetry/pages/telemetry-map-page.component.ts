import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { TelemetryMapFacade } from '../application/telemetry-map.facade';
import { TelemetryMapComponent } from '../components/telemetry-map.component';
import { TelemetryMapMarker } from '../models/telemetry.model';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { AuthFacade } from '../../../core/auth/application/auth.facade';

@Component({
  selector: 'app-telemetry-map-page',
  imports: [ButtonDirective, DatePipe, LoadingSpinnerComponent, TelemetryMapComponent],
  templateUrl: './telemetry-map-page.component.html',
  styleUrl: './telemetry-map-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelemetryMapPageComponent implements OnDestroy {
  protected readonly facade = inject(TelemetryMapFacade);
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  protected readonly user = this.authFacade.user;
  protected readonly pendingInitialLoad = this.facade.pendingInitialLoad;
  protected readonly featureError = this.facade.errorMessage;
  protected readonly activeTab = signal<'fleet' | 'events' | 'trips'>('fleet');
  protected readonly panelOpen = signal(false);
  protected readonly hubConnected = this.facade.hubConnected;
  protected readonly hubReconnecting = this.facade.hubReconnecting;

  protected readonly markers = computed<readonly TelemetryMapMarker[]>(() =>
    this.facade
      .devices()
      .filter((device) => device.lastPosition !== null)
      .map((device) => ({
        imei: device.imei,
        latitude: device.lastPosition!.latitude,
        longitude: device.lastPosition!.longitude,
        lastSeenAtUtc: device.lastSeenAtUtc,
        protocol: device.protocol,
      })),
  );

  constructor() {
    void this.facade.load();
  }

  ngOnDestroy(): void {
    void this.facade.disconnect();
  }

  protected async retryLoad(): Promise<void> {
    await this.facade.load();
  }

  protected openDeviceTelemetry(imei: string): void {
    if (imei) {
      void this.router.navigate(['/app/devices', imei, 'telemetry']);
    } else {
      void this.router.navigate(['/app/devices']);
    }
  }

  protected togglePanel(): void {
    this.panelOpen.update((v) => !v);
  }
}
