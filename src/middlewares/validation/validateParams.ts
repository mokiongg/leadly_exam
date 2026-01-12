import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError, ErrorCode } from '../../types/api';

/**
 * Creates a validation middleware for route parameters using Zod schema.
 *
 * Validates the request params against the provided Zod schema.
 * If validation fails, throws an AppError with status 400.
 *
 * @param schema - Zod schema to validate route parameters against
 *
 * @returns Express middleware function that validates route parameters
 *
 * @throws {AppError} 400 VALIDATION_ERROR if validation fails
 *
 * @example
 * // Define a Zod schema
 * const idParamSchema = z.object({
 *   id: z.string().uuid(),
 * });
 *
 * // Use in route
 * router.get('/:id', validateParams(idParamSchema), handler);
 */
export const validateParams = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as typeof req.params;
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
