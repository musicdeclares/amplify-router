---
title: Managing Artists
description: Invite artists, manage accounts, and understand status controls.
audience: admin
order: 2
related:
  - admin/tours
  - admin/getting-started
---

## Overview

Artists are the core entity in AMPLIFY. Each artist gets a unique handle that forms their AMPLIFY link (e.g., `/a/radiohead`).

---

## Inviting an Artist (Recommended)

The preferred way to add artists is via invite, which allows them to set up their own account:

1. Go to **Artists** in the navigation menu
2. Click **Invite Artist**
3. Enter the artist's email and suggested name
4. Click **Create Invite**
5. Click **Send via email** or copy the invite link manually
6. The artist receives a link to create their account and choose their handle

Invites expire after 7 days. You can extend or revoke pending invites from the Artists page.

---

## Adding an Artist Directly

For cases where you need to create an artist account without self-service:

1. Go to **Artists** in the navigation menu
2. Click **Add Artist**
3. Enter the artist's name
4. The handle is auto-generated from the name (lowercase, hyphens for spaces)
5. Click **Add Artist**

---

## Artist Handles

- Handles must be unique and URL-safe
- They appear in the artist's AMPLIFY link: `amplify.musicdeclares.net/a/{handle}`
- Once created, handles cannot be changed since links may be printed on merch/posters

---

## Deactivating an Artist Account

To permanently deactivate an artist (e.g., ending a partnership):

1. Go to **Artists** and click on the artist
2. Set **Account Status** to **Inactive**
3. Click **Save Changes**

The artist will see a message that their account has been deactivated and will not be able to manage their link.

---

## Artist Self-Service

Artists with accounts can manage their own:

- **Tours**: Create, edit, and configure country routing
- **Diagnostics**: View fallback events and troubleshoot issues

Artists **cannot**:

- Change their handle
- Access other artists' data
- Modify MDE organization recommendations
