import { Routes } from '@angular/router';

export const OPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/ops-shell-page.component').then((m) => m.OpsShellPageComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'raw',
      },
      {
        path: 'raw/:packetId',
        loadComponent: () =>
          import('./pages/ops-raw-detail-page.component').then(
            (m) => m.OpsRawDetailPageComponent,
          ),
      },
      {
        path: 'raw',
        loadComponent: () =>
          import('./pages/ops-raw-page.component').then((m) => m.OpsRawPageComponent),
      },
      {
        path: 'errors',
        loadComponent: () =>
          import('./pages/ops-errors-page.component').then((m) => m.OpsErrorsPageComponent),
      },
      {
        path: 'sessions',
        loadComponent: () =>
          import('./pages/ops-sessions-page.component').then((m) => m.OpsSessionsPageComponent),
      },
      {
        path: 'ports',
        loadComponent: () =>
          import('./pages/ops-ports-page.component').then((m) => m.OpsPortsPageComponent),
      },
    ],
  },
];
