import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthSessionStorage } from '../data-access/auth-session.storage';
import { AuthApiService } from '../data-access/auth-api.service';
import { MeApiService } from '../data-access/me-api.service';
import { AuthLoginRequest, AuthLoginResponse } from '../models/auth-login.model';
import { AuthSession } from '../models/auth-session.model';
import { CurrentUserDto } from '../models/current-user.model';
import {
  ForgotPasswordRequest,
  RegisterRequest,
  RegisterResultResponse,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from '../models/register-request.model';
import { normalizeApiError, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { readJwtClaims, readJwtRoles } from '../utils/jwt-claims.util';

interface AuthState {
  readonly session: AuthSession | null;
  readonly user: CurrentUserDto | null;
  readonly initializing: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthFacade {
  private readonly authApi = inject(AuthApiService);
  private readonly meApi = inject(MeApiService);
  private readonly storage = inject(AuthSessionStorage);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  private readonly persistedState = this.storage.read();
  private readonly state = signal<AuthState>({
    session: this.persistedState?.session ?? null,
    user: this.persistedState?.user ?? null,
    initializing: true,
  });

  private refreshPromise: Promise<AuthSession | null> | null = null;

  readonly session = computed(() => this.state().session);
  readonly user = computed(() => this.state().user);
  readonly initializing = computed(() => this.state().initializing);
  readonly isAuthenticated = computed(() => Boolean(this.state().session?.accessToken));
  readonly tokenClaims = computed(() => {
    const accessToken = this.state().session?.accessToken;
    return accessToken ? readJwtClaims(accessToken) : null;
  });
  readonly roles = computed(() => {
    const userRoles = this.state().user?.roles ?? [];

    if (userRoles.length > 0) {
      return userRoles;
    }

    const accessToken = this.state().session?.accessToken;
    return accessToken ? readJwtRoles(accessToken) : [];
  });
  readonly displayName = computed(
    () =>
      this.state().user?.fullName ??
      this.state().user?.email ??
      this.tokenClaims()?.email ??
      this.tokenClaims()?.unique_name ??
      'Operador',
  );

  async initialize(): Promise<void> {
    if (!this.session()) {
      this.patchState({ initializing: false });
      return;
    }

    try {
      if (this.isSessionExpired()) {
        await this.refreshSession();
      }

      if (this.session()) {
        await this.loadCurrentUser();
      }
    } catch {
      this.clearState();
    } finally {
      this.patchState({ initializing: false });
    }
  }

  async login(payload: AuthLoginRequest): Promise<void> {
    try {
      const response = await firstValueFrom(this.authApi.login(payload));
      this.persistSession(unwrapApiResponse(response));
      await this.loadCurrentUser();
    } catch (error) {
      this.clearState();
      throw error;
    }
  }

  async register(payload: RegisterRequest): Promise<RegisterResultResponse> {
    const response = await firstValueFrom(this.authApi.register(payload));
    return unwrapApiResponse(response);
  }

  async confirmEmail(payload: VerifyEmailRequest): Promise<void> {
    await firstValueFrom(this.authApi.confirmEmail(payload));
  }

  async forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
    await firstValueFrom(this.authApi.forgotPassword(payload));
  }

  async resetPassword(payload: ResetPasswordRequest): Promise<void> {
    await firstValueFrom(this.authApi.resetPassword(payload));
  }

  async refreshProfile(): Promise<void> {
    await this.loadCurrentUser();
  }

  async logout(announce = true): Promise<void> {
    const session = this.session();

    if (session) {
      try {
        await firstValueFrom(this.authApi.revoke({ refreshToken: session.refreshToken }));
      } catch {
        // Ignore revoke failures during client-side logout.
      }
    }

    this.clearState();

    if (announce) {
      this.messageService.add({
        severity: 'success',
        summary: 'Sesion cerrada',
        detail: 'Has salido de IMPITrack.',
      });
    }

    await this.router.navigate(['/auth/login']);
  }

  async refreshSession(): Promise<AuthSession | null> {
    const session = this.session();

    if (!session?.refreshToken) {
      return null;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh(session.refreshToken);

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  hasAnyRole(expectedRoles: readonly string[]): boolean {
    if (expectedRoles.length === 0) {
      return true;
    }

    const currentRoles = this.roles();
    return expectedRoles.some((role) => currentRoles.includes(role));
  }

  getAccessToken(): string | null {
    return this.session()?.accessToken ?? null;
  }

  private async performRefresh(refreshToken: string): Promise<AuthSession | null> {
    try {
      const response = await firstValueFrom(this.authApi.refresh({ refreshToken }));
      const authResponse = unwrapApiResponse(response);
      this.persistSession(authResponse, this.user());
      return this.session();
    } catch (error) {
      const apiError = normalizeApiError(error);

      if (apiError.status === 401) {
        this.clearState();
      }

      return null;
    }
  }

  private async loadCurrentUser(): Promise<void> {
    const response = await firstValueFrom(this.meApi.getCurrentUser());
    const user = unwrapApiResponse(response);
    const mergedUser: CurrentUserDto = {
      ...user,
      roles: this.roles(),
    };

    this.patchState({ user: mergedUser });
    this.persistCurrentSnapshot();
  }

  private persistSession(authResponse: AuthLoginResponse, currentUser?: CurrentUserDto | null): void {
    const session: AuthSession = {
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
      expiresAt: authResponse.accessTokenExpiresAtUtc,
      tokenType: 'Bearer',
    };

    this.patchState({
      session,
      user: currentUser ?? this.user(),
    });

    this.persistCurrentSnapshot();
  }

  private persistCurrentSnapshot(): void {
    const session = this.session();

    if (!session) {
      this.storage.clear();
      return;
    }

    this.storage.write({
      session,
      user: this.user(),
    });
  }

  private clearState(): void {
    this.state.set({
      session: null,
      user: null,
      initializing: false,
    });
    this.storage.clear();
  }

  private isSessionExpired(): boolean {
    const expiresAt = this.session()?.expiresAt;

    if (!expiresAt) {
      return false;
    }

    return new Date(expiresAt).getTime() <= Date.now() + 30_000;
  }

  private patchState(partial: Partial<AuthState>): void {
    this.state.update((state) => ({
      ...state,
      ...partial,
    }));
  }
}
