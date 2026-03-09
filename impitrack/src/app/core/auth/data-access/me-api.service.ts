import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../config/app-config';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { CurrentUserDto } from '../models/current-user.model';

@Injectable({
  providedIn: 'root',
})
export class MeApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly appConfig = inject(APP_CONFIG);

  getCurrentUser(): Observable<ApiResponse<CurrentUserDto> | CurrentUserDto> {
    return this.httpClient.get<ApiResponse<CurrentUserDto> | CurrentUserDto>(
      `${this.appConfig.apiBaseUrl}/api/me`,
    );
  }
}
