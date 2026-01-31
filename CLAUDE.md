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
    - If no → default AMPLIFY landing
2. **Is there an active tour?**
    - `now` between `tour_start` and `tour_end`
3. **Does tour have a country match?**
    - Match inferred country → configured org
4. **Is org active + allowed?**
    - Not paused, not terminated
5. **Route**
    - Success → org destination URL
    - Failure → fallback AMPLIFY page

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

**New Tables Required:**

**artists**
```sql
id UUID PRIMARY KEY
slug VARCHAR UNIQUE  -- for /a/{artist_slug} URLs
name VARCHAR
enabled BOOLEAN DEFAULT true
created_at TIMESTAMP DEFAULT NOW()
```

**tours** 
```sql
id UUID PRIMARY KEY
artist_id UUID REFERENCES artists(id)
name VARCHAR
start_date DATE
end_date DATE  
enabled BOOLEAN DEFAULT true  -- Manual disable override
created_at TIMESTAMP DEFAULT NOW()
-- Note: "completed" status derived from end_date < CURRENT_DATE
```

**tour_country_configs**
```sql
id UUID PRIMARY KEY
tour_id UUID REFERENCES tours(id)
country_code VARCHAR(2)  -- ISO 3166-1 alpha-2
org_id UUID REFERENCES org(id)  -- FK to org table; router joins via org_public_view
enabled BOOLEAN DEFAULT true
priority INTEGER DEFAULT 10  -- For future conflict resolution
created_at TIMESTAMP DEFAULT NOW()
```

**router_org_overrides** (Router-specific org controls)
```sql
id UUID PRIMARY KEY
org_id UUID REFERENCES org(id)
enabled BOOLEAN DEFAULT true
reason TEXT  -- Optional: "capacity_exceeded", "partnership_paused"
updated_by TEXT
created_at TIMESTAMP DEFAULT NOW()
```

**router_config** (Global router settings)
```sql
id UUID PRIMARY KEY
key VARCHAR UNIQUE  -- e.g., "fallback_url"
value TEXT
updated_by TEXT
updated_at TIMESTAMP DEFAULT NOW()
```
- `fallback_url`: The single canonical AMPLIFY fallback page URL (editable by admins without redeploy)

**Existing org_public_view** (read-only access):
- View filters to `approval_status = 'approved'` — router never sees unapproved orgs
- Uses `website` field as destination URL
- Uses `country_code` for geographic matching
- Hides sensitive fields: `contact`, `email`, `created_by`, `updated_by`, `approval_status`
- Router-specific controls managed separately via `router_org_overrides`

### Admin Control Surface

Even if UI comes later, system must support:

- Disabling an org globally via `router_org_overrides`
- Disabling a tour via `tours.enabled = false`
- Emergency override without redeploy

### Implementation Phases

**Phase 1: Core Router API** 
- `GET /a/{artist_slug}` routing endpoint
- Database tables and basic queries
- Fallback page rendering

**Phase 2: Admin Configuration UI**
- Artist CRUD (`/admin/artists/`)
- Tour management (`/admin/tours/`)
- Routing configuration (`/admin/routing/`)
- Org override controls (`/admin/overrides/`)

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

`GET /a/{artist_slug}`

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
shows (
  id UUID PRIMARY KEY,
  tour_id UUID REFERENCES tours(id),
  venue_name VARCHAR,
  city VARCHAR,
  country_code VARCHAR,
  show_date DATE
)
```

**Weighted Org Selection:**
```sql
-- Future: Multiple orgs per geographic area
tour_country_configs.weight INTEGER  -- For A/B testing, capacity distribution
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
