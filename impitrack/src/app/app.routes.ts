import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';
import { AppShellComponent } from './core/layout/app-shell/app-shell.component';
import { PublicLayoutComponent } from './core/layout/public-layout/public-layout.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'app/map',
  },
  {
    path: 'auth',
    component: PublicLayoutComponent,
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/auth/pages/unauthorized-page.component').then(
        (m) => m.UnauthorizedPageComponent,
      ),
  },
  {
    path: 'app',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'map',
      },
      {
        path: 'dashboard',
        redirectTo: 'map',
      },
      {
        path: 'dashboard-legacy',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'account',
        loadChildren: () =>
          import('./features/account/account.routes').then((m) => m.ACCOUNT_ROUTES),
      },
      {
        path: 'map',
        loadComponent: () =>
          import('./features/telemetry/pages/telemetry-map-page.component').then(
            (m) => m.TelemetryMapPageComponent,
          ),
      },
      {
        path: 'devices',
        loadChildren: () =>
          import('./features/devices/devices.routes').then((m) => m.DEVICES_ROUTES),
      },
    ],
  },
  {
    path: 'admin',
    component: AppShellComponent,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Admin'],
    },
    children: [
      {
        path: 'users',
        loadChildren: () =>
          import('./features/admin-users/admin-users.routes').then((m) => m.ADMIN_USERS_ROUTES),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'users',
      },
    ],
  },
  {
    path: 'ops',
    component: AppShellComponent,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Admin'],
    },
    children: [
      {
        path: '',
        loadChildren: () => import('./features/ops/ops.routes').then((m) => m.OPS_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'app/map',
  },
];
