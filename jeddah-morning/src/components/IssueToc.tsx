import Link from "next/link";
import type { Issue } from "@/lib/schema";
import { SECTIONS } from "@/lib/sections";
import { toArabicDigits } from "@/lib/dates";
import { DemoBadge } from "./DemoBadge";

/** Interactive table of contents. `pageOffset` = reader page index of the first article (cover + toc = 2). */
export function IssueToc({ issue, pageOffset = 2, mode = "links" }: { issue: Issue; pageOffset?: number; mode?: "links" | "reader" }) {
  return (
    <ol className="divide-y divide-rule">
      {issue.articles.map((a, i) => {
        const meta = SECTIONS[a.section];
        const href = mode === "reader" ? `/issue/${issue.slug}/read?p=${i + pageOffset}` : `/issue/${issue.slug}/a/${a.id}`;
        return (
          <li key={a.id}>
            <Link href={href} className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-3 py-3">
              <span className="font-[family-name:var(--font-latin)] text-xl text-gold">{toArabicDigits(String(i + pageOffset + 1).padStart(2, "0"))}</span>
              <span>
                <span className="kicker block">{meta.name}</span>
                <span className="font-[family-name:var(--font-display)] text-lg font-bold leading-8 group-hover:text-forest-soft dark:group-hover:text-gold">{a.title}</span>
              </span>
              {(a.isDemo || issue.isDemo) && <DemoBadge />}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
