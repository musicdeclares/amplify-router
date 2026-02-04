# AMPLIFY Router – Product Strategy & Technical Brief

## Audience

Coding AI agent responsible for designing and implementing the AMPLIFY Router MVP and its extensible architecture.

## Product Background & Context

**Music Declares Emergency (MDE)** runs the **AMPLIFY** program to help musical artists mobilize fans toward climate action by directing them to vetted, grassroots partner organizations. These partners are governed by a lightweight, non-financial MOU that emphasizes low operational burden, non-discrimination, and the ability to pause or redirect traffic if capacity is constrained.

Historically, artists promoted orgs via static links or one-off QR codes. This breaks down across:

- Multi-country tours
- Changing tour dates
- Capacity constraints at partner orgs
- Artists wanting a single, evergreen link

**AMPLIFY Router** solves this by acting as a lightweight, context-aware routing service behind a single artist-facing URL.

The Router determines _where a fan should be sent_ based on contextual signals (primarily country + tour timing) and artist-defined configuration, while ensuring links never break or misrepresent partnerships.

## Core Product Goal

Enable a **single, evergreen artist AMPLIFY link** that:

- Routes fans to a relevant, vetted organization when appropriate
- Falls back gracefully to a neutral/default AMPLIFY experience
- Minimizes operational burden for MDE and partner orgs
- Is safe to print on posters, merch, and stage visuals

## Non-Goals (MVP)

Explicitly out of scope for initial build:

- Outcome tracking or attribution analytics
- Auto-recommendation of orgs
- On-demand asset generation
- Fine-grained geo (city-level, GPS)
- Real-time capacity detection

Architecture _should not block_ these later.

## User Types

- **Artists / managers**: configure routing rules per tour
- **Fans**: scan QR codes or click links
- **MDE admins**: manage orgs, tours, and safety overrides

## Conceptual Model

### Key Entities

- **Artist**
- **Tour**
- **Show** (future-proofed; not required for MVP routing)
- **Partner Organization**
- **Router Rule** (implicit via tour config)

### Artist Mental Model

> “I want one link for this tour. When fans scan it in Germany, it should send them to Org A during the tour, and something sensible when I’m not touring.”

## Routing Logic (MVP)

Order of resolution (deterministic, debuggable):

1. **Artist exists?**
    - If no → fallback with `ref=artist_not_found`
2. **Is there an active tour?**
    - `now` between `tour_start` and `tour_end` (considering pre/post windows)
    - If no → fallback with `ref=no_tour`
3. **Is country detected?**
    - From `x-vercel-ip-country` or `cf-ipcountry` headers
    - If no → fallback with `ref=no_country`
4. **Check artist-selected org override** (`router_tour_overrides`)
    - If override exists, enabled, AND org is in `org_public_view` → use that org
    - If override exists but org not in view → fall through to step 5 (don't strand the fan)
5. **Check MDE country defaults** (`router_country_defaults`)
    - If found AND org is in `org_public_view` → use that org (MDE recommended)
    - If default exists but org not in view → fallback with `ref=org_not_found`
6. **No org for this country**
    - Fallback with `ref=org_not_specified`
7. **Is org paused?** (`router_org_overrides`)
    - If paused → fallback with `ref=org_paused`
8. **Resolve destination URL** (`router_org_profiles`)
    - Check `router_org_profiles.cta_url` for this org
    - Destination = `cta_url` if set, otherwise `org.website`
9. **Does org have a destination?**
    - If neither `cta_url` nor `website` → fallback with `ref=org_no_website`
10. **Success** → append UTM tracking params and redirect
    - Appends `utm_source=mde_amplify_rtr`, `utm_medium=referral`, `utm_campaign={artist_handle}`
    - Preserves any existing non-UTM query params on the destination URL

> Outside tour dates, the link should _never_ imply a tour-specific partnership.

## Context Signals (MVP)

- **Country**: inferred at a coarse level (IP → country)
- **Time**: server-side current date

### Explicit Constraints

- No precise location storage
- No fan-identifying data persisted
- Context used only transiently for routing

## Product Constraints from MOU

Router behavior must support:

- Immediate pause or redirection if an org requests it
- Removal of org usage within 30 days of termination
- No implication of exclusivity or financial endorsement
- Zero required integration on org side

This implies:

- Org-level `active / paused` flags
- Central override capability

## Fallback Philosophy

Fallbacks are _intentional product states_, not errors.

Examples:

- Neutral AMPLIFY explainer page
- Country-agnostic climate action page
- “This tour has ended” messaging

The Router must **always return a valid destination**.

## Technical Architecture (Recommended)

### High-Level

- Stateless HTTP service
- Edge-friendly (low latency, globally accessible)
- Deterministic routing logic

### Confirmed Stack

- **Frontend/Router**: Next.js 16 (matches existing MDEDB stack)
- **Database**: Existing Supabase instance (extends MDEDB schema)
- **Deployment**: Vercel (consistent with existing MDE infrastructure)

### Data Model (MVP)

**Database Integration**: Extends existing MDEDB Supabase schema. Accesses partner organizations via `org_public_view` (a view exposing only approved orgs with sensitive fields hidden).

**Note:** All router tables are prefixed with `router_` for namespace separation from MDEDB tables.

**New Tables Required:**

**router_artists**
```sql
id UUID PRIMARY KEY
handle VARCHAR UNIQUE  -- for /a/{artist_handle} URLs, lowercase + hyphens only
name VARCHAR
enabled BOOLEAN DEFAULT true
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

**router_tours**
```sql
id UUID PRIMARY KEY
artist_id UUID REFERENCES router_artists(id)
name VARCHAR
start_date DATE
end_date DATE
pre_tour_window_days INTEGER DEFAULT 0
post_tour_window_days INTEGER DEFAULT 0
enabled BOOLEAN DEFAULT true  -- Manual disable override
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
-- Note: "completed" status derived from end_date < CURRENT_DATE
```

**router_tour_overrides** (Artist-selected org per country)
```sql
id UUID PRIMARY KEY
tour_id UUID REFERENCES router_tours(id)
country_code VARCHAR(2)  -- ISO 3166-1 alpha-2 (validated)
org_id UUID REFERENCES org(id)  -- NULL = use MDE recommended
enabled BOOLEAN DEFAULT true
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
UNIQUE(tour_id, country_code)  -- Only one override per tour+country
```

**router_country_defaults** (MDE recommended org per country)
```sql
id UUID PRIMARY KEY
country_code VARCHAR(2)  -- ISO 3166-1 alpha-2 (validated)
org_id UUID REFERENCES org(id)
effective_from DATE  -- NULL = permanent/always effective
effective_to DATE    -- NULL = no end date
notes TEXT           -- e.g., "Election season 2026"
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
-- Unique permanent record per country (effective_from IS NULL)
-- Date-specific records override permanent for their time period
```

**router_org_overrides** (Router-specific org controls)
```sql
id UUID PRIMARY KEY
org_id UUID REFERENCES org(id) UNIQUE
enabled BOOLEAN DEFAULT true
reason TEXT  -- Optional: "capacity_exceeded", "partnership_paused"
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

**router_org_profiles** (Fan-facing org content overrides)
```sql
id UUID PRIMARY KEY
org_id UUID REFERENCES org(id) UNIQUE  -- One profile per org
org_name TEXT           -- Fan-facing name; falls back to org.org_name
mission TEXT            -- Fan-facing mission; falls back to org.mission_statement
cta_url TEXT            -- Router redirect destination; falls back to org.website
                        -- On save: UTM params stripped (router appends its own at redirect time)
                        -- On save: domain validated against org.website (warning, not blocked)
cta_text TEXT           -- Button label; UI defaults to "Get involved" when NULL
fan_actions TEXT[]      -- e.g., '{"Register to vote", "Pressure decision-makers"}'
image_url TEXT          -- Supabase Storage URL (router-org-images bucket)
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

**router_analytics** (Routing event tracking)
```sql
id UUID PRIMARY KEY
artist_handle VARCHAR NOT NULL
country_code VARCHAR(2)
org_id UUID REFERENCES org(id)
tour_id UUID REFERENCES router_tours(id)
destination_url TEXT NOT NULL
fallback_ref TEXT  -- Generated from destination_url ref= param
override_org_fallthrough BOOLEAN DEFAULT false  -- True when artist org failed
attempted_override_org_id UUID  -- The org that failed (when fallthrough)
timestamp TIMESTAMP DEFAULT NOW()
```

**Existing org_public_view** (read-only access):
- View filters to `approval_status = 'approved'` — router never sees unapproved orgs
- Provides `website` field as fallback destination URL (overridden by `router_org_profiles.cta_url` when set)
- Uses `country_code` for geographic matching
- Hides sensitive fields: `contact`, `email`, `created_by`, `updated_by`, `approval_status`
- Router-specific controls managed separately via `router_org_overrides`
- Fan-facing content overrides managed via `router_org_profiles`

### Admin Control Surface

Even if UI comes later, system must support:

- Disabling an org globally via `router_org_overrides`
- Disabling a tour via `router_tours.enabled = false`
- Emergency override without redeploy

### Implementation Phases

**Phase 1: Core Router API** ✅
- `GET /a/{artist_handle}` routing endpoint
- Database tables and basic queries
- Fallback page rendering

**Phase 2: Admin Configuration UI** ✅
- Artist CRUD (`/admin/artists/`)
- Tour management (`/admin/tours/`)
- Country-first organization management (`/admin/organizations/`)
  - Lists countries with approved orgs
  - Click into country to manage recommendations and org status
  - Set permanent and date-specific recommendations per country
- Fan-facing org profile management (`/admin/organizations/org/[id]`)
  - Override org name, mission, CTA URL/text for fan display
  - Fan actions labels and org image upload (Supabase Storage)
  - Profile data feeds into routing (cta_url) and future org directory UI
- Analytics dashboard (`/admin/`)
  - Routing trends, top countries/artists, fallback diagnostics
  - Date range filtering, override fallthrough tracking

**Phase 3: Artist Self-Service** (Future)
- Artist-scoped dashboard (`/artist/dashboard/`)
- Self-service tour configuration (`/artist/tours/`)
- Permission separation: artists cannot disable orgs globally

### Security Architecture

**Database Role Separation**:
```sql
-- Strict table-level isolation
router_service_role: Full CRUD on Router tables, SELECT on org_public_view only
mdedb_service_role: Full CRUD on MDEDB tables including org (no Router access)
```

**Access Pattern**: The router queries `org_public_view`, not the `org` table directly. This ensures:
- Router only sees approved organizations
- Sensitive fields (contact, email, approval_status) are hidden
- No risk of exposing unapproved or pending organizations

**Cross-System Access**: None initially. Add specific permissions only when concrete use cases emerge.

## API Contract (Illustrative)

`GET /a/{artist_handle}`

Returns:

- `302` redirect to resolved destination

No client-side logic required.

## Observability (Minimal)

For MVP:

- Request count
- Resolution path (which branch)
- Error logging

Avoid user-level analytics.

## Future Schema Evolution (Do Not Block MVP)

The current schema includes `priority` fields to support future routing granularity without breaking changes.

**Potential Extensions:**

**Enhanced Geographic Routing:**
```sql
-- Future: More granular geographic configs
router_configs (
  context_type VARCHAR,      -- 'tour' | 'show' | 'venue'
  context_id VARCHAR,        -- References tour.id, show.id, etc.
  geographic_scope VARCHAR,  -- 'country' | 'city' | 'venue' 
  geographic_value VARCHAR,  -- 'US' | 'berlin' | 'venue-123'
  priority INTEGER          -- Higher priority = more specific
)
```

**Show-Level Routing:**
```sql
-- Future: Individual show configurations
router_shows (
  id UUID PRIMARY KEY,
  tour_id UUID REFERENCES router_tours(id),
  venue_name VARCHAR,
  city VARCHAR,
  country_code VARCHAR,
  show_date DATE
)
```

**Weighted Org Selection:**
```sql
-- Future: Multiple orgs per geographic area
router_tour_overrides.weight INTEGER  -- For A/B testing, capacity distribution
```

**Resolution Priority Logic** (future):
1. Show + City (priority 30)
2. Show + Country (priority 25) 
3. Tour + City (priority 20)
4. Tour + Country (priority 10) ← MVP uses this level
5. Artist default (priority 5)

This approach allows the Router to evolve from simple tour-country routing to complex venue-specific partnerships while maintaining backward compatibility.

### UI Architecture Evolution

**Shared Component Strategy**:
```typescript
// Reusable components for both admin and artist interfaces
components/
├── TourForm.tsx           // Tour CRUD with permission-aware fields
├── CountryOrgSelector.tsx // Country → org mapping interface  
├── RoutingPreview.tsx     // Visual preview of routing logic
├── DateRangePicker.tsx    // Tour date selection
└── OrgOverrideControls.tsx // Admin-only org disable controls
```

**Permission-Based Rendering**:
```typescript
// Same components, different capabilities based on user role
function RoutingConfiguration({ userRole }: { userRole: 'admin' | 'artist' }) {
  const availableOrgs = userRole === 'admin' ? allOrgs : approvedOrgsOnly;
  const canDisableOrgs = userRole === 'admin';
  
  return (
    <CountryOrgSelector 
      orgs={availableOrgs}
      showDisableControls={canDisableOrgs}
    />
  );
}
```

This allows building one UI that evolves from admin configuration tool to artist self-service through progressive permission refinement.

### Future Admin Features (Deferred)

The following features are intentionally deferred. They should be revisited after pilot testing with real artists.

**Asset generation**
- ~~Artist URL QR code generation~~ — **Implemented** via `qr-code-styling` library. Available on the artist edit page sidebar. Supports light/dark mode, transparent/solid background, AMPLIFY logo overlay, SVG + PNG download.
- Social media post templates

**Emergency & Bulk Controls**
- "Pause All Routing" emergency button (redirect all traffic to fallback)
- Bulk update organization status (enable/disable multiple orgs)
- These controls should be designed with safeguards:
  - Confirmation dialogs with clear impact messaging
  - Possibly require re-authentication or 2FA
  - Audit logging of who triggered what action
  - Consider placing in a separate "Settings" or "Emergency" page rather than dashboard
- The `router_org_overrides` table already supports per-org pausing; bulk operations would just batch these

**Audit Trail**
- Log configuration changes (who changed what and when) to a `router_audit_log` table
- Covers tour/override creation and deletion, org profile changes, country default updates
- Important for operational debugging ("what changed and when") and MOU compliance
- Consider preventing artist deletion entirely (disable-only policy) since artist handles are permanent public URLs
- Schema sketch: `(action, table_name, record_id, old_values, new_values, user_id, timestamp)` with Postgres triggers

**Org Self-Service** (may belong in MDEDB)
- Orgs updating their own info
- Viewing routing analytics for their org
- Submitting volunteer/engagement metrics

## Design Principles for the Agent

- Favor clarity over cleverness
- Make routing decisions inspectable
- Treat fallbacks as first-class
- Optimize for operational safety, not growth hacks

---

## Open Questions for Tiff

Please confirm or clarify:

1. Should **multiple simultaneous tours per artist** ever be allowed?
    - No, tours run sequentially, not simultaneously.

2. Is **country-only routing** sufficient for all MVP use cases?
    - Yes.

3. Should the Router support **manual, immediate overrides** without code changes?
    - Yes, especially for pausing an org or disabling a tour.

4. Is the fallback page static, or artist-specific?
    - Mostly static with minimal artist-specific token replacement if artist context is available.

If unanswered, default to the safest, simplest assumption.
