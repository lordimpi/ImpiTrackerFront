import { isPlatformServer } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { PLATFORM_ID, inject } from '@angular/core';
import { AuthFacade } from '../auth/application/auth.facade';

export const guestGuard: CanActivateFn = () => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformServer(platformId)) {
    return true;
  }

  return authFacade.isAuthenticated() ? router.createUrlTree(['/app/dashboard']) : true;
};
