import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode, ErrorResponse } from '../../types/api';

/**
 * Global error handling middleware for Express.
 *
 * Catches all errors thrown in route handlers and middleware,
 * formats them into a consistent error response structure,
 * and sends the appropriate HTTP status code.
 *
 * @param err - The error object thrown by the application
 * @param req - Express request object
 * @param res - Express response object
 * @param _next - Express next function (required for error middleware signature)
 *
 * @example
 * // Register as the last middleware in Express app
 * app.use(errorHandler);
 *
 * @returns void - Sends JSON error response to client
 */
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle unexpected errors
  const response: ErrorResponse = {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
    },
  };
  res.status(500).json(response);
};
