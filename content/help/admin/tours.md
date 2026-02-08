---
title: Tours & Country Routing
description: Create tours and configure how fans are routed by country.
audience: admin
order: 3
related:
  - admin/artists
  - admin/organizations
---

## Overview

Tours define when routing is active for an artist. Outside tour dates, fans see a fallback page.

---

## Adding a Tour

1. Go to **Tours** in the navigation menu
2. Click **Add Tour**
3. Select the artist
4. Enter tour name, start date, and end date
5. Optionally set pre-tour and post-tour windows (in days)
6. Click **Add Tour**

---

## Tour Windows

- **Pre-tour window**: Routing activates this many days before the start date
- **Post-tour window**: Routing stays active this many days after the end date

Setting these to increase the tour window duration catches earlier clicks and lingering traffic.

---

## Deactivating a Tour

Set a tour to **Inactive** to immediately stop routing, even if dates are current.

---

## Country Routing

Each tour can have routing configured per country. When a fan visits the AMPLIFY link, they're directed to an organization based on their detected country.

### How Routing Works

1. Fan visits `/a/{handle}`
2. The system detects their country from IP
3. Checks if artist has an active tour
4. Redirects to artist-selected org for that country or MDE's recommendation
5. Falls back to a general AMPLIFY page if country, artist, tour, or org checks fail

### Setting Up Country Routing

1. Edit a tour
2. Click **Add Country**
3. Select a country from the dropdown
4. Choose an org (or leave as "Use MDE recommended")

### MDE Recommended vs Artist Selected

- **Use MDE recommended**: MDE sets and may update the recommended org for each country at any time. Selecting this option lets MDE control which org fans are routed to—useful if artist wants to defer to MDE's expertise or doesn't have a preference.

- **Select a specific org**: Choose a specific org to control routing for that country. Even if artist's choice matches MDE's current recommendation, selecting it explicitly means MDE's future changes won't affect their link's routing behavior.

---

## Common Tasks

### Quickly deactivate all org-specific routing for an artist

Set their tour to **Inactive** in the tour edit page to force fallback redirect.

### Change where fans are routed mid-tour

Edit the tour and update the org selection for the relevant country.

### See which countries have no routing

Check the analytics dashboard for fallback events with `org_not_specified`.
