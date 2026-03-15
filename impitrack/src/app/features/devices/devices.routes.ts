import { Routes } from '@angular/router';

export const DEVICES_ROUTES: Routes = [
  {
    path: ':imei/telemetry',
    loadComponent: () =>
      import('../telemetry/pages/device-telemetry-page.component').then(
        (m) => m.DeviceTelemetryPageComponent,
      ),
    data: {
      telemetryContext: 'self',
    },
  },
  {
    path: '',
    loadComponent: () =>
      import('./pages/devices-page.component').then((m) => m.DevicesPageComponent),
  },
];
