import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { PagedResult } from '../../admin-users/models/admin-user.model';
import {
  ErrorAggregateDto,
  OpsErrorsQuery,
  OpsRawQuery,
  OpsSessionsQuery,
  PortIngestionSnapshotDto,
  RawPacketRecordDto,
  SessionRecordDto,
} from '../models/ops.model';

@Injectable({
  providedIn: 'root',
})
export class OpsApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly appConfig = inject(APP_CONFIG);
  private readonly baseUrl = `${this.appConfig.apiBaseUrl}/api/ops`;

  getLatestRaw(
    query: OpsRawQuery,
  ): Observable<ApiResponse<PagedResult<RawPacketRecordDto>> | PagedResult<RawPacketRecordDto>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize);

    if (query.imei) {
      params = params.set('imei', query.imei);
    }

    return this.httpClient.get<ApiResponse<PagedResult<RawPacketRecordDto>> | PagedResult<RawPacketRecordDto>>(
      `${this.baseUrl}/raw/latest`,
      { params },
    ).pipe(
      map((response) =>
        this.mapApiResponse(response, (pagedResult) => ({
          ...pagedResult,
          items: pagedResult.items.map((packet) => this.normalizeRawPacket(packet)),
        })),
      ),
    );
  }

  getRawPacket(
    packetId: string,
  ): Observable<ApiResponse<RawPacketRecordDto> | RawPacketRecordDto> {
    return this.httpClient.get<ApiResponse<RawPacketRecordDto> | RawPacketRecordDto>(
      `${this.baseUrl}/raw/${packetId}`,
    ).pipe(
      map((response) => this.mapApiResponse(response, (packet) => this.normalizeRawPacket(packet))),
    );
  }

  getTopErrors(
    query: OpsErrorsQuery,
  ): Observable<ApiResponse<PagedResult<ErrorAggregateDto>> | PagedResult<ErrorAggregateDto>> {
    const params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize)
      .set('from', query.from)
      .set('to', query.to)
      .set('groupBy', query.groupBy);

    return this.httpClient.get<
      ApiResponse<PagedResult<ErrorAggregateDto>> | PagedResult<ErrorAggregateDto>
    >(`${this.baseUrl}/errors/top`, {
      params,
    }).pipe(
      map((response) =>
        this.mapApiResponse(response, (pagedResult) => ({
          ...pagedResult,
          items: pagedResult.items.map((group) => this.normalizeErrorGroup(group)),
        })),
      ),
    );
  }

  getActiveSessions(
    query: OpsSessionsQuery,
  ): Observable<ApiResponse<PagedResult<SessionRecordDto>> | PagedResult<SessionRecordDto>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize);

    if (typeof query.port === 'number') {
      params = params.set('port', query.port);
    }

    return this.httpClient.get<
      ApiResponse<PagedResult<SessionRecordDto>> | PagedResult<SessionRecordDto>
    >(`${this.baseUrl}/sessions/active`, {
      params,
    }).pipe(
      map((response) =>
        this.mapApiResponse(response, (pagedResult) => ({
          ...pagedResult,
          items: pagedResult.items.map((session) => this.normalizeSessionRecord(session)),
        })),
      ),
    );
  }

  getIngestionPorts(): Observable<
    ApiResponse<readonly PortIngestionSnapshotDto[]> | readonly PortIngestionSnapshotDto[]
  > {
    return this.httpClient.get<
      ApiResponse<readonly PortIngestionSnapshotDto[]> | readonly PortIngestionSnapshotDto[]
    >(`${this.baseUrl}/ingestion/ports`);
  }

  private mapApiResponse<T>(response: ApiResponse<T> | T, mapper: (data: T) => T): ApiResponse<T> | T {
    if (!this.isApiResponse(response)) {
      return mapper(response);
    }

    return {
      ...response,
      data: mapper(response.data),
    };
  }

  private normalizeRawPacket(packet: RawPacketRecordDto): RawPacketRecordDto {
    return {
      ...packet,
      sessionId: this.normalizeIdentifier(packet.sessionId) ?? '',
      packetId: this.normalizeIdentifier(packet.packetId) ?? '',
    };
  }

  private normalizeErrorGroup(group: ErrorAggregateDto): ErrorAggregateDto {
    return {
      ...group,
      lastPacketId: this.normalizeIdentifier(group.lastPacketId),
    };
  }

  private normalizeSessionRecord(session: SessionRecordDto): SessionRecordDto {
    return {
      ...session,
      sessionId: this.normalizeIdentifier(session.sessionId) ?? '',
    };
  }

  private normalizeIdentifier(value: unknown): string | null {
    if (typeof value === 'string') {
      return value.trim() === '' ? null : value;
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    const nestedValue = record['value'] ?? record['id'] ?? record['packetId'] ?? record['lastPacketId'];

    if (nestedValue === value) {
      return null;
    }

    return this.normalizeIdentifier(nestedValue);
  }

  private isApiResponse<T>(response: ApiResponse<T> | T): response is ApiResponse<T> {
    return typeof response === 'object' && response !== null && 'data' in response;
  }
}
