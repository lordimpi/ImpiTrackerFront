import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { ApiResponse } from '../../../shared/models/api-response.model';
import {
  AdminPlanDto,
  AdminUserDetailDto,
  AdminUserDeviceDto,
  AdminUserDevicesQuery,
  AdminUserListItemDto,
  AdminUserListQuery,
  BindAdminDeviceRequest,
  BindAdminDeviceResultDto,
  PagedResult,
  SetUserPlanRequest,
} from '../models/admin-user.model';

@Injectable({
  providedIn: 'root',
})
export class AdminUsersApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly appConfig = inject(APP_CONFIG);
  private readonly usersBaseUrl = `${this.appConfig.apiBaseUrl}/api/admin/users`;
  private readonly plansBaseUrl = `${this.appConfig.apiBaseUrl}/api/admin/plans`;

  getPlans(): Observable<ApiResponse<readonly AdminPlanDto[]> | readonly AdminPlanDto[]> {
    return this.httpClient.get<ApiResponse<readonly AdminPlanDto[]> | readonly AdminPlanDto[]>(
      this.plansBaseUrl,
    );
  }

  getUsers(
    query: AdminUserListQuery,
  ): Observable<ApiResponse<PagedResult<AdminUserListItemDto>> | PagedResult<AdminUserListItemDto>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('sortDirection', query.sortDirection);

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.planCode) {
      params = params.set('planCode', query.planCode);
    }

    return this.httpClient.get<
      ApiResponse<PagedResult<AdminUserListItemDto>> | PagedResult<AdminUserListItemDto>
    >(this.usersBaseUrl, {
      params,
    });
  }

  getUserSummary(
    userId: string,
  ): Observable<ApiResponse<AdminUserDetailDto> | AdminUserDetailDto> {
    return this.httpClient.get<ApiResponse<AdminUserDetailDto> | AdminUserDetailDto>(
      `${this.usersBaseUrl}/${userId}`,
    );
  }

  getUserDevices(
    userId: string,
    query: AdminUserDevicesQuery,
  ): Observable<ApiResponse<PagedResult<AdminUserDeviceDto>> | PagedResult<AdminUserDeviceDto>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize);

    if (query.search) {
      params = params.set('search', query.search);
    }

    return this.httpClient.get<
      ApiResponse<PagedResult<AdminUserDeviceDto>> | PagedResult<AdminUserDeviceDto>
    >(`${this.usersBaseUrl}/${userId}/devices`, { params });
  }

  setUserPlan(
    userId: string,
    payload: SetUserPlanRequest,
  ): Observable<ApiResponse<AdminUserDetailDto> | AdminUserDetailDto> {
    return this.httpClient.put<ApiResponse<AdminUserDetailDto> | AdminUserDetailDto>(
      `${this.usersBaseUrl}/${userId}/plan`,
      payload,
    );
  }

  bindUserDevice(
    userId: string,
    payload: BindAdminDeviceRequest,
  ): Observable<ApiResponse<BindAdminDeviceResultDto> | BindAdminDeviceResultDto> {
    return this.httpClient.post<ApiResponse<BindAdminDeviceResultDto> | BindAdminDeviceResultDto>(
      `${this.usersBaseUrl}/${userId}/devices`,
      payload,
    );
  }

  unbindUserDevice(userId: string, imei: string): Observable<ApiResponse<void> | void> {
    return this.httpClient.delete<ApiResponse<void> | void>(
      `${this.usersBaseUrl}/${userId}/devices/${encodeURIComponent(imei)}`,
    );
  }
}
