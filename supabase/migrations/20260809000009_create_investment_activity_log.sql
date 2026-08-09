-- Migration: create_investment_activity_log
-- Description: Audit trail for all investment status changes

CREATE TABLE IF NOT EXISTS investment_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_id UUID NOT NULL REFERENCES pool_trading_investments(id) ON DELETE CASCADE,
    
    action VARCHAR(50) NOT NULL,
    -- actions: 'created', 'matured', 'extended', 'cancelled', 'withdrawal_requested', 'withdrawal_completed', 'withdrawal_failed'
    
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    
    details JSONB,              -- flexible field for action-specific data
    -- e.g., for 'extended': { "new_maturity_date": "...", "reason": "..." }
    -- e.g., for 'cancelled': { "reason": "..." }
    
    performed_by UUID REFERENCES auth.users(id),  -- NULL if system action (e.g., auto-mature)
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_investment ON investment_activity_log(investment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON investment_activity_log(created_at DESC);
