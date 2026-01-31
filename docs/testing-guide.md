# AMPLIFY Router Testing Guide

## Prerequisites

1. **Local Supabase running:**
   ```bash
   supabase start
   ```

2. **Database seeded with test data:**
   ```bash
   supabase db reset
   ```

3. **Next.js dev server running:**
   ```bash
   npm run dev
   ```

## Manual Testing with curl

Use `-L` to follow redirects, `-s` to silence progress, and `-o /dev/null -w` to show just the redirect URL.

### Quick test command format

```bash
# Show redirect location
curl -s -o /dev/null -w "%{redirect_url}\n" "http://localhost:3000/a/{slug}" \
  -H "x-vercel-ip-country: {COUNTRY}"

# Or see full response headers
curl -I "http://localhost:3000/a/{slug}" -H "x-vercel-ip-country: {COUNTRY}"
```

---

## Test Scenarios

### Success Cases

| Test | Command | Expected |
|------|---------|----------|
| Radiohead + US | `curl -I "http://localhost:3000/a/radiohead" -H "x-vercel-ip-country: US"` | `https://example.com` |
| Radiohead + GB | `curl -I "http://localhost:3000/a/radiohead" -H "x-vercel-ip-country: GB"` | `https://example.co.uk` |

### Artist Failures

| Test | Command | Expected |
|------|---------|----------|
| Unknown artist | `curl -I "http://localhost:3000/a/unknown-artist"` | `?ref=unknown_artist` |
| Disabled artist | `curl -I "http://localhost:3000/a/disabled-artist" -H "x-vercel-ip-country: US"` | `?ref=unknown_artist` |

### Tour Failures

| Test | Command | Expected |
|------|---------|----------|
| Past tour | `curl -I "http://localhost:3000/a/coldplay" -H "x-vercel-ip-country: DE"` | `?ref=no_tour` |
| Future tour | `curl -I "http://localhost:3000/a/billie-eilish" -H "x-vercel-ip-country: AU"` | `?ref=no_tour` |
| Disabled tour | `curl -I "http://localhost:3000/a/taylor-swift" -H "x-vercel-ip-country: US"` | `?ref=no_tour` |

### Country Failures

| Test | Command | Expected |
|------|---------|----------|
| Country not configured | `curl -I "http://localhost:3000/a/radiohead" -H "x-vercel-ip-country: DE"` | `?ref=country_not_supported` |
| No country header | `curl -I "http://localhost:3000/a/radiohead"` | `?ref=no_country` |
| Country config disabled | `curl -I "http://localhost:3000/a/the-strokes" -H "x-vercel-ip-country: US"` | `?ref=country_not_supported` |

### Organization Failures

| Test | Command | Expected |
|------|---------|----------|
| Org paused | `curl -I "http://localhost:3000/a/arctic-monkeys" -H "x-vercel-ip-country: DE"` | `?ref=org_paused` |
| Org not approved | `curl -I "http://localhost:3000/a/gorillaz" -H "x-vercel-ip-country: JP"` | `?ref=org_not_approved` |
| Org no website | `curl -I "http://localhost:3000/a/daft-punk" -H "x-vercel-ip-country: FR"` | `?ref=no_org_website` |

---

## Automated Tests

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode during development
npm run test:watch
```

---

## Checking Analytics

After running tests, verify analytics were logged:

```bash
# Via Supabase Studio
open http://127.0.0.1:54330

# Or via psql
psql postgresql://postgres:postgres@127.0.0.1:54332/postgres \
  -c "SELECT artist_slug, country_code, reason_code, destination_url FROM router_analytics ORDER BY timestamp DESC LIMIT 10;"
```

---

## Testing Constraints

### Slug format (lowercase + hyphens only)

```bash
# This should fail
psql postgresql://postgres:postgres@127.0.0.1:54332/postgres \
  -c "INSERT INTO artists (slug, name) VALUES ('Invalid Slug', 'Test');"
# Error: violates check constraint "artists_slug_format"

# This should succeed
psql postgresql://postgres:postgres@127.0.0.1:54332/postgres \
  -c "INSERT INTO artists (slug, name) VALUES ('valid-slug', 'Test');"
```

### Country code format (2 uppercase letters)

```bash
# This should fail
psql postgresql://postgres:postgres@127.0.0.1:54332/postgres \
  -c "INSERT INTO tour_country_configs (tour_id, country_code, org_id)
      VALUES ('aaaa1111-1111-1111-1111-111111111111', 'usa', '00000000-0000-0000-0000-000000000001');"
# Error: violates check constraint "tour_country_configs_country_code_format"
```

### Overlapping tours (should be prevented)

```bash
# Try to create overlapping tour for radiohead (should fail)
psql postgresql://postgres:postgres@127.0.0.1:54332/postgres \
  -c "INSERT INTO tours (artist_id, name, start_date, end_date)
      VALUES ('11111111-1111-1111-1111-111111111111', 'Overlap Tour', '2026-06-01', '2026-08-01');"
# Error: Tour active windows cannot overlap for the same artist
```

### Delete restriction (should be prevented)

```bash
# Try to delete an artist with tours (should fail)
psql postgresql://postgres:postgres@127.0.0.1:54332/postgres \
  -c "DELETE FROM artists WHERE slug = 'radiohead';"
# Error: violates foreign key constraint ... ON DELETE RESTRICT
```

---

## Test Data Reference

See `supabase/seed.sql` for the full list of test artists, tours, and configurations.

| Artist | Tour Status | Country | Org Status | Expected Result |
|--------|-------------|---------|------------|-----------------|
| radiohead | Active (2026) | US, GB | Approved | Success |
| coldplay | Past (2024) | DE | Approved | no_active_tour |
| billie-eilish | Future (2028) | AU | Approved | no_active_tour |
| disabled-artist | Active | US | Approved | artist_not_found |
| taylor-swift | Disabled | US | Approved | no_active_tour |
| daft-punk | Active | FR | No website | org_no_website |
| gorillaz | Active | JP | Pending | org_not_approved |
| arctic-monkeys | Active | DE | Paused | org_paused |
| the-strokes | Active | US (disabled) | Approved | country_not_configured |
