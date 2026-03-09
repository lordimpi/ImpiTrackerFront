import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { AuthFacade } from '../../../core/auth/application/auth.facade';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { normalizeApiError } from '../../../shared/utils/api-response.util';

@Component({
  selector: 'app-account-page',
  imports: [ButtonDirective, Card, LoadingSpinnerComponent, Tag],
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountPageComponent {
  private readonly authFacade = inject(AuthFacade);

  protected readonly user = this.authFacade.user;
  protected readonly roles = this.authFacade.roles;
  protected readonly pending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected async refreshProfile(): Promise<void> {
    this.pending.set(true);
    this.errorMessage.set(null);

    try {
      await this.authFacade.refreshProfile();
    } catch (error) {
      this.errorMessage.set(normalizeApiError(error).message);
    } finally {
      this.pending.set(false);
    }
  }
}
