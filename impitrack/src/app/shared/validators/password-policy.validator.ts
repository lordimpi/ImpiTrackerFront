import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface PasswordRuleState {
  readonly minLength: boolean;
  readonly uppercase: boolean;
  readonly lowercase: boolean;
  readonly digit: boolean;
  readonly symbol: boolean;
}

export function getPasswordRuleState(value: string | null | undefined): PasswordRuleState {
  const password = value ?? '';

  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
}

export function passwordPolicyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const rules = getPasswordRuleState(control.value as string | null | undefined);
    const valid = Object.values(rules).every(Boolean);

    return valid ? null : { passwordPolicy: rules };
  };
}
