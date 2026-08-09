-- Migration: create_admin_notifications
-- Description: Stores notification history for the admin panel notification feed

CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    type VARCHAR(50) NOT NULL,
    -- types: 'pool_application', 'withdrawal_request', 'vip_request', 'investment_matured', 'system'
    
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Reference to related entity (polymorphic)
    reference_type VARCHAR(50),  -- 'pool_application', 'withdrawal_request', 'vip_request', 'investment'
    reference_id UUID,
    
    -- Link for admin to click
    action_url TEXT,
    
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON admin_notifications(is_read, created_at DESC) 
WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_all ON admin_notifications(created_at DESC);
