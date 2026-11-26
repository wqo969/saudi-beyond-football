"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteIssueAction, publishNowAction, unpublishAction, type SaveResult } from "@/app/admin/actions";
import type { IssueStatus } from "@/lib/schema";

export function IssueRowActions({ slug, status }: { slug: string; status: IssueStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<SaveResult>) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? null : (r.errors ?? ["خطأ"]).join("، "));
      router.refresh();
    });
  const btn = "rounded border border-rule px-2 py-1 text-xs hover:border-gold disabled:opacity-50";
  return (
    <div className="flex flex-wrap gap-1">
      <Link href={`/admin/issues/${slug}`} className={btn}>تحرير</Link>
      <Link href={`/issue/${slug}`} className={btn}>عرض</Link>
      {status !== "published" ? (
        <button type="button" disabled={pending} onClick={() => run(() => publishNowAction(slug))} className={btn}>انشر الآن</button>
      ) : (
        <button type="button" disabled={pending} onClick={() => run(() => unpublishAction(slug))} className={btn}>إلغاء النشر</button>
      )}
      <button type="button" disabled={pending} onClick={() => confirm(`حذف العدد ${slug} نهائيًا؟`) && run(() => deleteIssueAction(slug))} className={`${btn} text-demo`}>حذف</button>
      {error && <p className="w-full text-xs text-demo">{error}</p>}
    </div>
  );
}
