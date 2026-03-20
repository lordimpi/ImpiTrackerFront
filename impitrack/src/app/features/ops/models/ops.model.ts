export interface RawPacketRecordDto {
  readonly sessionId: string;
  readonly packetId: string;
  readonly port: number;
  readonly remoteIp: string;
  readonly protocol: string | number;
  readonly imei: string | null;
  readonly messageType: string | number;
  readonly payloadText: string;
  readonly receivedAtUtc: string;
  readonly parseStatus: string | number;
  readonly parseError: string | null;
  readonly ackSent: boolean;
  readonly ackPayload: string | null;
  readonly ackAtUtc: string | null;
  readonly ackLatencyMs: number | null;
}

export interface ErrorAggregateDto {
  readonly groupKey: string;
  readonly count: number;
  readonly lastPacketId: string | null;
}

export interface SessionRecordDto {
  readonly sessionId: string;
  readonly remoteIp: string;
  readonly port: number;
  readonly connectedAtUtc: string;
  readonly lastSeenAtUtc: string;
  readonly lastHeartbeatAtUtc: string | null;
  readonly imei: string | null;
  readonly framesIn: number;
  readonly framesInvalid: number;
  readonly closeReason: string | null;
  readonly disconnectedAtUtc: string | null;
  readonly isActive: boolean;
}

export interface PortIngestionSnapshotDto {
  readonly port: number;
  readonly activeConnections: number;
  readonly framesIn: number;
  readonly parseOk: number;
  readonly parseFail: number;
  readonly ackSent: number;
  readonly backlog: number;
}

export interface OpsRawQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly imei?: string;
}

export type OpsErrorGroupBy = 'errorCode' | 'protocol' | 'port';

export interface OpsErrorsQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly from: string;
  readonly to: string;
  readonly groupBy: OpsErrorGroupBy;
}

export interface OpsSessionsQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly port?: number;
}
