import { ChangeDetectionStrategy, Component, HostListener, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly navigationItems: readonly NavigationItem[] = [
    { label: 'Resumen', route: '/app/dashboard', icon: 'pi pi-chart-line' },
    { label: 'Mapa', route: '/app/map', icon: 'pi pi-map' },
    { label: 'Cuenta', route: '/app/account', icon: 'pi pi-user' },
    { label: 'Mis dispositivos', route: '/app/devices', icon: 'pi pi-truck' },
    { label: 'Administracion', route: '/admin/users', icon: 'pi pi-shield', roles: ['Admin'] },
    { label: 'Operaciones', route: '/ops/raw', icon: 'pi pi-bolt', roles: ['Admin'] },
  ];

  protected readonly displayName = this.authFacade.displayName;
  protected readonly roles = this.authFacade.roles;
  protected readonly user = this.authFacade.user;
  protected readonly sidebarOpen = signal(true);
  protected readonly mobileViewport = signal(false);
  protected readonly visibleItems = computed(() =>
    this.navigationItems.filter(
      (item) => !item.roles || this.authFacade.hasAnyRole(item.roles),
    ),
  );
  protected readonly showBackdrop = computed(() => this.mobileViewport() && this.sidebarOpen());

  constructor() {
    this.syncViewportState();
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.syncViewportState();
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((current) => !current);
  }

  protected closeSidebar(): void {
    if (this.mobileViewport()) {
      this.sidebarOpen.set(false);
    }
  }

  protected async signOut(): Promise<void> {
    await this.authFacade.logout();
  }

  private syncViewportState(): void {
    if (!this.isBrowser) {
      this.mobileViewport.set(false);
      this.sidebarOpen.set(true);
      return;
    }

    const isMobile = window.innerWidth <= 980;
    const previousMobileState = this.mobileViewport();
    this.mobileViewport.set(isMobile);

    if (isMobile && !previousMobileState) {
      this.sidebarOpen.set(false);
      return;
    }

    if (!isMobile && previousMobileState) {
      this.sidebarOpen.set(true);
    }
  }
}
