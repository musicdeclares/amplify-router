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

-- Create org_public_view if it doesn't exist (for local development)
-- In production, this view is created and maintained by MDEDB
-- This block is safe for production - it won't touch anything if the view already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'org_public_view' AND table_schema = 'public'
  ) THEN
    CREATE VIEW public.org_public_view AS
    SELECT
      id,
      org_name,
      country_code,
      website,
      type_of_work,
      mission_statement,
      years_active,
      notable_success,
      capacity,
      cta_notes,
      logo,
      banner,
      instagram,
      twitter,
      facebook,
      tiktok,
      linkedin,
      youtube,
      tags,
      created_at,
      updated_at
    FROM public.org
    WHERE approval_status = 'approved';
  END IF;
END $$;

-- =============================================================================
-- ISO 3166-1 alpha-2 Country Code Validation
-- Shared validation function for all country_code fields
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_valid_iso_country_code(code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN code IN (
    'AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ',
    'BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ',
    'CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ',
    'DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR',
    'GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY',
    'HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP',
    'KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY',
    'MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ',
    'NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY',
    'QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ',
    'TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ',
    'UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- ROUTER ARTISTS TABLE (was: artists)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.router_artists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    handle VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Handle must be URL-safe: lowercase alphanumeric and hyphens only
    CONSTRAINT router_artists_handle_format CHECK (handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

-- =============================================================================
-- ROUTER TOURS TABLE (was: tours)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.router_tours (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_id UUID NOT NULL REFERENCES public.router_artists(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pre_tour_window_days INTEGER DEFAULT 0,
    post_tour_window_days INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT router_tours_date_order CHECK (end_date >= start_date),
    CONSTRAINT router_tours_window_days_positive CHECK (pre_tour_window_days >= 0 AND post_tour_window_days >= 0)
);

-- =============================================================================
-- ROUTER TOUR OVERRIDES TABLE (was: tour_country_configs)
-- Artist-selected org overrides for specific tours
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.router_tour_overrides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tour_id UUID NOT NULL REFERENCES public.router_tours(id) ON DELETE CASCADE,
    country_code VARCHAR(2) NOT NULL,
    org_id UUID REFERENCES public.org(id) ON DELETE RESTRICT, -- NULL = use MDE recommended
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tour_id, country_code), -- Only one override per tour+country
    -- Country code must be valid ISO 3166-1 alpha-2
    CONSTRAINT router_tour_overrides_country_code_valid CHECK (is_valid_iso_country_code(country_code))
);

-- Validate org's country matches override's country (only when org_id is set)
CREATE OR REPLACE FUNCTION public.validate_tour_override_org_match()
RETURNS TRIGGER AS $$
DECLARE
  org_country VARCHAR(2);
BEGIN
  -- Skip validation if no org_id (using MDE default)
  IF NEW.org_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT country_code INTO org_country FROM public.org WHERE id = NEW.org_id;
  IF org_country IS NULL OR org_country != NEW.country_code THEN
    RAISE EXCEPTION 'Organization operates in %, but override is for %', COALESCE(org_country, 'unknown'), NEW.country_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_tour_override_org_match ON public.router_tour_overrides;
CREATE TRIGGER check_tour_override_org_match
BEFORE INSERT OR UPDATE ON public.router_tour_overrides
FOR EACH ROW EXECUTE FUNCTION public.validate_tour_override_org_match();

-- =============================================================================
-- ROUTER COUNTRY DEFAULTS TABLE
-- MDE's recommended org per country
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.router_country_defaults (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code VARCHAR(2) NOT NULL,
    org_id UUID NOT NULL REFERENCES public.org(id) ON DELETE RESTRICT,
    effective_from DATE,           -- NULL = permanent/always effective
    effective_to DATE,             -- NULL = no end date (only valid with effective_from set)
    notes TEXT,                    -- e.g., "Election season 2026"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Country code must be valid ISO 3166-1 alpha-2
    CONSTRAINT router_country_defaults_country_code_valid CHECK (is_valid_iso_country_code(country_code)),
    -- Only one permanent (NULL, NULL) record per country
    -- Date-specific records must have effective_from set
    CONSTRAINT valid_date_range CHECK (
        (effective_from IS NULL AND effective_to IS NULL) OR  -- permanent
        (effective_from IS NOT NULL)                           -- date-specific
    ),
    -- Unique permanent record per country (NULLS NOT DISTINCT treats NULLs as equal)
    UNIQUE NULLS NOT DISTINCT (country_code, effective_from)
);

-- Validate org's country matches default's country
CREATE OR REPLACE FUNCTION public.validate_country_default_org_match()
RETURNS TRIGGER AS $$
DECLARE
  org_country VARCHAR(2);
BEGIN
  SELECT country_code INTO org_country FROM public.org WHERE id = NEW.org_id;
  IF org_country IS NULL OR org_country != NEW.country_code THEN
    RAISE EXCEPTION 'Organization operates in %, but recommendation is for %', COALESCE(org_country, 'unknown'), NEW.country_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_country_default_org_match ON public.router_country_defaults;
CREATE TRIGGER check_country_default_org_match
BEFORE INSERT OR UPDATE ON public.router_country_defaults
FOR EACH ROW EXECUTE FUNCTION public.validate_country_default_org_match();

-- Prevent overlapping date-specific ranges for same country
CREATE OR REPLACE FUNCTION public.prevent_overlapping_country_defaults()
RETURNS TRIGGER AS $$
DECLARE
  conflicting RECORD;
BEGIN
  -- Skip check for permanent records (they don't overlap with date-specific)
  IF NEW.effective_from IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id, effective_from, effective_to INTO conflicting
  FROM public.router_country_defaults
  WHERE country_code = NEW.country_code
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
    AND effective_from IS NOT NULL  -- Only check date-specific records
    AND (
      (effective_to IS NULL OR NEW.effective_from <= effective_to)
      AND (NEW.effective_to IS NULL OR effective_from <= NEW.effective_to)
    )
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Date range conflicts with existing recommendation (% to %)',
      conflicting.effective_from::text,
      COALESCE(conflicting.effective_to::text, 'ongoing');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_overlapping_country_defaults ON public.router_country_defaults;
CREATE TRIGGER check_overlapping_country_defaults
BEFORE INSERT OR UPDATE ON public.router_country_defaults
FOR EACH ROW EXECUTE FUNCTION public.prevent_overlapping_country_defaults();

-- =============================================================================
-- ROUTER USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.router_users (
    id UUID PRIMARY KEY,           -- Links to Supabase auth.users.id
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'artist')),
    artist_id UUID REFERENCES public.router_artists(id),  -- NULL for admins, set for artists
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================================
-- ROUTER ANALYTICS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.router_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_handle VARCHAR(255) NOT NULL,
    country_code VARCHAR(2),
    org_id UUID REFERENCES public.org(id),
    tour_id UUID REFERENCES public.router_tours(id),
    destination_url TEXT NOT NULL, -- final URL user was sent to (includes ref= param for fallback tracking)
    -- Generated column extracts ref= value from destination_url for efficient querying
    -- e.g., "https://example.com?ref=no_tour" -> "no_tour"
    fallback_ref TEXT GENERATED ALWAYS AS (
        substring(destination_url from 'ref=([^&]+)')
    ) STORED,
    -- Track when artist-selected org failed and we fell through to MDE recommended
    override_org_fallthrough BOOLEAN DEFAULT false,
    attempted_override_org_id UUID REFERENCES public.org(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- attempted_override_org_id only set when fallthrough occurred
    CONSTRAINT valid_fallthrough_data CHECK (
        (override_org_fallthrough = false AND attempted_override_org_id IS NULL) OR
        (override_org_fallthrough = true)
    )
);

-- =============================================================================
-- ROUTER ORG OVERRIDES TABLE
-- Router-specific organization controls (pause/unpause orgs for routing)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.router_org_overrides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.org(id) ON DELETE RESTRICT,
    enabled BOOLEAN DEFAULT true,
    reason TEXT, -- Optional reason for deactivate: "capacity_exceeded", "partnership_paused"
    updated_by TEXT, -- Who made the change
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(org_id) -- One override record per org
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_router_artists_handle ON public.router_artists(handle);
CREATE INDEX IF NOT EXISTS idx_router_artists_enabled ON public.router_artists(enabled);

CREATE INDEX IF NOT EXISTS idx_router_tours_artist_id ON public.router_tours(artist_id);
CREATE INDEX IF NOT EXISTS idx_router_tours_enabled ON public.router_tours(enabled);
CREATE INDEX IF NOT EXISTS idx_router_tours_dates ON public.router_tours(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_router_tour_overrides_tour_id ON public.router_tour_overrides(tour_id);
CREATE INDEX IF NOT EXISTS idx_router_tour_overrides_country ON public.router_tour_overrides(country_code);
CREATE INDEX IF NOT EXISTS idx_router_tour_overrides_org_id ON public.router_tour_overrides(org_id);
CREATE INDEX IF NOT EXISTS idx_router_tour_overrides_enabled ON public.router_tour_overrides(enabled);

CREATE INDEX IF NOT EXISTS idx_router_country_defaults_country ON public.router_country_defaults(country_code);
CREATE INDEX IF NOT EXISTS idx_router_country_defaults_org_id ON public.router_country_defaults(org_id);
CREATE INDEX IF NOT EXISTS idx_router_country_defaults_dates ON public.router_country_defaults(effective_from, effective_to);

CREATE INDEX IF NOT EXISTS idx_router_analytics_timestamp ON public.router_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_router_analytics_artist_handle ON public.router_analytics(artist_handle);
CREATE INDEX IF NOT EXISTS idx_router_analytics_country ON public.router_analytics(country_code);
CREATE INDEX IF NOT EXISTS idx_router_analytics_org_id ON public.router_analytics(org_id);
CREATE INDEX IF NOT EXISTS idx_router_analytics_fallback_ref ON public.router_analytics(fallback_ref);
CREATE INDEX IF NOT EXISTS idx_router_analytics_fallthrough ON public.router_analytics(override_org_fallthrough) WHERE override_org_fallthrough = true;

CREATE INDEX IF NOT EXISTS idx_router_org_overrides_org_id ON public.router_org_overrides(org_id);
CREATE INDEX IF NOT EXISTS idx_router_org_overrides_enabled ON public.router_org_overrides(enabled);

CREATE INDEX IF NOT EXISTS idx_router_users_email ON public.router_users(email);
CREATE INDEX IF NOT EXISTS idx_router_users_artist_id ON public.router_users(artist_id);

-- =============================================================================
-- TRIGGERS - Updated At
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_router_artists_updated_at ON public.router_artists;
CREATE TRIGGER set_router_artists_updated_at
    BEFORE UPDATE ON public.router_artists
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_router_tours_updated_at ON public.router_tours;
CREATE TRIGGER set_router_tours_updated_at
    BEFORE UPDATE ON public.router_tours
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_router_tour_overrides_updated_at ON public.router_tour_overrides;
CREATE TRIGGER set_router_tour_overrides_updated_at
    BEFORE UPDATE ON public.router_tour_overrides
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_router_country_defaults_updated_at ON public.router_country_defaults;
CREATE TRIGGER set_router_country_defaults_updated_at
    BEFORE UPDATE ON public.router_country_defaults
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_router_org_overrides_updated_at ON public.router_org_overrides;
CREATE TRIGGER set_router_org_overrides_updated_at
    BEFORE UPDATE ON public.router_org_overrides
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- =============================================================================
-- TRIGGERS - Prevent Handle Updates
-- =============================================================================
CREATE OR REPLACE FUNCTION public.prevent_handle_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.handle IS DISTINCT FROM NEW.handle THEN
        RAISE EXCEPTION 'Artist handle cannot be modified after creation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_router_artist_handle_update ON public.router_artists;
CREATE TRIGGER prevent_router_artist_handle_update
    BEFORE UPDATE ON public.router_artists
    FOR EACH ROW EXECUTE PROCEDURE public.prevent_handle_update();

-- =============================================================================
-- TRIGGERS - Prevent Overlapping Tours
-- =============================================================================
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
    FROM public.router_tours
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
        RAISE EXCEPTION 'Tour active windows cannot overlap for the same artist. Deactivate conflicting tours first.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_router_tour_overlap_trigger ON public.router_tours;
CREATE TRIGGER check_router_tour_overlap_trigger
    BEFORE INSERT OR UPDATE ON public.router_tours
    FOR EACH ROW EXECUTE PROCEDURE public.check_tour_overlap();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.router_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.router_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.router_tour_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.router_country_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.router_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.router_org_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.router_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Service-level access control
-- Both Router and MDEDB apps use same service key, but RLS provides separation
CREATE POLICY "service_access_router_artists" ON public.router_artists FOR ALL TO service_role USING (true);
CREATE POLICY "service_access_router_tours" ON public.router_tours FOR ALL TO service_role USING (true);
CREATE POLICY "service_access_router_tour_overrides" ON public.router_tour_overrides FOR ALL TO service_role USING (true);
CREATE POLICY "service_access_router_country_defaults" ON public.router_country_defaults FOR ALL TO service_role USING (true);
CREATE POLICY "service_access_router_analytics" ON public.router_analytics FOR ALL TO service_role USING (true);
CREATE POLICY "service_access_router_org_overrides" ON public.router_org_overrides FOR ALL TO service_role USING (true);
CREATE POLICY "service_access_router_users" ON public.router_users FOR ALL TO service_role USING (true);

-- Note: User-level RLS policies (artist can only edit own tours, etc.)
-- will be added in future migration when building admin/artist UI
