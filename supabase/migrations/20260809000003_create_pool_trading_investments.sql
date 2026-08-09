-- Migration: create_pool_trading_investments
-- Description: Stores active/approved investments with maturity tracking

CREATE TABLE IF NOT EXISTS pool_trading_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES pool_trading_applications(id) ON DELETE SET NULL,
    package_id UUID NOT NULL REFERENCES pool_trading_packages(id) ON DELETE RESTRICT,
    
    -- Financial details
    invested_amount DECIMAL(18, 2) NOT NULL,
    expected_return DECIMAL(18, 2) NOT NULL,
    total_payout DECIMAL(18, 2) GENERATED ALWAYS AS (invested_amount + expected_return) STORED,
    
    -- Timing
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    maturity_date TIMESTAMP WITH TIME ZONE NOT NULL,
    original_maturity_date TIMESTAMP WITH TIME ZONE NOT NULL,  -- in case admin extends
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    -- status values: 'active', 'matured', 'withdrawal_pending', 'withdrawn', 'cancelled'
    
    -- Extension history
    extension_count INTEGER NOT NULL DEFAULT 0,
    last_extended_at TIMESTAMP WITH TIME ZONE,
    extension_reason TEXT,
    
    -- Cancellation info
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index: find investments that need to be auto-matured (cron job)
CREATE INDEX IF NOT EXISTS idx_investments_to_mature ON pool_trading_investments(maturity_date, status) 
WHERE status = 'active';

-- Index: user's investments
CREATE INDEX IF NOT EXISTS idx_investments_user ON pool_trading_investments(user_id, created_at DESC);

-- Index: admin filter by status
CREATE INDEX IF NOT EXISTS idx_investments_status ON pool_trading_investments(status, created_at DESC);
