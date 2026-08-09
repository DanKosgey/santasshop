-- Migration: create_admin_notification_settings
-- Description: Stores Telegram bot configuration and notification preferences

CREATE TABLE IF NOT EXISTS admin_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Telegram config
    telegram_bot_token TEXT,
    telegram_chat_id TEXT,
    
    -- Notification toggles
    notify_pool_application BOOLEAN NOT NULL DEFAULT TRUE,
    notify_withdrawal_request BOOLEAN NOT NULL DEFAULT TRUE,
    notify_vip_request BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default row if empty
INSERT INTO admin_notification_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM admin_notification_settings);
