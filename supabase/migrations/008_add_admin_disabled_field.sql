-- Rename enabled to link_active, deactivation_reason to link_inactive_reason, and add account_active + account_inactive_reason
-- This separates artist link pause (link_active) from admin account control (account_active)

-- Rename existing columns
ALTER TABLE router_artists
RENAME COLUMN enabled TO link_active;

ALTER TABLE router_artists
RENAME COLUMN deactivation_reason TO link_inactive_reason;

-- Add new columns for admin control
ALTER TABLE router_artists
ADD COLUMN account_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE router_artists
ADD COLUMN account_inactive_reason TEXT;

-- Add comments explaining the fields
COMMENT ON COLUMN router_artists.link_active IS 'Artist and admin can toggle - when false, link is paused';
COMMENT ON COLUMN router_artists.link_inactive_reason IS 'Optional reason provided when artist pauses their link';
COMMENT ON COLUMN router_artists.account_active IS 'Admin-only control - when false, account is deactivated and artist cannot undo';
COMMENT ON COLUMN router_artists.account_inactive_reason IS 'Optional reason provided when admin deactivates the account';
