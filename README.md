# Inventory Reservation API

A backend API service for managing inventory reservations with support for creating items, temporary holds (reservations), confirmations, cancellations, and automatic expiration of stale reservations.

## 🔗 Quick Links

| Resource              | URL                                                    |
| --------------------- | ------------------------------------------------------ |
| **Deployed API**      | `https://leadly-exam.vercel.app`                       |
| **Swagger UI**        | `https://leadly-exam.vercel.app/docs/`                 |
| **OpenAPI JSON**      | `https://leadly-exam.vercel.app/openapi.json`          |
| **Demo Video**        | [Link to demo video](#)                                |
| **GitHub Repository** | [leadly_exam](https://github.com/mokiongg/leadly_exam) |

---

## 📖 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Design Decisions](#design-decisions)
- [Setup Instructions](#setup-instructions)
- [Running Locally](#running-locally)
- [Deployment to Vercel](#deployment-to-vercel)
- [Concurrency Scenarios](#concurrency-scenarios)
- [Known Limitations & Trade-offs](#known-limitations--trade-offs)

---

## Overview

This API provides inventory management capabilities for a fictitious store. The core functionality includes:

- **Items Management**: Create and retrieve inventory items with initial quantities
- **Reservations**: Temporarily hold inventory for customers with automatic expiration
- **Confirmations**: Permanently commit reserved inventory
- **Cancellations**: Release held inventory back to availability
- **Expiration**: Automatically release stale pending reservations

### Key Assumptions

1. **Customer IDs are external**: The API accepts any string as `customer_id` without validation
2. **10-minute reservation window**: Reservations expire 10 minutes after creation
3. **No authentication**: API endpoints are publicly accessible (rate-limited)
4. **Idempotent operations**: Confirm/cancel operations are safe to retry

---

## Tech Stack

| Technology                | Purpose                              |
| ------------------------- | ------------------------------------ |
| **Express.js**            | Web framework                        |
| **TypeScript**            | Type safety and developer experience |
| **Supabase (PostgreSQL)** | Database with real-time capabilities |
| **Zod**                   | Request validation                   |
| **Swagger/OpenAPI**       | API documentation                    |
| **Vercel**                | Serverless deployment                |

---

## API Endpoints

### Items

| Method | Endpoint        | Description                                                          |
| ------ | --------------- | -------------------------------------------------------------------- |
| `GET`  | `/v1/items`     | Get all items                                                        |
| `GET`  | `/v1/items/:id` | Get item status (includes available, reserved, confirmed quantities) |
| `POST` | `/v1/items`     | Create a new item                                                    |

### Reservations

| Method | Endpoint                       | Description                               |
| ------ | ------------------------------ | ----------------------------------------- |
| `GET`  | `/v1/reservations`             | Get all reservations                      |
| `GET`  | `/v1/reservations/:id`         | Get a specific reservation                |
| `POST` | `/v1/reservations`             | Create a new reservation (temporary hold) |
| `POST` | `/v1/reservations/:id/confirm` | Confirm a pending reservation             |
| `POST` | `/v1/reservations/:id/cancel`  | Cancel a pending reservation              |

### Maintenance

| Method | Endpoint                              | Description                           |
| ------ | ------------------------------------- | ------------------------------------- |
| `POST` | `/v1/maintenance/expire-reservations` | Expire all stale pending reservations |

### Health

| Method | Endpoint  | Description           |
| ------ | --------- | --------------------- |
| `GET`  | `/health` | Health check endpoint |

### Documentation

| Method | Endpoint        | Description           |
| ------ | --------------- | --------------------- |
| `GET`  | `/docs`         | Swagger UI            |
| `GET`  | `/openapi.json` | OpenAPI specification |

---

## Database Schema

### Tables

#### `items`

| Column           | Type         | Description                  |
| ---------------- | ------------ | ---------------------------- |
| `id`             | UUID         | Primary key (auto-generated) |
| `name`           | VARCHAR(255) | Item name (non-empty)        |
| `total_quantity` | INTEGER      | Total inventory count (≥ 0)  |
| `created_at`     | TIMESTAMPTZ  | Creation timestamp           |
| `updated_at`     | TIMESTAMPTZ  | Last update timestamp        |

#### `reservations`

| Column         | Type         | Description                            |
| -------------- | ------------ | -------------------------------------- |
| `id`           | UUID         | Primary key (auto-generated)           |
| `item_id`      | UUID         | Foreign key to items                   |
| `customer_id`  | VARCHAR(255) | Customer identifier                    |
| `quantity`     | INTEGER      | Reserved quantity (> 0)                |
| `status`       | ENUM         | PENDING, CONFIRMED, CANCELLED, EXPIRED |
| `created_at`   | TIMESTAMPTZ  | Creation timestamp                     |
| `expires_at`   | TIMESTAMPTZ  | Expiration timestamp                   |
| `confirmed_at` | TIMESTAMPTZ  | Confirmation timestamp (nullable)      |
| `cancelled_at` | TIMESTAMPTZ  | Cancellation timestamp (nullable)      |

### Indexes

- `idx_reservations_item_id` - Fast lookups by item
- `idx_reservations_status` - Filter by status
- `idx_reservations_pending_expires` - Partial index for expiration queries
- `idx_reservations_customer_id` - Lookups by customer
- `idx_reservations_item_status` - Combined item and status queries

---

## Design Decisions

### Why We Don't Store Computed Quantities

Instead of storing `available_quantity`, `reserved_quantity`, and `confirmed_quantity` directly in the `items` table, we **calculate them on-demand** from the reservations table:

```
available_quantity = total_quantity - pending_reservations - confirmed_reservations
```

**Reasons:**

1. **Data Consistency**: Storing computed values creates risk of data drift between the source (reservations) and the cached values
2. **Simpler Updates**: No need to update multiple tables in transactions when reservation status changes
3. **Single Source of Truth**: The reservations table is the authoritative source for all quantity calculations
4. **Reduced Complexity**: Eliminates race conditions that could occur when updating counters

**Trade-off**: Slightly higher read latency due to aggregation queries. For high-traffic scenarios, caching or materialized views could be added.

### Idempotent Operations

Both `confirm` and `cancel` operations are designed to be **idempotent**:

- Confirming an already-confirmed reservation returns success (no double-deduction)
- Cancelling an already-cancelled reservation returns success (no double-release)
- Status transitions use optimistic concurrency with status checks

### Concurrency Safety

The API uses **conditional updates** to prevent race conditions:

```sql
UPDATE reservations
SET status = 'CONFIRMED'
WHERE id = :id AND status = 'PENDING'
```

This ensures that concurrent confirm/cancel requests don't corrupt data.

---

## Setup Instructions

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- Supabase account (free tier works)
- Vercel account (for deployment)

### 1. Clone the Repository

```bash
git clone https://github.com/mokiongg/leadly_exam.git
cd leadly_exam/codebase
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings** → **API** to find your:
   - Project URL (`SUPABASE_URL`)
   - Service Role Key (`SUPABASE_SERVICE_KEY`)
3. Go to **SQL Editor** and run the migration file:
   - Open `migrations/initial_schema.sql`
   - Copy the entire contents
   - Paste into SQL Editor and click **Run**

### 4. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your values
```

Required variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

Optional variables:

```env
PORT=8080
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## Running Locally

### Development Mode (with hot reload)

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Access Points

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/docs`
- OpenAPI JSON: `http://localhost:8080/openapi.json`
- Health Check: `http://localhost:8080/health`

---

## Deployment to Vercel

### 1. Install Vercel CLI (optional)

```bash
npm i -g vercel
```

### 2. Deploy via CLI

```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### 3. Configure Environment Variables

In the Vercel dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`

### 4. Verify Deployment

Visit `https://leadly-exam.vercel.app/docs` to access the Swagger UI.

---

## Concurrency Scenarios

### Testing Overselling Prevention

Use the following script to test concurrent reservation attempts:

```bash
# Create an item with limited quantity
curl -X POST https://leadly-exam.vercel.app/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Limited Widget", "initial_quantity": 2}'

# Note the returned item_id, then run concurrent reservations:
# (Replace ITEM_ID with actual UUID)

# In separate terminals or using background processes:
curl -X POST https://leadly-exam.vercel.app/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{"item_id": "ITEM_ID", "customer_id": "customer-1", "quantity": 2}' &

curl -X POST https://leadly-exam.vercel.app/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{"item_id": "ITEM_ID", "customer_id": "customer-2", "quantity": 2}' &

wait

# One should succeed, one should fail with 409 Insufficient Quantity
```

### Testing Idempotent Confirm

```bash
# Create a reservation
RESERVATION=$(curl -s -X POST https://leadly-exam.vercel.app/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{"item_id": "ITEM_ID", "customer_id": "test", "quantity": 1}')

RESERVATION_ID=$(echo $RESERVATION | jq -r '.data.id')

# Confirm twice (both should succeed without double-deduction)
curl -X POST https://leadly-exam.vercel.app/v1/reservations/$RESERVATION_ID/confirm
curl -X POST https://leadly-exam.vercel.app/v1/reservations/$RESERVATION_ID/confirm

# Check item status - confirmed quantity should be 1, not 2
curl https://leadly-exam.vercel.app/v1/items/ITEM_ID
```

### Testing Expiration

```bash
# Create a reservation
curl -X POST https://leadly-exam.vercel.app/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{"item_id": "ITEM_ID", "customer_id": "test", "quantity": 1}'

# Wait 10+ minutes, then expire
curl -X POST https://leadly-exam.vercel.app/v1/maintenance/expire-reservations

# Verify item quantity is restored
curl https://leadly-exam.vercel.app/v1/items/ITEM_ID
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

### Error Codes

| Code                    | HTTP Status | Description                        |
| ----------------------- | ----------- | ---------------------------------- |
| `VALIDATION_ERROR`      | 400         | Invalid request body or parameters |
| `NOT_FOUND`             | 404         | Resource not found                 |
| `ITEM_NOT_FOUND`        | 404         | Item does not exist                |
| `RESERVATION_NOT_FOUND` | 404         | Reservation does not exist         |
| `INSUFFICIENT_QUANTITY` | 409         | Not enough available inventory     |
| `RESERVATION_EXPIRED`   | 409         | Reservation has expired            |
| `RESERVATION_CANCELLED` | 409         | Reservation was already cancelled  |
| `RESERVATION_CONFIRMED` | 409         | Reservation was already confirmed  |
| `TOO_MANY_REQUESTS`     | 429         | Rate limit exceeded                |
| `DATABASE_ERROR`        | 500         | Database operation failed          |
| `INTERNAL_SERVER_ERROR` | 500         | Unexpected server error            |

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Default Window**: 15 minutes
- **Default Limit**: 100 requests per IP per window
- **Configurable** via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX` environment variables

When rate limited, the API returns:

```json
{
  "success": false,
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many requests, please try again later."
  }
}
```

---

## Known Limitations & Trade-offs

### Due to Time Constraints

1. **No background job for expiration**: The `expire-reservations` endpoint must be called manually or via an external scheduler (e.g., Vercel Cron, external cron job)

2. **No pagination**: List endpoints return all records; for production, pagination should be added

3. **No authentication/authorization**: All endpoints are public; production would need JWT/OAuth

4. **No distributed locking**: Concurrent requests rely on database-level constraints; high-concurrency scenarios might need Redis-based locks

5. **Basic error logging**: Errors are logged to console; production would benefit from structured logging

### Architectural Decisions

1. **Computed quantities vs. stored**: Chose computed for consistency over read performance
2. **Single database**: No read replicas; acceptable for low-to-medium traffic
3. **Vertical/Modular folder structure**: Organized code by feature (items, reservations, maintenance) rather than by type (controllers, services, models). This keeps related files close together, making it easier to navigate and scale as new features are added
4. **Structured request validation**: All incoming requests are validated using Zod schemas via middleware (`validateReqBody`, `validateParams`). This ensures consistent validation logic and clear error messages before reaching business logic
5. **Consistent response format**: All API responses follow a unified structure with `{ success: true, data: ... }` for success and `{ success: false, error: { code, message } }` for errors. This makes the API predictable and easier to consume
6. **Centralized error handling**: A custom `AppError` class with error codes allows throwing typed errors anywhere in the codebase. The global error handler middleware catches all errors and formats them consistently, keeping route handlers clean
7. **UUID for primary keys**: Chose UUIDs over auto-increment integers (bigint) for several reasons: globally unique without database coordination, can be generated client-side, prevents enumeration attacks (users can't guess valid IDs), and doesn't expose record counts or creation order

---

## Project Structure

The project follows a **vertical (feature-based) folder structure** rather than a horizontal (type-based) structure:

```
codebase/
├── src/
│   ├── db/
│   │   └── client.ts          # Supabase client singleton
│   ├── middlewares/
│   │   ├── error/             # Error handling middleware
│   │   ├── rateLimit/         # Rate limiting
│   │   └── validation/        # Request validation
│   ├── modules/
│   │   ├── items/             # Items feature
│   │   │   ├── index.ts       #   - Module exports
│   │   │   ├── items.routes.ts#   - Route handlers
│   │   │   ├── items.service.ts#  - Business logic
│   │   │   ├── items.schema.ts#   - Validation schemas
│   │   │   └── types.ts       #   - Type definitions
│   │   ├── reservations/      # Reservations feature (same structure)
│   │   └── maintenance/       # Maintenance feature (same structure)
│   ├── types/
│   │   └── api.ts             # Shared types and errors
│   ├── server.ts              # Express app setup
│   └── swagger.ts             # OpenAPI configuration
├── migrations/
│   └── initial_schema.sql     # Database schema
├── .env.example               # Environment template
├── vercel.json                # Vercel configuration
├── package.json
├── tsconfig.json
└── README.md
```
