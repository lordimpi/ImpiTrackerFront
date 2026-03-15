import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { ApiResponse } from '../../../shared/models/api-response.model';
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
  ): Observable<ApiResponse<readonly RawPacketRecordDto[]> | readonly RawPacketRecordDto[]> {
    let params = new HttpParams().set('limit', query.limit);

    if (query.imei) {
      params = params.set('imei', query.imei);
    }

    return this.httpClient.get<ApiResponse<readonly RawPacketRecordDto[]> | readonly RawPacketRecordDto[]>(
      `${this.baseUrl}/raw/latest`,
      { params },
    ).pipe(
      map((response) =>
        this.mapApiResponse(response, (packets) => packets.map((packet) => this.normalizeRawPacket(packet))),
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
  ): Observable<ApiResponse<readonly ErrorAggregateDto[]> | readonly ErrorAggregateDto[]> {
    const params = new HttpParams()
      .set('from', query.from)
      .set('to', query.to)
      .set('groupBy', query.groupBy)
      .set('limit', query.limit);

    return this.httpClient.get<
      ApiResponse<readonly ErrorAggregateDto[]> | readonly ErrorAggregateDto[]
    >(`${this.baseUrl}/errors/top`, {
      params,
    }).pipe(
      map((response) =>
        this.mapApiResponse(response, (groups) => groups.map((group) => this.normalizeErrorGroup(group))),
      ),
    );
  }

  getActiveSessions(
    query: OpsSessionsQuery,
  ): Observable<ApiResponse<readonly SessionRecordDto[]> | readonly SessionRecordDto[]> {
    let params = new HttpParams();

    if (typeof query.port === 'number') {
      params = params.set('port', query.port);
    }

    return this.httpClient.get<
      ApiResponse<readonly SessionRecordDto[]> | readonly SessionRecordDto[]
    >(`${this.baseUrl}/sessions/active`, {
      params,
    }).pipe(
      map((response) =>
        this.mapApiResponse(response, (sessions) =>
          sessions.map((session) => this.normalizeSessionRecord(session)),
        ),
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
