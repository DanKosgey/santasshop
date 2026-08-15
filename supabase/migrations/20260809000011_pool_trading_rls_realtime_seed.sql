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
        auth.uid() = user_id 
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

-- 5. Seed default institutional pool trading packages if table is empty
INSERT INTO pool_trading_packages (id, name, description, duration_value, duration_unit, min_amount, max_amount, roi_percentage, risk_level, recommended, is_active, sort_order)
VALUES
    ('a0000000-0000-0000-0000-000000000001', '24H · £500 Plan', 'Quick 24-hour institutional pool. Invest £500 and receive £4,200 profit within 24 hours.', 24, 'hours', 500.00, 500.00, 840.00, 'low', false, true, 1),
    ('a0000000-0000-0000-0000-000000000002', '24H · £600 Plan', 'Quick 24-hour institutional pool. Invest £600 and receive £5,000 profit within 24 hours.', 24, 'hours', 600.00, 600.00, 833.33, 'low', false, true, 2),
    ('a0000000-0000-0000-0000-000000000003', '24H · £700 Plan', 'Quick 24-hour institutional pool. Invest £700 and receive £6,100 profit within 24 hours.', 24, 'hours', 700.00, 700.00, 871.43, 'low', false, true, 3),
    ('a0000000-0000-0000-0000-000000000004', '24H · £800 Plan', 'Quick 24-hour institutional pool. Invest £800 and receive £7,000 profit within 24 hours.', 24, 'hours', 800.00, 800.00, 875.00, 'low', true, true, 4),
    ('a0000000-0000-0000-0000-000000000005', '2-Day · £900 Plan', 'Two-day compounded pool. Invest £900 and receive £8,000 profit at maturity.', 2, 'days', 900.00, 900.00, 888.89, 'medium', false, true, 5),
    ('a0000000-0000-0000-0000-000000000006', '2-Day · £1,000 Plan', 'Two-day compounded pool. Invest £1,000 and receive £9,000 profit at maturity.', 2, 'days', 1000.00, 1000.00, 900.00, 'medium', true, true, 6),
    ('a0000000-0000-0000-0000-000000000007', '2-Day · £1,500 Plan', 'Two-day compounded pool. Invest £1,500 and receive £12,000 profit at maturity.', 2, 'days', 1500.00, 1500.00, 800.00, 'medium', false, true, 7),
    ('a0000000-0000-0000-0000-000000000008', 'Weekly · £2,000 Plan', 'Weekly institutional syndicate. Invest £2,000 and receive £16,000 profit after 7 days.', 7, 'days', 2000.00, 2000.00, 800.00, 'high', false, true, 8),
    ('a0000000-0000-0000-0000-000000000009', 'Weekly · £3,000 Plan', 'Weekly institutional syndicate. Invest £3,000 and receive £20,000 profit after 7 days.', 7, 'days', 3000.00, 3000.00, 666.67, 'high', false, true, 9),
    ('a0000000-0000-0000-0000-000000000010', 'Weekly · £5,000 Plan', 'Weekly institutional syndicate. Invest £5,000 and receive £30,000 profit after 7 days.', 7, 'days', 5000.00, 5000.00, 600.00, 'high', true, true, 10),
    ('a0000000-0000-0000-0000-000000000011', 'Weekly · £10,000 Plan', 'Weekly high-tier institutional syndicate. Invest £10,000 and receive £60,000 profit after 7 days.', 7, 'days', 10000.00, 10000.00, 600.00, 'high', false, true, 11)
ON CONFLICT (id) DO NOTHING;
