import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register-page.component').then((m) => m.RegisterPageComponent),
  },
  {
    path: 'recover-password',
    loadComponent: () =>
      import('./pages/recover-password-page.component').then((m) => m.RecoverPasswordPageComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password-page.component').then((m) => m.ResetPasswordPageComponent),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
];
