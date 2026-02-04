-- =============================================================================
-- Migration 004: Create router-org-images storage bucket
-- Public bucket for fan-facing org profile images.
-- Hyphenated name to namespace from existing MDEDB org_assets bucket.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('router-org-images', 'router-org-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: service_role has full access
CREATE POLICY "service_role_all_router_org_images"
    ON storage.objects FOR ALL TO service_role
    USING (bucket_id = 'router-org-images');

-- RLS: anon/public can read (images are public)
CREATE POLICY "public_read_router_org_images"
    ON storage.objects FOR SELECT TO anon, public
    USING (bucket_id = 'router-org-images');
