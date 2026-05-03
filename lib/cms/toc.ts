import { slugify } from "@/lib/cms";

export interface TocItem {
  id: string;
  text: string;
}

export interface TocResult {
  html: string;
  toc: TocItem[];
}

const H2_RE = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi;
const ID_ATTR_RE = /\bid\s*=\s*("([^"]*)"|'([^']*)')/i;
const ID_ATTR_RE_GLOBAL = /\bid\s*=\s*("([^"]*)"|'([^']*)')/gi;

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

export function extractTocAndAddIds(input: string | null | undefined): TocResult {
  const html = input || "";
  if (!html) return { html, toc: [] };

  const usedIds = new Set<string>();
  const toc: TocItem[] = [];

  const nonH2Html = html.replace(H2_RE, "");
  for (const match of nonH2Html.matchAll(ID_ATTR_RE_GLOBAL)) {
    const existingId = (match[2] || match[3] || "").trim();
    if (existingId) usedIds.add(existingId);
  }

  const transformed = html.replace(H2_RE, (full, attrs: string, inner: string) => {
    const text = decodeEntities(stripTags(inner)).replace(/\s+/g, " ").trim();
    if (!text) return full;

    let id: string | undefined;
    const existing = ID_ATTR_RE.exec(attrs);
    const originalExistingId = existing ? (existing[2] || existing[3] || "").trim() : "";
    if (originalExistingId) {
      id = originalExistingId;
    }
    const base = id || slugify(text) || "section";
    if (!id) id = base;
    let n = 2;
    while (usedIds.has(id)) {
      id = `${base}-${n++}`;
    }
    usedIds.add(id);
    toc.push({ id, text });

    if (existing) {
      if (id === originalExistingId) return full;
      const newAttrs = attrs.replace(ID_ATTR_RE, `id="${id}"`);
      return `<h2${newAttrs}>${inner}</h2>`;
    }
    return `<h2${attrs} id="${id}">${inner}</h2>`;
  });

  return { html: transformed, toc };
}
