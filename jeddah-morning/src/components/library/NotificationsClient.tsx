"use client";
import Link from "next/link";
import { useState } from "react";
import { safeLocalGet, useClientValue } from "@/lib/use-client-value";

interface N { slug: string; title: string; at: string; edition: string; surprise: boolean }

/** In-app notices: issues published since the last time this screen was opened (device-local). */
export function NotificationsClient({ issues }: { issues: N[] }) {
  const lastSeen = useClientValue(() => safeLocalGet("jm:notif-seen") ?? "", "");
  const [marked, setMarked] = useState(false);
  const isNew = (n: N) => !marked && (!lastSeen || n.at > lastSeen);
  return (
    <>
      <button type="button" onClick={() => { try { localStorage.setItem("jm:notif-seen", new Date().toISOString()); } catch {} setMarked(true); }} className="mt-4 rounded-full border border-rule px-4 py-1.5 text-xs">تعليم الكل كمقروء</button>
      <ul className="mt-4 divide-y divide-rule">
        {issues.map((n) => (
          <li key={n.slug}>
            <Link href={`/issue/${n.slug}`} className="flex items-start gap-3 py-3">
              <span className={`mt-2 size-2 shrink-0 rounded-full ${isNew(n) ? "bg-gold" : "bg-transparent"}`} aria-label={isNew(n) ? "جديد" : undefined} />
              <span>
                <span className="block font-semibold">{n.edition === "evening" ? "صدر عدد جدة بعد الغروب" : n.edition === "special" ? "صدر عدد خاص" : "صدر العدد الصباحي"}</span>
                <span className="block text-sm text-muted">{n.title}{n.surprise ? " · فيه مفاجأة ✦" : ""}</span>
                <span className="text-xs text-muted">{new Date(n.at).toLocaleString("ar-SA-u-nu-arab", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" })}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
