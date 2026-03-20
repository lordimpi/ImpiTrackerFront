import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '../../../shared/models/api-error.model';
import { normalizeApiError, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { TelemetryApiService } from '../data-access/telemetry-api.service';
import {
  DEFAULT_EVENTS_LIMIT,
  DEFAULT_POSITIONS_LIMIT,
  DeviceAliasResultDto,
  DeviceEventDto,
  DevicePositionPointDto,
  DEFAULT_TRIPS_LIMIT,
  TelemetryContext,
  TelemetryDeviceSummaryDto,
  TelemetryWindowSelection,
  TripDetailDto,
  TripSummaryDto,
} from '../models/telemetry.model';

interface DeviceTelemetryState {
  readonly context: TelemetryContext;
  readonly imei: string | null;
  readonly device: TelemetryDeviceSummaryDto | null;
  readonly events: readonly DeviceEventDto[];
  readonly positions: readonly DevicePositionPointDto[];
  readonly trips: readonly TripSummaryDto[];
  readonly selectedTrip: TripDetailDto | null;
  readonly pendingInitialLoad: boolean;
  readonly pendingRefresh: boolean;
  readonly pendingTripSelection: boolean;
  readonly errorMessage: string | null;
  readonly tripErrorMessage: string | null;
  readonly notFound: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeviceTelemetryFacade {
  private readonly telemetryApi = inject(TelemetryApiService);

  private readonly state = signal<DeviceTelemetryState>({
    context: { kind: 'self' },
    imei: null,
    device: null,
    events: [],
    positions: [],
    trips: [],
    selectedTrip: null,
    pendingInitialLoad: false,
    pendingRefresh: false,
    pendingTripSelection: false,
    errorMessage: null,
    tripErrorMessage: null,
    notFound: false,
  });

  readonly context = computed(() => this.state().context);
  readonly imei = computed(() => this.state().imei);
  readonly device = computed(() => this.state().device);
  readonly events = computed(() => this.state().events);
  readonly positions = computed(() => this.state().positions);
  readonly trips = computed(() => this.state().trips);
  readonly selectedTrip = computed(() => this.state().selectedTrip);
  readonly pendingInitialLoad = computed(() => this.state().pendingInitialLoad);
  readonly pendingRefresh = computed(() => this.state().pendingRefresh);
  readonly pendingTripSelection = computed(() => this.state().pendingTripSelection);
  readonly errorMessage = computed(() => this.state().errorMessage);
  readonly tripErrorMessage = computed(() => this.state().tripErrorMessage);
  readonly notFound = computed(() => this.state().notFound);
  readonly hasEvents = computed(() => this.events().length > 0);
  readonly hasPositions = computed(() => this.positions().length > 0);
  readonly hasTrips = computed(() => this.trips().length > 0);

  async initialize(
    context: TelemetryContext,
    imei: string,
    window: TelemetryWindowSelection,
  ): Promise<void> {
    const trimmedImei = imei.trim();
    if (!trimmedImei) {
      this.patchState({
        context,
        imei: null,
        device: null,
        events: [],
        positions: [],
        trips: [],
        selectedTrip: null,
        errorMessage: null,
        tripErrorMessage: null,
        notFound: true,
      });
      return;
    }

    this.patchState({
      context,
      imei: trimmedImei,
      pendingInitialLoad: true,
      errorMessage: null,
      tripErrorMessage: null,
      notFound: false,
    });

    try {
      const data = await this.fetchTelemetry(context, trimmedImei, window);
      this.patchState({
        ...data,
        errorMessage: null,
        notFound: false,
      });
    } catch (error) {
      this.handleLoadError(error);
    } finally {
      this.patchState({
        pendingInitialLoad: false,
      });
    }
  }

  async refresh(window: TelemetryWindowSelection): Promise<void> {
    const context = this.context();
    const imei = this.imei();

    if (!imei || this.pendingRefresh()) {
      return;
    }

    this.patchState({
      pendingRefresh: true,
      errorMessage: null,
      tripErrorMessage: null,
    });

    try {
      const data = await this.fetchTelemetry(context, imei, window, this.selectedTrip()?.tripId ?? null);
      this.patchState({
        ...data,
        errorMessage: null,
        notFound: false,
      });
    } catch (error) {
      this.handleLoadError(error);
    } finally {
      this.patchState({
        pendingRefresh: false,
      });
    }
  }

  async selectTrip(window: TelemetryWindowSelection, tripId: string): Promise<void> {
    const imei = this.imei();
    if (!imei || this.pendingTripSelection() || this.selectedTrip()?.tripId === tripId) {
      return;
    }

    this.patchState({
      pendingTripSelection: true,
      tripErrorMessage: null,
    });

    try {
      const selectedTrip = await this.fetchTripDetail(this.context(), imei, tripId, {
        fromUtc: window.fromUtc,
        toUtc: window.toUtc,
      });

      this.patchState({
        selectedTrip,
        tripErrorMessage: null,
      });
    } catch (error) {
      const apiError = normalizeApiError(error);
      this.patchState({
        selectedTrip: null,
        tripErrorMessage:
          apiError.code === 'trip_not_found'
            ? 'El recorrido seleccionado ya no esta disponible dentro de esta ventana.'
            : apiError.message,
      });
    } finally {
      this.patchState({
        pendingTripSelection: false,
      });
    }
  }

  async updateAlias(alias: string | null): Promise<void> {
    const imei = this.imei();
    if (!imei) return;

    const response = await firstValueFrom(this.telemetryApi.updateMyDeviceAlias(imei, alias));
    const result = unwrapApiResponse(response) as DeviceAliasResultDto;
    this.state.update((state) => ({
      ...state,
      device: state.device ? { ...state.device, alias: result.alias } : null,
    }));
  }

  private async fetchTelemetry(
    context: TelemetryContext,
    imei: string,
    window: TelemetryWindowSelection,
    preferredTripId?: string | null,
  ): Promise<
    Pick<
      DeviceTelemetryState,
      'device' | 'events' | 'positions' | 'trips' | 'selectedTrip' | 'tripErrorMessage'
    >
  > {
    const query = {
      fromUtc: window.fromUtc,
      toUtc: window.toUtc,
    };
    const eventsQuery = {
      ...query,
      limit: DEFAULT_EVENTS_LIMIT,
    };
    const positionsQuery = {
      ...query,
      limit: DEFAULT_POSITIONS_LIMIT,
    };
    const tripsQuery = {
      ...query,
      limit: DEFAULT_TRIPS_LIMIT,
    };

    const [summaryResponse, eventsResponse, positionsResponse, tripsResponse] =
      context.kind === 'admin' && context.userId
        ? await Promise.all([
            firstValueFrom(this.telemetryApi.getAdminDeviceSummaries(context.userId)),
            firstValueFrom(this.telemetryApi.getAdminEvents(context.userId, imei, eventsQuery)),
            firstValueFrom(this.telemetryApi.getAdminPositions(context.userId, imei, positionsQuery)),
            firstValueFrom(this.telemetryApi.getAdminTrips(context.userId, imei, tripsQuery)),
          ])
        : await Promise.all([
            firstValueFrom(this.telemetryApi.getMyDeviceSummaries()),
            firstValueFrom(this.telemetryApi.getMyEvents(imei, eventsQuery)),
            firstValueFrom(this.telemetryApi.getMyPositions(imei, positionsQuery)),
            firstValueFrom(this.telemetryApi.getMyTrips(imei, tripsQuery)),
          ]);

    const device = unwrapApiResponse(summaryResponse).find(
      (item) => item.imei.toLowerCase() === imei.toLowerCase(),
    );

    if (!device) {
      throw {
        status: 404,
        code: 'device_binding_not_found',
        message: 'No existe un vinculo activo para el IMEI indicado.',
      } satisfies ApiError;
    }

    const trips = [...unwrapApiResponse(tripsResponse)].sort((left, right) =>
      right.startedAtUtc.localeCompare(left.startedAtUtc),
    );
    const selectedTripId =
      preferredTripId && trips.some((trip) => trip.tripId === preferredTripId)
        ? preferredTripId
        : trips[0]?.tripId ?? null;

    let selectedTrip: TripDetailDto | null = null;
    let tripErrorMessage: string | null = null;

    if (selectedTripId) {
      try {
        selectedTrip = await this.fetchTripDetail(context, imei, selectedTripId, query);
      } catch (error) {
        const apiError = normalizeApiError(error);
        if (apiError.code === 'trip_not_found') {
          tripErrorMessage = 'No fue posible abrir el recorrido seleccionado dentro de esta ventana.';
        } else {
          throw error;
        }
      }
    }

    return {
      device,
      events: [...unwrapApiResponse(eventsResponse)].sort((left, right) =>
        right.receivedAtUtc.localeCompare(left.receivedAtUtc),
      ),
      positions: [...unwrapApiResponse(positionsResponse)].sort((left, right) =>
        left.occurredAtUtc.localeCompare(right.occurredAtUtc),
      ),
      trips,
      selectedTrip,
      tripErrorMessage,
    };
  }

  private async fetchTripDetail(
    context: TelemetryContext,
    imei: string,
    tripId: string,
    query: { readonly fromUtc: string; readonly toUtc: string },
  ): Promise<TripDetailDto> {
    const response =
      context.kind === 'admin' && context.userId
        ? await firstValueFrom(this.telemetryApi.getAdminTripById(context.userId, imei, tripId, query))
        : await firstValueFrom(this.telemetryApi.getMyTripById(imei, tripId, query));

    return unwrapApiResponse(response);
  }

  private handleLoadError(error: unknown): void {
    const apiError = normalizeApiError(error);

    if (
      apiError.code === 'device_binding_not_found' ||
      apiError.code === 'user_not_found' ||
      apiError.status === 404
    ) {
      this.patchState({
        notFound: true,
        device: null,
        events: [],
        positions: [],
        trips: [],
        selectedTrip: null,
        errorMessage: null,
        tripErrorMessage: null,
      });
      return;
    }

    this.patchState({
      errorMessage: apiError.message,
      tripErrorMessage: null,
      notFound: false,
    });
  }

  private patchState(partial: Partial<DeviceTelemetryState>): void {
    this.state.update((state) => ({
      ...state,
      ...partial,
    }));
  }
}
