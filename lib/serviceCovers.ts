const FALLBACK = "/images/banner.jpg";

const BUNDLED_SERVICE_SLUGS: ReadonlySet<string> = new Set([
  "interior-design",
  "3d-modeling",
  "plumbing-services",
  "electrical-work",
  "hvac-services",
  "painting-services",
  "flooring-tiling",
  "carpentry",
  "home-renovation",
  "roofing",
  "masonry-brickwork",
  "window-door-installation",
  "siding-cladding",
  "garden-landscaping",
  "lawn-care",
  "deck-patio-building",
  "fence-installation",
]);

const BUNDLED_CATEGORY_SLUGS: ReadonlySet<string> = new Set([
  "interior-services",
  "exterior-structural",
  "outdoor-garden",
]);

export function getServiceCoverImage(slug: string | undefined | null, categorySlug?: string | null): string {
  const s = (slug || "").toLowerCase().trim();
  if (s && BUNDLED_SERVICE_SLUGS.has(s)) {
    return `/images/services/${s}.jpg`;
  }
  const c = (categorySlug || "").toLowerCase().trim();
  if (c && BUNDLED_CATEGORY_SLUGS.has(c)) {
    return `/images/services/_categories/${c}.jpg`;
  }
  return FALLBACK;
}
