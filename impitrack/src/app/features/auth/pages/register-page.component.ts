import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { AuthFacade } from '../../../core/auth/application/auth.facade';
import { ApiError } from '../../../shared/models/api-error.model';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { normalizeApiError } from '../../../shared/utils/api-response.util';
import {
  getPasswordRuleState,
  passwordPolicyValidator,
} from '../../../shared/validators/password-policy.validator';

@Component({
  selector: 'app-register-page',
  imports: [
    ButtonDirective,
    Card,
    InputText,
    LoadingSpinnerComponent,
    Message,
    Password,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPageComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);


  protected readonly pending = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly form = this.formBuilder.group({
    userName: ['', [Validators.required, Validators.minLength(3)]],
    fullName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, passwordPolicyValidator()]],
    confirmPassword: ['', [Validators.required]],
  });
  private readonly passwordValue = toSignal(
    this.form.controls.password.valueChanges.pipe(startWith(this.form.controls.password.value)),
    { initialValue: this.form.controls.password.value },
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

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.passwordMismatch() || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.submitError.set(null);

    const { userName, fullName, email, password } = this.form.getRawValue();

    try {
      await this.authFacade.register({
        userName,
        fullName: fullName || undefined,
        email,
        password,
      });
      await this.router.navigate(['/auth/login'], {
        queryParams: { registered: 'true' },
      });
    } catch (error) {
      this.submitError.set(this.getRegisterErrorMessage(normalizeApiError(error)));
    } finally {
      this.pending.set(false);
    }
  }

  private getRegisterErrorMessage(apiError: ApiError): string {
    switch (apiError.code) {
      case 'username_already_exists':
        return 'Ese nombre de usuario ya esta en uso.';
      case 'email_already_exists':
        return 'El correo ingresado ya esta registrado.';
      case 'validation_failed':
        return 'Revisa los datos del formulario antes de continuar.';
      default:
        return apiError.message;
    }
  }
}
