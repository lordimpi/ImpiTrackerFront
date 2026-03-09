import { Routes } from '@angular/router';

export const DEVICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/devices-page.component').then((m) => m.DevicesPageComponent),
  },
];
