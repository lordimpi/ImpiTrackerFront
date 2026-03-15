export interface UserDeviceBindingDto {
  readonly deviceId: string;
  readonly imei: string;
  readonly boundAtUtc: string;
}

export interface BindDeviceRequest {
  readonly imei: string;
}

export interface BindDeviceResultDto {
  readonly status: number;
  readonly deviceId?: string | null;
}
