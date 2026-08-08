-- Migration to add bot-related columns and table
-- Date: 2026-02-22

-- 1. Add columns to profiles table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bot_access') THEN
        ALTER TABLE profiles ADD COLUMN bot_access BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bot_purchase_status') THEN
        ALTER TABLE profiles ADD COLUMN bot_purchase_status TEXT DEFAULT 'none';
    END IF;
END $$;

-- 2. Create bot_assets table if it doesn't exist
CREATE TABLE IF NOT EXISTS bot_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    file_size TEXT,
    version TEXT DEFAULT '1.0.0',
    type TEXT DEFAULT 'mql5',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Set up RLS for bot_assets
ALTER TABLE bot_assets ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone (authenticated) can view bot assets
CREATE POLICY "Anyone can view bot assets" 
ON bot_assets FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Only admins can manage (insert/update/delete) bot assets
CREATE POLICY "Admins can manage bot assets" 
ON bot_assets FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 4. Grant permissions
GRANT ALL ON bot_assets TO authenticated;
GRANT ALL ON bot_assets TO service_role;
