-- Add staff role to router_users
-- Existing admins remain as admin (developers)
-- New MDE staff users will be created as staff

ALTER TABLE router_users
  DROP CONSTRAINT IF EXISTS router_users_role_check;

ALTER TABLE router_users
  ADD CONSTRAINT router_users_role_check
  CHECK (role IN ('admin', 'staff', 'artist'));
