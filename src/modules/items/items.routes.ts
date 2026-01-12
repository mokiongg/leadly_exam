import { type Router as RouterType, Router, Request, Response } from 'express';
import { validateReqBody, validateParams } from '../../middlewares';
import { SuccessResponse } from '../../types';
import { createItem, getAllItems, getItemStatus } from './items.service';
import { createItemSchema, itemIdParamSchema } from './items.schema';
import { Item, ItemStatus } from './types';

const router: RouterType = Router();

/**
 * GET /v1/items
 * Get all items
 *
 * @swagger
 * /items:
 *   get:
 *     tags:
 *       - Items
 *     summary: Get all items
 *     description: Retrieves a list of all inventory items.
 *     operationId: getAllItems
 *     responses:
 *       200:
 *         description: Items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponseItemList'
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
  const items = await getAllItems();

  const response: SuccessResponse<Item[]> = {
    success: true,
    data: items,
  };

  res.status(200).json(response);
});

/**
 * GET /v1/items/:id
 * Get item status including available, reserved, and confirmed quantities
 *
 * @swagger
 * /items/{id}:
 *   get:
 *     tags:
 *       - Items
 *     summary: Get item details
 *     description: Retrieves the current status of an item including available, reserved, and confirmed quantities.
 *     operationId: getItemStatus
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Item UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Item status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponseItemStatus'
 *       400:
 *         description: Invalid item ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
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
router.get('/:id', validateParams(itemIdParamSchema), async (req: Request, res: Response) => {
  const { id } = req.params;

  const itemStatus = await getItemStatus(id as string);

  const response: SuccessResponse<ItemStatus> = {
    success: true,
    data: itemStatus,
  };

  res.status(200).json(response);
});

/**
 * POST /v1/items
 * Create a new item with initial quantity
 *
 * @swagger
 * /items:
 *   post:
 *     tags:
 *       - Items
 *     summary: Create a new item
 *     description: Creates a new inventory item with the specified name and initial quantity.
 *     operationId: createItem
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateItemRequest'
 *     responses:
 *       201:
 *         description: Item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponseItem'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
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
router.post('/', validateReqBody(createItemSchema), async (req: Request, res: Response) => {
  const { name, initial_quantity } = req.body;

  const item = await createItem({ name, initial_quantity });

  const response: SuccessResponse<Item> = {
    success: true,
    data: item,
  };

  res.status(201).json(response);
});

export default router;
