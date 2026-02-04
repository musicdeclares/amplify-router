-- =============================================================================
-- Migration 003: Create router_org_profiles table
-- Fan-facing org content managed separately from MDEDB's internal org table.
-- The router uses cta_url (falling back to org.website) as the redirect
-- destination, and the org directory UI uses the remaining fields.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.router_org_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.org(id) ON DELETE RESTRICT,
    org_name TEXT,                  -- Fan-facing name; falls back to org.org_name
    mission TEXT,                   -- Fan-facing mission; falls back to org.mission_statement
    cta_url TEXT,                   -- Router redirect destination; falls back to org.website
    cta_text TEXT,                  -- Button label; UI defaults to "Get involved" when NULL
    fan_actions TEXT[],             -- e.g., '{"Volunteer", "Pressure decision-makers"}'
    image_url TEXT,                 -- Supabase Storage URL; UI defaults to placeholder when NULL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(org_id)                 -- One profile per org
);

-- Index for looking up profile by org
CREATE INDEX IF NOT EXISTS idx_router_org_profiles_org_id ON public.router_org_profiles(org_id);

-- Auto-update updated_at on changes
DROP TRIGGER IF EXISTS set_router_org_profiles_updated_at ON public.router_org_profiles;
CREATE TRIGGER set_router_org_profiles_updated_at
    BEFORE UPDATE ON public.router_org_profiles
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Row Level Security
ALTER TABLE public.router_org_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_access_router_org_profiles"
    ON public.router_org_profiles FOR ALL TO service_role USING (true);
