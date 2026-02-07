-- Migration: Create router_invites table and add deactivation_reason to router_artists
-- Purpose: Support artist self-service onboarding via admin-generated invites

-- Add deactivation_reason to router_artists for self-deactivation tracking
ALTER TABLE router_artists ADD COLUMN deactivation_reason TEXT;

-- Create router_invites table
CREATE TABLE router_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(64) UNIQUE NOT NULL,  -- crypto.randomBytes(32).toString('hex')
    role TEXT NOT NULL CHECK (role IN ('artist', 'org')),  -- extensible for org invites later
    email TEXT NOT NULL,
    suggested_name TEXT NOT NULL,
    -- Set on acceptance: link to the created entity
    artist_id UUID REFERENCES router_artists(id) ON DELETE SET NULL,  -- for role='artist'
    -- org_id can be added later for role='org'
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,  -- 7 days from creation
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES router_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_router_invites_token ON router_invites(token);
CREATE INDEX idx_router_invites_email ON router_invites(email);
CREATE INDEX idx_router_invites_status ON router_invites(status);
CREATE INDEX idx_router_invites_created_by ON router_invites(created_by);

-- Trigger to update updated_at on row changes
CREATE TRIGGER update_router_invites_updated_at
    BEFORE UPDATE ON router_invites
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_updated_at();

-- RLS policies (same pattern as other router tables - service_role access)
ALTER TABLE router_invites ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to router_invites"
    ON router_invites
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Anon role can read invites by token (for invite acceptance page)
CREATE POLICY "Anon can read invites by token"
    ON router_invites
    FOR SELECT
    TO anon
    USING (true);

-- Comment for documentation
COMMENT ON TABLE router_invites IS 'Stores invite tokens for artist (and future org) self-service onboarding';
COMMENT ON COLUMN router_invites.role IS 'Type of invite: artist or org (for future org self-service)';
COMMENT ON COLUMN router_invites.token IS 'Secure random token for invite URL: /invite/{token}';
COMMENT ON COLUMN router_invites.status IS 'pending = awaiting acceptance, accepted = used, expired = past expiry date, revoked = manually cancelled';
COMMENT ON COLUMN router_artists.deactivation_reason IS 'Optional reason when artist self-deactivates their AMPLIFY link';
