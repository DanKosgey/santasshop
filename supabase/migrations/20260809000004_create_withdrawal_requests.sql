-- Migration: create_withdrawal_requests
-- Description: Stores withdrawal requests from matured investments

CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    investment_id UUID NOT NULL REFERENCES pool_trading_investments(id) ON DELETE RESTRICT,
    
    -- Withdrawal details
    amount DECIMAL(18, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,     -- 'USDT_TRC20', 'USDT_ERC20', 'BTC', 'ETH', 'LTC'
    wallet_address TEXT NOT NULL,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- status values: 'pending', 'processing', 'completed', 'failed'
    
    -- Admin processing details
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    transaction_hash TEXT,                    -- on-chain tx hash if applicable
    
    -- Failure info
    failure_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index: admin pending withdrawals
CREATE INDEX IF NOT EXISTS idx_withdrawals_pending ON withdrawal_requests(status, created_at DESC) 
WHERE status IN ('pending', 'processing');

-- Index: user's withdrawal history
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawal_requests(user_id, created_at DESC);

-- Index: prevent duplicate pending withdrawals for same investment
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_withdrawal ON withdrawal_requests(investment_id) 
WHERE status IN ('pending', 'processing');
