import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { AuthFacade } from '../../../core/auth/application/auth.facade';
import { ApiError } from '../../../shared/models/api-error.model';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { normalizeApiError } from '../../../shared/utils/api-response.util';
import {
  getPasswordRuleState,
  passwordPolicyValidator,
} from '../../../shared/validators/password-policy.validator';

@Component({
  selector: 'app-reset-password-page',
  imports: [
    ButtonDirective,
    Card,
    LoadingSpinnerComponent,
    Message,
    Password,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './reset-password-page.component.html',
  styleUrl: './reset-password-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPageComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly authFacade = inject(AuthFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  protected readonly pending = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly form = this.formBuilder.group({
    newPassword: ['', [Validators.required, passwordPolicyValidator()]],
    confirmPassword: ['', [Validators.required]],
  });
  private readonly passwordValue = toSignal(
    this.form.controls.newPassword.valueChanges.pipe(startWith(this.form.controls.newPassword.value)),
    { initialValue: this.form.controls.newPassword.value },
  );
  private readonly confirmPasswordValue = toSignal(
    this.form.controls.confirmPassword.valueChanges.pipe(
      startWith(this.form.controls.confirmPassword.value),
    ),
    { initialValue: this.form.controls.confirmPassword.value },
  );
  protected readonly passwordRules = computed(() =>
    getPasswordRuleState(this.passwordValue()),
  );
  protected readonly confirmPasswordTouched = computed(
    () =>
      this.form.controls.confirmPassword.touched ||
      this.form.controls.confirmPassword.dirty ||
      this.confirmPasswordValue().length > 0,
  );
  protected readonly passwordMismatch = computed(
    () =>
      this.confirmPasswordTouched() &&
      this.passwordValue() !== this.confirmPasswordValue(),
  );
  protected readonly resetContextMissing = computed(
    () => !this.email.trim() || !this.token.trim(),
  );

  constructor() {
    if (this.resetContextMissing()) {
      this.submitError.set('El enlace de recuperacion no es valido o esta incompleto.');
    }
  }

  protected async submit(): Promise<void> {
    if (this.resetContextMissing()) {
      this.submitError.set('El enlace de recuperacion no es valido o esta incompleto.');
      return;
    }

    if (this.form.invalid || this.passwordMismatch() || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.submitError.set(null);

    const { newPassword } = this.form.getRawValue();

    try {
      await this.authFacade.resetPassword({
        email: this.email,
        token: this.token,
        newPassword,
      });
      this.messageService.add({
        severity: 'success',
        summary: 'Contrasena actualizada',
        detail: 'Ya puedes iniciar sesion con tu nueva contrasena.',
      });
      await this.router.navigate(['/auth/login']);
    } catch (error) {
      this.submitError.set(this.getResetPasswordErrorMessage(normalizeApiError(error)));
    } finally {
      this.pending.set(false);
    }
  }

  private getResetPasswordErrorMessage(apiError: ApiError): string {
    if (apiError.code === 'invalid_password_reset_token') {
      return 'El enlace de recuperacion no es valido o ya vencio.';
    }

    if (Array.isArray(apiError.details) && apiError.details.every((item) => typeof item === 'string')) {
      return (apiError.details as string[]).join(' ');
    }

    return apiError.message;
  }
}
