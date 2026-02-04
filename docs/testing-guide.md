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

The router endpoint is `/a/{handle}` where `handle` is the artist's unique identifier.

```bash
# Show redirect location
curl -s -o /dev/null -w "%{redirect_url}\n" "http://localhost:3000/a/{handle}" \
  -H "x-vercel-ip-country: {COUNTRY}"

# Or see full response headers
curl -I "http://localhost:3000/a/{handle}" -H "x-vercel-ip-country: {COUNTRY}"
```

### Simulating country in the browser (local dev only)

In development mode, you can override the detected country using a `?country=` query parameter. This is useful for testing routing in a browser without VPN or header injection tools.

```
http://localhost:3000/a/radiohead?country=DE
http://localhost:3000/a/radiohead?country=GB
```

The parameter is case-insensitive (`de` and `DE` both work) and takes priority over any geo headers. This override is **disabled in production** — it only works when `NODE_ENV=development`.

For testing against a deployed Vercel environment, use a VPN to change your IP's country instead.

---

## Test Scenarios

### Success Cases - Artist Selected Org

All success redirects include UTM tracking parameters: `?utm_source=mde_amplify_rtr&utm_medium=referral&utm_campaign={handle}`

| Test | Command | Expected |
|------|---------|----------|
| Radiohead + US (artist override) | `curl -I "http://localhost:3000/a/radiohead" -H "x-vercel-ip-country: US"` | `https://example.com/?utm_source=mde_amplify_rtr&utm_medium=referral&utm_campaign=radiohead` |
| Radiohead + GB (artist override) | `curl -I "http://localhost:3000/a/radiohead" -H "x-vercel-ip-country: GB"` | `https://example.co.uk/?utm_source=mde_amplify_rtr&utm_medium=referral&utm_campaign=radiohead` |

### Success Cases - MDE Default Org

| Test | Command | Expected |
|------|---------|----------|
| Tame Impala + US (no override, uses MDE default) | `curl -I "http://localhost:3000/a/tame-impala" -H "x-vercel-ip-country: US"` | `https://mde-default-us.org/?utm_source=...&utm_campaign=tame-impala` |
| Tame Impala + GB (no override, uses MDE default) | `curl -I "http://localhost:3000/a/tame-impala" -H "x-vercel-ip-country: GB"` | `https://mde-default-gb.org/?utm_source=...&utm_campaign=tame-impala` |

### Success Cases - Fallthrough to MDE Default

| Test | Command | Expected |
|------|---------|----------|
| Gorillaz + US (artist org pending, fallthrough) | `curl -I "http://localhost:3000/a/gorillaz" -H "x-vercel-ip-country: US"` | `https://mde-default-us.org/?utm_source=...&utm_campaign=gorillaz` |
| The Strokes + US (override inactive, uses MDE) | `curl -I "http://localhost:3000/a/the-strokes" -H "x-vercel-ip-country: US"` | `https://mde-default-us.org/?utm_source=...&utm_campaign=the-strokes` |

### Artist Failures

| Test | Command | Expected |
|------|---------|----------|
| Unknown artist | `curl -I "http://localhost:3000/a/unknown-artist"` | `?ref=artist_not_found` |
| Inactive artist | `curl -I "http://localhost:3000/a/inactive-artist" -H "x-vercel-ip-country: US"` | `?ref=artist_not_found` |

### Tour Failures

| Test | Command | Expected |
|------|---------|----------|
| Past tour | `curl -I "http://localhost:3000/a/coldplay" -H "x-vercel-ip-country: DE"` | `?ref=no_tour` |
| Future tour | `curl -I "http://localhost:3000/a/billie-eilish" -H "x-vercel-ip-country: AU"` | `?ref=no_tour` |
| Inactive tour | `curl -I "http://localhost:3000/a/taylor-swift" -H "x-vercel-ip-country: US"` | `?ref=no_tour` |

### Pre/Post Tour Window Tests

The router considers a tour "active" if today falls within the effective window:
- **Effective start** = `start_date - pre_tour_window_days`
- **Effective end** = `end_date + post_tour_window_days`

To test pre/post tour windows, create a tour via the Admin UI with appropriate dates and window values:

| Scenario | Tour Setup | Expected |
|----------|------------|----------|
| Pre-tour window active | Start date: 5 days from now, Pre-window: 7 days | Success (routing active) |
| Pre-tour window not yet active | Start date: 10 days from now, Pre-window: 7 days | `?ref=no_tour` |
| Post-tour window active | End date: 2 days ago, Post-window: 5 days | Success (routing active) |
| Post-tour window expired | End date: 10 days ago, Post-window: 5 days | `?ref=no_tour` |
| Within actual tour dates | Start: past, End: future, Windows: 0 | Success (routing active) |

### Country Failures

| Test | Command | Expected |
|------|---------|----------|
| No MDE default for country | `curl -I "http://localhost:3000/a/bjork" -H "x-vercel-ip-country: IS"` | `?ref=org_not_specified` |
| No country header | `curl -I "http://localhost:3000/a/radiohead"` | `?ref=no_country` |
| Country not in tour | `curl -I "http://localhost:3000/a/radiohead" -H "x-vercel-ip-country: JP"` | `?ref=org_not_specified` |

### Organization Failures

| Test | Command | Expected |
|------|---------|----------|
| Org paused | `curl -I "http://localhost:3000/a/arctic-monkeys" -H "x-vercel-ip-country: DE"` | `?ref=org_paused` |
| Org no website | `curl -I "http://localhost:3000/a/daft-punk" -H "x-vercel-ip-country: FR"` | `?ref=org_no_website` |

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

## UTM Tracking and CTA URL Validation

### UTM params on redirect

The router appends three UTM parameters to every successful redirect:

- `utm_source=mde_amplify_rtr`
- `utm_medium=referral`
- `utm_campaign={artist_handle}`

Fallback redirects (to the AMPLIFY page) do **not** get UTM params — they use `ref=` query params instead.

### CTA URL validation (on profile save)

When an admin saves an org profile with a `cta_url`, the API:

1. **Strips UTM params** — any `utm_*` query params are removed (the router adds its own at redirect time). The API returns a warning when this happens.
2. **Checks primary domain** — the CTA URL's primary domain is compared to the org's `website` domain. A warning (not an error) is returned if they don't match. Subdomains of the same primary domain pass without warning.

| Scenario | Expected |
|----------|----------|
| `cta_url` has UTM params | Params stripped, warning returned, profile saved |
| `cta_url` domain matches org website | No warning |
| `cta_url` subdomain of org website | No warning (primary domain matches) |
| `cta_url` domain differs from org website | Warning returned, profile still saved |
| `cta_url` is invalid URL | 400 error, profile not saved |

---

## Checking Analytics

After running tests, verify analytics were logged:

```bash
# Via Supabase Studio
open http://127.0.0.1:54330

# Or via psql
psql postgresql://postgres:postgres@127.0.0.1:54332/postgres \
  -c "SELECT artist_handle, country_code, fallback_ref, destination_url, override_org_fallthrough FROM router_analytics ORDER BY timestamp DESC LIMIT 10;"
```

---

## Testing Constraints

### Handle format (lowercase + hyphens only)

```bash
# This should fail
psql postgresql://postgres:postgres@127.0.0.1:54332/postgres \
  -c "INSERT INTO router_artists (handle, name) VALUES ('Invalid Handle', 'Test');"
# Error: violates check constraint "router_artists_handle_format"

# This should succeed
psql postgresql://postgres:postgres@127.0.0.1:54332/postgres \
  -c "INSERT INTO router_artists (handle, name) VALUES ('valid-handle', 'Test');"
```

### Country code format (ISO 3166-1 alpha-2)

```bash
# This should fail (not a valid ISO code)
psql postgresql://postgres:postgres@127.0.0.1:54332/postgres \
  -c "INSERT INTO router_tour_overrides (tour_id, country_code, org_id)
      VALUES ('aaaa1111-1111-1111-1111-111111111111', 'XX', '00000000-0000-0000-0000-000000000001');"
# Error: violates check constraint

# This should succeed
psql postgresql://postgres:postgres@127.0.0.1:54332/postgres \
  -c "INSERT INTO router_tour_overrides (tour_id, country_code)
      VALUES ('aaaa1111-1111-1111-1111-111111111111', 'CA');"
```

### Org country mismatch (should be prevented)

```bash
# Try to assign US org to GB country (should fail)
psql postgresql://postgres:postgres@127.0.0.1:54332/postgres \
  -c "INSERT INTO router_tour_overrides (tour_id, country_code, org_id)
      VALUES ('aaaa1111-1111-1111-1111-111111111111', 'GB', '00000000-0000-0000-0000-000000000001');"
# Error: Organization operates in US, but override is for GB
```

### Overlapping tours (should be prevented)

```bash
# Try to create overlapping tour for radiohead (should fail)
psql postgresql://postgres:postgres@127.0.0.1:54332/postgres \
  -c "INSERT INTO router_tours (artist_id, name, start_date, end_date)
      VALUES ('11111111-1111-1111-1111-111111111111', 'Overlap Tour', '2026-06-01', '2026-08-01');"
# Error: Tour active windows cannot overlap for the same artist
```

### Delete restriction (should be prevented)

```bash
# Try to delete an artist with tours (should fail)
psql postgresql://postgres:postgres@127.0.0.1:54332/postgres \
  -c "DELETE FROM router_artists WHERE handle = 'radiohead';"
# Error: violates foreign key constraint ... ON DELETE RESTRICT
```

---

## Analytics and Admin Test Clicks

When testing the router locally or in production, admin clicks on artist links (e.g., via curl or a browser) are counted in the analytics data. There is no reliable way to distinguish admin test clicks from real fan traffic since both are plain HTTP requests.

At pilot volumes this is negligible. Admins can use the date picker on the dashboard to focus on post-launch periods and filter out any test data generated during setup.

---

## Test Data Reference

See `supabase/seed.sql` for the full list of test artists, tours, and configurations.

### Artists and Expected Results

| Artist | Tour Status | Country | Org Source | Expected Result |
|--------|-------------|---------|------------|-----------------|
| radiohead | Active | US | Artist override | Success (example.com + UTM) |
| radiohead | Active | GB | Artist override | Success (example.co.uk + UTM) |
| tame-impala | Active | US | MDE default | Success (mde-default-us.org + UTM) |
| tame-impala | Active | GB | MDE default | Success (mde-default-gb.org + UTM) |
| gorillaz | Active | US | Fallthrough to MDE | Success (mde-default-us.org + UTM) |
| the-strokes | Active | US | Override inactive, MDE default | Success (mde-default-us.org + UTM) |
| bjork | Active | IS | No MDE default | org_not_specified |
| coldplay | Past | DE | N/A | no_tour |
| billie-eilish | Future | AU | N/A | no_tour |
| inactive-artist | Active | US | N/A | artist_not_found |
| taylor-swift | Inactive | US | N/A | no_tour |
| daft-punk | Active | FR | No website | org_no_website |
| arctic-monkeys | Active | DE | Paused | org_paused |

### MDE Country Defaults

| Country | Org | Website |
|---------|-----|---------|
| US | MDE Default Org US | https://mde-default-us.org |
| GB | MDE Default Org GB | https://mde-default-gb.org |
| DE | MDE Default Org DE | https://mde-default-de.org |
| AU | Test Org AU | https://example.com.au |
