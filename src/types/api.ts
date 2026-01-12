export enum ErrorCode {
  // General errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',

  // Item errors
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',

  // Reservation errors
  RESERVATION_NOT_FOUND = 'RESERVATION_NOT_FOUND',
  INSUFFICIENT_QUANTITY = 'INSUFFICIENT_QUANTITY',
  RESERVATION_EXPIRED = 'RESERVATION_EXPIRED',
  RESERVATION_CANCELLED = 'RESERVATION_CANCELLED',
  RESERVATION_CONFIRMED = 'RESERVATION_CONFIRMED',
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode | string;
    message: string;
  };
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
