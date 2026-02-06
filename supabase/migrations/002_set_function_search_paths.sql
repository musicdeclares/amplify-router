-- =============================================================================
-- Migration 002: Set search_path on all functions
-- Fixes Supabase lint warning: function_search_path_mutable
-- Without an explicit search_path, a user with CREATE privileges on a schema
-- earlier in the path could shadow objects the function references.
-- All functions already use fully-qualified public.* references, so
-- SET search_path = '' is safe and changes no runtime behavior.
-- =============================================================================

-- 1. is_valid_iso_country_code (IMMUTABLE, no table references)
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
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = '';

-- 2. validate_tour_override_org_match
CREATE OR REPLACE FUNCTION public.validate_tour_override_org_match()
RETURNS TRIGGER AS $$
DECLARE
  org_country VARCHAR(2);
BEGIN
  IF NEW.org_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT country_code INTO org_country FROM public.org WHERE id = NEW.org_id;
  IF org_country IS NULL OR org_country != NEW.country_code THEN
    RAISE EXCEPTION 'Organization operates in %, but override is for %', COALESCE(org_country, 'unknown'), NEW.country_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 3. validate_country_default_org_match
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
$$ LANGUAGE plpgsql SET search_path = '';

-- 4. prevent_overlapping_country_defaults
CREATE OR REPLACE FUNCTION public.prevent_overlapping_country_defaults()
RETURNS TRIGGER AS $$
DECLARE
  conflicting RECORD;
BEGIN
  IF NEW.effective_from IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id, effective_from, effective_to INTO conflicting
  FROM public.router_country_defaults
  WHERE country_code = NEW.country_code
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
    AND effective_from IS NOT NULL
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
$$ LANGUAGE plpgsql SET search_path = '';

-- 5. set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 6. prevent_handle_update
CREATE OR REPLACE FUNCTION public.prevent_handle_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.handle IS DISTINCT FROM NEW.handle THEN
        RAISE EXCEPTION 'Artist handle cannot be modified after creation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 7. check_tour_overlap
CREATE OR REPLACE FUNCTION public.check_tour_overlap()
RETURNS TRIGGER AS $$
DECLARE
    new_active_start DATE;
    new_active_end DATE;
    overlapping_count INTEGER;
BEGIN
    IF NOT NEW.enabled THEN
        RETURN NEW;
    END IF;

    new_active_start := NEW.start_date - NEW.pre_tour_window_days;
    new_active_end := NEW.end_date + NEW.post_tour_window_days;

    SELECT COUNT(*) INTO overlapping_count
    FROM public.router_tours
    WHERE artist_id = NEW.artist_id
      AND enabled = true
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
          (start_date - pre_tour_window_days, end_date + post_tour_window_days)
          OVERLAPS
          (new_active_start, new_active_end)
      );

    IF overlapping_count > 0 THEN
        RAISE EXCEPTION 'Tour active windows cannot overlap for the same artist. Deactivate conflicting tours first.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';
