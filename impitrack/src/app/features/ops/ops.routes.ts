import { Routes } from '@angular/router';

export const OPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/ops-page.component').then((m) => m.OpsPageComponent),
  },
];
