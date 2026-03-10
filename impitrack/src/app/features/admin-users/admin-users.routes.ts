import { Routes } from '@angular/router';

export const ADMIN_USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/admin-users-page.component').then((m) => m.AdminUsersPageComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/admin-user-detail-page.component').then(
        (m) => m.AdminUserDetailPageComponent,
      ),
  },
];
