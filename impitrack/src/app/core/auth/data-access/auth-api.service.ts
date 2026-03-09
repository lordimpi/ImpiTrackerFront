import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../config/app-config';
import { ApiResponse } from '../../../shared/models/api-response.model';
import {
  AuthLoginRequest,
  AuthLoginResponse,
  RefreshTokenRequest,
} from '../models/auth-login.model';
import {
  ForgotPasswordRequest,
  RegisterRequest,
  RegisterResultResponse,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from '../models/register-request.model';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly appConfig = inject(APP_CONFIG);
  private readonly baseUrl = `${this.appConfig.apiBaseUrl}/api/auth`;

  login(payload: AuthLoginRequest): Observable<ApiResponse<AuthLoginResponse> | AuthLoginResponse> {
    return this.httpClient.post<ApiResponse<AuthLoginResponse> | AuthLoginResponse>(
      `${this.baseUrl}/login`,
      payload,
    );
  }

  register(
    payload: RegisterRequest,
  ): Observable<ApiResponse<RegisterResultResponse> | RegisterResultResponse> {
    return this.httpClient.post<ApiResponse<RegisterResultResponse> | RegisterResultResponse>(
      `${this.baseUrl}/register`,
      payload,
    );
  }

  refresh(payload: RefreshTokenRequest): Observable<ApiResponse<AuthLoginResponse> | AuthLoginResponse> {
    return this.httpClient.post<ApiResponse<AuthLoginResponse> | AuthLoginResponse>(
      `${this.baseUrl}/refresh`,
      payload,
    );
  }

  revoke(payload: RefreshTokenRequest): Observable<ApiResponse<void> | void> {
    return this.httpClient.post<ApiResponse<void> | void>(`${this.baseUrl}/revoke`, payload);
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<ApiResponse<void> | void> {
    return this.httpClient.post<ApiResponse<void> | void>(`${this.baseUrl}/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<ApiResponse<void> | void> {
    return this.httpClient.post<ApiResponse<void> | void>(`${this.baseUrl}/reset-password`, payload);
  }

  confirmEmail(payload: VerifyEmailRequest): Observable<ApiResponse<void> | void> {
    return this.httpClient.post<ApiResponse<void> | void>(`${this.baseUrl}/verify-email`, payload);
  }

  confirmEmailByLink(payload: VerifyEmailRequest): Observable<ApiResponse<void> | void> {
    const params = new HttpParams({
      fromObject: {
        userId: payload.userId,
        token: payload.token,
      },
    });

    return this.httpClient.get<ApiResponse<void> | void>(`${this.baseUrl}/verify-email/confirm`, {
      params,
    });
  }
}
