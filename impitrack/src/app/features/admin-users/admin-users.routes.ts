import { Routes } from '@angular/router';

export const ADMIN_USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/admin-users-page.component').then((m) => m.AdminUsersPageComponent),
  },
  {
    path: ':id/devices/:imei/telemetry',
    loadComponent: () =>
      import('../telemetry/pages/device-telemetry-page.component').then(
        (m) => m.DeviceTelemetryPageComponent,
      ),
    data: {
      telemetryContext: 'admin',
    },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/admin-user-detail-page.component').then(
        (m) => m.AdminUserDetailPageComponent,
      ),
  },
];
