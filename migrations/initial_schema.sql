/* -------
* Enums
--------- */    
-- Reservation status enum
CREATE TYPE reservation_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED');

-- Error code enum
CREATE TYPE error_code AS ENUM (
    'INTERNAL_SERVER_ERROR',
    'NOT_FOUND',
    'VALIDATION_ERROR',
    'TOO_MANY_REQUESTS',
    'DATABASE_ERROR',
    'ITEM_NOT_FOUND',
    'RESERVATION_NOT_FOUND',
    'INSUFFICIENT_QUANTITY',
    'RESERVATION_EXPIRED',
    'RESERVATION_CANCELLED',
    'RESERVATION_CONFIRMED'
);


/* -------
* Tables
--------- */

-- Items table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    total_quantity INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT items_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT items_total_quantity_positive CHECK (total_quantity >= 0)
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    status reservation_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Foreign key constraint
    CONSTRAINT fk_reservations_item 
        FOREIGN KEY (item_id) 
        REFERENCES items(id) 
        ON DELETE RESTRICT,
    
    -- Constraints
    CONSTRAINT reservations_customer_id_not_empty CHECK (LENGTH(TRIM(customer_id)) > 0),
    CONSTRAINT reservations_quantity_positive CHECK (quantity > 0)
);

/* ------- 
* Indexes 
--------- */
CREATE INDEX IF NOT EXISTS idx_reservations_item_id ON reservations(item_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_pending_expires 
    ON reservations(status, expires_at) 
    WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_reservations_customer_id ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_item_status 
    ON reservations(item_id, status);

-- Grant table permissions to Supabase roles
GRANT ALL ON items TO anon, authenticated, service_role;
GRANT ALL ON reservations TO anon, authenticated, service_role;