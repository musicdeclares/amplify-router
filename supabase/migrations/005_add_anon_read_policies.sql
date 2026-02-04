-- =============================================================================
-- Migration 005: Add anon read policies for org directory
-- The org directory app (GitHub Pages) uses the Supabase anon key
-- to fetch fan-facing org data. Profile data is non-sensitive.
-- =============================================================================

-- Allow anonymous read access to fan-facing org profiles
CREATE POLICY "anon_read_router_org_profiles"
    ON public.router_org_profiles FOR SELECT TO anon
    USING (true);
