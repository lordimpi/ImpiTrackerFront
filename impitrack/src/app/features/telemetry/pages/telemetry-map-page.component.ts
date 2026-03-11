import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  PLATFORM_ID,
  computed,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { TelemetryMapFacade } from '../application/telemetry-map.facade';
import { TelemetryDeviceListComponent } from '../components/telemetry-device-list.component';
import { TelemetryMapComponent } from '../components/telemetry-map.component';
import { TelemetryMapMarker } from '../models/telemetry.model';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-telemetry-map-page',
  imports: [
    ButtonDirective,
    Card,
    LoadingSpinnerComponent,
    Message,
    TelemetryDeviceListComponent,
    TelemetryMapComponent,
  ],
  templateUrl: './telemetry-map-page.component.html',
  styleUrl: './telemetry-map-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelemetryMapPageComponent implements OnDestroy {
  private readonly facade = inject(TelemetryMapFacade);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private pollingHandle: ReturnType<typeof setInterval> | null = null;

  protected readonly devices = computed(() => [...this.facade.devices()]);
  protected readonly pendingInitialLoad = this.facade.pendingInitialLoad;
  protected readonly refreshing = this.facade.refreshing;
  protected readonly featureError = this.facade.errorMessage;
  protected readonly hasDevices = this.facade.hasDevices;
  protected readonly hasMappableDevices = this.facade.hasMappableDevices;
  protected readonly markers = computed<readonly TelemetryMapMarker[]>(() =>
    this.devices()
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
    if (this.isBrowser) {
      this.startPolling();
    }
  }

  ngOnDestroy(): void {
    if (this.pollingHandle) {
      clearInterval(this.pollingHandle);
      this.pollingHandle = null;
    }
  }

  protected async refresh(): Promise<void> {
    await this.facade.load(true);
  }

  protected async retryLoad(): Promise<void> {
    await this.facade.load();
  }

  protected openDeviceTelemetry(imei: string): void {
    void this.router.navigate(['/app/devices', imei, 'telemetry']);
  }

  protected goToDevices(): void {
    void this.router.navigate(['/app/devices']);
  }

  private startPolling(): void {
    this.pollingHandle = setInterval(() => {
      void this.facade.load(true);
    }, 30_000);
  }
}
