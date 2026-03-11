import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { LoadingSpinnerComponent } from './shared/ui/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-root',
  imports: [ConfirmDialog, LoadingSpinnerComponent, RouterOutlet, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly shouldHoldProtectedSsrRender = computed(
    () => !this.isBrowser && /^(\/app|\/admin|\/ops)(\/|$)/.test(this.router.url),
  );
}
