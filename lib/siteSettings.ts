import { authFetch } from "@/lib/utils";

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
}

export interface SiteSettings {
  socialLinks?: SocialLinks;
}

const API = () => process.env.NEXT_PUBLIC_BACKEND_URL || "";

export async function publicGetSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API()}/api/public/site-settings`, { cache: "no-store" });
    if (!res.ok) return { socialLinks: {} };
    const body = await res.json();
    if (body?.success === false) return { socialLinks: {} };
    return (body?.data as SiteSettings) || { socialLinks: {} };
  } catch {
    return { socialLinks: {} };
  }
}

export async function adminGetSiteSettings(): Promise<SiteSettings> {
  const res = await authFetch(`${API()}/api/admin/site-settings`);
  const body = await res.json();
  if (!res.ok || body?.success === false) {
    throw new Error(body?.msg || `Request failed (${res.status})`);
  }
  return body.data as SiteSettings;
}

export async function adminUpdateSiteSettings(payload: { socialLinks?: SocialLinks }): Promise<SiteSettings> {
  const res = await authFetch(`${API()}/api/admin/site-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok || body?.success === false) {
    throw new Error(body?.msg || `Request failed (${res.status})`);
  }
  return body.data as SiteSettings;
}
