import swaggerJsdoc from 'swagger-jsdoc';
import { ErrorCode } from './types';
import { ReservationStatus } from './modules/reservations/types';

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Inventory Reservation API',
    version: '1.0.0',
    description:
      'A REST API for managing inventory items and reservations. Supports creating items, making reservations, confirming/cancelling reservations, and automatic expiration of pending reservations.',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: '/v1',
      description: 'API v1',
    },
  ],
  tags: [
    {
      name: 'Items',
      description: 'Inventory item management',
    },
    {
      name: 'Reservations',
      description: 'Reservation management for inventory items',
    },
    {
      name: 'Maintenance',
      description: 'System maintenance operations',
    },
    {
      name: 'Health',
      description: 'Health check endpoints',
    },
  ],
  components: {
    schemas: {
      // Item schemas
      Item: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the item',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          name: {
            type: 'string',
            description: 'Name of the item',
            example: 'Widget Pro',
          },
          total_quantity: {
            type: 'integer',
            description: 'Total quantity of the item in inventory',
            example: 100,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the item was created',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the item was last updated',
          },
        },
        required: ['id', 'name', 'total_quantity', 'created_at', 'updated_at'],
      },
      ItemStatus: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the item',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          name: {
            type: 'string',
            description: 'Name of the item',
            example: 'Widget Pro',
          },
          total_quantity: {
            type: 'integer',
            description: 'Total quantity of the item in inventory',
            example: 100,
          },
          available_quantity: {
            type: 'integer',
            description: 'Quantity available for reservation',
            example: 75,
          },
          reserved_quantity: {
            type: 'integer',
            description: 'Quantity currently reserved (pending confirmation)',
            example: 15,
          },
          confirmed_quantity: {
            type: 'integer',
            description: 'Quantity that has been confirmed (permanently deducted)',
            example: 10,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the item was created',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the item was last updated',
          },
        },
        required: [
          'id',
          'name',
          'total_quantity',
          'available_quantity',
          'reserved_quantity',
          'confirmed_quantity',
          'created_at',
          'updated_at',
        ],
      },
      CreateItemRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
            description: 'Name of the item',
            example: 'Widget Pro',
          },
          initial_quantity: {
            type: 'integer',
            minimum: 1,
            description: 'Initial quantity to add to inventory',
            example: 100,
          },
        },
        required: ['name', 'initial_quantity'],
      },

      // Error codes enum
      ErrorCode: {
        type: 'string',
        enum: Object.values(ErrorCode),
        description: 'Application error codes',
      },

      // Reservation schemas
      ReservationStatus: {
        type: 'string',
        enum: Object.values(ReservationStatus),
        description: 'Status of the reservation',
      },
      Reservation: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the reservation',
            example: '660e8400-e29b-41d4-a716-446655440001',
          },
          item_id: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the reserved item',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          customer_id: {
            type: 'string',
            description: 'Customer identifier',
            example: 'customer_123',
          },
          quantity: {
            type: 'integer',
            description: 'Quantity reserved',
            example: 5,
          },
          status: {
            $ref: '#/components/schemas/ReservationStatus',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the reservation was created',
          },
          expires_at: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the reservation expires if not confirmed',
          },
          confirmed_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Timestamp when the reservation was confirmed',
          },
          cancelled_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Timestamp when the reservation was cancelled',
          },
        },
        required: ['id', 'item_id', 'customer_id', 'quantity', 'status', 'created_at', 'expires_at'],
      },
      CreateReservationRequest: {
        type: 'object',
        properties: {
          item_id: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the item to reserve',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          customer_id: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
            description: 'Customer identifier',
            example: 'customer_123',
          },
          quantity: {
            type: 'integer',
            minimum: 1,
            description: 'Quantity to reserve',
            example: 5,
          },
        },
        required: ['item_id', 'customer_id', 'quantity'],
      },

      // Maintenance schemas
      ExpireReservationsResult: {
        type: 'object',
        properties: {
          expired_count: {
            type: 'integer',
            description: 'Number of reservations that were expired',
            example: 3,
          },
          expired_reservation_ids: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uuid',
            },
            description: 'List of reservation IDs that were expired',
            example: ['660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002'],
          },
        },
        required: ['expired_count', 'expired_reservation_ids'],
      },

      // Response wrappers
      SuccessResponseItem: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            enum: [true],
          },
          data: {
            $ref: '#/components/schemas/Item',
          },
        },
        required: ['success', 'data'],
      },
      SuccessResponseItemStatus: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            enum: [true],
          },
          data: {
            $ref: '#/components/schemas/ItemStatus',
          },
        },
        required: ['success', 'data'],
      },
      SuccessResponseItemList: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            enum: [true],
          },
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Item',
            },
          },
        },
        required: ['success', 'data'],
      },
      SuccessResponseReservation: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            enum: [true],
          },
          data: {
            $ref: '#/components/schemas/Reservation',
          },
        },
        required: ['success', 'data'],
      },
      SuccessResponseReservationList: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            enum: [true],
          },
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Reservation',
            },
          },
        },
        required: ['success', 'data'],
      },
      SuccessResponseExpireReservations: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            enum: [true],
          },
          data: {
            $ref: '#/components/schemas/ExpireReservationsResult',
          },
        },
        required: ['success', 'data'],
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ok'],
            example: 'ok',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Current server timestamp',
          },
        },
        required: ['status', 'timestamp'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            enum: [false],
          },
          error: {
            type: 'object',
            properties: {
              code: {
                $ref: '#/components/schemas/ErrorCode',
              },
              message: {
                type: 'string',
                description: 'Human-readable error message',
              },
            },
            required: ['code', 'message'],
          },
        },
        required: ['success', 'error'],
      },
      // Specific error responses
      ValidationError: {
        allOf: [
          { $ref: '#/components/schemas/ErrorResponse' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', enum: ['VALIDATION_ERROR'], example: 'VALIDATION_ERROR' },
                  message: { type: 'string', example: 'Invalid request body' },
                },
              },
            },
          },
        ],
      },
      TooManyRequestsError: {
        allOf: [
          { $ref: '#/components/schemas/ErrorResponse' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', enum: ['TOO_MANY_REQUESTS'], example: 'TOO_MANY_REQUESTS' },
                  message: { type: 'string', example: 'Too many requests, please try again later' },
                },
              },
            },
          },
        ],
      },
      InternalServerError: {
        allOf: [
          { $ref: '#/components/schemas/ErrorResponse' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', enum: ['INTERNAL_SERVER_ERROR'], example: 'INTERNAL_SERVER_ERROR' },
                  message: { type: 'string', example: 'An unexpected error occurred' },
                },
              },
            },
          },
        ],
      },
      ItemNotFoundError: {
        allOf: [
          { $ref: '#/components/schemas/ErrorResponse' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', enum: ['ITEM_NOT_FOUND'], example: 'ITEM_NOT_FOUND' },
                  message: { type: 'string', example: 'Item not found' },
                },
              },
            },
          },
        ],
      },
      ReservationNotFoundError: {
        allOf: [
          { $ref: '#/components/schemas/ErrorResponse' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', enum: ['RESERVATION_NOT_FOUND'], example: 'RESERVATION_NOT_FOUND' },
                  message: { type: 'string', example: 'Reservation not found' },
                },
              },
            },
          },
        ],
      },
      InsufficientQuantityError: {
        allOf: [
          { $ref: '#/components/schemas/ErrorResponse' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', enum: ['INSUFFICIENT_QUANTITY'], example: 'INSUFFICIENT_QUANTITY' },
                  message: { type: 'string', example: 'Insufficient quantity available' },
                },
              },
            },
          },
        ],
      },
      ReservationExpiredError: {
        allOf: [
          { $ref: '#/components/schemas/ErrorResponse' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', enum: ['RESERVATION_EXPIRED'], example: 'RESERVATION_EXPIRED' },
                  message: { type: 'string', example: 'Reservation has expired' },
                },
              },
            },
          },
        ],
      },
      ReservationCancelledError: {
        allOf: [
          { $ref: '#/components/schemas/ErrorResponse' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', enum: ['RESERVATION_CANCELLED'], example: 'RESERVATION_CANCELLED' },
                  message: { type: 'string', example: 'Reservation has been cancelled' },
                },
              },
            },
          },
        ],
      },
      ReservationConfirmedError: {
        allOf: [
          { $ref: '#/components/schemas/ErrorResponse' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', enum: ['RESERVATION_CONFIRMED'], example: 'RESERVATION_CONFIRMED' },
                  message: { type: 'string', example: 'Reservation has already been confirmed' },
                },
              },
            },
          },
        ],
      },
    },
  },
};

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  // Parse JSDoc comments from route files
  apis: [
    './src/modules/**/*.routes.ts',
    './src/server.ts',
    // Also include compiled JS for production
    './dist/modules/**/*.routes.js',
    './dist/server.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
