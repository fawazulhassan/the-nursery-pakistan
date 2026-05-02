import { cn } from "@/lib/utils";

/** Collapses whitespace for short previews (e.g. listing cards with line-clamp). */
export function productDescriptionPreview(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

type ProductDescriptionProps = {
  text: string | null | undefined;
  /** Applied to each paragraph `<p>` */
  className?: string;
  /** Applied to the outer wrapper (e.g. spacing below the block) */
  wrapperClassName?: string;
};

/** Default max length for a single-line `...:` section label. Raise to 200 only if long labels are missed in QA. */
const SECTION_TITLE_MAX_LENGTH = 160;
/** Never classify lines longer than this as section titles (avoids misclassifying short narrative paragraphs). */
const SECTION_TITLE_ABSOLUTE_MAX = 300;

const sectionTitleLabelClass = "text-sm font-semibold text-muted-foreground";

/** Arabic, Arabic Supplement, Arabic Presentation Forms-A (covers Urdu) + Urdu/Arabic full stop U+06D4 */
const ARABIC_OR_STOP_BEFORE_LATIN_LINE =
  /(?<=[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\u06D4])\s*\n\s*(?=[A-Za-z])/g;

function splitIntoParagraphs(normalized: string): string[] {
  let parts = normalized
    .split(/\n(?:\s*\n)+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 1) {
    const heurPieces = parts[0].split(ARABIC_OR_STOP_BEFORE_LATIN_LINE).map((p) => p.trim()).filter(Boolean);
    if (heurPieces.length > 1) {
      parts = heurPieces;
    }
  }

  return parts;
}

function isSectionTitle(para: string): boolean {
  const t = para.trim();
  if (!t || t.includes("\n") || !t.endsWith(":")) return false;
  if (t.length > SECTION_TITLE_ABSOLUTE_MAX) return false;
  if (t.length > SECTION_TITLE_MAX_LENGTH) return false;
  return true;
}

type DescGroup =
  | { kind: "titleBody"; title: string; body: string; key: string }
  | { kind: "titleOnly"; title: string; key: string }
  | { kind: "bodyOnly"; body: string; key: string };

function buildDescriptionGroups(paragraphs: string[]): DescGroup[] {
  const groups: DescGroup[] = [];
  let i = 0;
  while (i < paragraphs.length) {
    const p = paragraphs[i];
    if (isSectionTitle(p) && i + 1 < paragraphs.length) {
      groups.push({
        kind: "titleBody",
        title: p,
        body: paragraphs[i + 1],
        key: `tb-${i}`,
      });
      i += 2;
    } else if (isSectionTitle(p)) {
      groups.push({ kind: "titleOnly", title: p, key: `t-${i}` });
      i += 1;
    } else {
      groups.push({ kind: "bodyOnly", body: p, key: `b-${i}` });
      i += 1;
    }
  }
  return groups;
}

function BorderedBody({ body, className }: { body: string; className?: string }) {
  return (
    <div className="border-l-4 border-muted-foreground/30 py-1 pl-4">
      <p className={cn("whitespace-pre-line text-start", className)} dir="auto">
        {body}
      </p>
    </div>
  );
}

/**
 * Preserves line breaks (`white-space: pre-line`), splits on blank lines (and a conservative
 * Urdu→Latin single-newline split). Single-line segments ending with `:` (section labels) pair
 * with the following paragraph: label uses muted section styling; body keeps blockquote-style border.
 */
export function ProductDescription({ text, className, wrapperClassName }: ProductDescriptionProps) {
  const raw = text?.trim();
  if (!raw) return null;

  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const paragraphs = splitIntoParagraphs(normalized);

  if (paragraphs.length === 0) return null;

  const groups = buildDescriptionGroups(paragraphs);

  return (
    <div className={cn("space-y-4", wrapperClassName)}>
      {groups.map((g) => {
        if (g.kind === "titleBody") {
          return (
            <div key={g.key} className="space-y-1">
              <p className={sectionTitleLabelClass}>{g.title}</p>
              <BorderedBody body={g.body} className={className} />
            </div>
          );
        }
        if (g.kind === "titleOnly") {
          return (
            <p key={g.key} className={sectionTitleLabelClass}>
              {g.title}
            </p>
          );
        }
        return (
          <BorderedBody key={g.key} body={g.body} className={className} />
        );
      })}
    </div>
  );
}
