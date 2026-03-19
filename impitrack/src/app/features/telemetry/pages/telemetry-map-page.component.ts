import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private pollingHandle: ReturnType<typeof setInterval> | null = null;
  private countdownHandle: ReturnType<typeof setInterval> | null = null;

  protected readonly user = this.authFacade.user;
  protected readonly pendingInitialLoad = this.facade.pendingInitialLoad;
  protected readonly featureError = this.facade.errorMessage;
  protected readonly activeTab = signal<'fleet' | 'events' | 'trips'>('fleet');
  protected readonly pollingCountdown = signal(30);

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
    if (this.isBrowser) {
      this.startPolling();
      this.startCountdown();
    }
  }

  ngOnDestroy(): void {
    if (this.pollingHandle) {
      clearInterval(this.pollingHandle);
      this.pollingHandle = null;
    }
    if (this.countdownHandle) {
      clearInterval(this.countdownHandle);
      this.countdownHandle = null;
    }
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

  private startPolling(): void {
    this.pollingHandle = setInterval(() => {
      this.pollingCountdown.set(30);
      void this.facade.load(true);
    }, 30_000);
  }

  private startCountdown(): void {
    this.countdownHandle = setInterval(() => {
      this.pollingCountdown.update((v) => (v > 1 ? v - 1 : 30));
    }, 1_000);
  }
}
