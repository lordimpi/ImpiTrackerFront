import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { PagedResult } from '../../admin-users/models/admin-user.model';
import {
  BindDeviceRequest,
  BindDeviceResultDto,
  UserDeviceBindingDto,
  UserDevicesQuery,
} from '../models/user-device.model';

@Injectable({
  providedIn: 'root',
})
export class DevicesApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly appConfig = inject(APP_CONFIG);
  private readonly baseUrl = `${this.appConfig.apiBaseUrl}/api/me/devices`;

  getDevices(
    query: UserDevicesQuery,
  ): Observable<ApiResponse<PagedResult<UserDeviceBindingDto>> | PagedResult<UserDeviceBindingDto>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize);

    if (query.search) {
      params = params.set('search', query.search);
    }

    return this.httpClient.get<
      ApiResponse<PagedResult<UserDeviceBindingDto>> | PagedResult<UserDeviceBindingDto>
    >(this.baseUrl, { params });
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
