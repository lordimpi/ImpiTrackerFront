import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { AuthFacade } from '../../../core/auth/application/auth.facade';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { normalizeApiError } from '../../../shared/utils/api-response.util';

@Component({
  selector: 'app-login-page',
  imports: [
    ButtonDirective,
    Card,
    Checkbox,
    InputText,
    LoadingSpinnerComponent,
    Message,
    Password,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly justRegistered = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly form = this.formBuilder.group({
    userNameOrEmail: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberSession: [false],
  });

  constructor() {
    if (this.route.snapshot.queryParamMap.get('registered') === 'true') {
      this.justRegistered.set(true);
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.submitError.set(null);

    try {
      const { rememberSession, ...credentials } = this.form.getRawValue();
      await this.authFacade.login(credentials, rememberSession);
      await this.router.navigate(['/app/map']);
    } catch (error) {
      const apiError = normalizeApiError(error);
      this.submitError.set(
        apiError.status === 401 ? 'Usuario o contrasena invalidos.' : apiError.message,
      );
    } finally {
      this.pending.set(false);
    }
  }
}
