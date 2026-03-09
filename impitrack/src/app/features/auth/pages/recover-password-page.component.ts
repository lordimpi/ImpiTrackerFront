import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { AuthFacade } from '../../../core/auth/application/auth.facade';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { normalizeApiError } from '../../../shared/utils/api-response.util';

@Component({
  selector: 'app-recover-password-page',
  imports: [
    ButtonDirective,
    Card,
    InputText,
    LoadingSpinnerComponent,
    Message,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './recover-password-page.component.html',
  styleUrl: './recover-password-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoverPasswordPageComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly authFacade = inject(AuthFacade);

  protected readonly pending = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.submitError.set(null);
    this.successMessage.set(null);

    try {
      await this.authFacade.forgotPassword(this.form.getRawValue());
      this.successMessage.set(
        'Si el correo existe, te enviaremos un enlace para restablecer la contrasena.',
      );
    } catch (error) {
      this.submitError.set(normalizeApiError(error).message);
    } finally {
      this.pending.set(false);
    }
  }
}
