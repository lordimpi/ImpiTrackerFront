import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { ApiResponse } from '../../../shared/models/api-response.model';
import {
  DeviceEventDto,
  DevicePositionPointDto,
  TelemetryDeviceSummaryDto,
  TelemetryQueryWindow,
  TripDetailDto,
  TripSummaryDto,
} from '../models/telemetry.model';

@Injectable({
  providedIn: 'root',
})
export class TelemetryApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly appConfig = inject(APP_CONFIG);
  private readonly baseUrl = `${this.appConfig.apiBaseUrl}/api`;

  getMyDeviceSummaries(): Observable<
    ApiResponse<readonly TelemetryDeviceSummaryDto[]> | readonly TelemetryDeviceSummaryDto[]
  > {
    return this.httpClient.get<
      ApiResponse<readonly TelemetryDeviceSummaryDto[]> | readonly TelemetryDeviceSummaryDto[]
    >(`${this.baseUrl}/me/telemetry/devices`);
  }

  getMyPositions(
    imei: string,
    query: TelemetryQueryWindow,
  ): Observable<ApiResponse<readonly DevicePositionPointDto[]> | readonly DevicePositionPointDto[]> {
    return this.httpClient.get<
      ApiResponse<readonly DevicePositionPointDto[]> | readonly DevicePositionPointDto[]
    >(`${this.baseUrl}/me/telemetry/devices/${imei}/positions`, {
      params: this.toWindowParams(query),
    });
  }

  getMyEvents(
    imei: string,
    query: TelemetryQueryWindow,
  ): Observable<ApiResponse<readonly DeviceEventDto[]> | readonly DeviceEventDto[]> {
    return this.httpClient.get<ApiResponse<readonly DeviceEventDto[]> | readonly DeviceEventDto[]>(
      `${this.baseUrl}/me/telemetry/devices/${imei}/events`,
      {
        params: this.toWindowParams(query),
      },
    );
  }

  getMyTrips(
    imei: string,
    query: TelemetryQueryWindow,
  ): Observable<ApiResponse<readonly TripSummaryDto[]> | readonly TripSummaryDto[]> {
    return this.httpClient.get<ApiResponse<readonly TripSummaryDto[]> | readonly TripSummaryDto[]>(
      `${this.baseUrl}/me/telemetry/devices/${imei}/trips`,
      {
        params: this.toWindowParams(query),
      },
    );
  }

  getMyTripById(
    imei: string,
    tripId: string,
    query: TelemetryQueryWindow,
  ): Observable<ApiResponse<TripDetailDto> | TripDetailDto> {
    return this.httpClient.get<ApiResponse<TripDetailDto> | TripDetailDto>(
      `${this.baseUrl}/me/telemetry/devices/${imei}/trips/${tripId}`,
      {
        params: this.toWindowParams(query),
      },
    );
  }

  getAdminDeviceSummaries(
    userId: string,
  ): Observable<ApiResponse<readonly TelemetryDeviceSummaryDto[]> | readonly TelemetryDeviceSummaryDto[]> {
    return this.httpClient.get<
      ApiResponse<readonly TelemetryDeviceSummaryDto[]> | readonly TelemetryDeviceSummaryDto[]
    >(`${this.baseUrl}/admin/users/${userId}/telemetry/devices`);
  }

  getAdminPositions(
    userId: string,
    imei: string,
    query: TelemetryQueryWindow,
  ): Observable<ApiResponse<readonly DevicePositionPointDto[]> | readonly DevicePositionPointDto[]> {
    return this.httpClient.get<
      ApiResponse<readonly DevicePositionPointDto[]> | readonly DevicePositionPointDto[]
    >(`${this.baseUrl}/admin/users/${userId}/telemetry/devices/${imei}/positions`, {
      params: this.toWindowParams(query),
    });
  }

  getAdminEvents(
    userId: string,
    imei: string,
    query: TelemetryQueryWindow,
  ): Observable<ApiResponse<readonly DeviceEventDto[]> | readonly DeviceEventDto[]> {
    return this.httpClient.get<ApiResponse<readonly DeviceEventDto[]> | readonly DeviceEventDto[]>(
      `${this.baseUrl}/admin/users/${userId}/telemetry/devices/${imei}/events`,
      {
        params: this.toWindowParams(query),
      },
    );
  }

  getAdminTrips(
    userId: string,
    imei: string,
    query: TelemetryQueryWindow,
  ): Observable<ApiResponse<readonly TripSummaryDto[]> | readonly TripSummaryDto[]> {
    return this.httpClient.get<ApiResponse<readonly TripSummaryDto[]> | readonly TripSummaryDto[]>(
      `${this.baseUrl}/admin/users/${userId}/telemetry/devices/${imei}/trips`,
      {
        params: this.toWindowParams(query),
      },
    );
  }

  getAdminTripById(
    userId: string,
    imei: string,
    tripId: string,
    query: TelemetryQueryWindow,
  ): Observable<ApiResponse<TripDetailDto> | TripDetailDto> {
    return this.httpClient.get<ApiResponse<TripDetailDto> | TripDetailDto>(
      `${this.baseUrl}/admin/users/${userId}/telemetry/devices/${imei}/trips/${tripId}`,
      {
        params: this.toWindowParams(query),
      },
    );
  }

  private toWindowParams(query: TelemetryQueryWindow): HttpParams {
    let params = new HttpParams();

    if (query.fromUtc) {
      params = params.set('from', query.fromUtc);
    }

    if (query.toUtc) {
      params = params.set('to', query.toUtc);
    }

    if (typeof query.limit === 'number') {
      params = params.set('limit', query.limit);
    }

    return params;
  }
}
