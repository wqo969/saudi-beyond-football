"use server";
import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/content";
import { kv } from "@/lib/content/store";
import { logOp } from "@/lib/ops-log";
import { readAutomation, writeAutomation } from "@/lib/push";
import { IssueSchema, formatIssues } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";

export async function setAutomationAction(enabled: boolean) {
  await requireAdmin();
  await writeAutomation({ ...(await readAutomation()), enabled });
  await logOp("cron", enabled ? "تشغيل الأتمتة" : "إيقاف الأتمتة", "success");
  revalidatePath("/admin/operations");
}

export async function addCorrectionAction(slug: string, text: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (text.trim().length < 5) return { ok: false, error: "نص التصحيح قصير" };
  const repo = getRepository();
  const issue = (repo.getIssueFresh ? await repo.getIssueFresh(slug) : null) ?? (await repo.getIssue(slug));
  if (!issue) return { ok: false, error: "العدد غير موجود" };
  await repo.saveIssue({ ...issue, corrections: [...issue.corrections, { at: new Date().toISOString().slice(0, 10), text: text.trim() }] });
  await logOp("content", "إضافة تصحيح تحريري", "success", slug);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function restoreVersionAction(slug: string, version: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const repo = getRepository();
  if (!repo.readVersion) return { ok: false, error: "سجل الإصدارات متاح في التخزين السحابي فقط" };
  const v = await repo.readVersion(slug, version);
  if (!v) return { ok: false, error: "الإصدار غير موجود" };
  await repo.saveIssue(v);
  await logOp("content", `استعادة الإصدار ${version}`, "success", slug);
  revalidatePath("/", "layout");
  return { ok: true };
}

export interface TrustedSource {
  name: string;
  url: string;
  sections: string[];
  note?: string;
}

export async function saveSourcesAction(list: TrustedSource[]): Promise<{ ok: boolean }> {
  await requireAdmin();
  const clean = list.filter((s) => s.name.trim() && /^https:\/\//.test(s.url)).map((s) => ({ ...s, name: s.name.trim().slice(0, 80), url: s.url.trim().slice(0, 300) }));
  await kv.set("sources", clean);
  revalidatePath("/admin/sources");
  return { ok: true };
}

/** Restore a backup produced by /api/admin/export (issues only; secrets are never part of backups). */
export async function restoreBackupAction(json: string): Promise<{ ok: boolean; restored?: number; errors?: string[] }> {
  await requireAdmin();
  let data: { issues?: unknown[] };
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, errors: ["ملف غير صالح"] };
  }
  const errors: string[] = [];
  let restored = 0;
  for (const raw of data.issues ?? []) {
    const r = IssueSchema.safeParse(raw);
    if (!r.success) {
      errors.push(...formatIssues(r.error).slice(0, 2));
      continue;
    }
    await getRepository().saveIssue(r.data);
    restored++;
  }
  await logOp("backup", `استعادة نسخة احتياطية: ${restored} عددًا`, errors.length ? "failure" : "success");
  revalidatePath("/", "layout");
  return { ok: errors.length === 0, restored, errors };
}
