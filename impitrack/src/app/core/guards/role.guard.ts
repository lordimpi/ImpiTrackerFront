import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthFacade } from '../auth/application/auth.facade';

export const roleGuard: CanActivateFn = (route) => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);
  const expectedRoles = (route.data['roles'] as readonly string[] | undefined) ?? [];

  if (!authFacade.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  return authFacade.hasAnyRole(expectedRoles)
    ? true
    : router.createUrlTree(['/unauthorized']);
};
