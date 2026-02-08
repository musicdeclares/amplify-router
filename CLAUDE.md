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
- **Artists / managers**: Configure their own tours and country routing via self-service dashboard
- **MDE admins**: Manage artists, tours, orgs, safety overrides, and send artist invites

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
| `/help` | Help center with documentation (filtered by user role) |
| `/help/{audience}/{slug}` | Individual help articles (e.g., `/help/admin/tours`) |
| `/invite/{token}` | Artist onboarding page for accepting invites |

### Artist Routes (require artist authentication)
| Route | Description |
|-------|-------------|
| `/artist/{artistId}` | Artist dashboard with link, QR code, stats |
| `/artist/{artistId}/tours` | Artist's tour list |
| `/artist/{artistId}/tours/new` | Create new tour |
| `/artist/{artistId}/tours/{tourId}` | Edit tour and country routing |
| `/artist/{artistId}/diagnostics` | Fallback diagnostics and troubleshooting |
| `/artist/{artistId}/settings` | Account settings (name, email) |

### Admin Routes (require admin authentication)
| Route | Description |
|-------|-------------|
| `/admin` | Analytics dashboard |
| `/admin/artists` | Artist management and invites |
| `/admin/artists/invite` | Send artist invite |
| `/admin/tours` | Tour management |
| `/admin/organizations` | Country defaults and org profiles |
| `/admin/settings` | Account settings (email, password reset) |

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
| `router_artists` | Artist profiles with handles and account status |
| `router_tours` | Tour dates with pre/post windows |
| `router_tour_overrides` | Artist-selected orgs per tour + country |
| `router_country_defaults` | MDE-recommended orgs per country |
| `router_org_overrides` | Pause/resume orgs for routing |
| `router_org_profiles` | Fan-facing org content (name, mission, CTA, image) |
| `router_analytics` | Routing event tracking |
| `router_users` | User authentication (admin and artist roles) |
| `router_invites` | Artist invite tokens with expiry |
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

### Artist Self-Service (`/artist/{artistId}`)
- Artists onboard via admin-generated invite links
- Dashboard with AMPLIFY link, QR code, and stats
- Create and manage tours with country routing
- View fallback diagnostics with actionable guidance

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL          # For canonical URLs in kit page
```

## Deployment

Hosted on Vercel. Only `main` and `staging` branches trigger deployments (configured via Ignored Build Step).

### Environments

| Branch | Environment | URL |
|--------|-------------|-----|
| `main` | Production | `amplify.musicdeclares.net` (configured in Vercel project settings) |
| `staging` | Preview | `amplify-router-git-staging-musicdeclares.vercel.app` |
| Other branches | Not deployed | Push to GitHub for PRs, but no Vercel build |

### Setup (one-time)

Create the staging branch:
```bash
git branch staging
git push origin staging
```

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b my-feature

# 2. Work and commit as usual
git add . && git commit -m "Add feature"

# 3. Push to staging for preview (stable URL)
git push origin HEAD:staging -f

# 4. Test at: amplify-router-git-staging-musicdeclares.vercel.app

# 5. Push feature branch to GitHub for PR
git push origin my-feature

# 6. Create PR: my-feature → main

# 7. Merge PR when ready (deploys to production)
```

### Notes

- The `-f` (force push) to staging is intentional—it's a throwaway branch
- Never merge staging → main; merge your feature branch → main
- Feature branches are pushed to GitHub for version control and PRs, but don't trigger Vercel builds
- Vercel config: Settings → Build and Deployment → Ignored Build Step → Custom:
  ```
  [ "$VERCEL_GIT_COMMIT_REF" = "main" ] || [ "$VERCEL_GIT_COMMIT_REF" = "staging" ] && exit 1 || exit 0
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
- **No artist link pause** — Tour windows already control when routing is active; a separate "pause link" toggle added confusion without value. DB columns (`link_active`, `link_inactive_reason`) retained for potential future use

## Terminology Conventions

Use consistent, inclusive language throughout user-facing text and documentation.

### Status Toggles

| Context | On State | Off State | Who Controls | Rationale |
|---------|----------|-----------|--------------|-----------|
| Artist account | **Active** | **Inactive** / **Deactivated** | Admin only | "Deactivated" implies admin action; used for ending partnerships |
| Tour | **Active** | **Inactive** | Artist or Admin | Tours control when routing is active |
| Organization | **Active** / **Resume** | **Paused** | Admin only | Orgs can be temporarily paused per MOU requirements |

### Words to Avoid

- **Enable/Disable**: Avoid in user-facing text. "Disable" has ableist connotations. Use "activate/deactivate" for permanent states or "pause/resume" for temporary states.
- **Enabled/Disabled** as UI labels: Use "Active/Inactive" instead. Internal code values (e.g., `value="enabled"`) are acceptable if the displayed label uses preferred terminology.

### Icons

- **Account status**: Ban icon (deactivated by admin)

### Database Fields

Database column names use `enabled` for boolean flags (e.g., `router_tours.enabled`). This is acceptable for internal schema — the convention applies to user-facing text only.

For artist status:
- `account_active` + `account_inactive_reason`: Admin only (for ending partnerships)

Note: `link_active` and `link_inactive_reason` columns exist in the database but are not exposed in the UI. They were removed because tour windows already handle routing activation, and the feature was not requested by artists. The columns are retained for potential future use.

## Launch Checklist (Org Directory)

When ready to promote the org directory for public discovery:

- [ ] Add OpenGraph image (1200×630px branded image for social sharing)
- [ ] Add Twitter card metadata
- [ ] Add `robots.txt` allowing crawling
- [ ] Add `sitemap.xml` for search engines
- [ ] Consider structured data (JSON-LD) for organizations
- [ ] Update Umami `data-domains` if domain changes from amplify.musicdeclares.net

Note: Home page (`/`) is now the fallback page with Climate Reality Project CTA. Directory remains at `/directory`.

## Keeping Docs in Sync

Help documentation lives in `content/help/` and describes UI flows step-by-step. When changing UI text (button labels, field names, navigation), update the corresponding help doc.

Key files have comments pointing to their docs:
```tsx
// Documented in: content/help/admin/artists.md#inviting-an-artist
```

**Help doc structure:**
- `content/help/admin/` — Admin guides (getting-started, artists, tours, organizations)
- `content/help/artist/` — Artist guides (getting-started, tours, troubleshooting)

## Tailwind CSS Conventions

Use **canonical Tailwind classes** instead of arbitrary pixel values for accessibility. Canonical classes use rem units that scale with user font preferences.

### Spacing (pixels ÷ 4)

| Instead of | Use | Calculation |
|------------|-----|-------------|
| `w-[50px]` | `w-12.5` | 50 ÷ 4 = 12.5 |
| `w-[100px]` | `w-25` | 100 ÷ 4 = 25 |
| `max-w-[300px]` | `max-w-75` | 300 ÷ 4 = 75 |

### Flex utilities (use short form)

| Instead of | Use |
|------------|-----|
| `flex-shrink-0` | `shrink-0` |
| `flex-shrink` | `shrink` |
| `flex-grow-0` | `grow-0` |
| `flex-grow` | `grow` |

### Exceptions

- shadcn/ui component defaults (leave as-is)
- Print-specific styles where exact pixel sizing is intentional

## Analytics Tracking

We use Umami for client-side analytics. Event tracking is defined in `app/lib/analytics-events.ts`.

### Adding Event Tracking

Use `data-umami-event` attributes on clickable elements:

```tsx
import { EVENTS } from "@/app/lib/analytics-events";

// Simple event
<Button data-umami-event={EVENTS.KIT_COPY_LINK}>
  Copy Link
</Button>

// With properties (for context like org name, artist, etc.)
<Button
  data-umami-event={EVENTS.DIRECTORY_ORG_CTA}
  data-umami-event-org={org.name}
  data-umami-event-country={org.country}
>
  Take Action
</Button>
```

### Naming Convention

Event names follow `{area}-{action}[-{detail}]`:
- **area**: page or role (fallback, directory, kit; artist, admin)
- **action**: what the user did (cta, click, copy, download, create)
- **detail**: optional specificity (global, directory, qr)

### When to Add Tracking

Track user-initiated actions that indicate engagement:
- CTA button clicks
- Form submissions
- Copy/download actions
- Navigation to key pages
- External link clicks

Do NOT track:
- Page views (Umami handles automatically)
- Hover states or passive interactions
- Internal navigation within the same flow

### Verification

1. Open browser DevTools → Network tab
2. Filter for requests to `umami`
3. Click the tracked element
4. Verify the event payload includes expected name and properties

### Privacy

Avoid storing personally identifiable information (PII) in event properties:
- Use IDs (invite ID, artist ID) instead of emails
- Artist names are acceptable (public/stage names, not personal names)
- Tokens can be used for correlation with app database

### Infrastructure

**Decision: Keep Umami database separate from app database.**

| Component | Host | Database |
|-----------|------|----------|
| App (AMPLIFY Router) | Vercel | Supabase (PostgreSQL) |
| Analytics (Umami) | Vercel | Neon (PostgreSQL) |

**Why separate:**
- Umami manages its own schema and migrations
- Analytics issues don't affect app database
- Leverages two free tiers
- Simpler Umami upgrades (just redeploy)

**Tradeoff:** Can't directly join analytics with app data. For correlation:
1. Use IDs in event properties (invite_id, token, artist handle)
2. Query Umami API or database for events
3. Query Supabase for app data
4. Join in application code or notebook when investigating

**Revisit if:** You find yourself frequently needing real-time joins between analytics and app data. Consolidating to Supabase is straightforward—just point Umami's `DATABASE_URL` to Supabase.

## Internationalization (i18n)

The directory (`/directory`) is i18n-ready with a content dictionary pattern.

### Structure

```
app/lib/directory-content.ts  # All translatable strings
```

Content is organized by page section:
- `meta`: Page title, description, OG tags
- `header`: Page header text
- `about`: "About the AMPLIFY Program" section
- `search`: Search placeholder, results count
- `filters`: Country filter labels
- `card`: Organization card labels
- `empty`: Empty/error state messages
- `footer`: Footer text

### Adding a New Language

1. Add the locale to the `Locale` type:
   ```typescript
   export type Locale = "en" | "fr";
   ```

2. Add the translations object (copy `en` and translate):
   ```typescript
   export const directoryContent = {
     en: { ... },
     fr: { ... },
   } as const;
   ```

3. Pass locale to components:
   ```tsx
   <OrgsClient organizations={orgs} locale="fr" />
   ```

4. For dynamic metadata, convert `page.tsx` to use `generateMetadata()`:
   ```typescript
   export async function generateMetadata({ params }): Promise<Metadata> {
     const content = getDirectoryContent(params.locale);
     return { title: content.meta.title, ... };
   }
   ```

### Locale Detection (not yet implemented)

Options for determining user locale:
- URL path prefix (`/fr/directory`)
- Cookie preference
- `Accept-Language` header
- Query param (`?lang=fr`)

## Future Considerations

- **Organization self-service**: Let orgs update their own profiles in the directory
- **Show-level routing**: Route based on specific venue/date
- **Audit trail**: Log configuration changes for compliance
- **Emergency controls**: "Pause all routing" button with safeguards
- **Branded email invites**: Replace mailto links with server-sent emails via Resend
- **A/B test sample captions**: Track which caption types get copied most (`kit-copy-caption` event with `caption` property), then test variant copy to optimize messaging. Add a `variant` property when ready to test alternatives.
