# AMPLIFY Router

A context-aware routing service that helps musical artists mobilize fans toward climate action through vetted, grassroots partner organizations.

## Product Background

**Music Declares Emergency (MDE)** runs the **AMPLIFY** program to help musical artists mobilize fans toward climate action by directing them to vetted, grassroots partner organizations. These partners are governed by a lightweight, non-financial MOU that emphasizes low operational burden, non-discrimination, and the ability to pause or redirect traffic if capacity is constrained.

Historically, artists promoted orgs via static links or one-off QR codes. This breaks down across:
- Multi-country tours
- Changing tour dates
- Capacity constraints at partner orgs
- Artists wanting a single, evergreen link

**AMPLIFY Router** solves this by providing a single artist-facing URL that intelligently routes fans based on context.

## User Types

- **Fans**: Scan QR codes or click links at shows, on social media, etc.
- **Artists / managers**: Share their AMPLIFY link; may configure routing rules per tour (future)
- **MDE admins**: Manage artists, tours, orgs, and safety overrides

## Product Constraints (from MOU)

Router behavior must support:
- Immediate pause or redirection if an org requests it
- Removal of org usage within 30 days of termination
- No implication of exclusivity or financial endorsement
- Zero required integration on org side

## What It Does

### Fan Routing (`/a/{handle}`)
Provides a **single, evergreen artist AMPLIFY link** that:
- Routes fans to a relevant organization based on their country and the artist's tour schedule
- Falls back gracefully when no match is found
- Never breaks or misrepresents partnerships
- Is safe to print on posters, merch, and stage visuals

### Org Directory (`/directory`)
A public-facing directory of vetted climate action organizations:
- Helps fans discover orgs they can support
- Search by name, mission, or fan actions
- Filter by country
- Each org card links to their CTA with UTM tracking

The directory shares data with the router — both read from `org_public_view` (approved orgs from MDEDB) and `router_org_profiles` (fan-facing content overrides). Admins configure org profiles once, and the data appears in both the routing redirects and the directory.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (extends existing MDEDB schema)
- **Deployment**: Vercel
- **Styling**: Tailwind CSS v4, shadcn/ui components

## Routes

### Public Routes
| Route | Description |
|-------|-------------|
| `/` | Redirects to MDE AMPLIFY landing page (interim) |
| `/a/{handle}` | Fan routing endpoint — redirects to org based on context |
| `/directory` | Public org directory with search and country filter |
| `/kit/{handle}` | Artist starter kit page with AMPLIFY link, QR code, sample captions |
| `/help` | Help center with documentation |
| `/help/{slug}` | Individual help articles (admin-guide, artist-guide) |

### Admin Routes (require authentication)
| Route | Description |
|-------|-------------|
| `/admin` | Analytics dashboard |
| `/admin/artists` | Artist management |
| `/admin/tours` | Tour management |
| `/admin/organizations` | Country defaults and org profiles |

## Routing Logic

Resolution order (deterministic):

1. **Artist exists?** → If no, fallback (`ref=artist_not_found`)
2. **Active tour?** → Checks `now` between start/end dates with pre/post windows
3. **Country detected?** → From `x-vercel-ip-country` header
4. **Artist override?** → Check `router_tour_overrides` for this tour + country
5. **MDE default?** → Check `router_country_defaults` for this country
6. **Org paused?** → Check `router_org_overrides.enabled`
7. **Has destination?** → Use `router_org_profiles.cta_url` or `org.website`
8. **Success** → Redirect with UTM params (`utm_source=mde_amplify_rtr`)

Fallback reasons: `artist_not_found`, `no_tour`, `no_country`, `org_not_found`, `org_not_specified`, `org_paused`, `org_no_website`, `error`

## Database Schema

All router tables are prefixed with `router_` for namespace separation.

| Table | Purpose |
|-------|---------|
| `router_artists` | Artist profiles with handles |
| `router_tours` | Tour dates with pre/post windows |
| `router_tour_overrides` | Artist-selected orgs per tour + country |
| `router_country_defaults` | MDE-recommended orgs per country |
| `router_org_overrides` | Pause/enable orgs for routing |
| `router_org_profiles` | Fan-facing org content (name, mission, CTA, image) |
| `router_analytics` | Routing event tracking |
| `router_users` | Admin authentication |
| `org_public_view` | Read-only view of approved orgs from MDEDB |

## Key Features

### Analytics Dashboard (`/admin`)
- Routes over time (chart)
- Success rate and fallback breakdown
- Top countries and artists
- Collapsible recent fallback events with recovery guidance

### Org Profiles (`/admin/organizations/org/[id]`)
- Override org name, mission, CTA URL/text for fan display
- Upload custom images (Supabase Storage)
- Configure "fan actions" labels

### Artist Starter Kit (`/kit/{handle}`)
- Public page for sharing with artists after setup
- Copy button for AMPLIFY link
- QR code generator (light/dark, transparent/solid bg, SVG/PNG)
- Print-optimized layout with static QR code

### Org Directory (`/directory`)
- Public directory of vetted climate action organizations
- Search by name, mission, fan actions
- Filter by country
- Server-rendered for SEO
- UTM tracking on CTA links: `utm_source=mde_amplify_dir`

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL          # For canonical URLs in kit page
```

## Project Structure

```
app/
  admin/           # Admin UI pages
  api/             # API routes
  lib/             # Utilities (supabase, router-logic, analytics, countries, content)
  directory/       # Public org directory
  help/            # Help center and documentation pages
  kit/[handle]/    # Artist starter kit
  types/           # TypeScript definitions

components/
  ui/              # shadcn/ui primitives
  shared/          # Reusable components (QrCodeDialog, ImageUpload, etc.)
  analytics/       # Dashboard components
  content/         # Markdown rendering for help docs
  directory/       # Org directory components
  tours/           # Tour management components

content/
  help/            # Markdown documentation files with frontmatter
```

## Design Principles

- Routing decisions must be deterministic and inspectable
- Fallbacks are intentional product states, not errors
- The router must always return a valid destination
- No fan-identifying data is persisted

## Key Decisions

- **Tours run sequentially**, not simultaneously — one active tour per artist at a time
- **Country-only routing** for MVP — no city or venue-level granularity yet
- **Fallbacks are intentional** — "no tour" or "no org for country" are valid states, not errors
- **Artist handles are permanent** — once created, they become public URLs that shouldn't be deleted
- **Home page redirects to MDE site** (interim) — will switch to org directory when ready for launch
- **Org directory integrated** — lives in same codebase, shares data with router via `router_org_profiles`

## Launch Checklist (Org Directory)

When ready to make `/directory` the public-facing home page:

- [ ] Add OpenGraph image (1200×630px branded image for social sharing)
- [ ] Add Twitter card metadata
- [ ] Add `robots.txt` allowing crawling
- [ ] Add `sitemap.xml` for search engines
- [ ] Consider structured data (JSON-LD) for organizations
- [ ] Switch home page from MDE redirect to org directory
- [ ] Update Umami `data-domains` if domain changes from mde-amplify.vercel.app

## Future Considerations

- **Artist self-service**: Let artists configure their own tours
- **Organization self-service**: Let orgs update their own profiles in the directory
- **Show-level routing**: Route based on specific venue/date
- **Audit trail**: Log configuration changes for compliance
- **Emergency controls**: "Pause all routing" button with safeguards
