import { type Router as RouterType, Router, Request, Response } from 'express';
import { validateReqBody, validateParams } from '../../middlewares';
import { SuccessResponse } from '../../types';
import {
  createReservation,
  confirmReservation,
  cancelReservation,
  getAllReservations,
  getReservation,
} from './reservations.service';
import { createReservationSchema, reservationIdParamSchema } from './reservations.schema';
import { ReservationResponse } from './types';

const router: RouterType = Router();

/**
 * GET /v1/reservations
 * Get all reservations
 *
 * @swagger
 * /reservations:
 *   get:
 *     tags:
 *       - Reservations
 *     summary: Get all reservations
 *     description: Retrieves a list of all reservations.
 *     operationId: getAllReservations
 *     responses:
 *       200:
 *         description: Reservations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponseReservationList'
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
router.get('/', async (req: Request, res: Response) => {
  const reservations = await getAllReservations();

  const response: SuccessResponse<ReservationResponse[]> = {
    success: true,
    data: reservations,
  };

  res.status(200).json(response);
});

/**
 * GET /v1/reservations/:id
 * Get a reservation by ID
 *
 * @swagger
 * /reservations/{id}:
 *   get:
 *     tags:
 *       - Reservations
 *     summary: Get a reservation by ID
 *     description: Retrieves a specific reservation by its UUID.
 *     operationId: getReservationById
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Reservation UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponseReservation'
 *       400:
 *         description: Invalid reservation ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationNotFoundError'
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
router.get('/:id', validateParams(reservationIdParamSchema), async (req: Request, res: Response) => {
  const { id } = req.params;

  const reservation = await getReservation(id as string);

  const response: SuccessResponse<ReservationResponse> = {
    success: true,
    data: reservation,
  };

  res.status(200).json(response);
});

/**
 * POST /v1/reservations
 * Create a new reservation
 *
 * @swagger
 * /reservations:
 *   post:
 *     tags:
 *       - Reservations
 *     summary: Create a new reservation
 *     description: Creates a new pending reservation for an item. The reserved quantity is temporarily held until the reservation is confirmed, cancelled, or expires.
 *     operationId: createReservation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReservationRequest'
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponseReservation'
 *       400:
 *         description: Validation error or insufficient quantity
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/InsufficientQuantityError'
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ItemNotFoundError'
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
router.post('/', validateReqBody(createReservationSchema), async (req: Request, res: Response) => {
  const { item_id, customer_id, quantity } = req.body;

  const reservation = await createReservation({
    item_id,
    customer_id,
    quantity,
  });

  const response: SuccessResponse<ReservationResponse> = {
    success: true,
    data: reservation,
  };

  res.status(201).json(response);
});

/**
 * POST /v1/reservations/:id/confirm
 * Confirm a pending reservation (permanently deducts quantity)
 *
 * @swagger
 * /reservations/{id}/confirm:
 *   post:
 *     tags:
 *       - Reservations
 *     summary: Confirm a reservation
 *     description: Confirms a pending reservation, permanently deducting the reserved quantity from the item inventory.
 *     operationId: confirmReservation
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Reservation UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponseReservation'
 *       400:
 *         description: Invalid reservation ID format or reservation cannot be confirmed
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/ReservationExpiredError'
 *                 - $ref: '#/components/schemas/ReservationCancelledError'
 *                 - $ref: '#/components/schemas/ReservationConfirmedError'
 *       404:
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationNotFoundError'
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
router.post('/:id/confirm', validateParams(reservationIdParamSchema), async (req: Request, res: Response) => {
  const { id } = req.params;

  const reservation = await confirmReservation(id as string);

  const response: SuccessResponse<ReservationResponse> = {
    success: true,
    data: reservation,
  };

  res.status(200).json(response);
});

/**
 * POST /v1/reservations/:id/cancel
 * Cancel a pending reservation (releases quantity back to availability)
 *
 * @swagger
 * /reservations/{id}/cancel:
 *   post:
 *     tags:
 *       - Reservations
 *     summary: Cancel a reservation
 *     description: Cancels a pending reservation, releasing the reserved quantity back to availability.
 *     operationId: cancelReservation
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Reservation UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponseReservation'
 *       400:
 *         description: Invalid reservation ID format or reservation cannot be cancelled
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/ReservationExpiredError'
 *                 - $ref: '#/components/schemas/ReservationCancelledError'
 *                 - $ref: '#/components/schemas/ReservationConfirmedError'
 *       404:
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationNotFoundError'
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
router.post('/:id/cancel', validateParams(reservationIdParamSchema), async (req: Request, res: Response) => {
  const { id } = req.params;

  const reservation = await cancelReservation(id as string);

  const response: SuccessResponse<ReservationResponse> = {
    success: true,
    data: reservation,
  };

  res.status(200).json(response);
});

export default router;
