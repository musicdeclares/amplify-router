# AMPLIFY Router Contract v0 (Pilot)

This document defines the scope, guarantees, and design boundaries of the AMPLIFY Router. **Foundational** sections are permanent principles; **Evolvable** sections describe current implementation and may change only in ways that preserve existing behavior.

## 1. Purpose [Foundational]

The AMPLIFY Router provides artists with a **single, evergreen link** that deterministically routes fans to an appropriate, vetted destination or a neutral AMPLIFY fallback experience.

The Router's role is strictly **routing and activation**. Capabilities involving fan engagement, data capture, or partner management are outside scope and would require separate products with their own governance.

## 2. Data Boundary & Logging [Foundational]

AMPLIFY functions solely as a routing and activation layer.

**What is logged** (per request)

- `artist_handle`
- `request_country`
- `resolved_url`
- `reason_code`
- `timestamp`

**What is never stored**

- IP addresses
- User agents
- Cookies
- Any fan-identifying information

Any future initiative involving personal data collection would constitute a **separate product**, requiring explicit approval, legal review, and governance outside this contract.

## 3. Inputs [Evolvable (v0)]

Automatically inferred at request time:

- `artist_handle`: Stable artist identifier for routing and fallback contextualization
- `request_country`: Country-level location inferred via network data (no precise location stored)
- `request_timestamp`: UTC timestamp for routing eligibility

## 4. Artist Configuration [Evolvable (v0)]

**Required**

- `tour_start_date`
- `tour_end_date`
- `country_org_map` (country → destination URL)

**Optional**

- `pre_tour_window_days` (integer, default `0`)
- `post_tour_window_days` (integer, default `0`)

## 5. Tour Activity Window [Evolvable (v0)]

Tour dates determine whether partner redirection is appropriate, acting as a guardrail against stale or misleading destinations.

- `active_start` = `tour_start_date` - `pre_tour_window_days`
- `active_end` = `tour_end_date` + `post_tour_window_days`

Outside this window, the Router **must not** redirect to partner organizations.

## 6. Resolution Rules [Foundational behavior, Evolvable steps]

For every request, the Router resolves **exactly one destination URL**.

Resolution order:

1. **Artist exists?** → If no, fallback
2. **Within active routing window?** → If no, fallback
3. **Country match configured?** → If no, fallback
4. **Organization active and allowed?** → If no (e.g., paused, terminated), fallback
5. **Route** → Redirect to org destination URL

The Router treats missing, ambiguous, or unverifiable inputs as resolution failures, defaulting to fallback.

Additional resolution steps may be added, but **existing behavior and defaults must not change**.

## 7. Fallback Experience [Foundational]

The Router redirects to a **single canonical AMPLIFY fallback page** whenever routing cannot succeed. The fallback URL is configurable by admins without requiring a redeploy.

**What the fallback page may do** (outside Router scope)
- Render artist-aware copy when artist context is present
- Surface a global fallback partner as a default safety net
- Provide general climate action guidance

**Constraints on the fallback page**
- Must not imply artist-, tour-, or country-specific partnerships
- Must not collect fan personal data

The Router's only responsibility is redirecting to this page.

## 8. Output [Foundational]

- Single **302 redirect** to resolved destination
- Deterministic: identical inputs yield identical outputs

## 9. Non-Goals [Foundational]

Out of scope for AMPLIFY Router:

- Fan or volunteer data collection
- City- or venue-level routing
- Multiple organizations per country
- Partner capacity management
- Real-time capacity detection
- Outcome tracking or attribution analytics
- Auto-recommendation of orgs
- On-demand asset generation
- Artist dashboards or CMS tooling

These may exist only as **separate products or layers**.

## 10. Versioning Guarantee [Foundational]

- All existing links must continue to resolve identically unless an artist explicitly opts into new configuration.
- Future versions may add inputs or capabilities but must not silently alter default behavior.
- Foundational clauses may only be modified through creation of a separate contract or product definition.
