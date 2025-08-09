-- Create admin_succession table for managing super admin succession
CREATE TABLE IF NOT EXISTS admin_succession (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resigning_super_admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    successor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resigning_email TEXT NOT NULL,
    successor_email TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('designated', 'completed', 'auto_completed')) DEFAULT 'designated',
    designated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transferred_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(resigning_super_admin_id)
);

-- Enable RLS
ALTER TABLE admin_succession ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read succession records
CREATE POLICY "Users can read succession records" ON admin_succession
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow super admins to manage succession records  
CREATE POLICY "Super admins can manage succession records" ON admin_succession
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_succession_resigning_admin ON admin_succession(resigning_super_admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_succession_successor ON admin_succession(successor_id);
CREATE INDEX IF NOT EXISTS idx_admin_succession_status ON admin_succession(status);
CREATE INDEX IF NOT EXISTS idx_admin_succession_designated_at ON admin_succession(designated_at);