import { isPlatformServer } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { PLATFORM_ID, inject } from '@angular/core';
import { AuthFacade } from '../auth/application/auth.facade';

export const roleGuard: CanActivateFn = (route) => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const expectedRoles = (route.data['roles'] as readonly string[] | undefined) ?? [];

  if (isPlatformServer(platformId)) {
    return true;
  }

  if (!authFacade.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  return authFacade.hasAnyRole(expectedRoles)
    ? true
    : router.createUrlTree(['/unauthorized']);
};
