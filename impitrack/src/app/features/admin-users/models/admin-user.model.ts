export interface AdminPlanDto {
  readonly planId: string;
  readonly code: string;
  readonly name: string;
  readonly maxGps: number;
  readonly isActive: boolean;
}

export interface AdminUserListItemDto {
  readonly userId: string;
  readonly email: string;
  readonly fullName?: string | null;
  readonly planCode: string;
  readonly maxGps: number;
  readonly usedGps: number;
}

export interface AdminUserDetailDto {
  readonly userId: string;
  readonly email: string;
  readonly fullName?: string | null;
  readonly planCode: string;
  readonly planName: string;
  readonly maxGps: number;
  readonly usedGps: number;
}

export interface AdminUserDeviceDto {
  readonly deviceId: string;
  readonly imei: string;
  readonly boundAtUtc: string;
}

export interface PagedResult<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface AdminUserListQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly planCode?: string;
  readonly sortBy: AdminUsersSortField;
  readonly sortDirection: AdminUsersSortDirection;
}

export interface SetUserPlanRequest {
  readonly planCode: string;
}

export interface BindAdminDeviceRequest {
  readonly imei: string;
}

export interface BindAdminDeviceResultDto {
  readonly status: number;
  readonly deviceId?: string | null;
}

export interface AdminUserDevicesQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
}

export type AdminUsersSortField =
  | 'email'
  | 'fullName'
  | 'planCode'
  | 'maxGps'
  | 'usedGps'
  | 'createdAt';

export type AdminUsersSortDirection = 'asc' | 'desc';
