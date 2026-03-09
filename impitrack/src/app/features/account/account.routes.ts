import { Routes } from '@angular/router';

export const ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/account-page.component').then((m) => m.AccountPageComponent),
  },
];
