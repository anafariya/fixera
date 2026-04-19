export const siteUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) {
    const isBuild = process.env.NEXT_PHASE === "phase-production-build";
    if (process.env.NODE_ENV === "production" && !isBuild) {
      throw new Error(
        "siteUrl: NEXT_PUBLIC_SITE_URL must be set in production — unset would emit localhost URLs in sitemap, canonical, and OG tags."
      );
    }
    if (isBuild) {
      console.warn(
        "siteUrl: NEXT_PUBLIC_SITE_URL is not set during build — falling back to localhost. Ensure the env is configured in the deployment environment before serving traffic."
      );
    }
    return "http://localhost:3000";
  }
  return raw.replace(/\/$/, "");
};

export const SITE_NAME = "Fixera";
export const SITE_TAGLINE = "One Platform, Every Solution.";
export const SITE_DESCRIPTION =
  "Fixera connects customers with verified professionals for any property service — from minor repairs to full renovations. Get the job done with quality and security guaranteed.";
export const OG_DEFAULT_IMAGE = "/fixera-logo.png";

export const absoluteUrl = (path: string): string => {
  if (!path) return siteUrl();
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}${p}`;
};
