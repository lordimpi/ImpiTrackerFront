import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { APP_CONFIG } from '../../config/app-config';
import { AuthFacade } from './auth.facade';

describe('AuthFacade', () => {
  const apiBaseUrl = 'https://localhost:54124';

  beforeEach(() => {
    globalThis.localStorage.clear();
    globalThis.sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        {
          provide: APP_CONFIG,
          useValue: {
            apiBaseUrl,
            appName: 'IMPITrack Frontend',
            production: false,
          },
        },
      ],
    });
  });

  it('logs in, hydrates the current user, and resolves roles from the JWT', async () => {
    const facade = TestBed.inject(AuthFacade);
    const httpController = TestBed.inject(HttpTestingController);

    const loginPromise = facade.login({
      userNameOrEmail: 'admin',
      password: 'secure-pass',
    }, true);

    httpController.expectOne(`${apiBaseUrl}/api/auth/login`).flush({
      data: {
        accessToken: createJwt({
          email: 'admin@imptrack.local',
          role: ['Admin'],
        }),
        accessTokenExpiresAtUtc: new Date(Date.now() + 900_000).toISOString(),
        refreshToken: 'refresh-token',
        refreshTokenExpiresAtUtc: new Date(Date.now() + 86_400_000).toISOString(),
      },
    });

    await Promise.resolve();

    httpController.expectOne(`${apiBaseUrl}/api/me`).flush({
      data: {
        userId: 'usr-1',
        email: 'admin@imptrack.local',
        fullName: 'Ops Lead',
        planCode: 'BASIC',
        planName: 'Basico',
        maxGps: 3,
        usedGps: 1,
      },
    });

    await loginPromise;

    expect(facade.isAuthenticated()).toBe(true);
    expect(facade.user()?.email).toBe('admin@imptrack.local');
    expect(facade.roles()).toEqual(['Admin']);
    expect(globalThis.localStorage.getItem('impitrack.auth')).toContain('refresh-token');
    httpController.verify();
  });

  it('clears state when refresh fails with unauthorized', async () => {
    globalThis.sessionStorage.setItem(
      'impitrack.auth',
      JSON.stringify({
        session: {
          accessToken: createJwt({
            email: 'admin@imptrack.local',
          }),
          refreshToken: 'refresh-token',
          tokenType: 'Bearer',
          expiresAt: new Date(Date.now() - 60_000).toISOString(),
        },
        user: null,
      }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        {
          provide: APP_CONFIG,
          useValue: {
            apiBaseUrl,
            appName: 'IMPITrack Frontend',
            production: false,
          },
        },
      ],
    });

    const facade = TestBed.inject(AuthFacade);
    const httpController = TestBed.inject(HttpTestingController);

    const initPromise = facade.initialize();

    httpController.expectOne(`${apiBaseUrl}/api/auth/refresh`).flush(
      {
        error: {
          code: 'unauthorized',
          message: 'Session expired',
        },
      },
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    await initPromise;

    expect(facade.isAuthenticated()).toBe(false);
    expect(globalThis.localStorage.getItem('impitrack.auth')).toBeNull();
    expect(globalThis.sessionStorage.getItem('impitrack.auth')).toBeNull();
    httpController.verify();
  });
});

function createJwt(payload: Record<string, unknown>): string {
  const header = toBase64Url({ alg: 'none', typ: 'JWT' });
  const body = toBase64Url(payload);
  return `${header}.${body}.signature`;
}

function toBase64Url(value: Record<string, unknown>): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
