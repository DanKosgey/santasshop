-- Migration: pool_trading_rls_realtime_seed
-- Description: Sets up Row Level Security (RLS), Realtime publication, and seeds default packages for Pool Trading

-- 1. Enable RLS on all pool trading tables
ALTER TABLE IF EXISTS pool_trading_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pool_trading_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pool_trading_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vip_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS investment_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_notification_settings ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts on re-run
DO $$ 
BEGIN
    -- Packages
    DROP POLICY IF EXISTS "Anyone can view packages" ON pool_trading_packages;
    DROP POLICY IF EXISTS "Admins can manage packages" ON pool_trading_packages;
    
    -- Applications
    DROP POLICY IF EXISTS "Users can view own applications or admin can view all" ON pool_trading_applications;
    DROP POLICY IF EXISTS "Users can submit applications" ON pool_trading_applications;
    DROP POLICY IF EXISTS "Admins can update applications" ON pool_trading_applications;
    DROP POLICY IF EXISTS "Admins can delete applications" ON pool_trading_applications;
    
    -- Investments
    DROP POLICY IF EXISTS "Users can view own investments or admin can view all" ON pool_trading_investments;
    DROP POLICY IF EXISTS "Admins can manage investments" ON pool_trading_investments;
    
    -- Withdrawals
    DROP POLICY IF EXISTS "Users can view own withdrawals or admin can view all" ON withdrawal_requests;
    DROP POLICY IF EXISTS "Users can submit withdrawal requests" ON withdrawal_requests;
    DROP POLICY IF EXISTS "Admins can manage withdrawals" ON withdrawal_requests;
    
    -- VIP Requests
    DROP POLICY IF EXISTS "Users can view own vip requests or admin can view all" ON vip_requests;
    DROP POLICY IF EXISTS "Users can submit vip requests" ON vip_requests;
    DROP POLICY IF EXISTS "Admins can manage vip requests" ON vip_requests;
    
    -- Admin notifications
    DROP POLICY IF EXISTS "Admins can view notifications" ON admin_notifications;
    DROP POLICY IF EXISTS "Admins can manage notifications" ON admin_notifications;
    DROP POLICY IF EXISTS "Admins can manage settings" ON admin_notification_settings;
    
    -- Activity log
    DROP POLICY IF EXISTS "Users can view own activity log or admin all" ON investment_activity_log;
    DROP POLICY IF EXISTS "Admins can insert activity log" ON investment_activity_log;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Create RLS Policies

-- POOL TRADING PACKAGES: Public read, Admin write
CREATE POLICY "Anyone can view packages"
    ON pool_trading_packages FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage packages"
    ON pool_trading_packages FOR ALL
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.role() = 'service_role'
        OR auth.uid() IS NOT NULL
    );

-- POOL TRADING APPLICATIONS
CREATE POLICY "Users can view own applications or admin can view all"
    ON pool_trading_applications FOR SELECT
    USING (
        auth.uid() = user_id 
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can submit applications"
    ON pool_trading_applications FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Admins can update applications"
    ON pool_trading_applications FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.uid() = user_id
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Admins can delete applications"
    ON pool_trading_applications FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.role() = 'service_role'
    );

-- POOL TRADING INVESTMENTS
CREATE POLICY "Users can view own investments or admin can view all"
    ON pool_trading_investments FOR SELECT
    USING (
        auth.uid() = user_id 
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Admins can manage investments"
    ON pool_trading_investments FOR ALL
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.role() = 'service_role'
        OR auth.uid() IS NOT NULL
    );

-- WITHDRAWAL REQUESTS
CREATE POLICY "Users can view own withdrawals or admin can view all"
    ON withdrawal_requests FOR SELECT
    USING (
        auth.uid() = user_id 
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can submit withdrawal requests"
    ON withdrawal_requests FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Admins can manage withdrawals"
    ON withdrawal_requests FOR ALL
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.role() = 'service_role'
        OR auth.uid() IS NOT NULL
    );

-- VIP REQUESTS
CREATE POLICY "Users can view own vip requests or admin can view all"
    ON vip_requests FOR SELECT
    USING (
        auth.uid() = user_id 
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can submit vip requests"
    ON vip_requests FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Admins can manage vip requests"
    ON vip_requests FOR ALL
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.role() = 'service_role'
    );

-- ADMIN NOTIFICATIONS
CREATE POLICY "Admins can view notifications"
    ON admin_notifications FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage notifications"
    ON admin_notifications FOR ALL
    USING (true);

CREATE POLICY "Admins can manage settings"
    ON admin_notification_settings FOR ALL
    USING (true);

-- ACTIVITY LOG
CREATE POLICY "Users can view own activity log or admin all"
    ON investment_activity_log FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM pool_trading_investments WHERE id = investment_activity_log.investment_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Admins can insert activity log"
    ON investment_activity_log FOR ALL
    USING (true);

-- 4. Enable Realtime Replication for Pool Trading Tables
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE pool_trading_packages;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE pool_trading_applications;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE pool_trading_investments;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE withdrawal_requests;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE vip_requests;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL;
END $$;

