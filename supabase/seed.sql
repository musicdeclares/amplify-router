-- Test data for local development
-- Run this after applying the migration

-- Insert test artists
INSERT INTO public.artists (id, slug, name, enabled) VALUES
('11111111-1111-1111-1111-111111111111', 'radiohead', 'Radiohead', true),
('22222222-2222-2222-2222-222222222222', 'coldplay', 'Coldplay', true),
('33333333-3333-3333-3333-333333333333', 'billie-eilish', 'Billie Eilish', true)
ON CONFLICT (id) DO NOTHING;

-- Insert test tours (active tour for radiohead, inactive for coldplay, future for billie eilish)
-- pre_tour_window_days and post_tour_window_days extend the active routing window
INSERT INTO public.tours (id, artist_id, name, start_date, end_date, pre_tour_window_days, post_tour_window_days, enabled) VALUES
('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Radiohead World Tour 2026', '2026-01-01', '2026-12-31', 7, 3, true),
('bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Coldplay Past Tour', '2025-01-01', '2025-06-30', 0, 0, true),
('cccc3333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Billie Eilish Future Tour', '2027-03-01', '2027-09-30', 14, 7, true)
ON CONFLICT (id) DO NOTHING;

-- Insert tour country configurations (radiohead has US and GB, coldplay has DE)
INSERT INTO public.tour_country_configs (id, tour_id, country_code, org_id, enabled) VALUES
('cccc1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'US', '00000000-0000-0000-0000-000000000001', true),
('dddd2222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111', 'GB', '00000000-0000-0000-0000-000000000002', true),
('eeee3333-3333-3333-3333-333333333333', 'bbbb2222-2222-2222-2222-222222222222', 'DE', '00000000-0000-0000-0000-000000000003', true)
ON CONFLICT (id) DO NOTHING;

-- Create an org override to test pause functionality
INSERT INTO public.router_org_overrides (id, org_id, enabled, reason) VALUES
('ffff4444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000003', false, 'Testing pause functionality')
ON CONFLICT (org_id) DO UPDATE SET enabled = false, reason = 'Testing pause functionality';
