import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { ApiResponse } from '../../../shared/models/api-response.model';
import {
  BindDeviceRequest,
  BindDeviceResultDto,
  UserDeviceBindingDto,
} from '../models/user-device.model';

@Injectable({
  providedIn: 'root',
})
export class DevicesApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly appConfig = inject(APP_CONFIG);
  private readonly baseUrl = `${this.appConfig.apiBaseUrl}/api/me/devices`;

  getDevices(): Observable<ApiResponse<readonly UserDeviceBindingDto[]> | readonly UserDeviceBindingDto[]> {
    return this.httpClient.get<ApiResponse<readonly UserDeviceBindingDto[]> | readonly UserDeviceBindingDto[]>(
      this.baseUrl,
    );
  }

  bindDevice(
    payload: BindDeviceRequest,
  ): Observable<ApiResponse<BindDeviceResultDto> | BindDeviceResultDto> {
    return this.httpClient.post<ApiResponse<BindDeviceResultDto> | BindDeviceResultDto>(
      this.baseUrl,
      payload,
    );
  }

  unbindDevice(imei: string): Observable<ApiResponse<void> | void> {
    return this.httpClient.delete<ApiResponse<void> | void>(
      `${this.baseUrl}/${encodeURIComponent(imei)}`,
    );
  }
}
