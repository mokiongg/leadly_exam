import { Request, Response } from 'express';
import { ErrorCode, ErrorResponse } from '../../types/api';

/**
 * Handler for undefined routes (404 Not Found).
 *
 * Catches all requests that don't match any defined routes
 * and returns a standardized 404 error response.
 *
 * @param req - Express request object
 * @param res - Express response object
 *
 * @example
 * // Register after all route definitions
 * app.use(notFoundHandler);
 *
 * @returns void - Sends JSON 404 error response to client
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: ErrorCode.NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
    },
  };
  res.status(404).json(response);
};
