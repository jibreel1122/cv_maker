// Single source of truth for product naming.
// Used by page metadata, the site chrome, and outgoing email so a rename never
// has to be chased through a dozen string literals again.

export const BRAND_NAME = "Bornat CV Maker";
export const BRAND_TAGLINE = "Free professional CV builder";
export const BRAND_TAGLINE_AR = "منشئ السير الذاتية الاحترافي المجاني";

// Convenience for <title> values: "Dashboard | Bornat CV Maker"
export function pageTitle(section) {
  return section ? `${section} | ${BRAND_NAME}` : BRAND_NAME;
}
