import { type Router as RouterType, Router, Request, Response } from 'express';
import { SuccessResponse } from '../../types';
import { expireReservations } from './maintenance.service';
import { ExpireReservationsResult } from './types';

const router: RouterType = Router();

/**
 * POST /v1/maintenance/expire-reservations
 * Expire all pending reservations that have passed their expiry time
 *
 * @swagger
 * /maintenance/expire-reservations:
 *   post:
 *     tags:
 *       - Maintenance
 *     summary: Expire pending reservations
 *     description: Expires all pending reservations that have passed their expiry time, releasing their quantities back to availability.
 *     operationId: expireReservations
 *     responses:
 *       200:
 *         description: Expiration process completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponseExpireReservations'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TooManyRequestsError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 */
router.post('/expire-reservations', async (req: Request, res: Response) => {
  const result = await expireReservations();

  const response: SuccessResponse<ExpireReservationsResult> = {
    success: true,
    data: result,
  };

  res.status(200).json(response);
});

export default router;
