-- Migration: create_pool_trading_packages
-- Description: Stores the different pool trading packages available to clients

CREATE TABLE IF NOT EXISTS pool_trading_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration_value INTEGER NOT NULL,       -- e.g., 24, 7, 30
    duration_unit VARCHAR(10) NOT NULL,     -- 'hours' or 'days'
    min_amount DECIMAL(18, 2) NOT NULL,
    max_amount DECIMAL(18, 2),              -- NULL means no max
    roi_percentage DECIMAL(5, 2) NOT NULL,  -- e.g., 15.00 for 15%
    risk_level VARCHAR(10) NOT NULL DEFAULT 'medium',  -- 'low', 'medium', 'high'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for sorting active packages on client side
CREATE INDEX IF NOT EXISTS idx_packages_active_sort ON pool_trading_packages(is_active, sort_order);
