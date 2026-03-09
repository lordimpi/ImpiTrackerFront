import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthFacade } from '../auth/application/auth.facade';

describe('authGuard', () => {
  it('allows navigation when a session exists', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthFacade,
          useValue: {
            isAuthenticated: () => true,
          },
        },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/app/dashboard' } as never),
    );

    expect(result).toBe(true);
  });

  it('redirects guests to login with the target url', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthFacade,
          useValue: {
            isAuthenticated: () => false,
          },
        },
      ],
    });

    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/app/account' } as never),
    );

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/auth/login?redirectTo=%2Fapp%2Faccount');
  });
});
