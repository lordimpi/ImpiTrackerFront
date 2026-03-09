import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthFacade } from '../auth/application/auth.facade';

const AUTH_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/refresh',
  '/api/auth/revoke',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/verify-email/confirm',
];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authFacade = inject(AuthFacade);
  const accessToken = authFacade.getAccessToken();
  const isAuthRoute = AUTH_ROUTES.some((segment) => request.url.includes(segment));
  const authorizedRequest =
    accessToken && !isAuthRoute
      ? request.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isAuthRoute) {
        return throwError(() => error);
      }

      return from(authFacade.refreshSession()).pipe(
        switchMap((session) => {
          if (!session) {
            return throwError(() => error);
          }

          return next(
            request.clone({
              setHeaders: {
                Authorization: `${session.tokenType} ${session.accessToken}`,
              },
            }),
          );
        }),
      );
    }),
  );
};
