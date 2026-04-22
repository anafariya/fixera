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

interface ApiEnvelope {
  success?: boolean;
  msg?: string;
  data?: unknown;
}

async function safeParseJson(res: Response): Promise<{ body: ApiEnvelope | null; text?: string }> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text().catch(() => "");
    return { body: null, text };
  }
  try {
    const body = (await res.json()) as ApiEnvelope;
    return { body };
  } catch {
    return { body: null };
  }
}

export async function publicGetSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API()}/api/public/site-settings`, { cache: "no-store" });
    if (!res.ok) return { socialLinks: {} };
    const { body } = await safeParseJson(res);
    if (!body || body?.success === false) return { socialLinks: {} };
    return (body?.data as SiteSettings) || { socialLinks: {} };
  } catch {
    return { socialLinks: {} };
  }
}

export async function adminGetSiteSettings(): Promise<SiteSettings> {
  const res = await authFetch(`${API()}/api/admin/site-settings`);
  const { body, text } = await safeParseJson(res);
  if (!res.ok || !body || body?.success === false) {
    throw new Error(
      body?.msg ||
        (text && text.slice(0, 200)) ||
        `Request failed (${res.status})`
    );
  }
  return body.data as SiteSettings;
}

export async function adminUpdateSiteSettings(payload: { socialLinks?: SocialLinks }): Promise<SiteSettings> {
  const res = await authFetch(`${API()}/api/admin/site-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const { body, text } = await safeParseJson(res);
  if (!res.ok || !body || body?.success === false) {
    throw new Error(
      body?.msg ||
        (text && text.slice(0, 200)) ||
        `Request failed (${res.status})`
    );
  }
  return body.data as SiteSettings;
}
