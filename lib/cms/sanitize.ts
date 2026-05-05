import "server-only";
import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "strong", "em", "u", "s", "code", "pre",
  "ul", "ol", "li",
  "blockquote",
  "a", "img",
  "span", "div",
  "table", "thead", "tbody", "tr", "th", "td",
];

const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "title", "class", "id", "loading"];

export function sanitizeRichText(html: string): string {
  const allowedAttributes: Record<string, string[]> = { "*": ALLOWED_ATTR };
  return sanitizeHtml(html || "", {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes,
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { a: ["http", "https", "mailto"] },
    allowProtocolRelative: false,
    allowedSchemesAppliedToAttributes: ["href", "src"],
    transformTags: {
      a: (tagName, attribs) => {
        if (attribs.target === "_blank") {
          const existing = (attribs.rel || "").split(/\s+/).filter(Boolean);
          for (const required of ["noopener", "noreferrer"]) {
            if (!existing.includes(required)) existing.push(required);
          }
          attribs.rel = existing.join(" ");
        }
        return { tagName, attribs };
      },
    },
  });
}
