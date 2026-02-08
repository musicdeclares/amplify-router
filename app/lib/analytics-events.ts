/**
 * Umami analytics event names.
 *
 * Usage: Add data attributes to track clicks
 *   <Button data-umami-event={EVENTS.FALLBACK_CTA_GLOBAL}>Take Action</Button>
 *
 * With properties:
 *   <Button
 *     data-umami-event={EVENTS.DIRECTORY_ORG_CTA}
 *     data-umami-event-org={org.name}
 *     data-umami-event-country={org.country}
 *   >
 *
 * Naming convention: {area}-{action}[-{detail}]
 *   - area: page or feature (fallback, directory, kit, artist, admin)
 *   - action: what the user did (cta, click, copy, download, create)
 *   - detail: optional specificity (crp, directory, qr)
 */

export const EVENTS = {
  // === Fallback Page ===
  FALLBACK_CTA_GLOBAL: "fallback-cta-global",
  FALLBACK_CTA_DIRECTORY: "fallback-cta-directory",

  // === Directory ===
  DIRECTORY_ORG_CTA: "directory-org-cta",
  DIRECTORY_SEARCH: "directory-search",
  DIRECTORY_FILTER_COUNTRY: "directory-filter-country",

  // === Kit Page ===
  KIT_COPY_LINK: "kit-copy-link",
  KIT_COPY_CAPTION: "kit-copy-caption",
  KIT_DOWNLOAD_QR: "kit-download-qr",
  KIT_OPEN_QR_DIALOG: "kit-open-qr-dialog",

  // === Artist Dashboard ===
  ARTIST_COPY_LINK: "artist-copy-link",
  ARTIST_OPEN_QR_DIALOG: "artist-open-qr-dialog",
  ARTIST_VIEW_KIT: "artist-view-kit",
  ARTIST_CREATE_TOUR: "artist-create-tour",
  ARTIST_EDIT_TOUR: "artist-edit-tour",
  ARTIST_SAVE_TOUR: "artist-save-tour",
  ARTIST_ADD_COUNTRY: "artist-add-country",
  ARTIST_REMOVE_COUNTRY: "artist-remove-country",
  ARTIST_UPDATE_NAME: "artist-update-name",
  ARTIST_DELETE_TOUR: "artist-delete-tour",

  // === Admin Dashboard ===
  ADMIN_CREATE_ARTIST: "admin-create-artist",
  ADMIN_SEND_INVITE: "admin-send-invite",
  ADMIN_COPY_INVITE: "admin-copy-invite",
  ADMIN_REVOKE_INVITE: "admin-revoke-invite",
  ADMIN_DEACTIVATE_ARTIST: "admin-deactivate-artist",
  ADMIN_REACTIVATE_ARTIST: "admin-reactivate-artist",
  ADMIN_CREATE_TOUR: "admin-create-tour",
  ADMIN_EDIT_TOUR: "admin-edit-tour",
  ADMIN_SET_COUNTRY_DEFAULT: "admin-set-country-default",
  ADMIN_PAUSE_ORG: "admin-pause-org",
  ADMIN_RESUME_ORG: "admin-resume-org",
  ADMIN_SAVE_ORG_PROFILE: "admin-save-org-profile",

  // === Shared / Navigation ===
  NAV_HELP: "nav-help",
  NAV_LOGOUT: "nav-logout",
  EXTERNAL_LINK: "external-link",
} as const;

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * Source values for tracking where an action originated.
 * Use with data-umami-event-source attribute.
 */
export const SOURCES = {
  // Artist pages
  DASHBOARD: "dashboard",
  TOURS_LIST: "tours-list",
  TOURS_EMPTY_STATE: "tours-empty-state",
  TOUR_FORM: "tour-form",
  DIAGNOSTICS: "diagnostics",
  SETTINGS: "settings",

  // Admin pages
  ARTIST_FORM: "artist-form",
  INVITE_FORM: "invite-form",
  ADMIN_TOUR_FORM: "admin-tour-form",

  // Navigation
  NAV: "nav",
} as const;

export type AnalyticsSource = (typeof SOURCES)[keyof typeof SOURCES];
