import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError, ErrorCode } from '../../types/api';

/**
 * Creates a validation middleware for request body using Zod schema.
 *
 * Validates the request body against the provided Zod schema.
 * If validation fails, throws an AppError with status 400.
 *
 * @param schema - Zod schema to validate request body against
 *
 * @returns Express middleware function that validates request body
 *
 * @throws {AppError} 400 VALIDATION_ERROR if validation fails
 *
 * @example
 * // Define a Zod schema
 * const createItemSchema = z.object({
 *   name: z.string().min(1).max(255),
 *   initial_quantity: z.number().int().min(1),
 * });
 *
 * // Use in route
 * router.post('/', validateReqBody(createItemSchema), handler);
 */
export const validateReqBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        throw new AppError(400, messages, ErrorCode.VALIDATION_ERROR);
      }
      throw error;
    }
  };
};
