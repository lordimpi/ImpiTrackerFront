export interface ApiError {
  readonly status: number;
  readonly message: string;
  readonly code?: string;
  readonly details?: unknown;
}
