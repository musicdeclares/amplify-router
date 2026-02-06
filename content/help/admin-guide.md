---
title: Admin Quick-Start Guide
description: Learn how to manage artists, tours, and routing in AMPLIFY.
audience: admin
order: 1
---

## Getting Started

Welcome to the AMPLIFY admin dashboard. This guide will walk you through the key tasks for managing the routing system.

### Logging In

1. Navigate to [`/admin/login`](/admin/login)
2. Enter your email and password
3. You'll be redirected to the dashboard

---

## Managing Artists

Artists are the core entity in AMPLIFY. Each artist gets a unique handle that forms their AMPLIFY link (e.g., `/a/radiohead`).

### Adding an Artist

1. Go to **Artists** in the sidebar
2. Click **Add Artist**
3. Enter the artist's name
4. The handle is auto-generated from the name (lowercase, hyphens for spaces)
5. Click **Create Artist**

### Artist Handles

- Handles must be unique and URL-safe
- They appear in the artist's AMPLIFY link: `amplify.musicdeclares.net/a/{handle}`
- Once created, handles shouldn't be changed (links may be printed on merch/posters)

### Deactivating an Artist

Artists cannot be deleted because their AMPLIFY links may already be printed on merchandise, posters, or shared publicly. Instead, set an artist to **Inactive**:

1. Go to **Artists** and click on the artist
2. Change the status to **Inactive**
3. Click **Save Changes**

When an artist is inactive, fans visiting their link will see a fallback page instead of being routed to an organization.

---

## Creating Tours

Tours define when routing is active for an artist. Outside tour dates, fans see a fallback page.

### Adding a Tour

1. Go to **Tours** in the sidebar
2. Click **Add Tour**
3. Select the artist
4. Enter tour name, start date, and end date
5. Optionally set pre-tour and post-tour windows (in days)
6. Click **Create Tour**

### Tour Windows

- **Pre-tour window**: Routing activates this many days before the start date
- **Post-tour window**: Routing stays active this many days after the end date
- This helps catch early arrivals and lingering traffic

### Disabling a Tour

Set a tour to **Inactive** to immediately stop routing, even if dates are current.

---

## Country Routing

Each tour can have routing configured per country. When a fan visits the AMPLIFY link, they're directed to an organization based on their detected country.

### How Routing Works

1. Fan visits `/a/{handle}`
2. System detects their country from IP
3. Checks for artist-selected org for that country
4. Falls back to MDE recommended org if no override
5. Falls back to a general page if no org available

### Setting Up Country Routing

1. Edit a tour
2. Click **Add Country**
3. Select a country from the dropdown
4. Choose an org (or leave as "Use MDE recommended")

### MDE Recommended vs Artist Selected

- **MDE recommended**: Default org for a country, set by MDE admins
- **Artist selected**: Override chosen by the artist/manager for their tour

---

## Managing Organizations

Organizations are managed through the **Organizations** page. This is where you set MDE recommendations per country.

### Setting MDE Recommendations

1. Go to **Organizations**
2. Click on a country
3. Set the recommended org for that country
4. Optionally set date-specific recommendations (e.g., election season)

### Pausing an Organization

If an org needs to be temporarily removed from routing:

1. Go to **Organizations**
2. Find the org
3. Toggle **Active** to off
4. Add a reason (optional but helpful)

Fans will be routed to the fallback instead.

---

## Understanding Analytics

The dashboard shows key metrics about routing activity.

### Key Metrics

- **Total Routes**: Successful redirects to org websites
- **Unique Artists**: Artists with active routing
- **Countries Reached**: Geographic distribution
- **Fallback Rate**: Percentage of visits that couldn't be routed

### Fallback Events

The **Recent Fallback Events** section shows when routing failed and why. Common reasons:

| Reason | Meaning | Action |
|--------|---------|--------|
| `artist_not_found` | Invalid artist handle | Check the link is correct |
| `no_active_tour` | No current tour for artist | Create or enable a tour |
| `org_not_specified` | No org for fan's country | Add country routing or MDE default |
| `org_paused` | Org is temporarily inactive | Re-enable or set alternative |
| `org_no_website` | Org has no website URL | Add website in org settings |

---

## Common Tasks

### Quickly deactivate all routing for an artist

Set their tour to **Inactive** in the tour edit page.

### Change where fans are routed mid-tour

Edit the tour and update the org selection for the relevant country.

### See which countries have no routing

Check the analytics dashboard for fallback events with `org_not_specified`.

---

## Need Help?

Contact the MDE team or check the other documentation in the Help Center.
