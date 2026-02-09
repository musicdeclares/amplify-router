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
  FALLBACK_SWITCH_LANG: "fallback-switch-lang",

  // === Directory ===
  DIRECTORY_ORG_CTA: "directory-org-cta",
  DIRECTORY_SEARCH: "directory-search",
  DIRECTORY_FILTER_COUNTRY: "directory-filter-country",
  DIRECTORY_SWITCH_LANG: "directory-switch-lang",

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
  ADMIN_SAVE_ARTIST: "admin-save-artist",
  ADMIN_SEND_INVITE: "admin-send-invite",
  ADMIN_COPY_INVITE: "admin-copy-invite", // Use with field property: link, subject, body
  ADMIN_EMAIL_INVITE: "admin-email-invite",
  ADMIN_EXTEND_INVITE: "admin-extend-invite",
  ADMIN_REVOKE_INVITE: "admin-revoke-invite",
  ADMIN_CREATE_TOUR: "admin-create-tour",
  ADMIN_SAVE_TOUR: "admin-save-tour",
  ADMIN_DELETE_TOUR: "admin-delete-tour",
  ADMIN_ADD_COUNTRY: "admin-add-country",
  ADMIN_REMOVE_COUNTRY: "admin-remove-country",
  ADMIN_SET_COUNTRY_DEFAULT: "admin-set-country-default",
  ADMIN_REMOVE_COUNTRY_DEFAULT: "admin-remove-country-default",
  ADMIN_ADD_DATE_SPECIFIC_REC: "admin-add-date-specific-rec",
  ADMIN_PAUSE_ORG: "admin-pause-org",
  ADMIN_RESUME_ORG: "admin-resume-org",
  ADMIN_SAVE_ORG_PROFILE: "admin-save-org-profile",
  ADMIN_RESET_ORG_PROFILE: "admin-reset-org-profile",
  ADMIN_UPLOAD_ORG_IMAGE: "admin-upload-org-image",
  ADMIN_REMOVE_ORG_IMAGE: "admin-remove-org-image",

  // === Invite Acceptance ===
  INVITE_ACCEPT: "invite-accept",

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
  INVITE_CREATED: "invite-created",
  INVITE_PAGE: "invite-page",
  ARTISTS_LIST: "artists-list",
  ADMIN_TOUR_FORM: "admin-tour-form",

  // Navigation
  NAV: "nav",
} as const;

export type AnalyticsSource = (typeof SOURCES)[keyof typeof SOURCES];
