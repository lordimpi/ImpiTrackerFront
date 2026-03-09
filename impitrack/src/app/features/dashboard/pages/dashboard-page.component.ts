import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Card } from 'primeng/card';
import { ButtonDirective } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Tag } from 'primeng/tag';
import { AuthFacade } from '../../../core/auth/application/auth.facade';

type DashboardSeverity = 'success' | 'secondary' | 'info' | 'warn';

@Component({
  selector: 'app-dashboard-page',
  imports: [ButtonDirective, Card, Dialog, Tag],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  private readonly authFacade = inject(AuthFacade);

  protected readonly user = this.authFacade.user;
  protected roadmapVisible = false;
  protected readonly readiness = computed(() => [
    {
      label: 'Autenticación',
      value: 'Activa',
      severity: 'success' as DashboardSeverity,
    },
    {
      label: 'Perfil',
      value: this.user() ? 'Listo' : 'Esperando sesión del backend',
      severity: (this.user() ? 'info' : 'warn') as DashboardSeverity,
    },
    {
      label: 'Dispositivos',
      value: 'Siguiente corte',
      severity: 'secondary' as DashboardSeverity,
    },
  ]);
}
