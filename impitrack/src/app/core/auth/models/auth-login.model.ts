export interface AuthLoginRequest {
  readonly userNameOrEmail: string;
  readonly password: string;
}

export interface AuthLoginResponse {
  readonly accessToken: string;
  readonly accessTokenExpiresAtUtc: string;
  readonly refreshToken: string;
  readonly refreshTokenExpiresAtUtc: string;
}

export interface RefreshTokenRequest {
  readonly refreshToken: string;
}
