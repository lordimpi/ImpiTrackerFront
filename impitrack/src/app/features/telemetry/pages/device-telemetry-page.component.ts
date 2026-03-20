import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { DeviceTelemetryFacade } from '../application/device-telemetry.facade';
import { TelemetryMapComponent } from '../components/telemetry-map.component';
import { TelemetryTripSummaryComponent } from '../components/telemetry-trip-summary.component';
import { TelemetryTripsListComponent } from '../components/telemetry-trips-list.component';
import {
  DeviceEventDto,
  TelemetryContext,
  TelemetryMapMarker,
  TelemetryRangePreset,
  TelemetryWindowSelection,
  buildTelemetryPresetWindow,
  normalizeTelemetryText,
  toDateTimeInputValue,
  toIsoFromDateTimeInput,
} from '../models/telemetry.model';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';

type TelemetryContentPanelView = 'map' | 'events' | 'trips';
type TelemetryEventsPanelView = 'timeline' | 'table';

@Component({
  selector: 'app-device-telemetry-page',
  imports: [
    DatePipe,
    DecimalPipe,
    Dialog,
    InputText,
    LoadingSpinnerComponent,
    Message,
    ReactiveFormsModule,
    SelectModule,
    TelemetryMapComponent,
    TelemetryTripSummaryComponent,
    TelemetryTripsListComponent,
  ],
  templateUrl: './device-telemetry-page.component.html',
  styleUrl: './device-telemetry-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceTelemetryPageComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(DeviceTelemetryFacade);

  protected readonly device = this.facade.device;
  protected readonly positions = computed(() => [...this.facade.positions()]);
  protected readonly events = computed(() => [...this.facade.events()]);
  protected readonly trips = computed(() => [...this.facade.trips()]);
  protected readonly selectedTrip = this.facade.selectedTrip;
  protected readonly pendingInitialLoad = this.facade.pendingInitialLoad;
  protected readonly pendingRefresh = this.facade.pendingRefresh;
  protected readonly pendingTripSelection = this.facade.pendingTripSelection;
  protected readonly featureError = this.facade.errorMessage;
  protected readonly tripErrorMessage = this.facade.tripErrorMessage;
  protected readonly notFound = this.facade.notFound;
  protected readonly hasTrips = this.facade.hasTrips;
  protected readonly hasEvents = this.facade.hasEvents;
  protected readonly hasPositions = this.facade.hasPositions;
  protected readonly activePreset = signal<TelemetryRangePreset>('day');
  protected readonly currentWindow = signal<TelemetryWindowSelection>(
    buildTelemetryPresetWindow('day'),
  );
  protected readonly activeContentPanelView = signal<TelemetryContentPanelView>('map');
  protected readonly activeEventsPanelView = signal<TelemetryEventsPanelView>('timeline');
  protected readonly summaryDialogVisible = signal(false);
  protected readonly eventDetailVisible = signal(false);
  protected readonly selectedEvent = signal<DeviceEventDto | null>(null);
  protected readonly panelOpen = signal(false);
  protected readonly aliasEditMode = signal(false);
  protected readonly aliasEditValue = signal('');
  protected readonly eventFilterControl = this.formBuilder.control('all', {
    validators: [Validators.required],
  });
  protected readonly selectedEventCode = toSignal(this.eventFilterControl.valueChanges, {
    initialValue: this.eventFilterControl.getRawValue(),
  });
  protected readonly customRangeForm = this.formBuilder.group({
    from: [toDateTimeInputValue(new Date(Date.now() - 24 * 60 * 60 * 1000)), [Validators.required]],
    to: [toDateTimeInputValue(new Date()), [Validators.required]],
  });
  protected readonly backLabel = computed(() =>
    this.facade.context().kind === 'admin' ? 'Volver al usuario' : 'Volver al mapa',
  );
  protected readonly normalizeText = normalizeTelemetryText;

  protected readonly summaryMarkers = computed<readonly TelemetryMapMarker[]>(() => {
    const device = this.device();
    if (!device?.lastPosition) {
      return [];
    }

    return [
      {
        imei: device.imei,
        latitude: device.lastPosition.latitude,
        longitude: device.lastPosition.longitude,
        lastSeenAtUtc: device.lastSeenAtUtc,
        protocol: device.protocol,
      },
    ];
  });
  protected readonly currentMapMarkers = computed<readonly TelemetryMapMarker[]>(() =>
    this.summaryMarkers(),
  );
  protected readonly currentMapPathPoints = computed<readonly TelemetryMapMarker[]>(() => []);
  protected readonly tripMapMarkers = computed<readonly TelemetryMapMarker[]>(() => {
    const trip = this.selectedTrip();
    if (!trip) {
      return this.summaryMarkers();
    }

    return [trip.startPosition, trip.endPosition].map((position) => ({
      imei: trip.imei,
      latitude: position.latitude,
      longitude: position.longitude,
      lastSeenAtUtc: position.receivedAtUtc,
      protocol: this.device()?.protocol ?? null,
    }));
  });
  protected readonly tripMapPathPoints = computed<readonly TelemetryMapMarker[]>(() => {
    const trip = this.selectedTrip();
    if (!trip) {
      return [];
    }

    return trip.pathPoints.map((position) => ({
      imei: trip.imei,
      latitude: position.latitude,
      longitude: position.longitude,
      lastSeenAtUtc: position.receivedAtUtc,
      protocol: this.device()?.protocol ?? null,
      ignitionOn: position.ignitionOn,
    }));
  });
  protected readonly fallbackRouteAvailable = computed(
    () => !this.hasTrips() && this.positions().length > 0,
  );
  protected readonly fallbackRouteMarkers = computed<readonly TelemetryMapMarker[]>(() => {
    const device = this.device();
    const lastPosition = this.positions().at(-1) ?? device?.lastPosition ?? null;

    if (!device || !lastPosition) {
      return [];
    }

    return [
      {
        imei: device.imei,
        latitude: lastPosition.latitude,
        longitude: lastPosition.longitude,
        lastSeenAtUtc: lastPosition.receivedAtUtc ?? device.lastSeenAtUtc,
        protocol: device.protocol,
      },
    ];
  });
  protected readonly fallbackRoutePathPoints = computed<readonly TelemetryMapMarker[]>(() => {
    const device = this.device();
    if (!device) {
      return [];
    }

    return this.positions().map((position) => ({
      imei: device.imei,
      latitude: position.latitude,
      longitude: position.longitude,
      lastSeenAtUtc: position.receivedAtUtc,
      protocol: device.protocol,
      ignitionOn: position.ignitionOn,
    }));
  });
  protected readonly fallbackRouteSummary = computed(() => {
    const positions = this.positions();
    if (positions.length === 0) {
      return null;
    }

    const speeds = positions
      .map((position) => position.speedKmh)
      .filter((speed): speed is number => speed != null);

    return {
      startedAtUtc: positions[0].occurredAtUtc,
      endedAtUtc: positions.at(-1)?.occurredAtUtc ?? positions[0].occurredAtUtc,
      pointCount: positions.length,
      maxSpeedKmh: speeds.length > 0 ? Math.max(...speeds) : null,
      avgSpeedKmh:
        speeds.length > 0
          ? speeds.reduce((total, speed) => total + speed, 0) / speeds.length
          : null,
    };
  });
  protected readonly eventCodeOptions = computed(() => {
    const distinctCodes = [
      ...new Set(
        this.events()
          .map((event) => event.eventCode)
          .filter(Boolean),
      ),
    ]
      .sort((left, right) => left.localeCompare(right))
      .map((code) => ({
        label: code,
        value: code,
      }));

    return [
      {
        label: 'Todos los eventos',
        value: 'all',
      },
      ...distinctCodes,
    ];
  });
  protected readonly filteredEvents = computed(() => {
    const selectedCode = this.selectedEventCode();
    if (selectedCode === 'all') {
      return this.events();
    }

    return this.events().filter((event) => event.eventCode === selectedCode);
  });
  protected readonly hasFilteredEvents = computed(() => this.filteredEvents().length > 0);
  protected readonly eventSummaryLabel = computed(() => {
    const total = this.events().length;
    const filtered = this.filteredEvents().length;

    if (this.selectedEventCode() === 'all') {
      return `${total} evento${total === 1 ? '' : 's'} en la ventana actual`;
    }

    return `Mostrando ${filtered} de ${total} evento${total === 1 ? '' : 's'}`;
  });
  protected readonly windowLabel = computed(() => {
    const window = this.currentWindow();
    const formatter = new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    return `${formatter.format(new Date(window.fromUtc))} — ${formatter.format(new Date(window.toUtc))}`;
  });
  protected readonly tripWindowLabel = computed(() => {
    const window = this.currentWindow();
    const formatter = new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    return `Recorridos consultados entre ${formatter.format(new Date(window.fromUtc))} y ${formatter.format(new Date(window.toUtc))}`;
  });
  protected readonly fallbackRouteLabel = computed(() => {
    const summary = this.fallbackRouteSummary();
    if (!summary) {
      return 'No hay posiciones suficientes en esta ventana.';
    }

    const formatter = new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    return `Mostrando historial entre ${formatter.format(new Date(summary.startedAtUtc))} y ${formatter.format(new Date(summary.endedAtUtc))}.`;
  });

  /** Computed que decide qué markers pasar al mapa fullscreen según el tab activo */
  protected readonly fullscreenMapMarkers = computed<readonly TelemetryMapMarker[]>(() => {
    const view = this.activeContentPanelView();

    if (view === 'trips') {
      if (this.selectedTrip()) {
        return this.tripMapMarkers();
      }
      if (this.fallbackRouteAvailable()) {
        return this.fallbackRouteMarkers();
      }
      return this.summaryMarkers();
    }

    return this.currentMapMarkers();
  });

  /** Computed que decide qué pathPoints pasar al mapa fullscreen según el tab activo */
  protected readonly fullscreenMapPathPoints = computed<readonly TelemetryMapMarker[]>(() => {
    const view = this.activeContentPanelView();

    if (view === 'trips') {
      if (this.selectedTrip()) {
        return this.tripMapPathPoints();
      }
      if (this.fallbackRouteAvailable()) {
        return this.fallbackRoutePathPoints();
      }
      return [];
    }

    return this.currentMapPathPoints();
  });

  constructor() {
    combineLatest([this.route.paramMap, this.route.data])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, data]) => {
        const telemetryContext =
          (data['telemetryContext'] as 'self' | 'admin' | undefined) ?? 'self';
        const context: TelemetryContext =
          telemetryContext === 'admin'
            ? {
                kind: 'admin',
                userId: params.get('id') ?? undefined,
              }
            : { kind: 'self' };
        const imei = params.get('imei') ?? '';

        this.currentWindow.set(buildTelemetryPresetWindow('day'));
        this.activePreset.set('day');
        this.activeContentPanelView.set('map');
        this.activeEventsPanelView.set('timeline');
        this.summaryDialogVisible.set(false);
        this.eventFilterControl.setValue('all', { emitEvent: true });
        this.syncCustomForm(this.currentWindow());
        void this.facade.initialize(context, imei, this.currentWindow());
      });
  }

  protected async applyPreset(preset: Exclude<TelemetryRangePreset, 'custom'>): Promise<void> {
    this.activePreset.set(preset);
    const window = buildTelemetryPresetWindow(preset);
    this.currentWindow.set(window);
    this.syncCustomForm(window);
    await this.facade.refresh(window);
  }

  protected async applyCustomRange(): Promise<void> {
    if (this.customRangeForm.invalid) {
      this.customRangeForm.markAllAsTouched();
      return;
    }

    const from = this.customRangeForm.controls.from.getRawValue();
    const to = this.customRangeForm.controls.to.getRawValue();
    const window: TelemetryWindowSelection = {
      preset: 'custom',
      fromUtc: toIsoFromDateTimeInput(from),
      toUtc: toIsoFromDateTimeInput(to),
    };

    this.activePreset.set('custom');
    this.currentWindow.set(window);
    await this.facade.refresh(window);
  }

  protected async refresh(): Promise<void> {
    await this.facade.refresh(this.currentWindow());
  }

  protected selectContentPanelView(view: TelemetryContentPanelView): void {
    this.activeContentPanelView.set(view);
  }

  protected selectEventsPanelView(view: TelemetryEventsPanelView): void {
    this.activeEventsPanelView.set(view);
  }

  protected openSummaryDialog(): void {
    this.summaryDialogVisible.set(true);
  }

  protected closeSummaryDialog(): void {
    this.summaryDialogVisible.set(false);
  }

  protected async selectTrip(tripId: string): Promise<void> {
    await this.facade.selectTrip(this.currentWindow(), tripId);
  }

  protected resetEventFilter(): void {
    this.eventFilterControl.setValue('all');
  }

  protected openEventDetail(event: DeviceEventDto): void {
    this.selectedEvent.set(event);
    this.eventDetailVisible.set(true);
  }

  protected closeEventDetail(): void {
    this.eventDetailVisible.set(false);
  }

  protected async retryLoad(): Promise<void> {
    await this.facade.initialize(
      this.facade.context(),
      this.facade.imei() ?? '',
      this.currentWindow(),
    );
  }

  protected togglePanel(): void {
    this.panelOpen.update((v) => !v);
  }

  protected openAliasEdit(): void {
    this.aliasEditValue.set(this.device()?.alias ?? '');
    this.aliasEditMode.set(true);
  }

  protected cancelAliasEdit(): void {
    this.aliasEditMode.set(false);
  }

  protected async saveAlias(): Promise<void> {
    const value = this.aliasEditValue().trim() || null;
    await this.facade.updateAlias(value);
    this.aliasEditMode.set(false);
  }

  protected async goBack(): Promise<void> {
    if (this.facade.context().kind === 'admin' && this.facade.context().userId) {
      await this.router.navigate(['/admin/users', this.facade.context().userId]);
      return;
    }

    await this.router.navigate(['/app/map']);
  }

  private syncCustomForm(window: TelemetryWindowSelection): void {
    this.customRangeForm.reset(
      {
        from: toDateTimeInputValue(new Date(window.fromUtc)),
        to: toDateTimeInputValue(new Date(window.toUtc)),
      },
      { emitEvent: false },
    );
  }
}
