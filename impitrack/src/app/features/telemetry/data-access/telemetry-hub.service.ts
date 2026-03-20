import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { AuthFacade } from '../../../core/auth/application/auth.facade';
import { DeviceStatusChangedEvent, PositionUpdatedEvent } from '../models/telemetry.model';

@Injectable({ providedIn: 'root' })
export class TelemetryHubService {
  private readonly appConfig = inject(APP_CONFIG);
  private readonly authFacade = inject(AuthFacade);
  private readonly platformId = inject(PLATFORM_ID);

  private connection: HubConnection | null = null;

  readonly connected = signal(false);
  readonly reconnecting = signal(false);

  private readonly positionUpdatedSubject = new Subject<PositionUpdatedEvent>();
  private readonly deviceStatusChangedSubject = new Subject<DeviceStatusChangedEvent>();

  readonly positionUpdated$: Observable<PositionUpdatedEvent> =
    this.positionUpdatedSubject.asObservable();
  readonly deviceStatusChanged$: Observable<DeviceStatusChangedEvent> =
    this.deviceStatusChangedSubject.asObservable();

  connect(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (
      this.connection &&
      this.connection.state !== HubConnectionState.Disconnected
    ) {
      return;
    }

    this.connection = new HubConnectionBuilder()
      .withUrl(`${this.appConfig.apiBaseUrl}/hubs/telemetry`, {
        accessTokenFactory: () => this.authFacade.getAccessToken() ?? '',
      })
      .withAutomaticReconnect()
      .build();

    this.connection.onreconnecting(() => {
      this.reconnecting.set(true);
      this.connected.set(false);
    });

    this.connection.onreconnected(() => {
      this.reconnecting.set(false);
      this.connected.set(true);
    });

    this.connection.onclose(() => {
      this.connected.set(false);
      this.reconnecting.set(false);
    });

    this.connection.on('PositionUpdated', (event: PositionUpdatedEvent) => {
      this.positionUpdatedSubject.next(event);
    });

    this.connection.on('DeviceStatusChanged', (event: DeviceStatusChangedEvent) => {
      this.deviceStatusChangedSubject.next(event);
    });

    void this.connection
      .start()
      .then(() => {
        this.connected.set(true);
      })
      .catch(() => {
        this.connected.set(false);
      });
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
    this.connected.set(false);
    this.reconnecting.set(false);
  }
}
