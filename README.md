# AMPLIFY Router

A lightweight, context-aware routing service for the Music Declares Emergency AMPLIFY program. Routes fans to vetted grassroots climate organizations based on artist tour context and geographic location.

## Overview

The AMPLIFY Router enables artists to use a single, evergreen link (e.g., `amplify-router.vercel.app/a/artist-handle`) that intelligently routes fans to:
- Relevant partner organizations during active tours
- Graceful fallback experiences when tours aren't active
- Country-specific organizations based on IP geolocation

## Features

- **Smart Routing**: Routes based on artist, tour dates, and country
- **Rich Analytics**: Comprehensive tracking for pilot assessment
- **Global Controls**: Emergency pause/resume for organizations and tours
- **Graceful Fallbacks**: Always returns a valid destination
- **Edge Performance**: Optimized for global, low-latency access

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Database**: Supabase PostgreSQL (shared with MDEDB)
- **Deployment**: Vercel Edge Functions
- **TypeScript**: Full type safety throughout

## Quick Start

### Prerequisites

- Node.js 18+
- Access to the shared Supabase instance with MDEDB

### Installation

```bash
# Clone the repository
git clone https://github.com/musicdeclares/amplify-router.git
cd amplify-router

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations (if first time setup)
# Apply the SQL in supabase/migrations/001_create_router_tables.sql to your Supabase instance

# Start development server
npm run dev
```

### Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=development
```

## Database Schema

The router adds these tables to the existing MDEDB schema:

- **artists**: Artist profiles and handles
- **tours**: Tour configurations with date ranges
- **tour_country_configs**: Country-specific organization mappings
- **router_analytics**: Comprehensive analytics for routing decisions
- **organizations**: Extended with `router_active` field for global controls

## Usage

### Router URL Pattern

```
https://your-domain.com/a/{artist-handle}
```

Example: `https://amplify-router.vercel.app/a/radiohead`

### Admin Interface

Access the admin dashboard at `/admin` to:

- Manage artists and tours
- Configure country-specific routing
- Monitor analytics
- Emergency controls (pause orgs, disable tours)

### API Endpoints

- `GET /api/artists` - List artists
- `POST /api/artists` - Add artist
- `GET /api/tours` - List tours
- `POST /api/tours` - Add tour
- `GET /api/organizations` - List organizations
- `GET /api/analytics` - View routing analytics

## Routing Logic

The router follows this deterministic order:

1. **Artist exists?** → If no, fallback to default AMPLIFY page
2. **Active tour?** → Check if current date is within tour dates  
3. **Country configured?** → Match detected country to tour config
4. **Organization active?** → Verify org is approved and router_active
5. **Route** → Success: redirect to org website; Failure: fallback page

## Analytics

The router tracks rich analytics for pilot assessment:

- Click-through rates by country/org/artist
- Fallback reasons and patterns
- Geographic distribution of engagement
- Temporal usage patterns
- Operational events (pause/resume actions)

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Environment Variables (Production)

Set these in your Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Check TypeScript types
```

### Database Migrations

Apply the SQL migration manually to your Supabase instance:

```bash
# Copy the contents of supabase/migrations/001_create_router_tables.sql
# and run it in the Supabase SQL editor
```

## Emergency Controls

### Pause an Organization Globally

```bash
curl -X PUT "https://your-domain.com/api/organizations/org-id" \
  -H "Content-Type: application/json" \
  -d '{"router_active": false}'
```

### Disable a Tour

```bash
curl -X PUT "https://your-domain.com/api/tours/tour-id" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

## Architecture Decisions

- **Edge Functions**: Router endpoint uses Vercel Edge for global performance
- **Shared Database**: Leverages existing MDEDB infrastructure
- **Graceful Fallbacks**: Always returns valid destination, never broken links
- **Analytics-First**: Comprehensive tracking for data-driven optimization

## Contributing

1. Follow existing code patterns and TypeScript conventions
2. Add tests for new functionality
3. Update documentation for API changes
4. Ensure graceful fallbacks for all routing paths

## License

[Add your license here]
