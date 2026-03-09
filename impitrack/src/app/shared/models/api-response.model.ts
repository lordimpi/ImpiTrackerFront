export interface ApiResponse<T> {
  readonly success?: boolean;
  readonly data: T;
  readonly error?: {
    readonly code?: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly traceId?: string;
}
