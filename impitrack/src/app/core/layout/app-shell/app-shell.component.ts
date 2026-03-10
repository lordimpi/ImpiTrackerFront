import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { AuthFacade } from '../../auth/application/auth.facade';

interface NavigationItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly roles?: readonly string[];
}

@Component({
  selector: 'app-shell',
  imports: [ButtonDirective, RouterLink, RouterLinkActive, RouterOutlet, Tag],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  private readonly authFacade = inject(AuthFacade);

  private readonly navigationItems: readonly NavigationItem[] = [
    { label: 'Resumen', route: '/app/dashboard', icon: 'pi pi-chart-line' },
    { label: 'Cuenta', route: '/app/account', icon: 'pi pi-user' },
    { label: 'Mis dispositivos', route: '/app/devices', icon: 'pi pi-truck' },
    { label: 'Administración', route: '/admin/users', icon: 'pi pi-shield', roles: ['Admin'] },
    { label: 'Operaciones', route: '/ops/raw', icon: 'pi pi-bolt', roles: ['Admin'] },
  ];

  protected readonly displayName = this.authFacade.displayName;
  protected readonly roles = this.authFacade.roles;
  protected readonly user = this.authFacade.user;
  protected readonly visibleItems = computed(() =>
    this.navigationItems.filter(
      (item) => !item.roles || this.authFacade.hasAnyRole(item.roles),
    ),
  );

  protected async signOut(): Promise<void> {
    await this.authFacade.logout();
  }
}
