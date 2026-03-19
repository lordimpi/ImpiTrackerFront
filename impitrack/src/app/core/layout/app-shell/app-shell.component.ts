import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthFacade } from '../../auth/application/auth.facade';

interface NavigationItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly roles?: readonly string[];
}

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  private readonly navigationItems: readonly NavigationItem[] = [
    { label: 'Mapa', route: '/app/map', icon: 'pi pi-map' },
    { label: 'Dispositivos', route: '/app/devices', icon: 'pi pi-truck' },
    { label: 'Cuenta', route: '/app/account', icon: 'pi pi-user' },
    { label: 'Administración', route: '/admin/users', icon: 'pi pi-shield', roles: ['Admin'] },
    { label: 'Operaciones', route: '/ops/raw', icon: 'pi pi-bolt', roles: ['Admin'] },
  ];

  protected readonly displayName = this.authFacade.displayName;

  protected readonly isAdminShell = computed(() => {
    const url = this.router.url;
    return url.startsWith('/admin') || url.startsWith('/ops');
  });

  protected readonly visibleItems = computed(() =>
    this.navigationItems.filter((item) => !item.roles || this.authFacade.hasAnyRole(item.roles)),
  );

  protected async signOut(): Promise<void> {
    await this.authFacade.logout();
  }
}
