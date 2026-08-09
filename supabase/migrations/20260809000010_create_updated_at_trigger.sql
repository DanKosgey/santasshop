-- Migration: create_updated_at_trigger
-- Description: Auto-updates updated_at timestamp on row modification

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables that have updated_at
DROP TRIGGER IF EXISTS update_pool_trading_packages_updated_at ON pool_trading_packages;
CREATE TRIGGER update_pool_trading_packages_updated_at 
    BEFORE UPDATE ON pool_trading_packages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pool_trading_investments_updated_at ON pool_trading_investments;
CREATE TRIGGER update_pool_trading_investments_updated_at 
    BEFORE UPDATE ON pool_trading_investments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_withdrawal_requests_updated_at ON withdrawal_requests;
CREATE TRIGGER update_withdrawal_requests_updated_at 
    BEFORE UPDATE ON withdrawal_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_notification_settings_updated_at ON admin_notification_settings;
CREATE TRIGGER update_admin_notification_settings_updated_at 
    BEFORE UPDATE ON admin_notification_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
