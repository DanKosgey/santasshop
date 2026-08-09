-- Migration: create_pool_trading_applications
-- Description: Stores user applications for pool trading packages

CREATE TABLE IF NOT EXISTS pool_trading_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES pool_trading_packages(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- status values: 'pending', 'approved', 'rejected'
    
    -- Admin-set values (populated on approval)
    approved_amount DECIMAL(18, 2),           -- amount admin approved (may differ from package min)
    expected_return DECIMAL(18, 2),           -- calculated on approval
    custom_maturity_date TIMESTAMP WITH TIME ZONE, -- admin can override maturity date
    
    -- Rejection info
    rejection_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id)     -- admin who reviewed
);

-- Partial index: only one pending application per user per package
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_application 
ON pool_trading_applications(user_id, package_id) 
WHERE status = 'pending';

-- Index for admin to query pending applications
CREATE INDEX IF NOT EXISTS idx_applications_pending ON pool_trading_applications(status, created_at DESC) 
WHERE status = 'pending';

-- Index for user to query their applications
CREATE INDEX IF NOT EXISTS idx_applications_user ON pool_trading_applications(user_id, created_at DESC);
