-- AMPLIFY Router Database Schema
-- This migration adds the router-specific tables to the existing MDEDB schema

-- Create minimal org table (matching MDEDB structure) for local development
CREATE TABLE IF NOT EXISTS public.org (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_name VARCHAR(255) NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    website VARCHAR(255),
    contact VARCHAR(255),
    email VARCHAR(255),
    type_of_work VARCHAR(255),
    mission_statement TEXT,
    years_active VARCHAR(100),
    notable_success TEXT,
    capacity TEXT,
    cta_notes TEXT,
    logo VARCHAR(255),
    banner VARCHAR(255),
    instagram VARCHAR(255),
    twitter VARCHAR(255),
    facebook VARCHAR(255),
    tiktok VARCHAR(255),
    linkedin VARCHAR(255),
    youtube VARCHAR(255),
    tags TEXT[],
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'under_review')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Add some test data for development
INSERT INTO public.org (id, org_name, country_code, website, approval_status) VALUES
('00000000-0000-0000-0000-000000000001', 'Test Climate Org US', 'US', 'https://example.com', 'approved'),
('00000000-0000-0000-0000-000000000002', 'Test Climate Org UK', 'GB', 'https://example.co.uk', 'approved'),
('00000000-0000-0000-0000-000000000003', 'Test Climate Org DE', 'DE', 'https://example.de', 'approved')
ON CONFLICT (id) DO NOTHING;

-- Artists table
CREATE TABLE IF NOT EXISTS public.artists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Slug must be URL-safe: lowercase alphanumeric and hyphens only
    CONSTRAINT artists_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

-- Tours table
CREATE TABLE IF NOT EXISTS public.tours (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT tours_date_order CHECK (end_date >= start_date),
    CONSTRAINT tours_window_days_positive CHECK (pre_tour_window_days >= 0 AND post_tour_window_days >= 0)
);

-- Tour Country Configurations table
CREATE TABLE IF NOT EXISTS public.tour_country_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE RESTRICT,
    country_code VARCHAR(2) NOT NULL, -- ISO 3166-1 alpha-2 country codes
    org_id UUID NOT NULL REFERENCES public.org(id) ON DELETE RESTRICT,
    enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 10, -- Future-proofing for conflict resolution
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tour_id, country_code), -- One org per country per tour
    -- Country code must be exactly 2 uppercase letters (ISO 3166-1 alpha-2)
    CONSTRAINT tour_country_configs_country_code_format CHECK (country_code ~ '^[A-Z]{2}$')
);

-- Router Analytics table for tracking routing decisions and performance
CREATE TABLE IF NOT EXISTS public.router_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_slug VARCHAR(255) NOT NULL,
    country_code VARCHAR(2),
    org_id UUID REFERENCES public.org(id),
    tour_id UUID REFERENCES public.tours(id),
    fallback_reason VARCHAR(255), -- reason if routing fell back (e.g., "no_active_tour", "org_paused", "country_not_configured")
    destination_url TEXT, -- final URL user was sent to
    user_agent TEXT,
    ip_address INET, -- for debugging, not for tracking users
    session_id UUID DEFAULT gen_random_uuid(), -- anonymous session tracking
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Router-specific organization overrides (instead of modifying existing org table)
-- This preserves clear ownership boundaries between Router and MDEDB
CREATE TABLE IF NOT EXISTS public.router_org_overrides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.org(id) ON DELETE RESTRICT,
    enabled BOOLEAN DEFAULT true,
    reason TEXT, -- Optional reason for disable: "capacity_exceeded", "partnership_paused"
    updated_by TEXT, -- Who made the change
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(org_id) -- One override record per org
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_artists_slug ON public.artists(slug);
CREATE INDEX IF NOT EXISTS idx_artists_enabled ON public.artists(enabled);

CREATE INDEX IF NOT EXISTS idx_tours_artist_id ON public.tours(artist_id);
CREATE INDEX IF NOT EXISTS idx_tours_enabled ON public.tours(enabled);
CREATE INDEX IF NOT EXISTS idx_tours_dates ON public.tours(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_tour_country_configs_tour_id ON public.tour_country_configs(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_country_configs_country ON public.tour_country_configs(country_code);
CREATE INDEX IF NOT EXISTS idx_tour_country_configs_org_id ON public.tour_country_configs(org_id);
CREATE INDEX IF NOT EXISTS idx_tour_country_configs_enabled ON public.tour_country_configs(enabled);

CREATE INDEX IF NOT EXISTS idx_router_analytics_timestamp ON public.router_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_router_analytics_artist_slug ON public.router_analytics(artist_slug);
CREATE INDEX IF NOT EXISTS idx_router_analytics_country ON public.router_analytics(country_code);
CREATE INDEX IF NOT EXISTS idx_router_analytics_org_id ON public.router_analytics(org_id);

CREATE INDEX IF NOT EXISTS idx_router_org_overrides_org_id ON public.router_org_overrides(org_id);
CREATE INDEX IF NOT EXISTS idx_router_org_overrides_enabled ON public.router_org_overrides(enabled);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS set_artists_updated_at ON public.artists;
CREATE TRIGGER set_artists_updated_at
    BEFORE UPDATE ON public.artists
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_tours_updated_at ON public.tours;
CREATE TRIGGER set_tours_updated_at
    BEFORE UPDATE ON public.tours
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_tour_country_configs_updated_at ON public.tour_country_configs;
CREATE TRIGGER set_tour_country_configs_updated_at
    BEFORE UPDATE ON public.tour_country_configs
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_router_org_overrides_updated_at ON public.router_org_overrides;
CREATE TRIGGER set_router_org_overrides_updated_at
    BEFORE UPDATE ON public.router_org_overrides
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_router_config_updated_at ON public.router_config;
CREATE TRIGGER set_router_config_updated_at
    BEFORE UPDATE ON public.router_config
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Prevent overlapping tours for the same artist
-- Tours are considered overlapping if their active windows overlap
-- Active window = (start_date - pre_tour_window_days) to (end_date + post_tour_window_days)
CREATE OR REPLACE FUNCTION public.check_tour_overlap()
RETURNS TRIGGER AS $$
DECLARE
    new_active_start DATE;
    new_active_end DATE;
    overlapping_count INTEGER;
BEGIN
    -- Only check enabled tours
    IF NOT NEW.enabled THEN
        RETURN NEW;
    END IF;

    -- Calculate new tour's active window
    new_active_start := NEW.start_date - NEW.pre_tour_window_days;
    new_active_end := NEW.end_date + NEW.post_tour_window_days;

    -- Check for overlapping enabled tours for the same artist
    SELECT COUNT(*) INTO overlapping_count
    FROM public.tours
    WHERE artist_id = NEW.artist_id
      AND enabled = true
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
          -- New tour's active window overlaps with existing tour's active window
          (start_date - pre_tour_window_days, end_date + post_tour_window_days)
          OVERLAPS
          (new_active_start, new_active_end)
      );

    IF overlapping_count > 0 THEN
        RAISE EXCEPTION 'Tour active windows cannot overlap for the same artist. Disable conflicting tours first.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_tour_overlap_trigger ON public.tours;
CREATE TRIGGER check_tour_overlap_trigger
    BEFORE INSERT OR UPDATE ON public.tours
    FOR EACH ROW EXECUTE PROCEDURE public.check_tour_overlap();

-- Enable Row Level Security
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_country_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.router_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.router_org_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Service-level access control
-- Both Router and MDEDB apps use same service key, but RLS provides separation

-- Router tables: Allow all operations with service role (bypass RLS for simplicity)
-- User-level permissions will be added when UI is built
CREATE POLICY "service_access_artists" ON public.artists FOR ALL TO service_role USING (true);
CREATE POLICY "service_access_tours" ON public.tours FOR ALL TO service_role USING (true);
CREATE POLICY "service_access_tour_configs" ON public.tour_country_configs FOR ALL TO service_role USING (true);
CREATE POLICY "service_access_analytics" ON public.router_analytics FOR ALL TO service_role USING (true);
CREATE POLICY "service_access_org_overrides" ON public.router_org_overrides FOR ALL TO service_role USING (true);

-- Note: User-level RLS policies (artist can only edit own tours, etc.)
-- will be added in future migration when building admin/artist UI
