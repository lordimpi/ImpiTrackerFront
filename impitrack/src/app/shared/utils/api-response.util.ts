import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../models/api-error.model';
import { ApiResponse } from '../models/api-response.model';

export function unwrapApiResponse<T>(response: ApiResponse<T> | T): T {
  if (!isApiResponse(response)) {
    return response;
  }

  if (response.success === false || response.error) {
    throw {
      status: 400,
      message: response.error?.message ?? 'La API devolvio una respuesta no exitosa.',
      code: response.error?.code,
      details: response.error?.details,
    } satisfies ApiError;
  }

  return response.data;
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof HttpErrorResponse) {
    const serverPayload = error.error as
      | {
          message?: string;
          code?: string;
          errors?: unknown;
          error?: {
            code?: string;
            message?: string;
            details?: unknown;
          };
        }
      | null;
    const envelopeError = serverPayload?.error;

    return {
      status: error.status,
      message:
        envelopeError?.message ?? serverPayload?.message ?? error.message ?? 'Error inesperado de la API.',
      code: envelopeError?.code ?? serverPayload?.code,
      details: envelopeError?.details ?? serverPayload?.errors ?? error.error,
    };
  }

  if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
    return error as ApiError;
  }

  return {
    status: 0,
    message: error instanceof Error ? error.message : 'Error inesperado de la API.',
    details: error,
  };
}

function isApiResponse<T>(response: ApiResponse<T> | T): response is ApiResponse<T> {
  return typeof response === 'object' && response !== null && 'data' in response;
}
