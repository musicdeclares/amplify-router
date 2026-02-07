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

### Inviting an Artist (Recommended)

The preferred way to add artists is via invite, which allows them to set up their own account:

1. Go to **Artists** in the sidebar
2. Click **Invite Artist**
3. Enter the artist's email and suggested name
4. Click **Send via email** or copy the invite link manually
5. The artist receives a link to create their account and choose their handle

Invites expire after 7 days. You can extend or revoke pending invites from the Artists page.

### Adding an Artist Directly

For cases where you need to create an artist account without self-service:

1. Go to **Artists** in the sidebar
2. Click **Add Artist**
3. Enter the artist's name
4. The handle is auto-generated from the name (lowercase, hyphens for spaces)
5. Click **Create Artist**

### Artist Handles

- Handles must be unique and URL-safe
- They appear in the artist's AMPLIFY link: `amplify.musicdeclares.net/a/{handle}`
- Once created, handles shouldn't be changed (links may be printed on merch/posters)

### Pausing vs. Deactivating

There are two ways an artist's link can be inactive:

**Link Paused** (artist or admin can control)
- Artist pauses their own link from Settings, or admin pauses it
- Artist can resume at any time
- Use for temporary breaks (e.g., between tours)

**Account Deactivated** (admin only)
- Only admins can activate/deactivate accounts
- Artist cannot undo this
- Use when ending a partnership with an artist

Both controls are visible on the artist edit page. If either is set, fans see a fallback page.

### Paused Artists

Artists can pause their own AMPLIFY link from their Settings page. When this happens:

- An alert banner appears on the **Artists** page
- The artist's reason for pausing (if provided) is visible on their profile
- Artists can resume their link themselves at any time

### Deactivating an Artist Account

To permanently deactivate an artist (e.g., ending a partnership):

1. Go to **Artists** and click on the artist
2. Set **Account Status** to **Inactive**
3. Click **Save Changes**

The artist will see a message that their account has been deactivated and will not be able to resume their link.

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

### Deactivating a Tour

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

- **Use MDE recommended**: MDE sets and may update the recommended org for each country at any time. Selecting this option lets MDE control which org fans are routed to—useful if you want to defer to MDE's expertise or don't have a preference.
- **Select a specific org**: Choose an org yourself to control routing for that country. Even if your choice matches MDE's current recommendation, selecting it explicitly means MDE's future changes won't affect your routing.

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

**`artist_not_found`** — Invalid artist handle
→ Check the link is correct

**`no_active_tour`** — No current tour for artist
→ Create or activate a tour

**`org_not_specified`** — No org for fan's country
→ Add country routing or MDE default

**`org_paused`** — Org is temporarily inactive
→ Resume or set alternative

**`org_no_website`** — Org has no website URL
→ Add website in org settings

---

## Common Tasks

### Quickly deactivate all routing for an artist

Set their tour to **Inactive** in the tour edit page.

### Change where fans are routed mid-tour

Edit the tour and update the org selection for the relevant country.

### See which countries have no routing

Check the analytics dashboard for fallback events with `org_not_specified`.

---

## Artist Self-Service

Artists with accounts can manage their own:

- **Tours**: Create, edit, and configure country routing
- **Link status**: Pause and resume their AMPLIFY link
- **Diagnostics**: View fallback events and troubleshoot issues

Artists **cannot**:

- Change their handle (contact MDE if needed)
- Access other artists' data
- Modify MDE organization recommendations

---

## Need Help?

Contact the MDE team or check the other documentation in the Help Center.
