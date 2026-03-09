export interface RegisterRequest {
  readonly userName: string;
  readonly email: string;
  readonly password: string;
  readonly fullName?: string;
}

export interface RegisterResponseData {
  readonly userId: string;
  readonly userName: string;
  readonly email: string;
  readonly requiresEmailVerification: boolean;
  readonly emailVerificationToken: string;
}

export interface RegisterResultResponse {
  readonly status: number;
  readonly registration?: RegisterResponseData | null;
  readonly errors?: readonly string[];
}

export interface VerifyEmailRequest {
  readonly userId: string;
  readonly token: string;
}

export interface ForgotPasswordRequest {
  readonly email: string;
}

export interface ResetPasswordRequest {
  readonly email: string;
  readonly token: string;
  readonly newPassword: string;
}
