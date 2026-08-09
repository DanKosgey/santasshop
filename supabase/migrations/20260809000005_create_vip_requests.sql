-- Migration: create_vip_requests
-- Description: Stores VIP access requests from users

CREATE TABLE IF NOT EXISTS vip_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- status values: 'pending', 'approved', 'rejected'
    
    rejection_reason TEXT,
    
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- One pending request per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_vip ON vip_requests(user_id) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_vip_requests_pending ON vip_requests(status, created_at DESC) 
WHERE status = 'pending';
